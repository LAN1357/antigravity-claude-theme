const puppeteer = require('puppeteer-core');

const PORT = process.env.DEBUG_PORT || process.argv[2] || 9222;

async function inspect() {
  console.log(`Connecting to http://127.0.0.1:${PORT}...`);
  const browser = await puppeteer.connect({
    browserURL: `http://127.0.0.1:${PORT}`,
    defaultViewport: null,
  });

  const pages = await browser.pages();
  const mainPage = pages.find((p) => !p.url().startsWith('devtools://')) || pages[0];
  if (!mainPage) {
    console.error('未找到活动页面');
    process.exit(1);
  }

  console.log(`正在检查页面: "${await mainPage.title()}" (${mainPage.url()})`);

  const info = await mainPage.evaluate(() => {
    // 1. 抓取 html 元素属性与内联 style
    const html = document.documentElement;
    const htmlAttrs = {};
    for (const attr of html.attributes) {
      htmlAttrs[attr.name] = attr.value;
    }

    // 2. 抓取所有 CSS 变量（包括内联与样式表）
    const cssVars = new Set();
    // 内联
    const inlineStyle = html.getAttribute('style') || '';
    const inlineMatches = inlineStyle.matchAll(/(--[\w-]+)\s*:/g);
    for (const m of inlineMatches) {
      cssVars.add(m[1]);
    }

    // 样式表中的变量
    try {
      for (const sheet of Array.from(document.styleSheets)) {
        try {
          for (const rule of Array.from(sheet.cssRules || [])) {
            if (rule.style) {
              for (let i = 0; i < rule.style.length; i++) {
                const prop = rule.style[i];
                if (prop.startsWith('--')) {
                  cssVars.add(prop);
                }
              }
            }
          }
        } catch (e) {}
      }
    } catch (e) {}

    // 3. 计算一些关键颜色值
    const computed = window.getComputedStyle(html);
    const keyComputed = {
      backgroundColor: computed.backgroundColor,
      color: computed.color,
      fontFamily: computed.fontFamily,
    };

    // 4. 抓取所有 data-testid
    const testIds = Array.from(document.querySelectorAll('[data-testid]')).map((el) => {
      return {
        testId: el.getAttribute('data-testid'),
        tag: el.tagName.toLowerCase(),
        classes: Array.from(el.classList).slice(0, 5).join(' '),
      };
    });

    // 5. 查找输入框区域
    const inputs = Array.from(document.querySelectorAll('textarea, input, [contenteditable="true"]')).map((el) => {
      let parent = el;
      const chain = [];
      for (let i = 0; i < 4 && parent; i++) {
        chain.push({
          tag: parent.tagName.toLowerCase(),
          id: parent.id || null,
          testId: parent.getAttribute('data-testid') || null,
          classes: Array.from(parent.classList).join(' '),
        });
        parent = parent.parentElement;
      }
      return chain;
    });

    // 6. 查找代码块和 markdown 元素
    const codeBlocks = Array.from(document.querySelectorAll('pre, code, .monaco-editor, [class*="code"]')).slice(0, 5).map((el) => ({
      tag: el.tagName.toLowerCase(),
      classes: Array.from(el.classList).join(' '),
      testId: el.getAttribute('data-testid') || null,
    }));

    // 7. 查找侧边栏或导航
    const sidebars = Array.from(document.querySelectorAll('aside, nav, [role="navigation"], [class*="sidebar"]')).slice(0, 5).map((el) => ({
      tag: el.tagName.toLowerCase(),
      classes: Array.from(el.classList).join(' '),
      testId: el.getAttribute('data-testid') || null,
    }));

    return {
      htmlAttrs,
      inlineStyleSample: inlineStyle.substring(0, 500),
      cssVars: Array.from(cssVars).sort(),
      keyComputed,
      testIds: testIds.slice(0, 30),
      inputs: inputs.slice(0, 3),
      codeBlocks,
      sidebars,
    };
  });

  console.log('\n--- DOM 探测报告 ---');
  console.log(JSON.stringify(info, null, 2));

  await browser.disconnect();
}

inspect().catch((err) => {
  console.error('探测执行失败:', err);
  process.exit(1);
});
