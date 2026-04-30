/**
 * JS Auto Forward - Popup 交互逻辑
 */

const STORAGE_KEY = 'forwardRules';
const LOCAL_SERVER_KEY = 'localServerBase';
const ENABLED_KEY = 'globalEnabled';

// DOM 元素
const globalToggle = document.getElementById('globalToggle');
const serverBaseInput = document.getElementById('serverBase');
const rulesList = document.getElementById('rulesList');
const emptyState = document.getElementById('emptyState');
const rulesCount = document.getElementById('rulesCount');
const btnAdd = document.getElementById('btnAdd');
const modalOverlay = document.getElementById('modalOverlay');
const modalTitle = document.getElementById('modalTitle');
const inputName = document.getElementById('inputName');
const inputRemoteUrl = document.getElementById('inputRemoteUrl');
const inputLocalUrl = document.getElementById('inputLocalUrl');
const btnSave = document.getElementById('btnSave');
const btnCancel = document.getElementById('btnCancel');
const btnModalClose = document.getElementById('btnModalClose');

// 当前编辑的规则索引（-1 表示新增）
let editingIndex = -1;

/**
 * 初始化
 */
async function init() {
  const data = await chrome.storage.local.get([STORAGE_KEY, LOCAL_SERVER_KEY, ENABLED_KEY]);
  const rules = data[STORAGE_KEY] || [];
  const serverBase = data[LOCAL_SERVER_KEY] || 'http://localhost:3321';
  const enabled = data[ENABLED_KEY] !== false;

  globalToggle.checked = enabled;
  serverBaseInput.value = serverBase;

  renderRules(rules);
}

/**
 * 渲染规则列表
 */
function renderRules(rules) {
  rulesCount.textContent = `${rules.length} 条`;

  if (rules.length === 0) {
    rulesList.classList.add('hidden');
    emptyState.classList.remove('hidden');
    return;
  }

  rulesList.classList.remove('hidden');
  emptyState.classList.add('hidden');

  rulesList.innerHTML = rules.map((rule, index) => `
    <div class="rule-card ${rule.enabled ? '' : 'disabled'}" data-index="${index}">
      <div class="rule-top">
        <span class="rule-name">${escapeHtml(rule.name || '未命名规则')}</span>
        <div class="rule-actions">
          <button class="btn-icon" title="编辑" data-action="edit" data-index="${index}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </button>
          <button class="btn-icon danger" title="删除" data-action="delete" data-index="${index}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
          <label class="switch rule-switch" title="启用/禁用">
            <input type="checkbox" ${rule.enabled ? 'checked' : ''} data-action="toggle" data-index="${index}">
            <span class="slider"></span>
          </label>
        </div>
      </div>
      <div class="rule-urls">
        <div class="rule-url-row">
          <span class="url-label remote">远程</span>
          <span class="url-text" title="${escapeHtml(rule.remoteUrl)}">${escapeHtml(rule.remoteUrl)}</span>
        </div>
        <div class="rule-arrow">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <polyline points="19 12 12 19 5 12"></polyline>
          </svg>
        </div>
        <div class="rule-url-row">
          <span class="url-label local">本地</span>
          <span class="url-text" title="${escapeHtml(rule.localUrl)}">${escapeHtml(rule.localUrl)}</span>
        </div>
      </div>
    </div>
  `).join('');
}

/**
 * HTML 转义
 */
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * 获取规则列表
 */
async function getRules() {
  const data = await chrome.storage.local.get(STORAGE_KEY);
  return data[STORAGE_KEY] || [];
}

/**
 * 保存规则列表
 */
async function saveRules(rules) {
  await chrome.storage.local.set({ [STORAGE_KEY]: rules });
  renderRules(rules);
  // 通知 background 刷新规则
  chrome.runtime.sendMessage({ type: 'REFRESH_RULES' });
}

/**
 * 打开模态框
 */
function openModal(index = -1) {
  editingIndex = index;

  if (index === -1) {
    modalTitle.textContent = '添加转发规则';
    inputName.value = '';
    inputRemoteUrl.value = '';
    inputLocalUrl.value = '';
  } else {
    modalTitle.textContent = '编辑转发规则';
    getRules().then(rules => {
      const rule = rules[index];
      inputName.value = rule.name || '';
      inputRemoteUrl.value = rule.remoteUrl || '';
      inputLocalUrl.value = rule.localUrl || '';
    });
  }

  modalOverlay.classList.add('active');
  setTimeout(() => inputName.focus(), 100);
}

/**
 * 关闭模态框
 */
function closeModal() {
  modalOverlay.classList.remove('active');
  editingIndex = -1;
}

// ========================================
// 事件绑定
// ========================================

// 全局开关
globalToggle.addEventListener('change', async () => {
  await chrome.storage.local.set({ [ENABLED_KEY]: globalToggle.checked });
});

// 服务器地址
let serverDebounce;
serverBaseInput.addEventListener('input', () => {
  clearTimeout(serverDebounce);
  serverDebounce = setTimeout(async () => {
    await chrome.storage.local.set({ [LOCAL_SERVER_KEY]: serverBaseInput.value.trim() });
  }, 500);
});

// 添加规则按钮
btnAdd.addEventListener('click', () => openModal(-1));

// 模态框关闭
btnCancel.addEventListener('click', closeModal);
btnModalClose.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', (e) => {
  if (e.target === modalOverlay) closeModal();
});

// 保存规则
btnSave.addEventListener('click', async () => {
  const name = inputName.value.trim();
  const remoteUrl = inputRemoteUrl.value.trim();
  const localUrl = inputLocalUrl.value.trim();

  if (!remoteUrl) {
    inputRemoteUrl.style.borderColor = 'var(--danger)';
    inputRemoteUrl.focus();
    setTimeout(() => inputRemoteUrl.style.borderColor = '', 2000);
    return;
  }

  if (!localUrl) {
    inputLocalUrl.style.borderColor = 'var(--danger)';
    inputLocalUrl.focus();
    setTimeout(() => inputLocalUrl.style.borderColor = '', 2000);
    return;
  }

  const rules = await getRules();
  const ruleData = {
    name: name || '未命名规则',
    remoteUrl,
    localUrl,
    enabled: true,
    createdAt: Date.now()
  };

  if (editingIndex === -1) {
    rules.push(ruleData);
  } else {
    ruleData.enabled = rules[editingIndex].enabled;
    ruleData.createdAt = rules[editingIndex].createdAt || Date.now();
    rules[editingIndex] = ruleData;
  }

  await saveRules(rules);
  closeModal();
});

// 规则列表点击事件委托
rulesList.addEventListener('click', async (e) => {
  const actionEl = e.target.closest('[data-action]');
  if (!actionEl) return;

  const action = actionEl.dataset.action;
  const index = parseInt(actionEl.dataset.index, 10);
  const rules = await getRules();

  switch (action) {
    case 'edit':
      openModal(index);
      break;
    case 'delete':
      rules.splice(index, 1);
      await saveRules(rules);
      break;
    case 'toggle':
      rules[index].enabled = actionEl.checked;
      await saveRules(rules);
      break;
  }
});

// 键盘快捷键
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
  if (e.key === 'Enter' && modalOverlay.classList.contains('active')) {
    btnSave.click();
  }
});

// 初始化
init();
