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

  // 5. 净化顶部杂项按钮（如“安装 IDE”等非必要推广）
  function hidePromoButtons() {
    const btns = document.querySelectorAll('button');
    btns.forEach(b => {
      if (b.textContent.trim() === '安装 IDE') {
        b.style.display = 'none';
      }
    });
  }

  // 6. Claude 统一思考与执行栏控制器 (Unified Thought & Tool Execution Drawer)

  // A. 全局事件委托：监听复制/展开以及用户手动折叠行为
  if (!window.__claude_thought_events_bound) {
    window.__claude_thought_events_bound = true;

    document.addEventListener('click', (e) => {
      // 1. 复制原始命令
      const copyBtn = e.target.closest('.claude-btn-copy');
      if (copyBtn) {
        e.preventDefault();
        e.stopPropagation();
        const cmd = copyBtn.getAttribute('data-cmd');
        if (cmd && navigator.clipboard) {
          navigator.clipboard.writeText(cmd).then(() => {
            copyBtn.textContent = '已复制';
            setTimeout(() => { copyBtn.textContent = '复制'; }, 1500);
          }).catch(() => {});
        }
        return;
      }

      // 2. 展开/折叠原始命令
      const expandBtn = e.target.closest('.claude-btn-expand');
      if (expandBtn) {
        e.preventDefault();
        e.stopPropagation();
        const drawer = expandBtn.closest('[data-testid="run-command-step"]')?.querySelector('.claude-cmd-drawer');
        if (drawer) {
          const isHidden = drawer.style.display === 'none';
          drawer.style.display = isHidden ? 'block' : 'none';
          expandBtn.textContent = isHidden ? '收起' : '展开';
        }
        return;
      }

      // 3. 用户手动点击折叠/展开主栏（Requirement 4: 手动展开过的栏绝不被自动折叠）
      const triggerBtn = e.target.closest('button[data-testid="tool-group-collapsible"], button[data-testid="thinking-collapsible-trigger"], button[data-testid="worked-for-collapsible"]');
      if (triggerBtn) {
        const wasExpanded = triggerBtn.getAttribute('aria-expanded') === 'true';
        if (!wasExpanded) {
          // 用户手动展开：打上用户已展开标记，防止被自动折叠
          triggerBtn.dataset.claudeUserOpened = 'true';
          delete triggerBtn.dataset.claudeUserClosed;
        } else {
          // 用户手动折叠：移除展开标记并标记已手动关闭
          delete triggerBtn.dataset.claudeUserOpened;
          triggerBtn.dataset.claudeUserClosed = 'true';
        }
      }
    }, true);
  }

  // B. 文本汉化映射表
  function translateChinese(str) {
    if (!str || typeof str !== 'string') return str;
    return str
      .replace(/Exploring (\d+) files?/gi, '探索 $1 个文件')
      .replace(/Explored (\d+) files?/gi, '已探索 $1 个文件')
      .replace(/Exploring (\d+) search(?:es)?/gi, '探索 $1 次搜索')
      .replace(/Explored (\d+) search(?:es)?/gi, '已探索 $1 次搜索')
      .replace(/(\d+)\s*tasks?/gi, '$1 个任务')
      .replace(/running (\d+) commands?/gi, '运行 $1 条命令')
      .replace(/ran (\d+) commands?/gi, '已运行 $1 条命令')
      .replace(/Worked for (\d+)m\s*(\d+)s/gi, '已耗时 $1 分 $2 秒')
      .replace(/Worked for (\d+)m/gi, '已耗时 $1 分钟')
      .replace(/Worked for (\d+)s/gi, '已耗时 $1 秒')
      .replace(/Thought for (\d+)m\s*(\d+)s/gi, '已思考 $1 分 $2 秒')
      .replace(/Thought for (\d+)m/gi, '已思考 $1 分钟')
      .replace(/Thought for (\d+)s/gi, '已思考 $1 秒')
      .replace(/^Thinking\.*/gi, '思考中...')
      .replace(/^Running\.*/gi, '执行中...')
      .replace(/^Working\.*/gi, '执行中...')
      .replace(/^Searching\s+(.+)$/gi, '正在搜索 $1')
      .replace(/^Searched\s+(.+)$/gi, '已搜索 $1')
      .replace(/^Edited/gi, '已编辑')
      .replace(/^Load older messages$/gi, '加载更早消息');
  }

  // C. 主处理逻辑
  function processThoughtAndToolDocks() {
    const turns = document.querySelectorAll('div.group.w-full.scroll-mt-4');

    turns.forEach((turn) => {
      // 查找本轮全部抽屉触发按钮（包含工具组、耗时汇总、思考过程）
      const triggers = turn.querySelectorAll('button[data-testid="tool-group-collapsible"], button[data-testid="thinking-collapsible-trigger"], button[data-testid="worked-for-collapsible"]');

      triggers.forEach((btn) => {
        // (1) 标题文本汉化 (Requirement 6)
        const span = btn.querySelector('span');
        if (span && span.textContent) {
          const translated = translateChinese(span.textContent.trim());
          if (span.textContent !== translated) {
            span.textContent = translated;
          }
        }
        if (btn.hasAttribute('title')) {
          btn.setAttribute('title', translateChinese(btn.getAttribute('title')));
        }
        if (btn.hasAttribute('aria-label')) {
          btn.setAttribute('aria-label', translateChinese(btn.getAttribute('aria-label')));
        }

        // (2) 默认折叠：非用户手动展开时，保持折叠 (Requirement: 命令不要默认展开)
        const isExpanded = btn.getAttribute('aria-expanded') === 'true';
        if (isExpanded) {
          if (btn.dataset.claudeUserOpened !== 'true') {
            btn.click();
            btn.dataset.claudeAutoCollapsed = 'true';
          }
        }

        // (3) 报错、权限确认等需要介入时，折叠态也要显示一行醒目提示 (Requirement 3)
        const parentRelative = btn.parentElement;
        const scrollContainer = parentRelative?.querySelector('div.overflow-y-auto');

        if (scrollContainer) {
          const hasDestructive = !!scrollContainer.querySelector('.text-destructive, .text-danger, .text-red-500, [data-testid*="error"], [data-testid*="fail"], [data-status="error"]');
          const permBtn = Array.from(scrollContainer.querySelectorAll('button[data-testid*="allow"], button[data-testid*="approval"], button[data-testid*="permission"]'))[0];
          const termOutput = scrollContainer.querySelector('.xterm, [data-testid*="terminal"], [data-testid*="output"]');
          const hasTermError = termOutput ? /command failed|exit code [1-9]/i.test(termOutput.textContent) : false;

          if (hasDestructive || permBtn || hasTermError) {
            btn.dataset.claudeHasAlert = 'true';
            if (permBtn) btn.dataset.claudeAlertMsg = '需要授权确认：等待权限许可后继续执行';
            else btn.dataset.claudeAlertMsg = '步骤执行报错：包含异常退出或失败命令';
          } else {
            delete btn.dataset.claudeHasAlert;
            delete btn.dataset.claudeAlertMsg;
          }
        }

        const hasAlert = btn.dataset.claudeHasAlert === 'true';
        if (parentRelative) {
          let alertStrip = parentRelative.querySelector(':scope > .claude-intervention-strip');
          if (hasAlert) {
            btn.classList.add('has-intervention');
            const alertMsg = btn.dataset.claudeAlertMsg || '检测到步骤报错或待权限确认，点击可展开查看详情';
            if (!alertStrip) {
              alertStrip = document.createElement('div');
              alertStrip.className = 'claude-intervention-strip';
              alertStrip.innerHTML = `<span class="claude-alert-badge">需要确认</span><span class="claude-alert-text">${alertMsg}</span>`;
              parentRelative.appendChild(alertStrip);
            }
          } else {
            btn.classList.remove('has-intervention');
            if (alertStrip) alertStrip.remove();
          }
        }

        // (4) 展开区滚动管理与向上滚动保护 (Requirement 1 & 4)
        if (scrollContainer) {
          if (!scrollContainer.dataset.claudeScrollBound) {
            scrollContainer.dataset.claudeScrollBound = 'true';
            scrollContainer.addEventListener('scroll', () => {
              const distanceToBottom = scrollContainer.scrollHeight - scrollContainer.scrollTop - scrollContainer.clientHeight;
              if (distanceToBottom > 25) {
                scrollContainer.dataset.userScrolledUp = 'true';
              } else {
                delete scrollContainer.dataset.userScrolledUp;
              }
            }, { passive: true });
          }

          // 用户未向上翻阅时，内部自动触底
          if (scrollContainer.dataset.userScrolledUp !== 'true') {
            scrollContainer.scrollTop = scrollContainer.scrollHeight;
          }

          // (5) 工具调用单行截断、动作名显示、展开复制与连续相同调用合并 ×N (Requirement 5)
          const rowDivs = Array.from(scrollContainer.querySelectorAll('div.flex.flex-col.gap-0\\.5 > div.flex.flex-row'));
          let prevSig = null;
          let prevRow = null;
          let dupCount = 1;

          rowDivs.forEach((row) => {
            const cmdStep = row.querySelector('[data-testid="run-command-step"]');
            const fileStep = row.querySelector('[data-testid="view-file-step"]');
            const thinkStep = row.querySelector('[data-testid="thinking-collapsible-trigger"]');

            let sig = '';
            let rawCmd = '';

            if (cmdStep) {
              const mono = cmdStep.querySelector('.font-mono');
              rawCmd = mono?.textContent || '';
              sig = 'cmd:' + rawCmd.trim();

              // 简短动作名
              const ranSpan = cmdStep.querySelector('.text-secondary-foreground span:first-child');
              if (ranSpan && (ranSpan.textContent === 'Ran' || ranSpan.textContent === 'Run')) {
                ranSpan.className = 'claude-step-badge';
                ranSpan.textContent = '运行命令';
              }

              // 操作按钮（复制、展开）与展开代码框
              if (!cmdStep.querySelector('.claude-step-actions')) {
                const actionGroup = document.createElement('div');
                actionGroup.className = 'claude-step-actions';
                actionGroup.innerHTML = `
                  <button type="button" class="claude-step-btn claude-btn-copy" data-cmd="${rawCmd.replace(/"/g, '&quot;')}" title="复制原始命令">复制</button>
                  <button type="button" class="claude-step-btn claude-btn-expand" title="展开/收起完整命令">展开</button>
                `;
                const stepHeader = cmdStep.querySelector('[role="button"]') || cmdStep.children[0];
                if (stepHeader) {
                  stepHeader.appendChild(actionGroup);
                }

                const drawer = document.createElement('div');
                drawer.className = 'claude-cmd-drawer';
                drawer.style.display = 'none';
                const pre = document.createElement('pre');
                pre.className = 'claude-cmd-raw';
                const code = document.createElement('code');
                code.textContent = rawCmd;
                pre.appendChild(code);
                drawer.appendChild(pre);
                cmdStep.appendChild(drawer);
              }
            } else if (fileStep) {
              sig = 'file:' + fileStep.textContent.trim();
              const viewSpan = fileStep.querySelector('.text-secondary-foreground span:first-child');
              if (viewSpan && (viewSpan.textContent === 'Analyzed' || viewSpan.textContent === 'Read')) {
                viewSpan.className = 'claude-step-badge';
                viewSpan.textContent = '查看文件';
              }
            } else if (thinkStep) {
              sig = 'think:' + thinkStep.textContent.trim();
            } else {
              sig = 'other:' + row.textContent.trim().slice(0, 60);
            }

            // 连续相同调用合并为 "×N"
            if (sig && sig === prevSig) {
              dupCount++;
              row.classList.add('claude-merged-row');
              if (prevRow) {
                let pill = prevRow.querySelector('.claude-dup-pill');
                if (!pill) {
                  pill = document.createElement('span');
                  pill.className = 'claude-dup-pill';
                  const target = prevRow.querySelector('.truncate > div') || prevRow.querySelector('.truncate') || prevRow.querySelector('.min-w-0');
                  if (target) target.appendChild(pill);
                }
                pill.textContent = '×' + dupCount;
              }
            } else {
              prevSig = sig;
              prevRow = row;
              dupCount = 1;
              row.classList.remove('claude-merged-row');
              const oldPill = row.querySelector('.claude-dup-pill');
              if (oldPill) oldPill.remove();
            }
          });
        }
      });

      // 扫描并汉化本轮中的状态标签（如 Edited、Searching、Worked for 等）
      const statusSpans = turn.querySelectorAll('span, button');
      statusSpans.forEach((sp) => {
        if (sp.children.length === 0 && sp.textContent) {
          const txt = sp.textContent.trim();
          if (/^(Edited|Worked for|Thought for|Searching|Searched|Exploring|Explored|Load older messages)/i.test(txt)) {
            const trans = translateChinese(txt);
            if (txt !== trans) {
              sp.textContent = trans;
            }
          }
        }
      });
    });

    // 全局即时扫描并汉化动态微文字（如 Working / Thinking / Running）
    try {
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      let node;
      while ((node = walker.nextNode())) {
        const val = node.nodeValue?.trim();
        if (val && /^Working\.*/i.test(val)) {
          node.nodeValue = node.nodeValue.replace(/Working/i, '执行中');
        } else if (val && /^Thinking\.*/i.test(val)) {
          node.nodeValue = node.nodeValue.replace(/Thinking/i, '思考中');
        } else if (val && /^Running\.*/i.test(val)) {
          node.nodeValue = node.nodeValue.replace(/Running/i, '执行中');
        }
      }
    } catch (e) {}
  }

  // D. 实时响应 MutationObserver（毫秒级监听流式输出与工具调用）
  let dockDebounceTimer = null;
  function setupDockObserver() {
    const convView = document.querySelector('[data-testid="conversation-view"]');
    if (!convView || convView.dataset.claudeDockObserved) return;
    convView.dataset.claudeDockObserved = 'true';

    const observer = new MutationObserver(() => {
      clearTimeout(dockDebounceTimer);
      dockDebounceTimer = setTimeout(processThoughtAndToolDocks, 40);
    });

    observer.observe(convView, {
      childList: true,
      subtree: true,
      characterData: true
    });
  }

  // 暴露给注入进程热更新调用
  window.__claude_render_recents = renderRecents;
  window.__claude_process_docks = processThoughtAndToolDocks;

  function tick() {
    hookNewChat();
    renameHeaders();
    renderRecents();
    hidePromoButtons();
    processThoughtAndToolDocks();
    setupDockObserver();
  }

  window.__claude_enhancer_interval = setInterval(tick, 600);
  tick();
})();


