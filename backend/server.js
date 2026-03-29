const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0';
const JWT_SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV !== 'production' ? 'dev-battery-pms-secret' : '');
if (!JWT_SECRET) {
  console.error('JWT_SECRET is required in production');
  process.exit(1);
}
const DATA_FILE = process.env.DATA_FILE || process.env.DATA_FILE_PATH || path.join(__dirname, 'data.json');
const FRONTEND_DIST = process.env.FRONTEND_DIST || path.join(__dirname, '..', 'frontend', 'dist');
const HAS_FRONTEND_DIST = fs.existsSync(path.join(FRONTEND_DIST, 'index.html'));
const REQUIRE_DATA_FILE = process.env.REQUIRE_DATA_FILE === 'true';
const SEED_DEFAULT_USERS = process.env.SEED_DEFAULT_USERS ? process.env.SEED_DEFAULT_USERS === 'true' : process.env.NODE_ENV !== 'production';

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const emptyData = () => ({ users: [], projects: [], projectLogs: [], loginLogs: [] });
let data = emptyData();

const loadData = () => {
  if (!fs.existsSync(DATA_FILE)) {
    if (REQUIRE_DATA_FILE) {
      throw new Error(`DATA_FILE not found: ${DATA_FILE}`);
    }
    return;
  }
  const raw = fs.readFileSync(DATA_FILE, 'utf-8');
  try {
    data = JSON.parse(raw);
  } catch (e) {
    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    const corruptPath = `${DATA_FILE}.corrupt.${ts}`;
    fs.writeFileSync(corruptPath, raw, 'utf-8');
    throw new Error(`Failed to parse DATA_FILE. Backup written to: ${corruptPath}`);
  }
};

try {
  loadData();
} catch (e) {
  console.error(e.message || e);
  process.exit(1);
}

if (!Array.isArray(data.users)) data.users = [];
if (!Array.isArray(data.projects)) data.projects = [];
if (!Array.isArray(data.projectLogs)) data.projectLogs = [];
if (!Array.isArray(data.loginLogs)) data.loginLogs = [];

const saveData = () => {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const json = JSON.stringify(data, null, 2);
  const tmp = `${DATA_FILE}.tmp`;
  const bak = `${DATA_FILE}.bak`;
  fs.writeFileSync(tmp, json, 'utf-8');
  try {
    if (fs.existsSync(bak)) fs.rmSync(bak, { force: true });
    if (fs.existsSync(DATA_FILE)) fs.renameSync(DATA_FILE, bak);
    fs.renameSync(tmp, DATA_FILE);
  } catch (e) {
    if (fs.existsSync(tmp)) fs.rmSync(tmp, { force: true });
    if (!fs.existsSync(DATA_FILE) && fs.existsSync(bak)) fs.renameSync(bak, DATA_FILE);
    throw e;
  }
};

if (data.users.length === 0 && SEED_DEFAULT_USERS) {
  const adminPassword = bcrypt.hashSync('admin123', 10);
  const techPassword = bcrypt.hashSync('tech123', 10);
  const purchasePassword = bcrypt.hashSync('purchase123', 10);
  const productionPassword = bcrypt.hashSync('production123', 10);
  const deliveryPassword = bcrypt.hashSync('delivery123', 10);
  const financePassword = bcrypt.hashSync('finance123', 10);
  const afterSalePassword = bcrypt.hashSync('aftersale123', 10);

  data.users = [
    { id: uuidv4(), username: 'admin', password: adminPassword, realname: '系统管理员', role: '管理员', created_at: new Date().toISOString() },
    { id: uuidv4(), username: 'tech', password: techPassword, realname: '技术负责人', role: '技术', created_at: new Date().toISOString() },
    { id: uuidv4(), username: 'purchase', password: purchasePassword, realname: '采购负责人', role: '采购', created_at: new Date().toISOString() },
    { id: uuidv4(), username: 'production', password: productionPassword, realname: '生产负责人', role: '生产', created_at: new Date().toISOString() },
    { id: uuidv4(), username: 'delivery', password: deliveryPassword, realname: '交付负责人', role: '交付', created_at: new Date().toISOString() },
    { id: uuidv4(), username: 'finance', password: financePassword, realname: '财务负责人', role: '财务', created_at: new Date().toISOString() },
    { id: uuidv4(), username: 'aftersale', password: afterSalePassword, realname: '售后负责人', role: '售后', created_at: new Date().toISOString() }
  ];
  saveData();
}

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: '未授权' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: '无效的令牌' });
  }
};

