const { execSync } = require('child_process');
const path = require('path');

const root = path.resolve(__dirname, '..');

console.log('Installing backend dependencies...');
execSync('npm install', {
  cwd: path.join(root, 'backend'),
  stdio: 'inherit',
});

console.log('Installing frontend dependencies...');
execSync('npm install', {
  cwd: path.join(root, 'frontend'),
  stdio: 'inherit',
});
