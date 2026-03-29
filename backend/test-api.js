const http = require('http');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3001';
const DATA_FILE = process.env.DATA_FILE || process.env.DATA_FILE_PATH || path.join(__dirname, 'data.json');
const JWT_SECRET = process.env.JWT_SECRET || 'dev-battery-pms-secret';
let failures = 0;

function request(method, requestPath, data, token) {
  return new Promise((resolve, reject) => {
    const url = new URL(requestPath, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (token) options.headers.Authorization = `Bearer ${token}`;

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('请求超时'));
    });

    if (data !== undefined && data !== null) req.write(JSON.stringify(data));
    req.end();
  });
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function readDataFile() {
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
}

function createTokenForUser(user) {
  return jwt.sign({ id: user.id, username: user.username, role: user.role, realname: user.realname }, JWT_SECRET, { expiresIn: '7d' });
}

async function test(name, fn) {
  try {
    await fn();
    console.log(`✅ ${name}`);
  } catch (err) {
    failures++;
    console.error(`❌ ${name}: ${err.message}`);
  }
}

async function run() {
  failures = 0;
  console.log('='.repeat(50));
  console.log('开始自动化回归测试');
  console.log('='.repeat(50));

  const dataset = readDataFile();
  const adminUser = dataset.users.find(u => u.role === '管理员');
  const techUser = dataset.users.find(u => u.role === '技术');
  const purchaseUser = dataset.users.find(u => u.role === '采购');

  assert(adminUser, '缺少管理员用户');
  assert(techUser, '缺少技术用户');
  assert(purchaseUser, '缺少采购用户');

  const adminToken = createTokenForUser(adminUser);
  const techToken = createTokenForUser(techUser);
  const purchaseToken = createTokenForUser(purchaseUser);
  const stamp = Date.now();
  const tempUsername = `testuser_${stamp}`;
  const tempProjectName = `自动化测试项目_${stamp}`;
  let tempUserId = '';
  let tempProjectId = '';
  let tempPlanId = '';

  await test('1. 管理员令牌可访问用户列表', async () => {
    const res = await request('GET', '/api/users', null, adminToken);
    assert(res.status === 200, `HTTP ${res.status}`);
    assert(Array.isArray(res.data), '用户列表格式错误');
  });

  await test('2. 非管理员访问用户列表被拒绝', async () => {
    const res = await request('GET', '/api/users', null, techToken);
    assert(res.status === 403, `应返回403，实际${res.status}`);
  });

  await test('3. 管理员可创建编辑删除用户', async () => {
    const createRes = await request('POST', '/api/users', {
      username: tempUsername,
      password: 'test123456',
      realname: '自动化测试用户',
      role: '技术'
    }, adminToken);
    assert(createRes.status === 201, `创建失败 ${createRes.status}`);
    tempUserId = createRes.data.id;
    assert(tempUserId, '未返回用户ID');

    const updateRes = await request('PUT', `/api/users/${tempUserId}`, {
      realname: '自动化测试用户-已更新',
      role: '采购'
    }, adminToken);
    assert(updateRes.status === 200, `更新失败 ${updateRes.status}`);

    const passwordRes = await request('PUT', `/api/users/${tempUserId}/password`, { password: 'newpass123456' }, adminToken);
    assert(passwordRes.status === 200, `改密失败 ${passwordRes.status}`);

    const deleteRes = await request('DELETE', `/api/users/${tempUserId}`, null, adminToken);
    assert(deleteRes.status === 200, `删除失败 ${deleteRes.status}`);
  });

  await test('4. 管理员创建项目并保留财务字段', async () => {
    const res = await request('POST', '/api/projects', {
      project_name: tempProjectName,
      contract_amount: 88888,
      receivable_amount: 66666,
      received_amount: 12345,
      device_count: 2
    }, adminToken);
    assert(res.status === 201, `HTTP ${res.status}`);
    tempProjectId = res.data.id;
    assert(tempProjectId, '未返回项目ID');

    const detailRes = await request('GET', `/api/projects/${tempProjectId}`, null, adminToken);
    assert(detailRes.status === 200, `HTTP ${detailRes.status}`);
    assert(detailRes.data.contract_amount === 88888, '管理员详情未保留合同金额');
    assert(detailRes.data.receivable_amount === 66666, '管理员详情未保留应收金额');
    assert(detailRes.data.received_amount === 12345, '管理员详情未保留已收金额');
  });

  await test('5. 非管理员项目列表已脱敏财务字段', async () => {
    const res = await request('GET', '/api/projects', null, techToken);
    assert(res.status === 200, `HTTP ${res.status}`);
    assert(Array.isArray(res.data), '项目列表格式错误');
    const target = res.data.find(item => item.id === tempProjectId);
    assert(target, '技术用户未看到测试项目');
    assert(target.contract_amount === undefined, '技术用户列表看到了合同金额');
    assert(target.receivable_amount === undefined, '技术用户列表看到了应收金额');
    assert(target.received_amount === undefined, '技术用户列表看到了已收金额');
  });

  await test('6. 非管理员项目详情与日志已脱敏财务字段', async () => {
    const updateRes = await request('PUT', `/api/projects/${tempProjectId}`, { device_count: 3 }, adminToken);
    assert(updateRes.status === 200, `管理员更新失败 ${updateRes.status}`);
    const financeLogRes = await request('PUT', `/api/projects/${tempProjectId}`, { contract_amount: 99999 }, adminToken);
    assert(financeLogRes.status === 200, `管理员财务更新失败 ${financeLogRes.status}`);

    const res = await request('GET', `/api/projects/${tempProjectId}`, null, techToken);
    assert(res.status === 200, `HTTP ${res.status}`);
    assert(res.data.contract_amount === undefined, '技术用户详情看到了合同金额');
    assert(res.data.receivable_amount === undefined, '技术用户详情看到了应收金额');
    assert(res.data.received_amount === undefined, '技术用户详情看到了已收金额');
    assert(Array.isArray(res.data.logs), '日志格式错误');
    const financeLog = res.data.logs.find(item => item.action === '更新项目');
    assert(financeLog, '未找到更新日志');
    assert(!String(financeLog.details || '').includes('contract_amount'), '技术用户日志看到了财务字段');
  });

  await test('7. 非管理员可编辑普通字段但不能修改财务字段', async () => {
    const updateRes = await request('PUT', `/api/projects/${tempProjectId}`, { project_name: `${tempProjectName}_技术更新` }, techToken);
    assert(updateRes.status === 200, `普通字段更新失败 ${updateRes.status}`);

    const financeRes = await request('PUT', `/api/projects/${tempProjectId}`, { contract_amount: 1 }, techToken);
    assert(financeRes.status === 403, `财务字段应403，实际${financeRes.status}`);
  });

  await test('8. 项目计划接口支持查询参数与全员访问', async () => {
    const invalidRes = await request('POST', `/api/projects/${tempProjectId}/plans`, {
      title: '无效计划',
      start_date: '2026-03-10',
      end_date: '2026-03-01'
    }, adminToken);
    assert(invalidRes.status === 400, `无效计划应400，实际${invalidRes.status}`);

    const createRes = await request('POST', `/api/projects/${tempProjectId}/plans`, {
      title: '计划A',
      start_date: '2026-03-01',
      end_date: '2026-03-10'
    }, adminToken);
    assert(createRes.status === 201, `计划创建失败 ${createRes.status}`);
    tempPlanId = createRes.data.id;

    const techRes = await request('GET', `/api/projects/${tempProjectId}/plans`, null, techToken);
    assert(techRes.status === 200, `技术访问失败 ${techRes.status}`);
    assert(techRes.data.some(item => item.id === tempPlanId), '技术未看到计划');

    const purchaseRes = await request('GET', `/api/projects/${tempProjectId}/plans`, null, purchaseToken);
    assert(purchaseRes.status === 200, `采购访问失败 ${purchaseRes.status}`);
  });

  await test('9. 看板统计对管理员与非管理员返回不同字段', async () => {
    const adminRes = await request('GET', '/api/dashboard/stats', null, adminToken);
    assert(adminRes.status === 200, `管理员看板失败 ${adminRes.status}`);
    assert(adminRes.data.totalAmount !== undefined, '管理员缺少项目总额');

    const techRes = await request('GET', '/api/dashboard/stats', null, techToken);
    assert(techRes.status === 200, `技术看板失败 ${techRes.status}`);
    assert(techRes.data.totalAmount === undefined, '技术看板不应返回项目总额');
  });

  await test('10. 查询参数会正确传递到后端', async () => {
    const res = await request('GET', '/api/dashboard/projects?type=all&limit=1&offset=0', null, techToken);
    assert(res.status === 200, `HTTP ${res.status}`);
    assert(Array.isArray(res.data.items), '项目分页结果格式错误');
    assert(res.data.items.length <= 1, 'limit 参数未生效');
  });

  await test('11. 错误密码登录被拒绝', async () => {
    const res = await request('POST', '/api/login', { username: adminUser.username, password: 'wrongpassword' });
    assert(res.status === 401, `应返回401，实际${res.status}`);
  });

  await test('12. 无令牌访问被拒绝', async () => {
    const res = await request('GET', '/api/projects', null, null);
    assert(res.status === 401, `应返回401，实际${res.status}`);
  });

  await test('13. 清理测试项目', async () => {
    if (!tempProjectId) return;
    const res = await request('DELETE', `/api/projects/${tempProjectId}`, null, adminToken);
    assert(res.status === 200, `删除测试项目失败 ${res.status}`);
  });

  console.log('='.repeat(50));
  if (failures > 0) {
    console.error(`❌ 测试失败：${failures} 项未通过`);
    console.log('='.repeat(50));
    process.exit(1);
  }
  console.log('✅ 所有测试通过！');
  console.log('='.repeat(50));
}

run().catch(err => {
  console.error('测试失败:', err.message);
  process.exit(1);
});
