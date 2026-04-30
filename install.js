/**
 * JS Auto Forward - 一次性安装脚本
 *
 * 用法：
 *   node install.js          安装（会提示输入扩展 ID）
 *   node install.js --remove 卸载
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

const HOST_NAME = 'com.autoforward.host';
const REG_KEY = `HKCU\\Software\\Google\\Chrome\\NativeMessagingHosts\\${HOST_NAME}`;

async function install() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const extensionId = await ask(rl, '请输入 Chrome 扩展 ID（在 chrome://extensions/ 页面复制）: ');
  rl.close();

  if (!extensionId || extensionId.trim().length < 10) {
    console.error('扩展 ID 格式不正确');
    process.exit(1);
  }

  const batPath = path.join(__dirname, 'native-host.bat').replace(/\//g, '\\');

  // 生成 Native Messaging Host 配置
  const manifest = {
    name: HOST_NAME,
    description: 'JS Auto Forward 本地服务器管理',
    path: batPath,
    type: 'stdio',
    allowed_origins: [`chrome-extension://${extensionId.trim()}/`]
  };

  const manifestPath = path.join(__dirname, 'native-host-manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  // 写入注册表（HKCU 无需管理员权限）
  execSync(`reg add "${REG_KEY}" /ve /t REG_SZ /d "${manifestPath}" /f`, { stdio: 'pipe' });

  console.log('');
  console.log('安装成功！');
  console.log('');
  console.log(`配置文件: ${manifestPath}`);
  console.log(`注册表:   ${REG_KEY}`);
  console.log('');
  console.log('现在请刷新 Chrome 扩展，之后服务器会自动启动，无需手动操作。');
}

function remove() {
  try { execSync(`reg delete "${REG_KEY}" /f`, { stdio: 'pipe' }); } catch (e) { /* ignore */ }
  const manifestPath = path.join(__dirname, 'native-host-manifest.json');
  if (fs.existsSync(manifestPath)) fs.unlinkSync(manifestPath);
  console.log('已卸载 Native Messaging Host。');
}

function ask(rl, q) {
  return new Promise(resolve => rl.question(q, resolve));
}

if (process.argv.includes('--remove')) {
  remove();
} else {
  install().catch(console.error);
}
