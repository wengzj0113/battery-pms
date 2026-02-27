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
  console.log('测试软件版本字段功能');
  console.log('='.repeat(50));

  let adminToken = '';
  let testProjectId = '';

  // 测试1: 管理员登录
  await test('1. 管理员登录', async () => {
    const res = await request('POST', '/api/login', { username: 'admin', password: 'admin123' });
    if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
    adminToken = res.data.token;
    if (!adminToken) throw new Error('未获取到token');
    console.log(`   管理员: ${res.data.user.realname}`);
  });

  // 测试2: 创建项目带软件版本
  await test('2. 创建项目带软件版本信息', async () => {
    const res = await request('POST', '/api/projects', {
      project_name: '软件版本测试项目',
      customer_name: '测试客户',
      contract_amount: 100000,
      middle_software_version: 'V1.0.0',
      lower_software_version: 'V2.1.0',
      upper_software_version: 'V1.5.0',
      pcb_drawing_version: 'PCB-V1.0',
      structure_drawing_version: 'STR-V1.2'
    }, adminToken);
    if (res.status !== 201) throw new Error(`HTTP ${res.status}`);
    testProjectId = res.data.id;
    console.log(`   项目ID: ${testProjectId}`);
  });

  // 测试3: 获取项目详情验证软件版本
  await test('3. 获取项目详情验证软件版本', async () => {
    const res = await request('GET', `/api/projects/${testProjectId}`, null, adminToken);
    if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
    
    const p = res.data;
    if (p.middle_software_version !== 'V1.0.0') throw new Error('中位机软件版本不匹配');
    if (p.lower_software_version !== 'V2.1.0') throw new Error('下位机软件版本不匹配');
    if (p.upper_software_version !== 'V1.5.0') throw new Error('上位机软件版本不匹配');
    if (p.pcb_drawing_version !== 'PCB-V1.0') throw new Error('线路板图纸版本不匹配');
    if (p.structure_drawing_version !== 'STR-V1.2') throw new Error('结构设计图纸版本不匹配');
    
    console.log(`   中位机: ${p.middle_software_version}`);
    console.log(`   下位机: ${p.lower_software_version}`);
    console.log(`   上位机: ${p.upper_software_version}`);
    console.log(`   线路板图纸: ${p.pcb_drawing_version}`);
    console.log(`   结构图纸: ${p.structure_drawing_version}`);
  });

  // 测试4: 更新项目软件版本
  await test('4. 更新项目软件版本', async () => {
    const res = await request('PUT', `/api/projects/${testProjectId}`, {
      middle_software_version: 'V1.1.0',
      lower_software_version: 'V2.2.0'
    }, adminToken);
    if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
    console.log(`   已更新版本`);
  });

  // 测试5: 验证更新后的版本
  await test('5. 验证更新后的版本', async () => {
    const res = await request('GET', `/api/projects/${testProjectId}`, null, adminToken);
    if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
    
    if (res.data.middle_software_version !== 'V1.1.0') throw new Error('中位机软件版本未更新');
    if (res.data.lower_software_version !== 'V2.2.0') throw new Error('下位机软件版本未更新');
    
    console.log(`   中位机: ${res.data.middle_software_version}`);
    console.log(`   下位机: ${res.data.lower_software_version}`);
  });

  // 测试6: 删除测试项目
  await test('6. 删除测试项目', async () => {
    const res = await request('DELETE', `/api/projects/${testProjectId}`, null, adminToken);
    if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
    console.log(`   已删除`);
  });

  console.log('='.repeat(50));
  console.log('✅ 所有测试通过！');
  console.log('='.repeat(50));
}

run().catch(err => {
  console.error('测试失败:', err.message);
  process.exit(1);
});
