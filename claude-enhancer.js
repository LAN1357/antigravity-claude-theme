/**
 * Claude Enhancer for Antigravity
 * - Default Workspace: "antigravity日常"
 * - Hook global "新建对话" button to always route to "antigravity日常"
 * - Project conversations: User clicks into any project to create conversations there
 */
(function() {
  const DAILY_SECTION_ID = '3f37f9eb-e69b-4496-b230-dd157ff2f379';

  // 1. Remove old pill bar if exists
  const oldBar = document.getElementById('claude-projects-pills-bar');
  if (oldBar) oldBar.remove();

  // 2. Clear any old intervals
  if (window.__claude_enhancer_interval) {
    clearInterval(window.__claude_enhancer_interval);
    window.__claude_enhancer_interval = null;
  }

  // 3. Hook global "新建对话" button
  function hookNewChat() {
    // Also remove bar if recreated
    const bar = document.getElementById('claude-projects-pills-bar');
    if (bar) bar.remove();

    const newChatBtn = document.querySelector('[data-testid="new-conversation-button"]');
    if (newChatBtn && !newChatBtn.dataset.hookedDaily) {
      newChatBtn.dataset.hookedDaily = 'true';
      newChatBtn.setAttribute('href', `/?section=${DAILY_SECTION_ID}`);
      newChatBtn.addEventListener('click', (e) => {
        if (!e.metaKey && !e.ctrlKey && !e.shiftKey) {
          e.preventDefault();
          e.stopPropagation();
          window.location.href = `/?section=${DAILY_SECTION_ID}`;
        }
      }, true);
    }
  }

  window.__claude_enhancer_interval = setInterval(hookNewChat, 1000);
  hookNewChat();
})();
