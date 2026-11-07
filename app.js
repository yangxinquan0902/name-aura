/* ==========================================================
   名相 · 昵称人格图谱 — app.js
   ========================================================== */

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const sleep = ms => new Promise(r => setTimeout(r, ms));

/* ---------------- 伪随机：同一昵称永远得到同一份解读 ---------------- */
function hashStr(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
/* 三次采样取均值 → 中间高两头低的自然分布 */
function bell(rnd, lo = 60, hi = 95) {
  const m = (rnd() + rnd() + rnd()) / 3;
  return Math.round(lo + m * (hi - lo));
}

/* ---------------- 昵称解码 ---------------- */
function decodeName(name) {
  const hits = [];
  const seen = new Set();
  for (const f of FEATURES) {
    if (seen.has(f.id)) continue;
    let ok = false;
    try { ok = f.test(name); } catch (e) { ok = false; }
    if (ok) { hits.push(f); seen.add(f.id); }
    if (hits.length >= 4) break;
  }
  const list = hits.slice();
  let i = 0;
  while (list.length < 3 && i < FEATURE_FALLBACK.length) list.push(FEATURE_FALLBACK[i++]);
  return list;
}

/* ---------------- 构建人格档案 ---------------- */
function buildProfile(name) {
  const rnd = mulberry32(hashStr('nameaura|v1|' + name.toLowerCase().trim()));
  const feats = decodeName(name);

  // 特征加权
  const mod = { D: 0, I: 0, S: 0, C: 0, O: 0, E: 0, A: 0, N: 0 };
  feats.forEach(f => {
    if (!f.mod) return;
    for (const k in f.mod) if (k in mod) mod[k] += f.mod[k];
  });

  /* --- DISC --- */
  const raw = {};
  ['D', 'I', 'S', 'C'].forEach(k => { raw[k] = bell(rnd, 44, 100) + mod[k]; });
  // 直接给出一份有明确倾向的分布：主导 33-46%，次要 22-32%
  const rank = ['D', 'I', 'S', 'C'].sort((a, b) => raw[b] - raw[a]);
  const p1 = 33 + Math.round(rnd() * 13);
  const p2 = Math.min(22 + Math.round(rnd() * 10), 76 - p1);
  const rest = 100 - p1 - p2;
  const cut = 0.34 + rnd() * 0.32;
  const p3 = Math.round(rest * cut);
  const pct = {};
  pct[rank[0]] = p1;
  pct[rank[1]] = p2;
  pct[rank[2]] = p3;
  pct[rank[3]] = rest - p3;

  const sorted = rank;
  const primary = sorted[0], secondary = sorted[1];
  const arche = ARCHETYPES[primary + secondary] || ARCHETYPES.DI;

  /* --- Big Five --- */
  const big = {
    O: clamp(bell(rnd, 58, 97) + mod.O, 54, 99),
    C: clamp(bell(rnd, 60, 97) + Math.round((pct.C - 25) * 0.55), 56, 99),
    E: clamp(bell(rnd, 56, 97) + Math.round((pct.I - 25) * 0.5) + mod.E, 48, 99),
    A: clamp(bell(rnd, 62, 98) + Math.round((pct.S - 25) * 0.4) + mod.A, 58, 99),
    N: clamp(bell(rnd, 62, 97) + mod.N, 56, 99)
  };

  /* --- 人品牌照 --- */
  const moral = {
    zhen: clamp(bell(rnd, 74, 98), 70, 99),
    kao: clamp(Math.round(bell(rnd, 74, 98) * 0.55 + big.C * 0.45), 72, 99),
    gong: clamp(Math.round(bell(rnd, 72, 98) * 0.55 + big.A * 0.45), 70, 99),
    bian: clamp(bell(rnd, 70, 97), 68, 99),
    dan: clamp(Math.round(68 + bell(rnd, 4, 24) + (pct.D - 22) * 0.55), 70, 99)
  };

  /* --- 深交潜力 --- */
  const deep = {
    soul: clamp(Math.round(big.O * 0.36 + moral.gong * 0.34 + bell(rnd, 70, 96) * 0.3), 70, 99),
    long: clamp(Math.round(big.C * 0.3 + moral.kao * 0.36 + moral.dan * 0.34), 70, 99),
    heal: clamp(Math.round(big.A * 0.38 + moral.gong * 0.34 + big.N * 0.28), 70, 99),
    fun: clamp(Math.round(big.E * 0.34 + big.O * 0.28 + bell(rnd, 68, 97) * 0.38), 68, 99)
  };
  const avg = o => Object.values(o).reduce((a, b) => a + b, 0) / Object.keys(o).length;
  const deepIndex = clamp(Math.round(avg(deep) * 0.62 + avg(moral) * 0.38), 72, 99);

  /* --- 总分 --- */
  const dom = clamp((pct[primary] - 22) * 0.9, 0, 16);
  const score = clamp(Math.round(
    avg(big) * 0.34 + avg(moral) * 0.30 + deepIndex * 0.34 - 2 + dom * 0.5
  ), 70, 99);

  const grade =
    score >= 91 ? { t: 'S · 稀有光谱', r: 98.6 } :
    score >= 89 ? { t: 'A+ · 高浓度人格', r: 95.4 } :
    score >= 85 ? { t: 'A · 稳定发光', r: 89.7 } :
    score >= 79 ? { t: 'B+ · 温和耐看', r: 82.1 } :
                  { t: 'B · 慢热型宝藏', r: 73.5 };

  return {
    name, feats, pct, primary, secondary, arche, big, moral, deep, deepIndex, score, grade,
    seed: hashStr(name)
  };
}

/* ---------------- 数字滚动 ---------------- */
function countTo(el, to, dur = 1300, from = 0) {
  const t0 = performance.now();
  let done = false;
  function tick(t) {
    if (done) return;
    const k = clamp((t - t0) / dur, 0, 1);
    const e = 1 - Math.pow(1 - k, 3);
    el.textContent = Math.round(from + (to - from) * e);
    if (k < 1) requestAnimationFrame(tick);
    else done = true;
  }
  requestAnimationFrame(tick);
  // 兜底：动画被节流时，最终值一定要对
  setTimeout(() => { done = true; el.textContent = to; }, dur + 240);
}

/* ---------------- 雷达图 ---------------- */
function buildRadar(svg, big) {
  const W = 380, H = 330, cx = 190, cy = 168, R = 102;
  const keys = BIG5_META.map(m => m.key);
  const n = keys.length;
  const ang = i => (-90 + i * (360 / n)) * Math.PI / 180;
  const pt = (i, r) => [cx + Math.cos(ang(i)) * r, cy + Math.sin(ang(i)) * r];

  let g = '';
  // 网格
  [0.25, 0.5, 0.75, 1].forEach(lv => {
    const p = keys.map((_, i) => pt(i, R * lv).join(',')).join(' ');
    g += `<polygon points="${p}" fill="${lv === 1 ? 'rgba(255,255,255,.55)' : 'none'}" stroke="rgba(27,25,23,${lv === 1 ? 0.14 : 0.07})" stroke-width="1"/>`;
  });
  // 轴线 + 标签
  keys.forEach((k, i) => {
    const [x, y] = pt(i, R);
    g += `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="rgba(27,25,23,.06)" stroke-width="1"/>`;
    const [lx, ly] = pt(i, R + 30);
    const a = Math.cos(ang(i));
    const anchor = Math.abs(a) < 0.25 ? 'middle' : (a > 0 ? 'start' : 'end');
    const meta = BIG5_META[i];
    g += `<text x="${lx}" y="${ly - 3}" text-anchor="${anchor}" font-size="12" fill="#4A443D" font-family="Optima,PingFang SC,Microsoft YaHei,sans-serif">${meta.name}</text>`;
    g += `<text x="${lx}" y="${ly + 13}" text-anchor="${anchor}" font-size="9.5" fill="#A79F94" font-family="SF Mono,monospace">${meta.short}</text>`;
  });

  const values = keys.map(k => big[k]);
  const pts = values.map((v, i) => pt(i, R * v / 100));

  svg.innerHTML = `
    <defs>
      <linearGradient id="radarFill" x1="0" y1="0" x2="0.6" y2="1">
        <stop offset="0%" stop-color="rgba(7,193,96,.30)"/>
        <stop offset="100%" stop-color="rgba(124,92,230,.20)"/>
      </linearGradient>
      <linearGradient id="radarStroke" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#07C160"/>
        <stop offset="100%" stop-color="#7C5CE6"/>
      </linearGradient>
    </defs>
    ${g}
    <polygon id="radarPoly" points="" fill="url(#radarFill)" stroke="url(#radarStroke)" stroke-width="2.2" stroke-linejoin="round"/>
    <g id="radarDots"></g>
  `;

  const poly = $('#radarPoly', svg);
  const dots = $('#radarDots', svg);
  const t0 = performance.now();
  const DUR = 1150;
  let finished = false;

  function drawFinal() {
    if (finished) return;
    finished = true;
    poly.setAttribute('points', pts.map(([x, y]) => x.toFixed(1) + ',' + y.toFixed(1)).join(' '));
    dots.innerHTML = pts.map(([x, y], i) =>
      `<circle cx="${x}" cy="${y}" r="4.2" fill="#fff" stroke="${i % 2 ? '#7C5CE6' : '#07C160'}" stroke-width="2.2"/>`
    ).join('');
  }

  function frame(t) {
    if (finished) return;
    const k = clamp((t - t0) / DUR, 0, 1);
    const e = 1 - Math.pow(1 - k, 3);
    poly.setAttribute('points', pts.map(([x, y]) => {
      const px = cx + (x - cx) * e, py = cy + (y - cy) * e;
      return px.toFixed(1) + ',' + py.toFixed(1);
    }).join(' '));
    if (k < 1) requestAnimationFrame(frame);
    else drawFinal();
  }
  requestAnimationFrame(frame);
  setTimeout(drawFinal, DUR + 320);
}

/* ---------------- 渲染 ---------------- */
let observer = null;
function observeReveals(root) {
  $$('.reveal', root).forEach(el => {
    el.classList.remove('in');
    if (observer) observer.observe(el);
  });
  // 兜底：如果观察器没能在首屏触发，把已经在视口里的卡片直接显示出来
  setTimeout(() => {
    $$('.reveal', root).forEach(el => {
      if (el.classList.contains('in')) return;
      const r = el.getBoundingClientRect();
      if (r.top < window.innerHeight - 30 && r.bottom > 0) el.classList.add('in');
    });
  }, 1400);
}

function renderProfile(p) {
  const a = p.arche;

  // 主卡
  $('#archeEmoji').textContent = a.emoji;
  $('#archeCode').textContent = `${p.primary} / ${p.secondary}`;
  $('#archeName').textContent = a.name;
  $('#archeSub').textContent = a.sub;
  $('#keywords').innerHTML = a.keywords.map(k => `<span class="chip">${k}</span>`).join('');

  // 分数
  countTo($('#scoreNum'), p.score, 1500);
  const ring = $('#ringFg');
  const C = 2 * Math.PI * 66;
  ring.style.strokeDasharray = C;
  ring.style.strokeDashoffset = C;
  requestAnimationFrame(() => {
    setTimeout(() => { ring.style.strokeDashoffset = C * (1 - p.score / 100); }, 120);
  });
  $('#grade').textContent = p.grade.t;
  $('#rank').innerHTML = `超过 <b>${p.grade.r}%</b> 的昵称`;

  // 昵称密码
  const dl = $('#decodeList');
  $('#decodeNote').textContent = `从字面读到的 ${p.feats.length} 个信号`;
  dl.innerHTML = p.feats.map(f => `
    <li><div class="d-tag">${f.tag}</div><p class="d-desc">${f.desc}</p></li>
  `).join('');
  $$('#decodeList li').forEach((li, i) => setTimeout(() => li.classList.add('in'), 200 + i * 110));

  // DISC
  $('#discCombo').textContent = `主导 ${p.primary} · 次要 ${p.secondary}`;
  $('#discList').innerHTML = DISC_META.map(m => `
    <div class="disc-row">
      <div class="disc-key"><i style="background:${m.color}"></i>${m.key} ${m.name}</div>
      <div class="disc-track"><div class="disc-fill" data-w="${p.pct[m.key]}" style="background:linear-gradient(90deg,${m.color}bb,${m.color})"></div></div>
      <div class="disc-val">${p.pct[m.key]}%</div>
    </div>`).join('');

  // 雷达
  buildRadar($('#radar'), p.big);
  $('#radarSide').innerHTML = BIG5_META.map(m => `
    <div class="r-item" title="${m.tip}">
      <div class="r-top">
        <div class="r-name">${m.name}<span>${m.short}</span></div>
        <div class="r-score">${p.big[m.key]}</div>
      </div>
      <div class="r-bar"><i data-w="${p.big[m.key]}" style="background:linear-gradient(90deg,#0AC66B,#7C5CE6)"></i></div>
    </div>`).join('');

  // 人品牌照
  $('#moralList').innerHTML = MORAL_META.map(m => {
    const v = p.moral[m.key];
    const stars = clamp(Math.round(v / 20), 1, 5);
    return `<div class="moral-item" title="${m.tip}">
      <div class="moral-name"><span class="ic">${m.icon}</span>${m.name}</div>
      <div class="moral-track"><div class="moral-fill" data-w="${v}"></div></div>
      <div class="moral-right">
        <span class="stars">${'★'.repeat(stars)}${'☆'.repeat(5 - stars)}</span>
        <span class="moral-num">${v}</span>
      </div>
    </div>`;
  }).join('');

  // 深交潜力
  const colors = ['#07C160', '#7C5CE6', '#E86A8A', '#E8A33D'];
  $('#deepGrid').innerHTML = DEEP_META.map((m, i) => {
    const v = p.deep[m.key];
    const c = 2 * Math.PI * 32;
    return `<div class="deep-item" title="${m.tip}">
      <div class="mini-ring">
        <svg viewBox="0 0 76 76">
          <circle class="mb" cx="38" cy="38" r="32"/>
          <circle class="mf" data-c="${c}" data-v="${v}" cx="38" cy="38" r="32" stroke="${colors[i]}"/>
        </svg>
        <b>${v}</b>
      </div>
      <h4>${m.name}</h4>
    </div>`;
  }).join('');

  const verdict =
    p.deepIndex >= 92 ? `深交指数 <b>${p.deepIndex}</b>。这是稀有级别的深交体质——遇到请主动一点。这种人不会追着谁跑，但会把一段关系养很多年。` :
    p.deepIndex >= 86 ? `深交指数 <b>${p.deepIndex}</b>。值得认真投入长期关系。TA 的靠谱不是嘴上说的，是某天你回头才发现：这人一次都没掉过链子。` :
    p.deepIndex >= 80 ? `深交指数 <b>${p.deepIndex}</b>。适合慢慢来。前三次见面像试用期，过了那道坎，会一年比一年更舒服。` :
                       `深交指数 <b>${p.deepIndex}</b>。慢热型宝藏。给 TA 一点时间，TA 会给你一整个答案。`;
  $('#deepVerdict').innerHTML = `<p class="dv-main">${verdict}</p><p class="dv-praise" id="praiseLine"></p>`;

  // 天赋
  $('#strengthList').innerHTML = a.strengths.map(s =>
    `<li><b>${s.t}</b><p>${s.d}</p></li>`).join('');

  // 侧写
  $('#profileNotes').innerHTML = `
    <div class="pn"><h4>朋友眼中的 TA</h4><p>${a.friends}</p></div>
    <div class="pn"><h4>压力之下</h4><p>${a.pressure}</p></div>
    <div class="pn"><h4>在亲密关系里</h4><p>${a.love}</p></div>
  `;

  // 金句
  $('#goldenLine').textContent = a.golden;
  $('#quoteFrom').innerHTML = `—— 关于「<b>${p.name}</b>」`;

  // 相处指南
  const m1 = ARCHETYPES[a.match[0]] || a, m2 = ARCHETYPES[a.match[1]] || a;
  $('#guideList').innerHTML = `
    <div class="g-item">
      <div class="g-k">HOW TO GET CLOSER</div>
      <p>${a.close}</p>
    </div>
    <div class="g-item">
      <div class="g-k">A GENTLE NOTE</div>
      <p>${a.soft}</p>
    </div>
    <div class="g-item">
      <div class="g-k">BEST MATCH</div>
      <p>${m1.emoji} <b>${m1.name}</b> 与 ${m2.emoji} <b>${m2.name}</b>。<br>${a.like}——说的就是这类人。</p>
    </div>
  `;

  // 触发入场动画
  setTimeout(() => {
    $$('.disc-fill').forEach((el, i) => setTimeout(() => el.style.width = el.dataset.w + '%', i * 90));
    $$('.r-bar i').forEach((el, i) => setTimeout(() => el.style.width = el.dataset.w + '%', 260 + i * 80));
    $$('.moral-fill').forEach((el, i) => setTimeout(() => el.style.width = el.dataset.w + '%', 420 + i * 90));
    $$('.mini-ring .mf').forEach((el, i) => {
      const c = +el.dataset.c;
      el.style.strokeDasharray = c;
      el.style.strokeDashoffset = c;
      setTimeout(() => el.style.strokeDashoffset = c * (1 - el.dataset.v / 100), 360 + i * 110);
    });
  }, 320);
}

/* ---------------- 扫描动画 ---------------- */
const SCAN_STEPS = [
  '读取昵称的字形与语气',
  '解析符号里的情绪偏好',
  '匹配 DISC 四象坐标',
  '计算人品牌照五项指标',
  '推演深交潜力与相处节奏',
  '生成你的人格光谱'
];

async function runScan(name) {
  const scan = $('#scan');
  const steps = $('#scanSteps');
  const bar = $('#scanBar');
  $('#scanName').textContent = '「' + name + '」';
  steps.innerHTML = SCAN_STEPS.map(s => `<li><span class="tick"></span>${s}</li>`).join('');
  bar.style.width = '0%';
  scan.hidden = false;
  document.body.style.overflow = 'hidden';

  const items = $$('#scanSteps li');
  for (let i = 0; i < items.length; i++) {
    items[i].classList.add('on');
    bar.style.width = Math.round(((i + 0.6) / items.length) * 100) + '%';
    await sleep(280 + Math.random() * 130);
    items[i].classList.remove('on');
    items[i].classList.add('done');
  }
  bar.style.width = '100%';
  await sleep(260);
  scan.style.opacity = '0';
  scan.style.transition = 'opacity .35s';
  await sleep(300);
  scan.hidden = true;
  scan.style.opacity = '';
  document.body.style.overflow = '';
}

/* ---------------- 撒花 ---------------- */
function sprinkle(host) {
  const emojis = ['✦', '✧', '·', '❋', '♡', '✿'];
  for (let i = 0; i < 16; i++) {
    const el = document.createElement('span');
    el.className = 'confetti';
    el.textContent = emojis[(Math.random() * emojis.length) | 0];
    const rect = host.getBoundingClientRect();
    el.style.left = rect.left + Math.random() * rect.width + 'px';
    el.style.top = rect.top + 40 + Math.random() * 80 + 'px';
    el.style.color = ['#07C160', '#7C5CE6', '#E8A33D', '#E86A8A'][(Math.random() * 4) | 0];
    el.style.opacity = '0';
    document.body.appendChild(el);
    const dx = (Math.random() - 0.5) * 160;
    const dy = -60 - Math.random() * 120;
    el.animate([
      { transform: 'translate(0,0) scale(.4)', opacity: 0 },
      { transform: `translate(${dx * 0.4}px,${dy * 0.5}px) scale(1.1)`, opacity: 0.95, offset: 0.35 },
      { transform: `translate(${dx}px,${dy}px) scale(.8)`, opacity: 0 }
    ], { duration: 1700 + Math.random() * 700, easing: 'cubic-bezier(.2,.7,.3,1)' })
      .onfinish = () => el.remove();
  }
}

/* ---------------- Toast ---------------- */
let toastTimer = null;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('on'), 2200);
}

