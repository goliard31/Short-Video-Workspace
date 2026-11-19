/* ============================================================
   短视频工作台 Demo · 自检截图脚本
   用法：在 copycat skill 的 scripts 目录下执行
     cd ~/.dsh/skills/copycat/scripts
     node /d/App/web-app/demo/shot.mjs
   依赖：该目录 node_modules 里的 playwright（不额外安装）
   产出：web-app/demo/screens/ 下桌面视口图、桌面全页图、移动端全页图
   ============================================================ */
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const require = createRequire('C:/Users/atom2/.dsh/skills/copycat/scripts/');
const { chromium } = require('playwright');

const base = 'D:/App/web-app/demo';
const out = `${base}/screens`;
const pages = ['index', 'create'];

const browser = await chromium.launch();

for (const name of pages) {
  /* 桌面：按一屏一步滚动，固定丝带 / 吸顶栏位置真实 */
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push(String(e)));
  await page.goto(pathToFileURL(`${base}/${name}.html`).href, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await page.evaluate(() => window.getSelection().removeAllRanges());

  const stops = await page.evaluate(() => {
    const h = document.body.scrollHeight;
    const n = Math.max(1, Math.ceil((h - 900) / 900) + 1);
    return Array.from({ length: n }, (_, i) => Math.round(i * (h - 900) / (n - 1)));
  });
  for (let i = 0; i < stops.length; i++) {
    await page.evaluate(y => window.scrollTo(0, y), stops[i]);
    await page.waitForTimeout(450);
    await page.evaluate(() => window.getSelection().removeAllRanges());
    await page.screenshot({ path: `${out}/d-${name}-${i}.png` });
  }
  console.log(`${name}: ${stops.length} 张桌面视口图, 页面高 ${await page.evaluate(() => document.body.scrollHeight)}px, 控制台错误 ${errors.length}`);
  errors.slice(0, 5).forEach(e => console.log('  !', e.slice(0, 160)));
  await page.close();

  /* 桌面全页 */
  const fp = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await fp.goto(pathToFileURL(`${base}/${name}.html`).href, { waitUntil: 'networkidle' });
  await fp.waitForTimeout(800);
  await fp.evaluate(() => window.getSelection().removeAllRanges());
  await fp.screenshot({ path: `${out}/full-${name}.png`, fullPage: true });
  await fp.close();

  /* 移动端全页（375×812，检查是否有横向溢出） */
  const mp = await browser.newPage({ viewport: { width: 375, height: 812 }, isMobile: true, deviceScaleFactor: 2 });
  await mp.goto(pathToFileURL(`${base}/${name}.html`).href, { waitUntil: 'networkidle' });
  await mp.waitForTimeout(700);
  await mp.evaluate(() => window.getSelection().removeAllRanges());
  await mp.screenshot({ path: `${out}/m-${name}.png`, fullPage: true });
  const sw = await mp.evaluate(() => document.body.scrollWidth);
  console.log(`  m-${name}.png 已存，scrollWidth=${sw}（视口 375，相等即无横向溢出）`);
  await mp.close();

  /* 创作页额外：素材视图 */
  if (name === 'create') {
    const mv = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await mv.goto(pathToFileURL(`${base}/create.html`).href, { waitUntil: 'networkidle' });
    await mv.waitForTimeout(700);
    await mv.evaluate(() => window.getSelection().removeAllRanges());
    await mv.click('[data-view=material]');
    await mv.waitForTimeout(300);
    await mv.evaluate(() => window.getSelection().removeAllRanges());
    await mv.screenshot({ path: `${out}/d-create-material.png`, fullPage: true });
    await mv.close();
    console.log('  d-create-material.png 已存（素材视图）');
  }
}

await browser.close();
console.log('完成：输出目录', out);