const adminMiddleware = (req, res, next) => {
  if (req.user.role !== '管理员') {
    return res.status(403).json({ error: '需要管理员权限' });
  }
  next();
};

const selfRegisterRoles = ['技术', '采购', '生产', '交付', '财务', '售后'];
const checkpointStatuses = ['未开始', '进行中', '已完成', '已延期'];

const getUserProjects = (user) => {
  return data.projects;
};

const hasProjectAccess = (user, projectId) => {
  return true;
};

const isValidYmd = (value) => {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || '').trim());
};

const normalizeProjectForResponse = (project) => {
  const device_count = project.device_count === undefined ? 0 : project.device_count;
  return {
    ...project,
    device_count,
    checkpoints: Array.isArray(project.checkpoints) ? project.checkpoints : [],
    plans: Array.isArray(project.plans) ? project.plans : []
  };
};

const applyOverdueStatus = (checkpoint) => {
  if (!checkpoint) return checkpoint;
  if (checkpoint.status === '已完成') return checkpoint;
  if (!isValidYmd(checkpoint.planned_date)) return checkpoint;
  const today = new Date().toISOString().slice(0, 10);
  if (checkpoint.planned_date < today) {
    return { ...checkpoint, status: '已延期' };
  }
  return checkpoint;
};

const applyPlanOverdueStatus = (plan) => {
  if (!plan) return plan;
  if (plan.status === '已完成') return plan;
  if (!isValidYmd(plan.end_date)) return plan;
  const today = new Date().toISOString().slice(0, 10);
  if (plan.end_date < today) {
    return { ...plan, status: '已延期' };
  }
  return plan;
};

const financeFields = ['contract_amount', 'receivable_amount', 'received_amount'];
const isAdminUser = (user) => user?.role === '管理员';

const omitFields = (source, fields) => {
  const next = { ...source };
  fields.forEach(field => {
    delete next[field];
  });
  return next;
};

const sanitizeProjectForResponse = (project, user) => {
  const normalized = normalizeProjectForResponse(project);
  if (isAdminUser(user)) return normalized;
  return omitFields(normalized, financeFields);
};

const sanitizeProjectLogForResponse = (log, user) => {
  if (isAdminUser(user)) return log;
  if (log.action !== '更新项目') return log;
  try {
    const parsed = JSON.parse(String(log.details || '{}'));
    const sanitized = omitFields(parsed, financeFields);
    const details = Object.keys(sanitized).length === 0 ? '更新项目' : JSON.stringify(sanitized);
    return { ...log, details };
  } catch (e) {
    return { ...log, details: '更新项目' };
  }
};

const getRequestIp = (req) => {
  const xff = req.headers['x-forwarded-for'];
  if (typeof xff === 'string' && xff.trim()) return xff.split(',')[0].trim();
  return req.socket?.remoteAddress || '';
};

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const user = data.users.find(u => u.username === username);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    data.loginLogs.unshift({
      id: uuidv4(),
      username: String(username || ''),
      user_id: '',
      success: false,
      ip: getRequestIp(req),
      user_agent: String(req.headers['user-agent'] || ''),
      created_at: new Date().toISOString()
    });
    data.loginLogs = data.loginLogs.slice(0, 5000);
    saveData();
    return res.status(401).json({ error: '用户名或密码错误' });
  }
  const token = jwt.sign({ id: user.id, username: user.username, role: user.role, realname: user.realname }, JWT_SECRET, { expiresIn: '7d' });

  data.loginLogs.unshift({
    id: uuidv4(),
    username: user.username,
    user_id: user.id,
    success: true,
    ip: getRequestIp(req),
    user_agent: String(req.headers['user-agent'] || ''),
    created_at: new Date().toISOString()
  });
  data.loginLogs = data.loginLogs.slice(0, 5000);
  saveData();

  res.json({ token, user: { id: user.id, username: user.username, realname: user.realname, role: user.role } });
});

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

app.post('/api/register', (req, res) => {
  const username = String(req.body.username || '').trim();
  const password = String(req.body.password || '');
  const realname = String(req.body.realname || '').trim();
  const role = String(req.body.role || '').trim();

  if (!username || !password || !realname || !role) {
    return res.status(400).json({ error: '缺少必要字段' });
  }

  if (role === '管理员') {
    return res.status(403).json({ error: '不允许注册管理员' });
  }

  if (!selfRegisterRoles.includes(role)) {
    return res.status(400).json({ error: '角色不合法' });
  }

  if (data.users.find(u => u.username === username)) {
    return res.status(409).json({ error: '用户名已存在' });
  }

  const now = new Date().toISOString();
  const hashedPassword = bcrypt.hashSync(password, 10);
  const newUser = {
    id: uuidv4(),
    username,
    password: hashedPassword,
    realname,
    role,
    created_at: now
  };

  data.users.push(newUser);
  saveData();

  res.status(201).json({ id: newUser.id, username: newUser.username, realname: newUser.realname, role: newUser.role });
});

