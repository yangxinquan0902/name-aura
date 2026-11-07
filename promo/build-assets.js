// 生成用于截图的 harness 页面（放在应用根目录，保证相对路径可用）
const fs = require('fs');
const path = require('path');

const root = 'C:/Users/15016/WorkBuddy/2026-11-07-09-23-27/name-aura';
const src = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

const KILL = `<style id="capkill">
*,*::before,*::after{animation:none!important;transition:none!important}
.view{opacity:1!important}
.reveal{opacity:1!important;transform:none!important}
html,body{background:#FFFDF8!important}
.grain,.blob{display:none!important}
.nav,.foot,.hero{display:none!important}
body{padding-top:0!important}
#top{padding-top:0!important}
main{max-width:1120px;margin:0 auto}
#result,#duoResult{margin-top:0!important}
</style>`;

// 1) 报告页：结果区完整渲染，并测量区块位置
const measure = `
<script>
window.addEventListener('load', () => {
  setTimeout(() => {
    const res = document.getElementById('result');
    res.hidden = false;
    const base = res.getBoundingClientRect().top + window.scrollY;
    const pick = (sel, i) => {
      const els = document.querySelectorAll(sel);
      const el = els[i || 0];
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { y: Math.round(r.top + window.scrollY - base), h: Math.round(r.height) };
    };
    const info = {
      total: Math.round(res.getBoundingClientRect().height),
      hero: pick('.hero-card'),
      nameCard: pick('#result .card', 1),
      discCard: pick('#result .card', 2),
      radar: pick('#radar', 0),
      radarCard: pick('#result .card', 3),
      moralCard: pick('#result .card', 4),
      deepCard: pick('#result .card', 5),
      quote: pick('.quote-card')
    };
    document.title = 'MEASURE ' + JSON.stringify(info);
  }, 900);
});
</script>`;

// 2) 扫描动画页：自动填昵称并点击开始
const scan = `
<script>
window.addEventListener('load', () => {
  setTimeout(() => {
    const i = document.getElementById('nameInput');
    i.value = '一只鹿';
    document.getElementById('goBtn').click();
  }, 300);
});
</script>`;

// 3) 双人合盘页：切到合盘并出结果
const duo = `
<script>
window.addEventListener('load', () => {
  setTimeout(() => {
    document.querySelector('[data-view="duo"]').click();
    document.getElementById('duoA').value = '一只鹿';
    document.getElementById('duoB').value = '小满';
    document.getElementById('duoBtn').click();
  }, 300);
});
</script>`;

const write = (name, body) =>
  fs.writeFileSync(path.join(root, name), src.replace('</head>', KILL + '</head>').replace('</body>', body + '</body>'));

write('_cap_result.html', measure);
write('_cap_scan.html', scan);
write('_cap_duo.html', duo);
console.log('harness written: _cap_result.html / _cap_scan.html / _cap_duo.html');
