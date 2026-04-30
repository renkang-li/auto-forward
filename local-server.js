/**
 * JS Auto Forward - 本地文件服务器
 * 支持通过绝对路径直接访问本地任意文件，无需配置根目录
 *
 * 使用方法：
 *   node local-server.js
 *
 * 访问示例：
 *   http://localhost:3321/file?path=D:\LF\project\dist\index.js
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const PORT = parseInt(process.argv[2]) || 3321;

const MIME_TYPES = {
  '.js': 'application/javascript',
  '.mjs': 'application/javascript',
  '.json': 'application/json',
  '.css': 'text/css',
  '.html': 'text/html',
  '.map': 'application/json'
};

const server = http.createServer((req, res) => {
  // 允许跨域
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // 解析请求
  const parsed = new URL(req.url, `http://localhost:${PORT}`);

  // /file?path=绝对路径 模式
  if (parsed.pathname === '/file' && parsed.searchParams.get('path')) {
    const filePath = path.resolve(parsed.searchParams.get('path'));
    serveFile(filePath, res);
    return;
  }

  // 健康检查
  if (parsed.pathname === '/ping') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', time: new Date().toISOString() }));
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('用法: /file?path=本地文件绝对路径');
});

function serveFile(filePath, res) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      console.log(`[404] ${filePath}`);
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('文件不存在: ' + filePath);
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    // 禁用缓存
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    console.log(`[200] ${filePath}`);
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
}

server.listen(PORT, () => {
  console.log('');
  console.log('  JS Auto Forward 本地服务器已启动');
  console.log('  ─────────────────────────────────');
  console.log(`  地址: http://localhost:${PORT}`);
  console.log('  模式: 绝对路径模式（无需配置根目录）');
  console.log('');
  console.log('  按 Ctrl+C 停止');
  console.log('');
});