app.get('/api/users', authMiddleware, adminMiddleware, (req, res) => {
  res.json(data.users.map(u => ({ id: u.id, username: u.username, realname: u.realname, role: u.role, created_at: u.created_at })));
});

app.get('/api/login-logs', authMiddleware, adminMiddleware, (req, res) => {
  const limitRaw = parseInt(String(req.query.limit || ''), 10);
  const offsetRaw = parseInt(String(req.query.offset || ''), 10);
  const limit = Math.min(Number.isFinite(limitRaw) && limitRaw > 0 ? limitRaw : 50, 200);
  const offset = Number.isFinite(offsetRaw) && offsetRaw > 0 ? offsetRaw : 0;

  let logs = Array.isArray(data.loginLogs) ? data.loginLogs.slice() : [];
  const qUsername = String(req.query.username || '').trim().toLowerCase();
  if (qUsername) logs = logs.filter(l => String(l.username || '').toLowerCase().includes(qUsername));
  if (req.query.success !== undefined && String(req.query.success).trim() !== '') {
    const s = String(req.query.success).trim();
    if (s === 'true' || s === 'false') logs = logs.filter(l => Boolean(l.success) === (s === 'true'));
  }
  const from = String(req.query.from || '').trim();
  const to = String(req.query.to || '').trim();
  if (from) logs = logs.filter(l => String(l.created_at || '') >= from);
  if (to) logs = logs.filter(l => String(l.created_at || '') <= to);

  logs.sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')));
  res.json({ total: logs.length, items: logs.slice(offset, offset + limit) });
});

app.get('/api/users/me', authMiddleware, (req, res) => {
  const user = data.users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: '用户不存在' });
  res.json({ id: user.id, username: user.username, realname: user.realname, role: user.role, created_at: user.created_at });
});

app.post('/api/users', authMiddleware, adminMiddleware, (req, res) => {
  const { username, password, realname, role } = req.body;
  
  if (!username || !password || !realname || !role) {
    return res.status(400).json({ error: '缺少必要字段' });
  }
  
  if (data.users.find(u => u.username === username)) {
    return res.status(400).json({ error: '用户名已存在' });
  }
  
  const hashedPassword = bcrypt.hashSync(password, 10);
  const newUser = {
    id: uuidv4(),
    username,
    password: hashedPassword,
    realname,
    role,
    created_at: new Date().toISOString()
  };
  
  data.users.push(newUser);
  saveData();
  
  res.status(201).json({ id: newUser.id, username: newUser.username, realname: newUser.realname, role: newUser.role });
});

app.put('/api/users/:id', authMiddleware, adminMiddleware, (req, res) => {
  const userIndex = data.users.findIndex(u => u.id === req.params.id);
  if (userIndex === -1) return res.status(404).json({ error: '用户不存在' });
  
  const { username, realname, role } = req.body;
  
  if (username && username !== data.users[userIndex].username) {
    if (data.users.find(u => u.username === username)) {
      return res.status(400).json({ error: '用户名已存在' });
    }
    data.users[userIndex].username = username;
  }
  
  if (realname) data.users[userIndex].realname = realname;
  if (role) data.users[userIndex].role = role;
  
  saveData();
  
  res.json({ id: data.users[userIndex].id, username: data.users[userIndex].username, realname: data.users[userIndex].realname, role: data.users[userIndex].role });
});

app.delete('/api/users/:id', authMiddleware, adminMiddleware, (req, res) => {
  const userIndex = data.users.findIndex(u => u.id === req.params.id);
  if (userIndex === -1) return res.status(404).json({ error: '用户不存在' });
  
  if (data.users[userIndex].username === 'admin') {
    return res.status(400).json({ error: '不能删除管理员账户' });
  }
  
  data.users.splice(userIndex, 1);
  saveData();
  
  res.json({ success: true });
});

app.put('/api/users/:id/password', authMiddleware, adminMiddleware, (req, res) => {
  const userIndex = data.users.findIndex(u => u.id === req.params.id);
  if (userIndex === -1) return res.status(404).json({ error: '用户不存在' });
  
  const { password } = req.body;
  if (!password) {
    return res.status(400).json({ error: '请提供新密码' });
  }
  
  data.users[userIndex].password = bcrypt.hashSync(password, 10);
  saveData();
  
  res.json({ success: true });
});

