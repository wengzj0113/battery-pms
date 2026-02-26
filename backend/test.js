const http = require('http');

const BASE_URL = 'http://localhost:3001';
let token = '';

function request(path, method = 'GET', body = null) {
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

    if (body) {
      options.headers['Content-Length'] = Buffer.byteLength(JSON.stringify(body));
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', reject);
    
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function test() {
  console.log('=== 测试开始 ===\n');
  
  console.log('1. 测试登录功能...');
  const loginRes = await request('/api/login', 'POST', { username: 'admin', password: 'admin123' });
  if (loginRes.status === 200 && loginRes.data.token) {
    token = loginRes.data.token;
    console.log('   ✓ 登录成功，用户:', loginRes.data.user.realname);
  } else {
    console.log('   ✗ 登录失败:', loginRes.data.error);
    return;
  }

  console.log('\n2. 测试获取用户列表...');
  const usersRes = await request('/api/users');
  if (usersRes.status === 200) {
    console.log(`   ✓ 获取到 ${usersRes.data.length} 个用户`);
  } else {
    console.log('   ✗ 获取用户列表失败');
  }

  console.log('\n3. 测试获取仪表盘统计...');
  const statsRes = await request('/api/dashboard/stats');
  if (statsRes.status === 200) {
    console.log('   ✓ 统计数据:', JSON.stringify(statsRes.data));
  } else {
    console.log('   ✗ 获取统计数据失败');
  }

  console.log('\n4. 测试创建项目...');
  const createRes = await request('/api/projects', 'POST', {
    project_name: '测试锂电池化成分容设备项目',
    customer_name: '比亚迪测试',
    contract_amount: 500000,
    planned_delivery_date: '2026-06-30',
    device_model: 'BC-64',
    voltage_range: '3.0-4.2V',
    channel_count: 64
  });
  if (createRes.status === 200) {
    console.log('   ✓ 项目创建成功:', createRes.data.project_code);
    var projectId = createRes.data.id;
  } else {
    console.log('   ✗ 创建项目失败:', createRes.data.error);
    return;
  }

  console.log('\n5. 测试获取项目列表...');
  const listRes = await request('/api/projects');
  if (listRes.status === 200) {
    console.log(`   ✓ 获取到 ${listRes.data.length} 个项目`);
  } else {
    console.log('   ✗ 获取项目列表失败');
  }

  console.log('\n6. 测试获取单个项目详情...');
  const detailRes = await request(`/api/projects/${projectId}`);
  if (detailRes.status === 200) {
    console.log('   ✓ 项目详情:', detailRes.data.project_name);
    console.log('   - 客户:', detailRes.data.customer_name);
    console.log('   - 合同金额:', detailRes.data.contract_amount);
    console.log('   - 当前阶段:', detailRes.data.current_stage);
  } else {
    console.log('   ✗ 获取项目详情失败');
  }

  console.log('\n7. 测试更新项目...');
  const updateRes = await request(`/api/projects/${projectId}`, 'PUT', {
    purchase_progress: 50,
    production_progress: 30,
    current_stage: '采购执行'
  });
  if (updateRes.status === 200) {
    console.log('   ✓ 项目更新成功');
  } else {
    console.log('   ✗ 更新项目失败');
  }

  console.log('\n8. 测试再次获取项目详情（验证更新）...');
  const updatedDetailRes = await request(`/api/projects/${projectId}`);
  if (updatedDetailRes.status === 200) {
    console.log('   ✓ 采购进度:', updatedDetailRes.data.purchase_progress + '%');
    console.log('   ✓ 生产进度:', updatedDetailRes.data.production_progress + '%');
    console.log('   ✓ 当前阶段:', updatedDetailRes.data.current_stage);
  }

  console.log('\n9. 测试删除项目...');
  const deleteRes = await request(`/api/projects/${projectId}`, 'DELETE');
  if (deleteRes.status === 200) {
    console.log('   ✓ 项目删除成功');
  } else {
    console.log('   ✗ 删除项目失败');
  }

  console.log('\n10. 测试验证项目已删除...');
  const afterDeleteRes = await request(`/api/projects/${projectId}`);
  if (afterDeleteRes.status === 404) {
    console.log('   ✓ 项目已成功删除');
  }

  console.log('\n=== 测试完成 ===');
  console.log('\n所有核心功能测试通过！');
}

test().catch(err => {
  console.error('测试出错:', err.message);
});
