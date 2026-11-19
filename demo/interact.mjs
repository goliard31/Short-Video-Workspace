/* Demo 交互自测：参考板跨页传递、视图切换、轮播、方向选择 */
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
const require = createRequire('C:/Users/atom2/.dsh/skills/copycat/scripts/');
const { chromium } = require('playwright');
const base = 'D:/App/web-app/demo';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errs = [];
page.on('pageerror', e => errs.push(String(e)));
page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });

await page.goto(pathToFileURL(`${base}/index.html`).href, { waitUntil: 'networkidle' });
await page.evaluate(() => localStorage.clear());

const count = () => page.textContent('#refboardCount');
console.log('初始参考板计数 =', await count());

/* 1) 首页「采用这个设计」 */
await page.click('.ref-card:nth-of-type(1) .btn-adopt, .ref-card:nth-child(1) button');
await page.waitForTimeout(200);
console.log('采用 1 个后 =', await count());
await page.click('.ref-card:nth-child(2) button');
await page.waitForTimeout(200);
console.log('采用 2 个后 =', await count());
console.log('toast 文案 =', await page.textContent('#toast'));

/* 2) 一句话任务 → 创作页 */
await page.fill('#taskInput', '开学季助学视频');
const [nav] = await Promise.all([
  page.waitForNavigation({ waitUntil: 'networkidle' }),
  page.click('#taskForm button[type=submit]'),
]);
console.log('跳转后 URL =', page.url().split('/').pop());
console.log('创作页参考板计数 =', await page.textContent('#refboardCount'));
console.log('任务已带入 =', (await page.inputValue('#taskInput2')) === '开学季助学视频');
console.log('已选参考条数 =', await page.locator('#selectedRefs .selected-item').count());

/* 3) 移除一条 */
await page.locator('#selectedRefs .selected-item button').first().click();
await page.waitForTimeout(150);
console.log('移除 1 条后 =', await page.textContent('#refboardCount'));

/* 4) 候选方向选择 */
await page.locator('.dir-card').nth(1).click();
await page.waitForTimeout(150);
console.log('方向 B 选中 =', await page.locator('.dir-card.active').getAttribute('data-dir'));
console.log('方向提示 =', await page.textContent('#dirNote'));

/* 5) 视图切换 */
await page.click('[data-view=material]');
await page.waitForTimeout(200);
console.log('素材视图：素材列可见 =', await page.locator('.col-material').first().isVisible(),
            '| 画面列隐藏 =', !(await page.locator('.col-script').first().isVisible()));
await page.click('[data-view=script]');
await page.waitForTimeout(200);
console.log('脚本视图：画面列可见 =', await page.locator('.col-script').first().isVisible(),
            '| 素材列隐藏 =', !(await page.locator('.col-material').first().isVisible()));

/* 6) 生成方案 */
await page.click('#genBtn');
await page.waitForTimeout(1200);
console.log('生成后按钮恢复 =', await page.locator('#genBtn').isEnabled());

/* 7) 引用链 details 展开 */
const det = page.locator('details.cite-detail').first();
console.log('引用链初始 closed =', !(await det.evaluate(d => d.open)));
await det.locator('summary').click();
await page.waitForTimeout(200);
console.log('引用链点击后 open =', await det.evaluate(d => d.open));
console.log('展开后条目数 =', await det.locator('li').count());
await det.locator('summary').click();
await page.waitForTimeout(150);
console.log('再点一次收起 =', !(await det.evaluate(d => d.open)));

/* 8) 轮播滚动（回首页） */
await page.goto(pathToFileURL(`${base}/index.html`).href, { waitUntil: 'networkidle' });
await page.waitForTimeout(300);
const before = await page.evaluate(() => document.querySelector('.carousel').scrollLeft);
await page.evaluate(() => scrollCarousel('feedNew', 1));
await page.waitForTimeout(800);
const after = await page.evaluate(() => document.querySelector('#feedNew').scrollLeft);
console.log(`轮播 scrollLeft ${before} -> ${after}`);

console.log('控制台/页面错误数 =', errs.length);
errs.slice(0, 5).forEach(e => console.log('  !', e.slice(0, 200)));
await browser.close();