app.get('/api/dashboard/stats', authMiddleware, (req, res) => {
  const now = new Date();
  const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const currentMonth = now.toISOString().slice(0, 7);

  const userProjects = getUserProjects(req.user);
  
  const totalProjects = userProjects.length;
  const inProgressProjects = userProjects.filter(p => p.project_status === '进行中').length;
  const completedProjects = userProjects.filter(p => p.acceptance_status === '已验收').length;
  const expiringProjects = userProjects.filter(p => p.planned_delivery_date && new Date(p.planned_delivery_date) <= sevenDaysLater && p.acceptance_status !== '已验收').length;
  const newThisMonth = userProjects.filter(p => p.created_at && p.created_at.startsWith(currentMonth)).length;
  const deliveredThisMonth = userProjects.filter(p => p.delivery_date && p.delivery_date.startsWith(currentMonth)).length;
  const totalAmount = userProjects.reduce((sum, p) => sum + (parseFloat(p.contract_amount) || 0), 0);

  const stageDistribution = [];
  const stageMap = {};
  userProjects.forEach(p => {
    const stage = p.current_stage || '项目接单';
    stageMap[stage] = (stageMap[stage] || 0) + 1;
  });
  Object.keys(stageMap).forEach(stage => {
    stageDistribution.push({ stage, count: stageMap[stage] });
  });

  res.json({
    totalProjects,
    inProgressProjects,
    completedProjects,
    expiringProjects,
    newThisMonth,
    deliveredThisMonth,
    ...(isAdminUser(req.user) ? { totalAmount } : {}),
    stageDistribution
  });
});

app.get('/api/dashboard/checkpoints', authMiddleware, (req, res) => {
  const limitRaw = parseInt(String(req.query.limit || ''), 10);
  const limit = Math.min(Number.isFinite(limitRaw) && limitRaw > 0 ? limitRaw : 50, 200);

  const userProjects = getUserProjects(req.user);
  const items = [];
  userProjects.forEach(p => {
    const cps = Array.isArray(p.checkpoints) ? p.checkpoints : [];
    cps.forEach(c => {
      const cc = applyOverdueStatus(c);
      items.push({
        project_id: p.id,
        project_code: p.project_code,
        project_name: p.project_name,
        ...cc
      });
    });
  });

  items.sort((a, b) => {
    const d = String(a.planned_date || '').localeCompare(String(b.planned_date || ''));
    if (d !== 0) return d;
    return String(b.updated_at || b.created_at || '').localeCompare(String(a.updated_at || a.created_at || ''));
  });

  res.json(items.slice(0, limit));
});

app.get('/api/dashboard/projects', authMiddleware, (req, res) => {
  const type = String(req.query.type || '').trim();
  const validTypes = ['inProgress', 'expiring', 'accepted', 'all'];
  if (!type || !validTypes.includes(type)) return res.status(400).json({ error: 'type 参数不合法' });

  const limitRaw = parseInt(String(req.query.limit || ''), 10);
  const offsetRaw = parseInt(String(req.query.offset || ''), 10);
  const limit = Math.min(Number.isFinite(limitRaw) && limitRaw > 0 ? limitRaw : 50, 200);
  const offset = Number.isFinite(offsetRaw) && offsetRaw > 0 ? offsetRaw : 0;

  const userProjects = getUserProjects(req.user);
  const now = new Date();
  const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  let filtered = userProjects;
  if (type === 'inProgress') {
    filtered = userProjects.filter(p => p.project_status === '进行中');
  } else if (type === 'accepted') {
    filtered = userProjects.filter(p => p.acceptance_status === '已验收');
  } else if (type === 'expiring') {
    filtered = userProjects.filter(p => p.planned_delivery_date && new Date(p.planned_delivery_date) <= sevenDaysLater && p.acceptance_status !== '已验收');
  }

  const toItem = (p) => ({
    id: p.id,
    project_code: p.project_code,
    project_name: p.project_name,
    customer_name: p.customer_name,
    current_stage: p.current_stage,
    project_status: p.project_status,
    planned_delivery_date: p.planned_delivery_date,
    acceptance_status: p.acceptance_status
  });

  if (type === 'expiring') {
    filtered = filtered.slice().sort((a, b) => String(a.planned_delivery_date || '').localeCompare(String(b.planned_delivery_date || '')));
  } else {
    filtered = filtered.slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  const total = filtered.length;
  res.json({ total, items: filtered.slice(offset, offset + limit).map(toItem) });
});

app.get('/api/projects', authMiddleware, (req, res) => {
  const { status, stage, search } = req.query;
  let projects = getUserProjects(req.user);
  
  if (status) projects = projects.filter(p => p.project_status === status);
  if (stage) projects = projects.filter(p => p.current_stage === stage);
  if (search) {
    const s = search.toLowerCase();
    projects = projects.filter(p => 
      (p.project_name && p.project_name.toLowerCase().includes(s)) ||
      (p.project_code && p.project_code.toLowerCase().includes(s)) ||
      (p.customer_name && p.customer_name.toLowerCase().includes(s))
    );
  }
  
  projects.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  res.json(projects.map(project => sanitizeProjectForResponse(project, req.user)));
});

app.get('/api/projects/:id', authMiddleware, (req, res) => {
  const project = data.projects.find(p => p.id === req.params.id);
  if (!project) return res.status(404).json({ error: '项目不存在' });
  
  const logs = data.projectLogs
    .filter(l => l.project_id === req.params.id)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 20)
    .map(l => {
      const user = data.users.find(u => u.id === l.user_id);
      return sanitizeProjectLogForResponse({ ...l, realname: user ? user.realname : '未知' }, req.user);
    });
  
  res.json({ ...sanitizeProjectForResponse(project, req.user), logs });
});

