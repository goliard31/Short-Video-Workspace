/* ============================================================
   短视频工作台 · Demo 交互（零依赖）
   ============================================================ */

const store = {
  get(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
    catch { return fallback; }
  },
  set(key, val) { localStorage.setItem(key, JSON.stringify(val)); }
};

/* ---------- toast ---------- */
let toastTimer;
function toast(msg) {
  const el = document.getElementById('toast');
  if (!el) { alert(msg); return false; }
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
  return false;
}

/* ---------- 创作参考板（跨页保留） ---------- */
function refboard() { return store.get('sv_refboard', []); }
function setRefboard(list) { store.set('sv_refboard', list); renderRefboard(); }
function task() { return store.get('sv_task', ''); }
function setTask(t) { store.set('sv_task', t); }

/* 首次打开创作页时给两份示例参考，方便直接看到参考板的效果；
   用户一旦增删，就以真实选择为准。 */
function seedDemoRefboard() {
  if (localStorage.getItem('sv_seeded')) return;
  localStorage.setItem('sv_seeded', '1');
  if (!localStorage.getItem('sv_refboard')) {
    setRefboard([
      { title: '一镜到底的走访路线', stars: 5 },
      { title: '三段式开场：人物 → 冲突 → 行动', stars: 4 },
    ]);
  }
}

function renderRefboard() {
  const pill = document.getElementById('refboardPill');
  const count = document.getElementById('refboardCount');
  const list = refboard();
  if (count) count.textContent = list.length;
  if (pill) {
    pill.classList.remove('bump');
    void pill.offsetWidth; /* 重启动画 */
    pill.classList.add('bump');
  }
  renderSelectedList();
}

/* 首页：采用某个参考设计 */
function adoptRef(btn) {
  const card = btn.closest('.ref-card');
  const title = card.dataset.title;
  const stars = Number(card.dataset.stars || 0);
  const list = refboard();
  if (list.some(i => i.title === title)) {
    toast('参考板里已有这个设计');
    return false;
  }
  list.push({ title, stars });
  setRefboard(list);
  card.classList.add('selected');
  btn.textContent = '✓ 已加入参考板';
  toast(`已加入创作参考板：${title}`);
  return false;
}

/* ---------- 一句话任务 → 创作页 ---------- */
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('taskForm');
  if (form) {
    form.addEventListener('submit', e => {
      e.preventDefault();
      const val = document.getElementById('taskInput').value.trim();
      setTask(val);
      location.href = 'create.html';
    });
  }
  renderRefboard();
});

/* ---------- 轮播 ---------- */
function scrollCarousel(id, dir) {
  const el = document.getElementById(id);
  if (el) el.scrollBy({ left: dir * 520, behavior: 'smooth' });
}

/* ---------- chips 单选/多选高亮 ---------- */
document.querySelectorAll('.chip').forEach(chip => {
  chip.addEventListener('click', () => chip.classList.toggle('active'));
});

/* ============================================================
   创作页逻辑（仅 create.html 执行）
   ============================================================ */
function isCreatePage() { return !!document.getElementById('createLayout'); }

function starStr(n) {
  return '★'.repeat(n) + '☆'.repeat(5 - n);
}

function renderSelectedList() {
  const box = document.getElementById('selectedRefs');
  if (!box) return;
  const list = refboard();
  const input = document.getElementById('taskInput2');
  if (input && !input.value && task()) input.value = task();

  if (!list.length) {
    box.innerHTML = '<div class="selected-empty">还没有选参考。<br>回到首页把喜欢的设计“采用”进来。</div>';
    return;
  }
  box.innerHTML = list.map((item, i) => `
    <div class="selected-item">
      <span class="stars">${starStr(item.stars)}</span>
      <span>${item.title}</span>
      <button title="移除" onclick="removeRef(${i})">✕</button>
    </div>`).join('');
}

function removeRef(i) {
  const list = refboard();
  list.splice(i, 1);
  setRefboard(list);
  toast('已从参考板移除');
}

/* 候选方向选择 */
function selectDir(card) {
  document.querySelectorAll('.dir-card').forEach(c => c.classList.remove('active'));
  card.classList.add('active');
  const dir = card.dataset.dir;
  const note = document.getElementById('dirNote');
  if (note) note.textContent = `已选方向：${dir}。方案与脚本会按这个方向组织。`;
}

/* 生成方案（演示：模拟重算） */
function generatePlan() {
  const btn = document.getElementById('genBtn');
  const active = document.querySelector('.dir-card.active');
  if (!active) { toast('先选一个候选方向'); return false; }
  const original = btn.innerHTML;
  btn.innerHTML = '生成中…';
  btn.disabled = true;
  setTimeout(() => {
    btn.innerHTML = original;
    btn.disabled = false;
    toast('已按所选方向更新方案与分镜（演示）');
    document.getElementById('planSection').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 900);
  return false;
}

/* 视图切换：脚本视图 ↔ 素材视图 */
function switchView(view) {
  document.body.classList.toggle('script-view', view === 'script');
  document.body.classList.toggle('material-view', view === 'material');
  document.querySelectorAll('.view-toggle button').forEach(b =>
    b.classList.toggle('active', b.dataset.view === view));
}

/* 引用链展开由 <details> 原生实现 */
if (isCreatePage()) {
  document.addEventListener('DOMContentLoaded', () => {
    seedDemoRefboard();
    renderSelectedList();
    const active = document.querySelector('.dir-card.active');
    if (active) selectDir(active);
  });
}
