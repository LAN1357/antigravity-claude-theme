/**
 * Claude Enhancer for Antigravity
 * 1. 置顶 / 项目 / 最近 侧边栏三段式结构（全部支持折叠/展开）
 * 2. 项目名加粗与紧凑间距
 * 3. 新建对话 SPA 无刷新秒开 (默认路由至 antigravity日常)
 */
(function() {
  const DAILY_SECTION_ID = '3f37f9eb-e69b-4496-b230-dd157ff2f379';
  const CACHE_KEY = '__claude_recent_conversations_cache';
  const COLLAPSED_KEY = '__claude_recent_collapsed';

  // 清除旧药丸栏残留
  const oldBar = document.getElementById('claude-projects-pills-bar');
  if (oldBar) oldBar.remove();

  // 清除旧定时器
  if (window.__claude_enhancer_interval) {
    clearInterval(window.__claude_enhancer_interval);
    window.__claude_enhancer_interval = null;
  }

  // 1. 获取路由器实例
  function getRouter() {
    return window.__antigravity_router || window.__TSR_ROUTER__ || null;
  }

  // 2. 劫持顶部全局“+ 新建对话”按钮：无刷新秒开日常工作区
  function hookNewChat() {
    const newChatBtn = document.querySelector('[data-testid="new-conversation-button"]');
    if (newChatBtn && !newChatBtn.dataset.hookedDailySpa) {
      newChatBtn.dataset.hookedDailySpa = 'true';
      newChatBtn.setAttribute('href', `/?section=${DAILY_SECTION_ID}`);
      newChatBtn.addEventListener('click', (e) => {
        if (!e.metaKey && !e.ctrlKey && !e.shiftKey) {
          e.preventDefault();
          e.stopPropagation();
          const router = getRouter();
          if (router && typeof router.navigate === 'function') {
            router.navigate({ to: '/', search: { section: DAILY_SECTION_ID } });
          } else {
            window.location.href = `/?section=${DAILY_SECTION_ID}`;
          }
        }
      }, true);
    }
  }

  // 3. 重命名原生分组标题：Pinned Conversations -> 置顶，项目列表 -> 项目
  function renameHeaders() {
    const headers = document.querySelectorAll('[data-testid="section-header"]');
    headers.forEach(h => {
      const title = h.getAttribute('data-title');
      const span = h.querySelector('button > span.truncate') || h.querySelector('span.truncate');
      if (span) {
        if (title === 'Pinned Conversations' || span.textContent.includes('Pinned') || span.textContent === '置顶') {
          if (span.textContent !== '置顶') span.textContent = '置顶';
        } else if (title === 'Projects' || span.textContent.includes('项目') || span.textContent === '项目') {
          if (span.textContent !== '项目') span.textContent = '项目';
        }
      }
    });
  }

  // 4. 渲染最近对话列表 (Section 3: 最近，带折叠/展开按钮)
  function renderRecents() {
    const scrollContainer = document.querySelector('.relative.w-full.h-full.overflow-y-auto') ||
                            document.querySelector('[data-testid="conversation-list-sidebar"]');
    if (!scrollContainer) return;

    // 获取数据：优先内存变量，其次 localStorage 缓存
    let recents = window.__claude_recent_conversations;
    if (Array.isArray(recents) && recents.length > 0) {
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(recents));
      } catch (e) {}
    } else {
      try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) recents = JSON.parse(cached);
      } catch (e) {}
    }

    if (!Array.isArray(recents) || recents.length === 0) return;

    let recentSec = document.getElementById('claude-recent-section');
    if (!recentSec) {
      recentSec = document.createElement('div');
      recentSec.id = 'claude-recent-section';
      recentSec.className = 'claude-recent-section';
      scrollContainer.appendChild(recentSec);
    }

    // 绑定事件委托（确保即使元素已存在也能绑定最新事件）
    if (recentSec.dataset.hookedVersion !== '2') {
      recentSec.dataset.hookedVersion = '2';
      recentSec.addEventListener('click', (e) => {
        // A. 点击折叠/展开按钮
        const toggleBtn = e.target.closest('.claude-recent-toggle-btn');
        if (toggleBtn) {
          e.preventDefault();
          e.stopPropagation();
          const isCurrentlyCollapsed = recentSec.classList.contains('is-collapsed');
          const nextCollapsed = !isCurrentlyCollapsed;
          if (nextCollapsed) {
            recentSec.classList.add('is-collapsed');
            toggleBtn.setAttribute('aria-expanded', 'false');
          } else {
            recentSec.classList.remove('is-collapsed');
            toggleBtn.setAttribute('aria-expanded', 'true');
          }
          try {
            localStorage.setItem(COLLAPSED_KEY, nextCollapsed ? 'true' : 'false');
          } catch (err) {}
          return;
        }

        // B. 点击会话项：SPA 无刷新秒开
        const link = e.target.closest('.claude-recent-item');
        if (link && !e.metaKey && !e.ctrlKey && !e.shiftKey) {
          e.preventDefault();
          e.stopPropagation();
          const id = link.getAttribute('data-id');
          const router = getRouter();
          if (router && typeof router.navigate === 'function') {
            router.navigate({ to: '/c/' + id });
          } else {
            window.location.href = '/c/' + id;
          }
        }
      }, true);
    }

    const isCollapsed = localStorage.getItem(COLLAPSED_KEY) === 'true';
    if (isCollapsed) {
      if (!recentSec.classList.contains('is-collapsed')) recentSec.classList.add('is-collapsed');
    } else {
      if (recentSec.classList.contains('is-collapsed')) recentSec.classList.remove('is-collapsed');
    }

    const currentPath = window.location.pathname;
    const currentId = currentPath.startsWith('/c/') ? currentPath.split('/c/')[1]?.split('?')[0] : '';

    // 生成列表内容
    const listHtml = recents.map(item => {
      const isActive = item.id === currentId;
      const safeTitle = (item.title || '新对话')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
      return `<a class="claude-recent-item ${isActive ? 'active' : ''}" data-id="${item.id}" href="/c/${item.id}" title="${safeTitle}">${safeTitle}</a>`;
    }).join('');

    const newHtml = `
      <div class="claude-recent-header">
        <button type="button" class="claude-recent-toggle-btn" aria-expanded="${!isCollapsed}">
          <span class="truncate">最近</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 -960 960 960" fill="currentColor" class="claude-recent-chevron">
            <path d="M517.85-480l-184-184L376-706.15L602.15-480L376-253.85L333.85-296l184-184Z"></path>
          </svg>
        </button>
      </div>
      <div class="claude-recent-list">
        ${listHtml}
      </div>
    `;

    if (recentSec.dataset.lastHtml !== newHtml) {
      recentSec.innerHTML = newHtml;
      recentSec.dataset.lastHtml = newHtml;
    } else {
      // 仅更新 active 状态高亮
      recentSec.querySelectorAll('.claude-recent-item').forEach(link => {
        const id = link.getAttribute('data-id');
        if (id === currentId) {
          if (!link.classList.contains('active')) link.classList.add('active');
        } else {
          if (link.classList.contains('active')) link.classList.remove('active');
        }
      });
    }
  }

  // 暴露给注入进程热更新调用
  window.__claude_render_recents = renderRecents;

  function tick() {
    hookNewChat();
    renameHeaders();
    renderRecents();
  }

  window.__claude_enhancer_interval = setInterval(tick, 600);
  tick();
})();
