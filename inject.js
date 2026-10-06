const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CSS_PATH = path.join(__dirname, 'claude-style.css');
const PORT = process.env.DEBUG_PORT || process.argv[2] || 9223;
const STYLE_TAG_ID = 'antigravity-claude-style';

function getCssContent() {
  try {
    return fs.readFileSync(CSS_PATH, 'utf-8');
  } catch (err) {
    console.error(`[Error] 无法读取样式文件 ${CSS_PATH}:`, err.message);
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
      console.warn(`[Claude-Style] 注入页面提示:`, err.message);
    }
  }
}

function attachPageHooks(page) {
  const handler = () => injectStyleToPage(page, getCssContent());
  page.on('domcontentloaded', handler);
  page.on('load', handler);
  page.on('framenavigated', handler);
}

async function main() {
  console.log(`===============================================`);
  console.log(` Antigravity Claude-Style 实时注入与热更新服务`);
  console.log(` 调试端口: ${PORT}`);
  console.log(` 样式文件: ${CSS_PATH}`);
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
  for (const page of pages) {
    attachPageHooks(page);
    await injectStyleToPage(page, currentCss);
  }

  // 监听新创建的窗口
  browser.on('targetcreated', async (target) => {
    if (target.type() === 'page') {
      try {
        const newPage = await target.page();
        if (newPage) {
          attachPageHooks(newPage);
          await injectStyleToPage(newPage, getCssContent());
        }
      } catch (e) {}
    }
  });

  // 监听 CSS 文件变化热更新
  console.log(`👀 正在监听 ${CSS_PATH} 文件改动，保存后无需重启即可实时生效...`);
  let debounceTimer = null;
  fs.watch(CSS_PATH, (eventType) => {
    if (eventType === 'change' || eventType === 'rename') {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(async () => {
        console.log(`\n🔄 检测到 claude-style.css 改动，正在热更新...`);
        const updatedCss = getCssContent();
        try {
          const currentPages = await browser.pages();
          for (const page of currentPages) {
            await injectStyleToPage(page, updatedCss);
          }
          console.log(`✨ 热更新完成！`);
        } catch (err) {
          console.error(`更新样式出错:`, err.message);
        }
      }, 120);
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
