const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const CSS_PATH = path.join(__dirname, 'claude-style.css');
const JS_PATH = path.join(__dirname, 'claude-enhancer.js');
const USER_HOME = os.homedir() || process.env.USERPROFILE || process.env.HOME || '';
const DB_PATH = path.join(USER_HOME, '.gemini', 'antigravity', 'conversation_summaries.db');
const PORT = process.env.DEBUG_PORT || process.argv[2] || 9223;
const STYLE_TAG_ID = 'antigravity-claude-style';
const SCRIPT_TAG_ID = 'antigravity-claude-enhancer';

function getCssContent() {
  try {
    return fs.readFileSync(CSS_PATH, 'utf-8');
  } catch (err) {
    console.error(`[Error] 无法读取样式文件 ${CSS_PATH}:`, err.message);
    return '';
  }
}

function getJsContent() {
  try {
    if (fs.existsSync(JS_PATH)) {
      return fs.readFileSync(JS_PATH, 'utf-8');
    }
    return '';
  } catch (err) {
    console.error(`[Error] 无法读取脚本文件 ${JS_PATH}:`, err.message);
    return '';
  }
}

function getRecentConversations() {
  try {
    if (!fs.existsSync(DB_PATH)) return [];
    const sql = `SELECT conversation_id as id, title, last_modified_time as time FROM conversation_summaries WHERE killed = 0 AND title != '' ORDER BY last_modified_time DESC LIMIT 40;`;
    try {
      const out = execSync(`sqlite3 -json "${DB_PATH}" "${sql}"`, { encoding: 'utf-8', timeout: 2000, stdio: ['pipe', 'pipe', 'ignore'] });
      return JSON.parse(out);
    } catch (e) {
      // 备选方案：Windows 等未内置 sqlite3 命令行环境时，尝试通过 Python 标准库读取
      const pyCmd = `python -c "import sqlite3, json; con=sqlite3.connect(r'''${DB_PATH}'''); cur=con.cursor(); cur.execute('''${sql}'''); print(json.dumps([{'id':r[0],'title':r[1],'time':r[2]} for r in cur.fetchall()]))"`;
      const outPy = execSync(pyCmd, { encoding: 'utf-8', timeout: 3000, stdio: ['pipe', 'pipe', 'ignore'] });
      return JSON.parse(outPy);
    }
  } catch (err) {
    return [];
  }
}

async function injectStyleToPage(page, css) {
  try {
    const url = page.url();
    if (!url || url === 'about:blank' || url.startsWith('devtools://')) return;

    await page.evaluate((styleId, cssText) => {
      let styleEl = document.getElementById(styleId);
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = styleId;
        (document.head || document.documentElement).appendChild(styleEl);
      }
      styleEl.textContent = cssText;
    }, STYLE_TAG_ID, css);

    const title = await page.title().catch(() => '');
    console.log(`[Claude-Style] 🎨 已成功注入样式到窗口: "${title || url}"`);
  } catch (err) {
    if (!err.message.includes('Target closed') && !err.message.includes('Session closed')) {
      console.warn(`[Claude-Style] 注入样式提示:`, err.message);
    }
  }
}

async function injectScriptToPage(page, jsCode) {
  if (!jsCode) return;
  try {
    const url = page.url();
    if (!url || url === 'about:blank' || url.startsWith('devtools://')) return;

    const recents = getRecentConversations();
    await page.evaluate((scriptId, code, recentsData) => {
      window.__claude_recent_conversations = recentsData;
      let scriptEl = document.getElementById(scriptId);
      if (scriptEl) scriptEl.remove();
      scriptEl = document.createElement('script');
      scriptEl.id = scriptId;
      scriptEl.textContent = code;
      (document.head || document.documentElement).appendChild(scriptEl);
    }, SCRIPT_TAG_ID, jsCode, recents);

    console.log(`[Claude-Style] ⚡ 已成功注入功能增强脚本到窗口`);
  } catch (err) {
    if (!err.message.includes('Target closed') && !err.message.includes('Session closed')) {
      console.warn(`[Claude-Style] 注入脚本提示:`, err.message);
    }
  }
}

async function syncRecentsToPages(browser) {
  try {
    const recents = getRecentConversations();
    const pages = await browser.pages();
    for (const page of pages) {
      const url = page.url();
      if (!url || url === 'about:blank' || url.startsWith('devtools://')) continue;
      await page.evaluate((data) => {
        window.__claude_recent_conversations = data;
        if (typeof window.__claude_render_recents === 'function') {
          window.__claude_render_recents();
        }
      }, recents).catch(() => {});
    }
  } catch (e) {}
}

function attachPageHooks(page) {
  const handler = async () => {
    await injectStyleToPage(page, getCssContent());
    await injectScriptToPage(page, getJsContent());
  };
  page.on('domcontentloaded', handler);
  page.on('load', handler);
  page.on('framenavigated', handler);
}

