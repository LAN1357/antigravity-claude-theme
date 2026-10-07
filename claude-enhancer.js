/**
 * Claude Enhancer for Antigravity
 * - Top: Horizontal compact project pill badges (with + on hover)
 * - Bottom: Filterable recent conversation stream
 * - Global New Chat: Automatically routes to "antigravity日常"
 */
(function() {
  const ENHANCER_ID = 'claude-projects-pills-bar';

  // Discover all projects from DOM
  function scanProjects() {
    const projects = [];
    const headers = document.querySelectorAll('.group\\/header');
    headers.forEach(h => {
      const cardBtn = h.querySelector('button[data-project-card="true"]');
      const addLink = h.querySelector('a[href*="section="], a[aria-label*="新建对话"]');
      if (cardBtn && addLink) {
        const name = cardBtn.innerText.replace(/\n+/g, ' ').trim();
        const href = addLink.getAttribute('href') || '';
        const match = href.match(/section=([a-zA-Z0-9-]+)/);
        const sectionId = match ? match[1] : null;
        if (name && sectionId) {
          projects.push({ name, sectionId, href });
        }
      }
    });
    return projects;
  }

  function getDailySectionId(projects) {
    const match = projects.find(p => p.name.includes('日常') || p.name.includes('antigravity日常'));
    return match ? match.sectionId : null;
  }

  // Intercept Global New Conversation Button
  function hookGlobalNewChat(dailySectionId) {
    if (!dailySectionId) return;
    const newChatBtn = document.querySelector('[data-testid="new-conversation-button"]');
    if (newChatBtn && !newChatBtn.dataset.hookedByClaude) {
      newChatBtn.dataset.hookedByClaude = 'true';
      newChatBtn.addEventListener('click', (e) => {
        // If clicking normal left click without modifier keys
        if (!e.metaKey && !e.ctrlKey && !e.shiftKey) {
          e.preventDefault();
          e.stopPropagation();
          window.location.href = `/?section=${dailySectionId}`;
        }
      }, true);
    }
  }

  let currentActiveSection = 'all';

  function filterConversations(sectionName) {
    currentActiveSection = sectionName;
    const rows = document.querySelectorAll('[data-testid="conversation-row-sidebar"]');
    rows.forEach(row => {
      if (sectionName === 'all') {
        row.style.display = '';
        return;
      }
      const text = row.innerText || '';
      if (text.includes(sectionName)) {
        row.style.display = '';
      } else {
        row.style.display = 'none';
      }
    });
  }

  function renderPillsBar() {
    const sidebar = document.querySelector('[data-testid="conversation-list-sidebar"]');
    if (!sidebar) return;

    const projects = scanProjects();
    const dailySectionId = getDailySectionId(projects);
    hookGlobalNewChat(dailySectionId);

    // If projects are not yet loaded in DOM, keep existing or retry
    if (projects.length === 0) return;

    let bar = document.getElementById(ENHANCER_ID);
    if (!bar) {
      bar = document.createElement('div');
      bar.id = ENHANCER_ID;
      bar.className = 'claude-pills-bar';

      // Insert right before the project list or conversation list
      // Find the first section-header or project container
      const targetAnchor = sidebar.querySelector('[data-testid="sidebar-add-project-button"]')?.closest('.relative') ||
                           sidebar.firstElementChild;
      if (targetAnchor && targetAnchor.parentElement) {
        targetAnchor.parentElement.insertBefore(bar, targetAnchor);
      } else {
        sidebar.prepend(bar);
      }
    }

    // Build Pills HTML
    let html = `<div class="claude-pills-scroll">`;
    html += `
      <button class="claude-pill ${currentActiveSection === 'all' ? 'claude-pill-active' : ''}" data-name="all">
        <span class="claude-pill-name">全部</span>
      </button>
    `;

    projects.forEach(p => {
      const isActive = currentActiveSection === p.name;
      html += `
        <div class="claude-pill ${isActive ? 'claude-pill-active' : ''}" data-name="${p.name}" data-section-id="${p.sectionId}">
          <span class="claude-pill-name" title="筛选: ${p.name}">${p.name}</span>
          <a href="/?section=${p.sectionId}" class="claude-pill-add" title="在「${p.name}」中开启新对话" aria-label="新建对话">
            <svg viewBox="0 0 16 16" width="10" height="10" fill="currentColor">
              <path d="M8 2a.75.75 0 0 1 .75.75v4.5h4.5a.75.75 0 0 1 0 1.5h-4.5v4.5a.75.75 0 0 1-1.5 0v-4.5h-4.5a.75.75 0 0 1 0-1.5h4.5v-4.5A.75.75 0 0 1 8 2Z"/>
            </svg>
          </a>
        </div>
      `;
    });

    html += `</div>`;
    bar.innerHTML = html;

    // Attach click events
    bar.querySelectorAll('.claude-pill').forEach(pill => {
      const name = pill.getAttribute('data-name');
      const nameSpan = pill.querySelector('.claude-pill-name');
      if (nameSpan) {
        nameSpan.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          bar.querySelectorAll('.claude-pill').forEach(el => el.classList.remove('claude-pill-active'));
          pill.classList.add('claude-pill-active');
          filterConversations(name);
        });
      }
    });
  }

  // Periodic check / MutationObserver to keep in sync with React renders
  if (!window.__claude_enhancer_initialized) {
    window.__claude_enhancer_initialized = true;
    setInterval(renderPillsBar, 2000);
    renderPillsBar();
  }
})();