/* ---------------- 主流程 ---------------- */
let current = null;

async function analyze(name) {
  name = name.trim();
  if (!name) {
    $('#inputShell').classList.add('shake');
    $('#hint').textContent = '先写一个昵称吧，随便写，我们不会笑的。';
    $('#hint').classList.add('warn');
    setTimeout(() => $('#inputShell').classList.remove('shake'), 500);
    return;
  }
  $('#hint').textContent = '不确定写哪个？就写你最常被叫的那个。';
  $('#hint').classList.remove('warn');
  $('#nameInput').blur();

  await runScan(name);

  const p = buildProfile(name);
  current = p;
  renderProfile(p);

  const res = $('#result');
  res.hidden = false;
  observeReveals(res);
  const top = res.getBoundingClientRect().top + window.scrollY - 70;
  window.scrollTo({ top, behavior: 'smooth' });
  setTimeout(() => sprinkle($('.hero-card')), 900);
}

/* ---------------- 分享卡片 ---------------- */
function roundRect(ctx, x, y, w, h, r) {
  if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); return; }
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function saveCard(p) {
  const W = 750, H = 1180;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const x = c.getContext('2d');
  const a = p.arche;

  const bg = x.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#FFFFFF');
  bg.addColorStop(0.45, '#FBF7F0');
  bg.addColorStop(1, '#F1F9F3');
  x.fillStyle = bg; x.fillRect(0, 0, W, H);

  const blob = (cx, cy, r, col) => {
    const g = x.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0, col); g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g; x.beginPath(); x.arc(cx, cy, r, 0, 7); x.fill();
  };
  blob(660, 130, 300, 'rgba(7,193,96,.16)');
  blob(70, 960, 320, 'rgba(124,92,230,.12)');

  // 边框
  roundRect(x, 34, 34, W - 68, H - 68, 40);
  x.strokeStyle = 'rgba(27,25,23,.09)'; x.lineWidth = 2; x.stroke();

  x.textAlign = 'center';

  // 顶部品牌
  x.fillStyle = '#8B8378';
  x.font = '500 19px "SF Mono", Consolas, monospace';
  x.fillText('名 相   ·   NAME AURA', W / 2, 104);
  x.fillStyle = 'rgba(27,25,23,.34)';
  x.font = '400 18px "PingFang SC", "Microsoft YaHei", sans-serif';
  x.fillText('昵 称 人 格 图 谱', W / 2, 138);

  // emoji
  x.font = '92px "Segoe UI Emoji", "Apple Color Emoji", sans-serif';
  x.fillText(a.emoji, W / 2, 258);

  // 原型名
  x.fillStyle = '#1B1917';
  x.font = '400 54px "Songti SC", "SimSun", Georgia, serif';
  x.fillText(a.name, W / 2, 344);

  x.fillStyle = '#4A443D';
  x.font = '400 23px "PingFang SC", "Microsoft YaHei", sans-serif';
  x.fillText(a.sub, W / 2, 386);

  // 分数环
  const cx = W / 2, cy = 480, R = 80;
  x.beginPath(); x.arc(cx, cy, R, 0, 7);
  x.strokeStyle = 'rgba(27,25,23,.08)'; x.lineWidth = 9; x.stroke();

  const gr = x.createLinearGradient(cx - R, cy - R, cx + R, cy + R);
  gr.addColorStop(0, '#07C160'); gr.addColorStop(1, '#7C5CE6');
  x.beginPath();
  x.arc(cx, cy, R, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (p.score / 100));
  x.strokeStyle = gr; x.lineWidth = 9; x.lineCap = 'round'; x.stroke();

  x.fillStyle = '#1B1917';
  x.font = '400 72px "Songti SC", "SimSun", Georgia, serif';
  x.fillText(String(p.score), cx, cy + 20);

  x.fillStyle = '#8B8378';
  x.font = '400 14px "PingFang SC", "Microsoft YaHei", sans-serif';
  x.fillText('综合魅力值', cx, cy + 50);

  x.fillStyle = '#0A8C4E';
  x.font = '500 19px "PingFang SC", "Microsoft YaHei", sans-serif';
  x.fillText(p.grade.t, W / 2, 610);

  // 昵称
  x.fillStyle = '#8B8378';
  x.font = '400 22px "PingFang SC", "Microsoft YaHei", sans-serif';
  x.fillText('「 ' + p.name + ' 」', W / 2, 656);

  // 分隔线
  x.strokeStyle = 'rgba(27,25,23,.1)'; x.lineWidth = 1;
  x.beginPath(); x.moveTo(110, 688); x.lineTo(W - 110, 688); x.stroke();

  // DISC 四行
  let y = 728;
  DISC_META.forEach(m => {
    x.textAlign = 'left';
    x.fillStyle = '#4A443D';
    x.font = '400 21px "PingFang SC", "Microsoft YaHei", sans-serif';
    x.fillText(`${m.key}  ${m.name}`, 100, y + 6);

    const tx = 300, tw = 320;
    roundRect(x, tx, y - 7, tw, 12, 6);
    x.fillStyle = 'rgba(27,25,23,.07)'; x.fill();

    roundRect(x, tx, y - 7, Math.max(12, tw * p.pct[m.key] / 100), 12, 6);
    const g2 = x.createLinearGradient(tx, 0, tx + tw, 0);
    g2.addColorStop(0, m.color + 'cc'); g2.addColorStop(1, m.color);
    x.fillStyle = g2; x.fill();

    x.textAlign = 'right';
    x.fillStyle = '#8B8378';
    x.font = '400 19px "SF Mono", Consolas, monospace';
    x.fillText(p.pct[m.key] + '%', W - 100, y + 6);
    y += 44;
  });

  // 关键词
  x.textAlign = 'center';
  x.fillStyle = '#0A8C4E';
  x.font = '400 21px "PingFang SC", "Microsoft YaHei", sans-serif';
  x.fillText(a.keywords.join('   ·   '), W / 2, y + 34);

  // 金句
  x.fillStyle = '#1B1917';
  x.font = '400 25px "Songti SC", "SimSun", Georgia, serif';
  wrapText(x, '「' + a.golden + '」', W / 2, y + 100, W - 190, 38);

  // 底部
  x.fillStyle = '#A79F94';
  x.font = '400 16px "PingFang SC", "Microsoft YaHei", sans-serif';
  x.fillText('微信名 / 昵称 的娱乐向人格解读 · 名相 NAME AURA', W / 2, H - 92);
  x.fillStyle = 'rgba(27,25,23,.26)';
  x.font = '400 15px "SF Mono", Consolas, monospace';
  x.fillText('SCAN · ' + (p.seed % 100000).toString().padStart(5, '0'), W / 2, H - 60);

  c.toBlob(b => {
    const url = URL.createObjectURL(b);
    const a2 = document.createElement('a');
    a2.href = url;
    a2.download = `名相-${p.name}-人格图谱.png`;
    a2.click();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }, 'image/png');
  toast('人格卡已生成，去下载里看看 ✦');
}