app.post('/api/projects', authMiddleware, (req, res) => {
  const id = uuidv4();
  const count = data.projects.length + 1;
  const projectCode = `PRJ-${new Date().getFullYear()}-${String(count).padStart(3, '0')}`;
  const now = new Date().toISOString();
  
  const isAdmin = req.user.role === '管理员';
  const project = {
    id,
    project_code: projectCode,
    project_name: req.body.project_name || '',
    customer_name: req.body.customer_name || '',
    contract_amount: isAdmin ? (req.body.contract_amount || 0) : 0,
    signed_date: req.body.signed_date || '',
    planned_delivery_date: req.body.planned_delivery_date || '',
    actual_delivery_date: req.body.actual_delivery_date || '',
    device_count: req.body.device_count || 0,
    device_model: req.body.device_model || '',
    voltage_range: req.body.voltage_range || '',
    channel_count: req.body.channel_count || 0,
    technical_solution: req.body.technical_solution || '',
    technical_user_id: req.body.technical_user_id || '',
    purchase_list: req.body.purchase_list || '[]',
    purchase_progress: req.body.purchase_progress || 0,
    purchase_user_id: req.body.purchase_user_id || '',
    production_order: req.body.production_order || '',
    production_progress: req.body.production_progress || 0,
    assembly_complete_date: req.body.assembly_complete_date || '',
    test_complete_date: req.body.test_complete_date || '',
    production_user_id: req.body.production_user_id || '',
    test_report: req.body.test_report || '',
    test_result: req.body.test_result || '待测试',
    quality_user_id: req.body.quality_user_id || '',
    delivery_date: req.body.delivery_date || '',
    tracking_number: req.body.tracking_number || '',
    debug_status: req.body.debug_status || '待出发',
    acceptance_status: req.body.acceptance_status || '待验收',
    delivery_user_id: req.body.delivery_user_id || '',
    receivable_amount: isAdmin ? (req.body.receivable_amount || 0) : 0,
    received_amount: isAdmin ? (req.body.received_amount || 0) : 0,
    invoice_records: req.body.invoice_records || '[]',
    finance_user_id: req.body.finance_user_id || '',
    after_sale_status: req.body.after_sale_status || '正常',
    warranty_expiry_date: req.body.warranty_expiry_date || '',
    after_sale_records: req.body.after_sale_records || '',
    after_sale_user_id: req.body.after_sale_user_id || '',
    project_status: req.body.project_status || '进行中',
    current_stage: req.body.current_stage || '项目接单',
    middle_software_version: req.body.middle_software_version || '',
    lower_software_version: req.body.lower_software_version || '',
    upper_software_version: req.body.upper_software_version || '',
    pcb_drawing_version: req.body.pcb_drawing_version || '',
    structure_drawing_version: req.body.structure_drawing_version || '',
    checkpoints: [],
    plans: [],
    creator_id: req.user.id,
    created_at: now,
    updated_at: now
  };
  
  data.projects.push(project);
  
  data.projectLogs.push({
    id: uuidv4(),
    project_id: id,
    user_id: req.user.id,
    action: '创建项目',
    details: `创建项目 ${projectCode}`,
    created_at: now
  });
  
  saveData();
  res.status(201).json({ id, project_code: projectCode });
});

