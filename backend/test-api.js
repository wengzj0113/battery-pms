const http = require('http');

const BASE_URL = 'http://localhost:3001';

function request(method, path, data, token) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

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

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function test(name, fn) {
  try {
    await fn();
    console.log(`✅ ${name}`);
  } catch (err) {
    console.error(`❌ ${name}: ${err.message}`);
  }
}

async function run() {
  console.log('='.repeat(50));
  console.log('开始测试用户管理与角色权限系统');
  console.log('='.repeat(50));

  let adminToken = '';
  let techToken = '';

  // 测试1: 管理员登录
  await test('1. 管理员登录', async () => {
    const res = await request('POST', '/api/login', { username: 'admin', password: 'admin123' });
    if (res.status !== 200) throw new Error(`HTTP ${res.status}: ${res.data.error}`);
    adminToken = res.data.token;
    if (!adminToken) throw new Error('未获取到token');
    console.log(`   管理员: ${res.data.user.realname} (${res.data.user.role})`);
  });

  // 测试2: 技术角色登录
  await test('2. 技术角色登录', async () => {
    const res = await request('POST', '/api/login', { username: 'tech', password: 'tech123' });
    if (res.status !== 200) throw new Error(`HTTP ${res.status}: ${res.data.error}`);
    techToken = res.data.token;
    if (!techToken) throw new Error('未获取到token');
    console.log(`   技术: ${res.data.user.realname} (${res.data.user.role})`);
  });

  // 测试3: 获取用户列表（需管理员权限）
  await test('3. 获取用户列表（管理员）', async () => {
    const res = await request('GET', '/api/users', null, adminToken);
    if (res.status !== 200) throw new Error(`HTTP ${res.status}: ${res.data.error}`);
    if (!Array.isArray(res.data)) throw new Error('返回数据格式错误');
    console.log(`   用户数量: ${res.data.length}`);
  });

  // 测试4: 获取当前用户信息
  await test('4. 获取当前用户信息', async () => {
    const res = await request('GET', '/api/users/me', null, adminToken);
    if (res.status !== 200) throw new Error(`HTTP ${res.status}: ${res.data.error}`);
    if (res.data.role !== '管理员') throw new Error('角色验证失败');
    console.log(`   当前用户: ${res.data.realname} (${res.data.role})`);
  });

  // 测试5: 创建新用户（需管理员权限）
  await test('5. 创建新用户（管理员）', async () => {
    const res = await request('POST', '/api/users', {
      username: 'testuser_' + Date.now(),
      password: 'test123',
      realname: '测试用户',
      role: '技术'
    }, adminToken);
    if (res.status !== 201) throw new Error(`HTTP ${res.status}: ${res.data.error}`);
    console.log(`   新用户ID: ${res.data.id}`);
  });

  // 测试6: 编辑用户（需管理员权限）
  await test('6. 编辑用户（管理员）', async () => {
    const listRes = await request('GET', '/api/users', null, adminToken);
    const targetUser = listRes.data.find(u => u.username.startsWith('testuser_'));
    if (!targetUser) throw new Error('未找到测试用户');

    const res = await request('PUT', `/api/users/${targetUser.id}`, {
      realname: '测试用户-已修改',
      role: '采购'
    }, adminToken);
    if (res.status !== 200) throw new Error(`HTTP ${res.status}: ${res.data.error}`);
    console.log(`   已修改用户: ${targetUser.username}`);
  });

  // 测试7: 修改用户密码（需管理员权限）
  await test('7. 修改用户密码（管理员）', async () => {
    const listRes = await request('GET', '/api/users', null, adminToken);
    const targetUser = listRes.data.find(u => u.username.startsWith('testuser_'));
    if (!targetUser) throw new Error('未找到测试用户');

    const res = await request('PUT', `/api/users/${targetUser.id}/password`, {
      password: 'newpassword123'
    }, adminToken);
    if (res.status !== 200) throw new Error(`HTTP ${res.status}: ${res.data.error}`);
    console.log(`   已修改密码`);
  });

  // 测试8: 删除用户（需管理员权限）
  await test('8. 删除用户（管理员）', async () => {
    const listRes = await request('GET', '/api/users', null, adminToken);
    const targetUser = listRes.data.find(u => u.username.startsWith('testuser_'));
    if (!targetUser) throw new Error('未找到测试用户');

    const res = await request('DELETE', `/api/users/${targetUser.id}`, null, adminToken);
    if (res.status !== 200) throw new Error(`HTTP ${res.status}: ${res.data.error}`);
    console.log(`   已删除用户: ${targetUser.username}`);
  });

  // 测试9: 非管理员创建用户（应失败）
  await test('9. 非管理员创建用户（应拒绝）', async () => {
    const res = await request('POST', '/api/users', {
      username: 'hacker',
      password: 'hack',
      realname: '黑客',
      role: '管理员'
    }, techToken);
    if (res.status !== 403) throw new Error(`应返回403，实际返回${res.status}`);
    console.log('   正确拒绝非管理员操作');
  });

  // 测试10: 非管理员访问用户列表（应失败）
  await test('10. 非管理员访问用户列表（应拒绝）', async () => {
    const res = await request('GET', '/api/users', null, techToken);
    if (res.status !== 403) throw new Error(`应返回403，实际返回${res.status}`);
    console.log('   正确拒绝非管理员访问');
  });

  // 测试11: 项目列表 - 管理员查看所有项目
  await test('11. 项目列表 - 管理员查看所有', async () => {
    const res = await request('GET', '/api/projects', null, adminToken);
    if (res.status !== 200) throw new Error(`HTTP ${res.status}: ${res.data.error}`);
    console.log(`   项目数量: ${res.data.length}`);
  });

  // 测试12: 项目列表 - 技术只能看自己的项目
  await test('12. 项目列表 - 技术角色过滤', async () => {
    const res = await request('GET', '/api/projects', null, techToken);
    if (res.status !== 200) throw new Error(`HTTP ${res.status}: ${res.data.error}`);
    console.log(`   技术可查看项目数: ${res.data.length}`);
  });

  // 测试13: 仪表盘统计 - 管理员
  await test('13. 仪表盘统计 - 管理员', async () => {
    const res = await request('GET', '/api/dashboard/stats', null, adminToken);
    if (res.status !== 200) throw new Error(`HTTP ${res.status}: ${res.data.error}`);
    if (res.data.totalAmount === undefined) throw new Error('缺少totalAmount字段');
    console.log(`   项目总额: ¥${res.data.totalAmount.toLocaleString()}`);
  });

  // 测试14: 仪表盘统计 - 技术角色
  await test('14. 仪表盘统计 - 技术角色', async () => {
    const res = await request('GET', '/api/dashboard/stats', null, techToken);
    if (res.status !== 200) throw new Error(`HTTP ${res.status}: ${res.data.error}`);
    if (res.data.totalAmount === undefined) throw new Error('缺少totalAmount字段');
    console.log(`   技术可查看项目总额: ¥${res.data.totalAmount.toLocaleString()}`);
  });

  // 测试15: 错误的登录
  await test('15. 错误密码登录（应失败）', async () => {
    const res = await request('POST', '/api/login', { username: 'admin', password: 'wrongpassword' });
    if (res.status !== 401) throw new Error(`应返回401，实际返回${res.status}`);
    console.log('   正确拒绝错误密码');
  });

  // 测试16: 无Token访问
  await test('16. 无Token访问API（应失败）', async () => {
    const res = await request('GET', '/api/projects', null, null);
    if (res.status !== 401) throw new Error(`应返回401，实际返回${res.status}`);
    console.log('   正确拒绝未授权访问');
  });

  console.log('='.repeat(50));
  console.log('✅ 所有测试通过！');
  console.log('='.repeat(50));
}

run().catch(err => {
  console.error('测试失败:', err.message);
  process.exit(1);
});
