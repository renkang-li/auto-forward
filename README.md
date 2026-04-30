# JS Auto Forward

浏览器扩展 —— 将远程 JS 请求转发到本地文件，方便本地调试插件，无需反复发版。

## 核心功能

- 🔄 **URL 转发**：拦截指定的远程 JS URL，重定向到本地文件
- ⚡ **即时生效**：修改本地代码后刷新页面即可看到效果，无需发版
- 🚀 **自动启动**：本地服务器随扩展自动启动，无需手动操作
- 📁 **绝对路径**：直接填本地文件完整路径，无需配置根目录

## 安装步骤

### 1. 加载扩展

1. 打开 Chrome，进入 `chrome://extensions/`
2. 右上角开启「**开发者模式**」
3. 点击「**加载已解压的扩展程序**」→ 选择本项目文件夹
4. 记下扩展的 **ID**（扩展卡片上显示的一串字母）

### 2. 注册自动启动（一次性）

```bash
node install.js
```

按提示输入扩展 ID，完成后扩展就能自动管理本地服务器了。

卸载：`node install.js --remove`

## 使用方法

### 第一步：找到远程 JS URL

1. 打开商城页面，按 `F12` 打开开发者工具
2. 切换到「**网络**」面板，找到目标 JS 文件
3. 右键 → 「**复制链接地址**」

### 第二步：添加转发规则

1. 点击浏览器右上角的扩展图标
2. 点击「**添加转发规则**」
3. 填写：
   - **规则名称**：例如 `paymentprocessingfee 插件`
   - **远程 JS URL**：粘贴复制的远程地址
   - **本地 JS 路径**：填写完整路径，例如 `D:\LF\paymentprocessingfee-store\dist\index.js`
4. 保存，刷新商城页面即可

## 示例

| 远程 URL | 本地路径 |
|----------|----------|
| `https://xxx.com/extensions/.../assets/index.js` | `D:\LF\paymentprocessingfee-store\dist\index.js` |

## 注意事项

- 添加规则后需**刷新目标页面**才能生效
- 修改扩展代码后需在 `chrome://extensions/` 页面刷新扩展
- 本地服务器会在有激活规则时自动启动，无需手动管理

## 项目结构

```
auto-forward/
├── manifest.json       # 扩展配置
├── background.js       # 后台逻辑（规则管理 + 自动启动）
├── popup.html/css/js   # 弹出面板
├── local-server.js     # 本地文件服务器
├── native-host.js      # Native Messaging 宿主
├── native-host.bat     # 宿主启动器
├── install.js          # 一次性安装脚本
└── icons/              # 扩展图标
```