app.put('/api/projects/:id', authMiddleware, (req, res) => {
  const index = data.projects.findIndex(p => p.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: '项目不存在' });

  if (!hasProjectAccess(req.user, req.params.id)) return res.status(403).json({ error: '无权限访问此项目' });
  if (req.user.role !== '管理员') {
    const touchingFinance = financeFields.some(f => req.body[f] !== undefined);
    if (touchingFinance) {
      return res.status(403).json({ error: '财务字段仅管理员可修改' });
    }
  }
  
  const allowedFields = [
    'project_name', 'customer_name', 'contract_amount', 'signed_date', 
    'planned_delivery_date', 'actual_delivery_date', 'device_count', 'device_model', 
    'voltage_range', 'channel_count', 'technical_solution',
    'purchase_list', 'purchase_progress', 'purchase_user_id',
    'production_order', 'production_progress', 'assembly_complete_date', 
    'test_complete_date', 'production_user_id', 'test_report', 'test_result',
    'quality_user_id', 'delivery_date', 'tracking_number', 'debug_status', 
    'acceptance_status', 'delivery_user_id', 'receivable_amount', 'received_amount',
    'invoice_records', 'finance_user_id', 'after_sale_status', 'warranty_expiry_date',
    'after_sale_records', 'after_sale_user_id', 'project_status', 'current_stage',
    'middle_software_version', 'lower_software_version', 'upper_software_version',
    'pcb_drawing_version', 'structure_drawing_version'
  ];

  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      data.projects[index][field] = req.body[field];
    }
  });
  
  data.projects[index].updated_at = new Date().toISOString();

  data.projectLogs.push({
    id: uuidv4(),
    project_id: req.params.id,
    user_id: req.user.id,
    action: '更新项目',
    details: JSON.stringify(req.body),
    created_at: new Date().toISOString()
  });
  
  saveData();
  res.json({ success: true });
});

app.get('/api/projects/:id/checkpoints', authMiddleware, (req, res) => {
  const project = data.projects.find(p => p.id === req.params.id);
  if (!project) return res.status(404).json({ error: '项目不存在' });
  if (!hasProjectAccess(req.user, req.params.id)) return res.status(403).json({ error: '无权限访问此项目' });

  const checkpoints = Array.isArray(project.checkpoints) ? project.checkpoints : [];
  const result = checkpoints
    .map(c => applyOverdueStatus(c))
    .sort((a, b) => String(a.planned_date || '').localeCompare(String(b.planned_date || '')));
  res.json(result);
});

app.post('/api/projects/:id/checkpoints', authMiddleware, (req, res) => {
  const projectIndex = data.projects.findIndex(p => p.id === req.params.id);
  if (projectIndex === -1) return res.status(404).json({ error: '项目不存在' });
  if (!hasProjectAccess(req.user, req.params.id)) return res.status(403).json({ error: '无权限访问此项目' });

  const title = String(req.body.title || '').trim();
  const planned_date = String(req.body.planned_date || '').trim();
  const owner_user_id = String(req.body.owner_user_id || '').trim();
  const status = String(req.body.status || '未开始').trim();
  const notes = String(req.body.notes || '').trim();

  if (!title || !planned_date) return res.status(400).json({ error: '缺少必要字段' });
  if (!isValidYmd(planned_date)) return res.status(400).json({ error: '计划日期格式不正确' });
  if (!checkpointStatuses.includes(status)) return res.status(400).json({ error: '状态不合法' });

  const now = new Date().toISOString();
  const checkpoint = {
    id: uuidv4(),
    title,
    planned_date,
    owner_user_id,
    status,
    notes,
    created_at: now,
    updated_at: now
  };

  if (!Array.isArray(data.projects[projectIndex].checkpoints)) data.projects[projectIndex].checkpoints = [];
  data.projects[projectIndex].checkpoints.push(checkpoint);
  data.projects[projectIndex].updated_at = now;

  data.projectLogs.push({
    id: uuidv4(),
    project_id: req.params.id,
    user_id: req.user.id,
    action: '新增卡点',
    details: checkpoint.title,
    created_at: now
  });

  saveData();
  res.status(201).json(applyOverdueStatus(checkpoint));
});