async function main() {
  // 单实例守护锁：避免多个 inject.js 重复监听与注入
  const PID_FILE = path.join(os.tmpdir(), `claude_inject_${PORT}.pid`);
  try {
    if (fs.existsSync(PID_FILE)) {
      const oldPid = parseInt(fs.readFileSync(PID_FILE, 'utf-8').trim(), 10);
      if (oldPid && oldPid !== process.pid) {
        try {
          process.kill(oldPid, 0);
          process.kill(oldPid, 'SIGTERM');
        } catch (e) {}
      }
    }
    fs.writeFileSync(PID_FILE, String(process.pid));
  } catch (e) {}

  console.log(`===============================================`);
  console.log(` Antigravity Claude-Style 实时注入与热更新服务`);
  console.log(` 调试端口: ${PORT}`);
  console.log(` 样式文件: ${CSS_PATH}`);
  console.log(` 脚本文件: ${JS_PATH}`);
  console.log(` 数据库源: ${DB_PATH}`);
  console.log(`===============================================`);

  let browser;
  const maxRetries = 40;
  for (let i = 1; i <= maxRetries; i++) {
    try {
      browser = await puppeteer.connect({
        browserURL: `http://127.0.0.1:${PORT}`,
        defaultViewport: null,
      });
      console.log(`\n✅ 成功连接到 Chromium 调试端口 http://127.0.0.1:${PORT}`);
      break;
    } catch (err) {
      if (i === maxRetries) {
        console.error(`\n❌ 连接超时: 未在端口 ${PORT} 检测到 Antigravity 调试服务。`);
        console.error(`请确认 Antigravity 是否带有 --remote-debugging-port=${PORT} 启动。`);
        process.exit(1);
      }
      process.stdout.write(`⏳ 等待 Antigravity 调试端口就绪 (${i}/${maxRetries})...\r`);
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  // 注入已打开的全部窗口
  const pages = await browser.pages();
  const currentCss = getCssContent();
  const currentJs = getJsContent();
  for (const page of pages) {
    attachPageHooks(page);
    await injectStyleToPage(page, currentCss);
    await injectScriptToPage(page, currentJs);
  }

  // 监听新创建的窗口
  browser.on('targetcreated', async (target) => {
    if (target.type() === 'page') {
      try {
        const newPage = await target.page();
        if (newPage) {
          attachPageHooks(newPage);
          await injectStyleToPage(newPage, getCssContent());
          await injectScriptToPage(newPage, getJsContent());
        }
      } catch (e) {}
    }
  });

  // 监听 CSS 文件变化热更新
  console.log(`👀 正在监听 ${CSS_PATH} 与 ${JS_PATH} 文件改动...`);
  let debounceTimerCss = null;
  fs.watch(CSS_PATH, (eventType) => {
    if (eventType === 'change' || eventType === 'rename') {
      clearTimeout(debounceTimerCss);
      debounceTimerCss = setTimeout(async () => {
        console.log(`\n🔄 检测到 claude-style.css 改动，正在热更新...`);
        const updatedCss = getCssContent();
        try {
          const currentPages = await browser.pages();
          for (const page of currentPages) {
            await injectStyleToPage(page, updatedCss);
          }
          console.log(`✨ 样式热更新完成！`);
        } catch (err) {
          console.error(`更新样式出错:`, err.message);
        }
      }, 120);
    }
  });

  // 监听 JS 文件变化热更新
  let debounceTimerJs = null;
  fs.watch(JS_PATH, (eventType) => {
    if (eventType === 'change' || eventType === 'rename') {
      clearTimeout(debounceTimerJs);
      debounceTimerJs = setTimeout(async () => {
        console.log(`\n🔄 检测到 claude-enhancer.js 改动，正在热更新...`);
        const updatedJs = getJsContent();
        try {
          const currentPages = await browser.pages();
          for (const page of currentPages) {
            await injectScriptToPage(page, updatedJs);
          }
          console.log(`✨ 脚本热更新完成！`);
        } catch (err) {
          console.error(`更新脚本出错:`, err.message);
        }
      }, 150);
    }
  });

  // 监听 SQLite 数据库文件变动，实时推送最新对话
  const dbDir = path.dirname(DB_PATH);
  let debounceTimerDb = null;
  if (fs.existsSync(dbDir)) {
    fs.watch(dbDir, (eventType, filename) => {
      if (filename && filename.startsWith('conversation_summaries.db')) {
        clearTimeout(debounceTimerDb);
        debounceTimerDb = setTimeout(async () => {
          await syncRecentsToPages(browser);
        }, 300);
      }
    });
  }

  // 定时兜底刷新最近会话 (每 4 秒)
  const syncInterval = setInterval(async () => {
    await syncRecentsToPages(browser);
  }, 4000);

  process.on('SIGINT', async () => {
    console.log('\n正在退出注入服务...');
    clearInterval(syncInterval);
    try {
      await browser.disconnect();
    } catch (e) {}
    process.exit(0);
  });
}

main().catch((err) => {
  console.error('运行错误:', err);
  process.exit(1);
});
