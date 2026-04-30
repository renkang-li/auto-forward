/**
 * 图标生成脚本 - 生成扩展所需的图标文件
 * 运行: node generate-icons.js
 */

const fs = require('fs');
const path = require('path');

// 创建 icons 目录
const iconsDir = path.join(__dirname, 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir);
}

// 生成 SVG 图标
function createSvgIcon(size) {
  const padding = Math.round(size * 0.12);
  const innerSize = size - padding * 2;
  const cx = size / 2;
  const cy = size / 2;
  const r = innerSize / 2;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${Math.round(size * 0.18)}" fill="#1a1d27"/>
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#3b82f6" stroke-width="${Math.max(1.5, size * 0.04)}"/>
  <path d="M${cx - r * 0.35} ${cy - r * 0.15} L${cx + r * 0.1} ${cy - r * 0.15} L${cx + r * 0.1} ${cy + r * 0.15} L${cx + r * 0.35} ${cy + r * 0.15}" 
        fill="none" stroke="#3b82f6" stroke-width="${Math.max(1.5, size * 0.05)}" stroke-linecap="round" stroke-linejoin="round"/>
  <polygon points="${cx + r * 0.15},${cy - r * 0.35} ${cx + r * 0.55},${cy - r * 0.15} ${cx + r * 0.15},${cy + r * 0.05}" fill="#3b82f6"/>
  <polygon points="${cx + r * 0.15},${cy - r * 0.05} ${cx + r * 0.55},${cy + r * 0.15} ${cx + r * 0.15},${cy + r * 0.35}" fill="#10b981"/>
</svg>`;
}

// 生成各尺寸图标的 SVG（用于开发，生产需要转 PNG）
[16, 48, 128].forEach(size => {
  const svg = createSvgIcon(size);
  fs.writeFileSync(path.join(iconsDir, `icon${size}.svg`), svg);
  console.log(`已生成 icon${size}.svg`);
});

console.log('');
console.log('SVG 图标已生成。');
console.log('Chrome 扩展需要 PNG 格式图标，请用以下方式转换：');
console.log('  1. 使用在线工具如 https://svgtopng.com/');
console.log('  2. 或者安装 sharp: npm install sharp && node convert-icons.js');
console.log('');
console.log('或者，直接使用下方的 data URI 方式（已自动处理）...');

// 生成简单的 1x1 占位 PNG（实际项目中应替换为真实图标）
// 这里我们生成一个最小可用的 PNG
function createMinimalPng(size) {
  // 创建一个简单的 PNG 文件
  // PNG 文件头 + IHDR + IDAT + IEND
  const width = size;
  const height = size;

  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // 创建 IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;  // bit depth
  ihdrData[9] = 2;  // color type: RGB
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace

  const ihdr = createChunk('IHDR', ihdrData);

  // 创建 IDAT chunk（简单的蓝色填充）
  const rawData = [];
  for (let y = 0; y < height; y++) {
    rawData.push(0); // filter byte
    for (let x = 0; x < width; x++) {
      // 简单的圆形图标：蓝色圆在深色背景上
      const dx = x - width / 2;
      const dy = y - height / 2;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const radius = width * 0.38;

      if (dist <= radius) {
        rawData.push(59, 130, 246); // #3b82f6 蓝色
      } else {
        rawData.push(26, 29, 39); // #1a1d27 深色背景
      }
    }
  }

  const deflated = deflateRaw(Buffer.from(rawData));
  const idat = createChunk('IDAT', deflated);

  // IEND chunk
  const iend = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdr, idat, iend]);
}

function createChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);

  const typeBuffer = Buffer.from(type);
  const crcData = Buffer.concat([typeBuffer, data]);
  const crc = crc32(crcData);
  const crcBuffer = Buffer.alloc(4);
  crcBuffer.writeUInt32BE(crc, 0);

  return Buffer.concat([length, typeBuffer, data, crcBuffer]);
}

// CRC32 计算
function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      if (crc & 1) {
        crc = (crc >>> 1) ^ 0xEDB88320;
      } else {
        crc = crc >>> 1;
      }
    }
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

// 简单的 deflate（使用 zlib）
function deflateRaw(data) {
  const zlib = require('zlib');
  return zlib.deflateSync(data);
}

// 生成 PNG 图标
[16, 48, 128].forEach(size => {
  const png = createMinimalPng(size);
  fs.writeFileSync(path.join(iconsDir, `icon${size}.png`), png);
  console.log(`已生成 icon${size}.png (${png.length} bytes)`);
});

console.log('\n图标生成完成！');