app.put('/api/projects/:id/checkpoints/:checkpointId', authMiddleware, (req, res) => {
  const projectIndex = data.projects.findIndex(p => p.id === req.params.id);
  if (projectIndex === -1) return res.status(404).json({ error: '项目不存在' });
  if (!hasProjectAccess(req.user, req.params.id)) return res.status(403).json({ error: '无权限访问此项目' });

  const checkpoints = Array.isArray(data.projects[projectIndex].checkpoints) ? data.projects[projectIndex].checkpoints : [];
  const idx = checkpoints.findIndex(c => c.id === req.params.checkpointId);
  if (idx === -1) return res.status(404).json({ error: '卡点不存在' });

  const next = { ...checkpoints[idx] };
  if (req.body.title !== undefined) next.title = String(req.body.title || '').trim();
  if (req.body.planned_date !== undefined) next.planned_date = String(req.body.planned_date || '').trim();
  if (req.body.owner_user_id !== undefined) next.owner_user_id = String(req.body.owner_user_id || '').trim();
  if (req.body.status !== undefined) next.status = String(req.body.status || '').trim();
  if (req.body.notes !== undefined) next.notes = String(req.body.notes || '').trim();

  if (!next.title || !next.planned_date) return res.status(400).json({ error: '缺少必要字段' });
  if (!isValidYmd(next.planned_date)) return res.status(400).json({ error: '计划日期格式不正确' });
  if (!checkpointStatuses.includes(next.status)) return res.status(400).json({ error: '状态不合法' });

  const now = new Date().toISOString();
  next.updated_at = now;
  data.projects[projectIndex].checkpoints[idx] = next;
  data.projects[projectIndex].updated_at = now;

  data.projectLogs.push({
    id: uuidv4(),
    project_id: req.params.id,
    user_id: req.user.id,
    action: '更新卡点',
    details: next.title,
    created_at: now
  });

  saveData();
  res.json(applyOverdueStatus(next));
});

app.delete('/api/projects/:id/checkpoints/:checkpointId', authMiddleware, (req, res) => {
  const projectIndex = data.projects.findIndex(p => p.id === req.params.id);
  if (projectIndex === -1) return res.status(404).json({ error: '项目不存在' });
  if (!hasProjectAccess(req.user, req.params.id)) return res.status(403).json({ error: '无权限访问此项目' });

  const checkpoints = Array.isArray(data.projects[projectIndex].checkpoints) ? data.projects[projectIndex].checkpoints : [];
  const idx = checkpoints.findIndex(c => c.id === req.params.checkpointId);
  if (idx === -1) return res.status(404).json({ error: '卡点不存在' });

  const now = new Date().toISOString();
  const removed = checkpoints[idx];
  data.projects[projectIndex].checkpoints.splice(idx, 1);
  data.projects[projectIndex].updated_at = now;

  data.projectLogs.push({
    id: uuidv4(),
    project_id: req.params.id,
    user_id: req.user.id,
    action: '删除卡点',
    details: removed && removed.title ? removed.title : '',
    created_at: now
  });

  saveData();
  res.json({ success: true });
});

app.get('/api/projects/:id/plans', authMiddleware, (req, res) => {
  const project = data.projects.find(p => p.id === req.params.id);
  if (!project) return res.status(404).json({ error: '项目不存在' });
  if (!hasProjectAccess(req.user, req.params.id)) return res.status(403).json({ error: '无权限访问此项目' });

  const plans = Array.isArray(project.plans) ? project.plans : [];
  const result = plans
    .map(p => applyPlanOverdueStatus(p))
    .sort((a, b) => String(a.start_date || '').localeCompare(String(b.start_date || '')));
  res.json(result);
});

app.post('/api/projects/:id/plans', authMiddleware, (req, res) => {
  const projectIndex = data.projects.findIndex(p => p.id === req.params.id);
  if (projectIndex === -1) return res.status(404).json({ error: '项目不存在' });
  if (!hasProjectAccess(req.user, req.params.id)) return res.status(403).json({ error: '无权限访问此项目' });

  const title = String(req.body.title || '').trim();
  const start_date = String(req.body.start_date || '').trim();
  const end_date = String(req.body.end_date || '').trim();
  const owner_user_id = String(req.body.owner_user_id || '').trim();
  const status = String(req.body.status || '未开始').trim();
  const notes = String(req.body.notes || '').trim();

  if (!title || !start_date || !end_date) return res.status(400).json({ error: '缺少必要字段' });
  if (!isValidYmd(start_date) || !isValidYmd(end_date)) return res.status(400).json({ error: '日期格式不正确' });
  if (end_date < start_date) return res.status(400).json({ error: '结束日期不能早于开始日期' });
  if (!checkpointStatuses.includes(status)) return res.status(400).json({ error: '状态不合法' });

  const now = new Date().toISOString();
  const plan = {
    id: uuidv4(),
    title,
    start_date,
    end_date,
    owner_user_id,
    status,
    notes,
    created_at: now,
    updated_at: now
  };

  if (!Array.isArray(data.projects[projectIndex].plans)) data.projects[projectIndex].plans = [];
  data.projects[projectIndex].plans.push(plan);
  data.projects[projectIndex].updated_at = now;

  data.projectLogs.push({
    id: uuidv4(),
    project_id: req.params.id,
    user_id: req.user.id,
    action: '新增计划项',
    details: plan.title,
    created_at: now
  });

  saveData();
  res.status(201).json(applyPlanOverdueStatus(plan));
});