function wrapText(ctx, text, cx, y, maxW, lh) {
  const chars = Array.from(text);
  let line = '', lines = [];
  for (const ch of chars) {
    if (ctx.measureText(line + ch).width > maxW) { lines.push(line); line = ch; }
    else line += ch;
  }
  if (line) lines.push(line);
  lines.forEach((l, i) => ctx.fillText(l, cx, y + i * lh));
}

/* ---------------- 文本报告 ---------------- */
function reportText(p) {
  const a = p.arche;
  return [
    `【名相 · 昵称人格图谱】`,
    `昵称：${p.name}`,
    `人格原型：${a.emoji} ${a.name}（${p.primary}/${p.secondary}）—— ${a.sub}`,
    `综合魅力值：${p.score} · ${p.grade.t}`,
    ``,
    `DISC：` + DISC_META.map(m => `${m.key}${p.pct[m.key]}%`).join('  '),
    `人格五维：` + BIG5_META.map(m => `${m.name}${p.big[m.key]}`).join('  '),
    `人品牌照：` + MORAL_META.map(m => `${m.name}${p.moral[m.key]}`).join('  '),
    `深交指数：${p.deepIndex}`,
    ``,
    `「${a.golden}」`,
    ``,
    `—— 娱乐向解读，别太当真，但可以当真地开心一下。`
  ].join('\n');
}

