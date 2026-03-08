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
const JWT_SECRET = 'battery-pms-secret-key-2026';
const DATA_FILE = path.join(__dirname, 'data.json');

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

let data = { users: [], projects: [], projectLogs: [] };

if (fs.existsSync(DATA_FILE)) {
  try {
    data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  } catch (e) {
    data = { users: [], projects: [], projectLogs: [] };
  }
}

const saveData = () => {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
};

if (data.users.length === 0) {
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
  if (user.role === '管理员') {
    return data.projects;
  }
  
  const roleFieldMap = {
    '技术': 'technical_user_id',
    '采购': 'purchase_user_id',
    '生产': 'production_user_id',
    '交付': 'delivery_user_id',
    '财务': 'finance_user_id',
    '售后': 'after_sale_user_id'
  };
  
  const field = roleFieldMap[user.role];
  if (!field) {
    return [];
  }
  
  return data.projects.filter(p => p[field] === user.id);
};

const hasProjectAccess = (user, projectId) => {
  if (user.role === '管理员') return true;
  const userProjects = getUserProjects(user);
  return userProjects.some(p => p.id === projectId);
};

const isValidYmd = (value) => {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || '').trim());
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

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const user = data.users.find(u => u.username === username);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }
  const token = jwt.sign({ id: user.id, username: user.username, role: user.role, realname: user.realname }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, username: user.username, realname: user.realname, role: user.role } });
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
    totalAmount,
    stageDistribution
  });
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
  res.json(projects);
});

app.get('/api/projects/:id', authMiddleware, (req, res) => {
  const project = data.projects.find(p => p.id === req.params.id);
  if (!project) return res.status(404).json({ error: '项目不存在' });
  
  const userProjects = getUserProjects(req.user);
  const hasAccess = userProjects.some(p => p.id === req.params.id);
  if (!hasAccess) return res.status(403).json({ error: '无权限访问此项目' });
  
  const logs = data.projectLogs
    .filter(l => l.project_id === req.params.id)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 20)
    .map(l => {
      const user = data.users.find(u => u.id === l.user_id);
      return { ...l, realname: user ? user.realname : '未知' };
    });
  
  res.json({ ...project, logs });
});

app.post('/api/projects', authMiddleware, (req, res) => {
  const id = uuidv4();
  const count = data.projects.length + 1;
  const projectCode = `PRJ-${new Date().getFullYear()}-${String(count).padStart(3, '0')}`;
  const now = new Date().toISOString();
  
  const project = {
    id,
    project_code: projectCode,
    project_name: req.body.project_name || '',
    customer_name: req.body.customer_name || '',
    contract_amount: req.body.contract_amount || 0,
    signed_date: req.body.signed_date || '',
    planned_delivery_date: req.body.planned_delivery_date || '',
    actual_delivery_date: req.body.actual_delivery_date || '',
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
    receivable_amount: req.body.receivable_amount || 0,
    received_amount: req.body.received_amount || 0,
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
  
  const allowedFields = [
    'project_name', 'customer_name', 'contract_amount', 'signed_date', 
    'planned_delivery_date', 'actual_delivery_date', 'device_model', 
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

app.listen(PORT, HOST, () => {
  console.log(`服务器运行在 http://${HOST}:${PORT}`);
});