app.put('/api/projects/:id/plans/:planId', authMiddleware, (req, res) => {
  const projectIndex = data.projects.findIndex(p => p.id === req.params.id);
  if (projectIndex === -1) return res.status(404).json({ error: '项目不存在' });
  if (!hasProjectAccess(req.user, req.params.id)) return res.status(403).json({ error: '无权限访问此项目' });

  const plans = Array.isArray(data.projects[projectIndex].plans) ? data.projects[projectIndex].plans : [];
  const idx = plans.findIndex(p => p.id === req.params.planId);
  if (idx === -1) return res.status(404).json({ error: '计划项不存在' });

  const next = { ...plans[idx] };
  if (req.body.title !== undefined) next.title = String(req.body.title || '').trim();
  if (req.body.start_date !== undefined) next.start_date = String(req.body.start_date || '').trim();
  if (req.body.end_date !== undefined) next.end_date = String(req.body.end_date || '').trim();
  if (req.body.owner_user_id !== undefined) next.owner_user_id = String(req.body.owner_user_id || '').trim();
  if (req.body.status !== undefined) next.status = String(req.body.status || '').trim();
  if (req.body.notes !== undefined) next.notes = String(req.body.notes || '').trim();

  if (!next.title || !next.start_date || !next.end_date) return res.status(400).json({ error: '缺少必要字段' });
  if (!isValidYmd(next.start_date) || !isValidYmd(next.end_date)) return res.status(400).json({ error: '日期格式不正确' });
  if (next.end_date < next.start_date) return res.status(400).json({ error: '结束日期不能早于开始日期' });
  if (!checkpointStatuses.includes(next.status)) return res.status(400).json({ error: '状态不合法' });

  const now = new Date().toISOString();
  next.updated_at = now;
  data.projects[projectIndex].plans[idx] = next;
  data.projects[projectIndex].updated_at = now;

  data.projectLogs.push({
    id: uuidv4(),
    project_id: req.params.id,
    user_id: req.user.id,
    action: '更新计划项',
    details: next.title,
    created_at: now
  });

  saveData();
  res.json(applyPlanOverdueStatus(next));
});

app.delete('/api/projects/:id/plans/:planId', authMiddleware, (req, res) => {
  const projectIndex = data.projects.findIndex(p => p.id === req.params.id);
  if (projectIndex === -1) return res.status(404).json({ error: '项目不存在' });
  if (!hasProjectAccess(req.user, req.params.id)) return res.status(403).json({ error: '无权限访问此项目' });

  const plans = Array.isArray(data.projects[projectIndex].plans) ? data.projects[projectIndex].plans : [];
  const idx = plans.findIndex(p => p.id === req.params.planId);
  if (idx === -1) return res.status(404).json({ error: '计划项不存在' });

  const now = new Date().toISOString();
  const removed = plans[idx];
  data.projects[projectIndex].plans.splice(idx, 1);
  data.projects[projectIndex].updated_at = now;

  data.projectLogs.push({
    id: uuidv4(),
    project_id: req.params.id,
    user_id: req.user.id,
    action: '删除计划项',
    details: removed && removed.title ? removed.title : '',
    created_at: now
  });

  saveData();
  res.json({ success: true });
});

app.delete('/api/projects/:id', authMiddleware, adminMiddleware, (req, res) => {
  const index = data.projects.findIndex(p => p.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: '项目不存在' });

  const now = new Date().toISOString();
  const projectCode = data.projects[index].project_code;
  data.projects.splice(index, 1);
  data.projectLogs = data.projectLogs.filter(l => l.project_id !== req.params.id);
  data.projectLogs.push({
    id: uuidv4(),
    project_id: req.params.id,
    user_id: req.user.id,
    action: '删除项目',
    details: `删除项目 ${projectCode || ''}`.trim(),
    created_at: now
  });
  saveData();
  
  res.json({ success: true });
});

if (HAS_FRONTEND_DIST) {
  app.use(express.static(FRONTEND_DIST));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      next();
      return;
    }
    res.sendFile(path.join(FRONTEND_DIST, 'index.html'));
  });
}

app.listen(PORT, HOST, () => {
  console.log(`服务器运行在 http://${HOST}:${PORT}`);
});