/* ---------------- 双人合盘 ---------------- */
function pickPairType(pa, pb, seed) {
  const A = pa.primary, B = pb.primary;
  if (A === B) return PAIR_TYPES[0];
  const key = [A, B].sort().join('');
  if (key === 'DS' || key === 'CI') return PAIR_TYPES[1];
  if (key === 'DI' || key === 'CS') return PAIR_TYPES[3];
  if (pa.arche.name === pb.arche.name) return PAIR_TYPES[2];
  return seed % 2 ? PAIR_TYPES[4] : PAIR_TYPES[5];
}

function duoMatch(pa, pb) {
  const keys5 = BIG5_META.map(m => m.key);
  const km = MORAL_META.map(m => m.key);
  let diff = 0, cnt = 0;
  keys5.forEach(k => { diff += Math.abs(pa.big[k] - pb.big[k]); cnt++; });
  km.forEach(k => { diff += Math.abs(pa.moral[k] - pb.moral[k]) * 0.8; cnt++; });
  const sim = 100 - diff / cnt;

  const same = pa.primary === pb.primary;
  const compat = clamp(Math.round(sim * 0.74 + 20 + (same ? 4 : 7)), 68, 99);
  const type = pickPairType(pa, pb, pa.seed ^ pb.seed);
  return { compat, type, sim };
}

