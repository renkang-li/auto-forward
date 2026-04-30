/**
 * JS Auto Forward - Native Messaging Host
 * 接收扩展消息，自动管理本地服务器的启停
 */

const { spawn } = require('child_process');
const path = require('path');
const http = require('http');

const SERVER_PORT = 3321;
let inputBuffer = Buffer.alloc(0);

// 读取 Chrome 发来的消息（Native Messaging 协议：4字节长度 + JSON）
process.stdin.on('data', (chunk) => {
  inputBuffer = Buffer.concat([inputBuffer, chunk]);
  if (inputBuffer.length < 4) return;
  const msgLen = inputBuffer.readUInt32LE(0);
  if (inputBuffer.length < 4 + msgLen) return;
  const msg = JSON.parse(inputBuffer.slice(4, 4 + msgLen).toString('utf8'));
  handleMessage(msg);
});

async function handleMessage(msg) {
  if (msg.action === 'start_server') {
    const port = msg.port || SERVER_PORT;
    const running = await isServerRunning(port);
    if (running) {
      sendResponse({ success: true, status: 'already_running' });
      return;
    }
    // 以分离模式启动服务器，宿主退出后服务器继续运行
    const serverPath = path.join(__dirname, 'local-server.js');
    const child = spawn(process.execPath, [serverPath, String(port)], {
      detached: true,
      stdio: 'ignore',
      cwd: __dirname
    });
    child.unref();
    await new Promise(r => setTimeout(r, 600));
    const started = await isServerRunning(port);
    sendResponse({ success: started, status: started ? 'started' : 'failed', pid: child.pid });
  } else {
    sendResponse({ success: false, error: 'unknown action' });
  }
}

function isServerRunning(port) {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${port}/ping`, { timeout: 1000 }, (res) => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => { req.destroy(); resolve(false); });
  });
}

function sendResponse(msg) {
  const json = JSON.stringify(msg);
  const header = Buffer.alloc(4);
  header.writeUInt32LE(json.length, 0);
  process.stdout.write(header);
  process.stdout.write(json);
  setTimeout(() => process.exit(0), 100);
}
