/**
 * JS Auto Forward - Background Service Worker
 * 负责管理转发规则，拦截远程 JS 请求并重定向到本地服务器
 */

const STORAGE_KEY = 'forwardRules';
const LOCAL_SERVER_KEY = 'localServerBase';
const ENABLED_KEY = 'globalEnabled';
const NATIVE_HOST = 'com.autoforward.host';

/**
 * 确保本地服务器正在运行，未运行则通过 Native Messaging 自动启动
 */
async function ensureServerRunning(serverBase) {
  try {
    const resp = await fetch(serverBase.replace(/\/$/, '') + '/ping', {
      signal: AbortSignal.timeout(1000)
    });
    if (resp.ok) return true;
  } catch (e) { /* 服务器未运行 */ }

  return new Promise((resolve) => {
    try {
      chrome.runtime.sendNativeMessage(NATIVE_HOST, { action: 'start_server' }, (response) => {
        if (chrome.runtime.lastError) {
          console.warn('[JS Auto Forward] Native Messaging 不可用:', chrome.runtime.lastError.message);
          resolve(false);
          return;
        }
        console.log('[JS Auto Forward] 服务器启动结果:', response);
        resolve(response?.success || false);
      });
    } catch (e) {
      resolve(false);
    }
  });
}

/**
 * 从 storage 加载所有转发规则
 */
async function loadRules() {
  const data = await chrome.storage.local.get([STORAGE_KEY, LOCAL_SERVER_KEY, ENABLED_KEY]);
  return {
    rules: data[STORAGE_KEY] || [],
    serverBase: data[LOCAL_SERVER_KEY] || 'http://localhost:3321',
    enabled: data[ENABLED_KEY] !== false
  };
}

/**
 * 应用转发规则到 declarativeNetRequest
 */
async function applyRules() {
  // 先清除所有现有的动态规则
  const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
  const existingRuleIds = existingRules.map(r => r.id);

  if (existingRuleIds.length > 0) {
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: existingRuleIds
    });
  }

  const { rules, serverBase, enabled } = await loadRules();

  if (!enabled) {
    updateBadge(false, 0);
    return;
  }

  // 筛选启用的规则
  const activeRules = rules.filter(r => r.enabled);

  if (activeRules.length === 0) {
    updateBadge(true, 0);
    return;
  }
  // 有激活规则时，确保本地服务器已启动
  await ensureServerRunning(serverBase);

  // 构建 declarativeNetRequest 规则
  const netRules = activeRules.map((rule, index) => {
    const ruleId = index + 1; // 规则 ID 必须 > 0

    // 构建重定向 URL
    let redirectUrl = rule.localUrl;
    if (redirectUrl.startsWith('http')) {
      // 已经是完整 URL，直接使用
    } else {
      // 本地文件路径，通过 /file?path= 接口访问
      const base = serverBase.replace(/\/$/, '');
      redirectUrl = base + '/file?path=' + encodeURIComponent(redirectUrl);
    }

    return {
      id: ruleId,
      priority: 1,
      action: {
        type: 'redirect',
        redirect: { url: redirectUrl }
      },
      condition: {
        urlFilter: rule.remoteUrl,
        resourceTypes: ['script', 'xmlhttprequest', 'other']
      }
    };
  });

  try {
    await chrome.declarativeNetRequest.updateDynamicRules({
      addRules: netRules
    });
    updateBadge(true, activeRules.length);
    console.log(`[JS Auto Forward] 已应用 ${activeRules.length} 条转发规则`);
  } catch (err) {
    console.error('[JS Auto Forward] 应用规则失败:', err);
  }
}

/**
 * 更新扩展图标的 badge
 */
function updateBadge(enabled, count) {
  if (!enabled) {
    chrome.action.setBadgeText({ text: 'OFF' });
    chrome.action.setBadgeBackgroundColor({ color: '#6b7280' });
  } else if (count > 0) {
    chrome.action.setBadgeText({ text: String(count) });
    chrome.action.setBadgeBackgroundColor({ color: '#10b981' });
  } else {
    chrome.action.setBadgeText({ text: '' });
  }
}

// 监听 storage 变化，自动刷新规则
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local') {
    if (changes[STORAGE_KEY] || changes[LOCAL_SERVER_KEY] || changes[ENABLED_KEY]) {
      applyRules();
    }
  }
});

// 扩展安装/更新时应用规则
chrome.runtime.onInstalled.addListener(() => {
  applyRules();
});

// Service Worker 激活时应用规则
applyRules();

// 监听来自 popup 的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'REFRESH_RULES') {
    applyRules().then(() => sendResponse({ success: true }));
    return true;
  }
  if (message.type === 'GET_STATUS') {
    loadRules().then(data => {
      sendResponse({
        enabled: data.enabled,
        activeCount: data.rules.filter(r => r.enabled).length,
        totalCount: data.rules.length
      });
    });
    return true;
  }
});
