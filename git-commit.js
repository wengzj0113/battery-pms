const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const projectPath = 'd:\\traeProjectManeger';

try {
  console.log('配置Git用户...');
  execSync('git config user.email "dev@example.com"', { cwd: projectPath, stdio: 'pipe' });
  execSync('git config user.name "Developer"', { cwd: projectPath, stdio: 'pipe' });
  
  console.log('添加文件...');
  execSync('git add -A', { cwd: projectPath, stdio: 'pipe' });
  
  console.log('提交代码...');
  execSync('git commit -m "Initial commit: 锂电池化成分容设备项目管理系统"', { cwd: projectPath, stdio: 'pipe' });
  
  console.log('✓ Git提交成功！');
} catch (err) {
  console.error('Git操作失败:', err.message);
}