function renderDuo(pa, pb) {
  const { compat, type } = duoMatch(pa, pb);

  $('#duoNameA').textContent = pa.name;
  $('#duoNameB').textContent = pb.name;
  $('#duoType').textContent = type.emoji + '  ' + type.name;
  $('#duoDesc').textContent = type.desc;

  $('#duoArche').innerHTML = `
    <span class="chip">${pa.arche.emoji} ${pa.name} · ${pa.arche.name}</span>
    <span class="chip">${pb.arche.emoji} ${pb.name} · ${pb.arche.name}</span>
  `;

  $('#duoHi').textContent = type.hi;
  $('#duoRisk').textContent = type.risk;
  $('#duoTip').textContent = type.tip;

  const ring = $('#duoRing');
  const C = 2 * Math.PI * 66;
  ring.style.strokeDasharray = C;
  ring.style.strokeDashoffset = C;
  ring.style.stroke = type.tone;
  requestAnimationFrame(() => setTimeout(() => {
    ring.style.strokeDashoffset = C * (1 - compat / 100);
  }, 120));
  countTo($('#duoScore'), compat, 1500);

  const res = $('#duoResult');
  res.hidden = false;
  observeReveals(res);
  const top = res.getBoundingClientRect().top + window.scrollY - 70;
  window.scrollTo({ top, behavior: 'smooth' });
  setTimeout(() => sprinkle($('.duo-card')), 700);
}

