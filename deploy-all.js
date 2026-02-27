const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const projectPath = 'd:\\traeProjectManeger';
const frontendPath = path.join(projectPath, 'frontend');

console.log('='.repeat(50));
console.log('GitHub提交和部署自动化脚本');
console.log('='.repeat(50));

function runGitCommand(cmd, cwd = projectPath) {
  try {
    execSync(cmd, { cwd, stdio: 'pipe' });
    return true;
  } catch (err) {
    console.log(`命令失败: ${cmd}`);
    return false;
  }
}

console.log('\n[1/3] 检查Git状态...');
execSync('git status', { cwd: projectPath, stdio: 'inherit' });

console.log('\n[2/3] 尝试推送到GitHub...');

const pushCommands = [
  'gh repo create battery-pms --private --source=. --push -y',
  'git push -u origin master'
];

for (const cmd of pushCommands) {
  console.log(`\n尝试: ${cmd}`);
  try {
    execSync(cmd, { cwd: projectPath, stdio: 'inherit' });
    console.log('✓ 成功!');
    break;
  } catch (err) {
    console.log('需要认证或已存在');
  }
}

console.log('\n[3/3] 部署到Vercel...');
try {
  execSync('npx vercel deploy --prod', { cwd: frontendPath, stdio: 'inherit' });
} catch (err) {
  console.log('Vercel部署需要认证');
}

console.log('\n' + '='.repeat(50));
console.log('需要手动完成的步骤:');
console.log('='.repeat(50));
console.log(`
1. GitHub推送:
   - 访问 https://github.com/new 创建名为 "battery-pms" 的私有仓库
   - 然后运行:
     cd ${projectPath}
     git remote add origin https://github.com/你的用户名/battery-pms.git
     git push -u origin master

2. Vercel部署(前端):
   - 访问 https://vercel.com 并登录
   - 导入GitHub仓库 "battery-pms"
   - 配置: Root Directory = frontend
   - 点击 Deploy

3. 部署后端(Railway):
   - 访问 https://railway.app 并登录
   - 从GitHub导入 "battery-pms"
   - 配置: Root Directory = backend
   - 设置环境变量: PORT=3001
`);
