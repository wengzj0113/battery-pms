const { execSync } = require('child_process');
const path = require('path');

const projectPath = 'd:\\traeProjectManeger';

try {
  console.log('添加文件到Git...');
  execSync('git add -A', { cwd: projectPath, stdio: 'inherit' });
  
  console.log('提交代码...');
  execSync('git commit -m "feat: add user management and role permissions"', { cwd: projectPath, stdio: 'inherit' });
  
  console.log('推送到GitHub...');
  execSync('git push origin master', { cwd: projectPath, stdio: 'inherit' });
  
  console.log('✅ GitHub推送成功！');
} catch (err) {
  console.error('Git操作失败:', err.message);
}