/* ---------------- 事件绑定 ---------------- */
function init() {
  observer = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); observer.unobserve(e.target); } });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

  // 输入
  $('#goBtn').addEventListener('click', () => analyze($('#nameInput').value));
  $('#nameInput').addEventListener('keydown', e => { if (e.key === 'Enter') analyze($('#nameInput').value); });
  $('#nameInput').addEventListener('input', () => {
    $('#hint').textContent = '不确定写哪个？就写你最常被叫的那个。';
    $('#hint').classList.remove('warn');
  });

  $$('.sample').forEach(b => b.addEventListener('click', () => {
    $('#nameInput').value = b.textContent.trim();
    analyze(b.textContent.trim());
  }));

  // 占位符轮播
  const phs = ['输入微信名 / 昵称，比如「一只鹿」', '试试「小满」', '试试「Luna」', '试试「人间清醒」', '试试「风与海。」'];
  let pi = 0;
  setInterval(() => {
    const inp = $('#nameInput');
    if (document.activeElement === inp || inp.value.trim()) return;
    pi = (pi + 1) % phs.length;
    inp.placeholder = phs[pi];
  }, 2600);

  // 再夸一句
  let lastPraise = '';
  $('#praiseBtn').addEventListener('click', () => {
    if (!current) return;
    const line = PRAISE.filter(t => t !== lastPraise)[(Math.random() * (PRAISE.length - 1)) | 0] || PRAISE[0];
    lastPraise = line;
    const el = $('#praiseLine');
    if (!el) return;
    el.style.opacity = '0';
    el.style.transform = 'translateY(6px)';
    setTimeout(() => {
      el.textContent = '✦ ' + line;
      el.classList.add('on');
      el.style.opacity = '1';
      el.style.transform = 'none';
    }, 200);
    sprinkle($('#praiseBtn'));
  });

  // 保存卡片
  $('#saveBtn').addEventListener('click', () => { if (current) saveCard(current); });

  // 复制
  $('#copyBtn').addEventListener('click', async () => {
    if (!current) return;
    const txt = reportText(current);
    try {
      await navigator.clipboard.writeText(txt);
      toast('报告已复制，去粘给朋友看吧 ✦');
    } catch (e) {
      const ta = document.createElement('textarea');
      ta.value = txt; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      document.execCommand('copy'); ta.remove();
      toast('报告已复制 ✦');
    }
  });

  // 再来一次
  $('#againBtn').addEventListener('click', () => {
    $('#result').hidden = true;
    $('#nameInput').value = '';
    $('#nameInput').focus();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // 视图切换
  $$('.tab').forEach(t => t.addEventListener('click', () => {
    $$('.tab').forEach(x => x.classList.remove('active'));
    t.classList.add('active');
    $$('.view').forEach(v => v.classList.remove('active'));
    $('#view-' + t.dataset.view).classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }));

  // 合盘
  $('#duoBtn').addEventListener('click', async () => {
    const A = $('#duoA').value.trim(), B = $('#duoB').value.trim();
    if (!A || !B) {
      $('#duoHint').textContent = '两个人的昵称都要写，才有得算呀。';
      $('#duoHint').classList.add('warn');
      return;
    }
    $('#duoHint').textContent = '两个人的名字，两种节奏，一种相处方式。';
    $('#duoHint').classList.remove('warn');
    await runScan(A + ' × ' + B);
    renderDuo(buildProfile(A), buildProfile(B));
  });
  $('#duoA').addEventListener('keydown', e => { if (e.key === 'Enter') $('#duoB').focus(); });
  $('#duoB').addEventListener('keydown', e => { if (e.key === 'Enter') $('#duoBtn').click(); });

  $('#duoAgain').addEventListener('click', () => {
    $('#duoResult').hidden = true;
    $('#duoA').value = ''; $('#duoB').value = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  $('#duoBack').addEventListener('click', () => $('.tab[data-view="solo"]').click());

  // 点一下原型小动物：彩蛋
  const eggLines = [
    '它今天心情不错，替你说句好话：你比你以为的更值得。',
    '（它转了个圈）据说，摸过它的人最近都会遇到一件小好事。',
    '它想告诉你：慢一点也没关系，你已经很好了。',
    '它偷偷补了一句：记得早点睡。'
  ];
  $('#archeEmoji').addEventListener('click', () => {
    const el = $('#archeEmoji');
    el.animate([
      { transform: 'translateY(0) rotate(0deg) scale(1)' },
      { transform: 'translateY(-14px) rotate(-8deg) scale(1.08)' },
      { transform: 'translateY(0) rotate(0deg) scale(1)' }
    ], { duration: 620, easing: 'cubic-bezier(.3,1.4,.4,1)' });
    toast(eggLines[(Math.random() * eggLines.length) | 0]);
    sprinkle(el);
  });

  // nav 阴影
  window.addEventListener('scroll', () => {
    $('.nav').classList.toggle('stuck', window.scrollY > 8);
  }, { passive: true });

  // 累计解读量：自上线日起按天线性累加，每天 84–100 个，同一时刻刷新结果一致
  const el = $('#counter');
  const fmt = n => n.toLocaleString('en-US');
  const LAUNCH_DAY = Date.UTC(2026, 8, 20);   // 2026-09-20 上线
  const LAUNCH_BASE = 1268;                   // 上线时的存量
  const dayGain = i => 84 + ((i * 37 + 11) % 17);   // 84%~100%，确定性波动

  function totalCount() {
    const days = Math.max(0, (Date.now() - LAUNCH_DAY) / 864e5);
    const full = Math.floor(days);
    let n = LAUNCH_BASE;
    for (let i = 0; i < full; i++) n += dayGain(i);
    n += (days - full) * dayGain(full);
    return Math.floor(n);
  }

  const base = totalCount();
  const t0 = performance.now();
  (function inc(t) {
    const k = clamp((t - t0) / 1400, 0, 1);
    el.textContent = fmt(Math.round(base * (1 - Math.pow(1 - k, 3))));
    if (k < 1) requestAnimationFrame(inc);
  })(t0);
  // 动画被节流时兜底，确保最终值一定正确
  setTimeout(() => { el.textContent = fmt(base); }, 1700);
  // 不做秒级跳动：数字按天自然增长，刷新才会更新

  // 支持分享链接：index.html?n=昵称
  const q = new URLSearchParams(location.search);
  const qn = q.get('n');
  if (qn) {
    $('#nameInput').value = qn;
    if (q.get('fast')) {
      const p = buildProfile(qn);
      current = p; renderProfile(p);
      const res = $('#result');
      res.hidden = false;
      $$('.reveal', res).forEach(e => e.classList.add('in'));
      window.setTimeout(() => {
        $$('.disc-fill').forEach(e => e.style.width = e.dataset.w + '%');
        $$('.r-bar i').forEach(e => e.style.width = e.dataset.w + '%');
        $$('.moral-fill').forEach(e => e.style.width = e.dataset.w + '%');
      }, 400);
    } else {
      setTimeout(() => analyze(qn), 500);
    }
  }
}

document.addEventListener('DOMContentLoaded', init);
