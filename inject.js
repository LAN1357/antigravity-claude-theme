const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CSS_PATH = path.join(__dirname, 'claude-style.css');
const JS_PATH = path.join(__dirname, 'claude-enhancer.js');
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

    await page.evaluate((scriptId, code) => {
      let scriptEl = document.getElementById(scriptId);
      if (scriptEl) scriptEl.remove();
      scriptEl = document.createElement('script');
      scriptEl.id = scriptId;
      scriptEl.textContent = code;
      (document.head || document.documentElement).appendChild(scriptEl);
    }, SCRIPT_TAG_ID, jsCode);

    console.log(`[Claude-Style] ⚡ 已成功注入功能增强脚本到窗口`);
  } catch (err) {
    if (!err.message.includes('Target closed') && !err.message.includes('Session closed')) {
      console.warn(`[Claude-Style] 注入脚本提示:`, err.message);
    }
  }
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
  console.log(`===============================================`);
  console.log(` Antigravity Claude-Style 实时注入与热更新服务`);
  console.log(` 调试端口: ${PORT}`);
  console.log(` 样式文件: ${CSS_PATH}`);
  console.log(` 脚本文件: ${JS_PATH}`);
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

  process.on('SIGINT', async () => {
    console.log('\n正在退出注入服务...');
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
