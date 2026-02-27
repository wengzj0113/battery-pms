const { execSync } = require('child_process');
const https = require('https');

const projectPath = 'd:\\traeProjectManeger';

function createRepoAndPush() {
  console.log('尝试通过API创建GitHub仓库...');
  
  const repoName = 'battery-pms';
  const data = JSON.stringify({
    name: repoName,
    private: true,
    description: '锂电池化成分容设备项目管理系统'
  });

  const options = {
    hostname: 'api.github.com',
    path: '/user/repos',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length,
      'User-Agent': 'Node.js'
    }
  };

  const req = https.request(options, (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
      if (res.statusCode === 201) {
        console.log('✓ GitHub仓库创建成功!');
        pushToGitHub();
      } else if (res.statusCode === 401) {
        console.log('需要GitHub认证token');
        console.log('\n请在终端中运行以下命令来认证GitHub:');
        console.log('gh auth login');
        console.log('\n或者手动在 https://github.com 创建仓库，然后运行:');
        console.log('git remote add origin https://github.com/你的用户名/battery-pms.git');
        console.log('git push -u origin master');
      } else {
        console.log('创建仓库失败:', res.statusCode, body);
      }
    });
  });

  req.on('error', (e) => {
    console.log('请求失败:', e.message);
  });

  req.write(data);
  req.end();
}

function pushToGitHub() {
  try {
    console.log('添加远程仓库...');
    execSync('git remote add origin https://github.com/wengzj0113/battery-pms.git', { cwd: projectPath, stdio: 'pipe' });
    
    console.log('推送到GitHub...');
    execSync('git push -u origin master', { cwd: projectPath, stdio: 'inherit' });
    
    console.log('✓ 成功推送到GitHub!');
  } catch (err) {
    console.log('推送失败:', err.message);
  }
}

createRepoAndPush();
