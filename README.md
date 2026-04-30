# JS Auto Forward

浏览器扩展 —— 将远程 JS 请求转发到本地文件，方便本地调试插件，无需反复发版。

## 核心功能

- 🔄 **URL 转发**：拦截指定的远程 JS URL，重定向到本地文件
- ⚡ **即时生效**：修改本地代码后刷新页面即可看到效果，无需发版
- 🎛️ **灵活管理**：支持多条转发规则，可单独启用/禁用
- 🌐 **全局开关**：一键暂停/恢复所有转发
- 📁 **绝对路径**：直接填本地文件完整路径，无需配置根目录

## 安装步骤

### 1. 安装扩展

1. 打开 Chrome 浏览器，进入 `chrome://extensions/`
2. 右上角开启「**开发者模式**」
3. 点击「**加载已解压的扩展程序**」
4. 选择本项目文件夹（`auto-forward` 目录）

### 2. 启动本地服务器

```bash
node local-server.js
```

启动一次即可，无需任何参数。服务器默认运行在 `http://localhost:3321`。

## 使用方法

### 第一步：找到远程 JS URL

1. 打开商城页面
2. 按 `F12` 打开开发者工具
3. 切换到「**网络**」(Network) 面板
4. 找到你要替换的 JS 文件
5. 右键 → 「**复制链接地址**」

### 第二步：添加转发规则

1. 点击浏览器右上角的扩展图标打开面板
2. 点击「**添加转发规则**」
3. 填写：
   - **规则名称**：方便识别，例如 `paymentprocessingfee 插件`
   - **远程 JS URL**：粘贴复制的远程地址
   - **本地 JS 路径**：填写本地文件的**完整路径**，例如 `D:\LF\paymentprocessingfee-store\dist\index.js`
4. 保存规则

### 第三步：刷新页面

回到商城页面，刷新即可。远程 JS 会被替换为你本地的文件。

## 示例

| 远程 URL | 本地路径 |
|----------|----------|
| `https://xxx.com/extensions/.../assets/index.js` | `D:\LF\paymentprocessingfee-store\dist\index.js` |
| `https://xxx.com/plugins/checkout.js` | `D:\LF\checkout-plugin\dist\checkout.js` |

## 注意事项

- 添加或修改规则后需要**刷新目标页面**才能生效
- 修改扩展代码后需要在 `chrome://extensions/` 页面**刷新扩展**
- 本地服务器已默认设置 CORS 和禁用缓存，确保每次拿到最新文件
- 支持同时配置多条规则，不同项目的文件可以同时转发

## 项目结构

```
auto-forward/
├── manifest.json       # 扩展配置文件
├── background.js       # 后台 Service Worker
├── popup.html          # 弹出面板 HTML
├── popup.css           # 弹出面板样式
├── popup.js            # 弹出面板逻辑
├── local-server.js     # 本地文件服务器
└── icons/              # 扩展图标
```
