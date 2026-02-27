const { execSync } = require('child_process');

const projectPath = 'd:\\traeProjectManeger';

try {
  console.log('创建GitHub仓库...');
  execSync('gh repo create battery-pms --private --source=. --push', { 
    cwd: projectPath, 
    stdio: 'inherit',
    env: { ...process.env, GH_TOKEN: process.env.GH_TOKEN }
  });
  console.log('✓ 已推送到GitHub！');
} catch (err) {
  console.error('推送失败:', err.message);
  console.log('\n请在浏览器中手动完成以下步骤：');
  console.log('1. 访问 https://github.com/new 创建新仓库');
  console.log('2. 运行以下命令推送代码:');
  console.log('   git remote add origin https://github.com/你的用户名/battery-pms.git');
  console.log('   git push -u origin master');
}
