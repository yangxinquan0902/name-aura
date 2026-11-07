// 把结果页中的单张卡片克隆出来单独渲染，避免页面留白与裁切错位
const fs = require('fs');
const path = require('path');

const root = 'C:/Users/15016/WorkBuddy/2026-11-07-09-23-27/name-aura';
const src = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

const KILL = `<style>
*,*::before,*::after{animation:none!important;transition:none!important}
.view{opacity:1!important}
.reveal{opacity:1!important;transform:none!important}
html,body{background:#fff!important}
.grain,.blob,.nav,.foot,.hero{display:none!important}
main{max-width:1120px;margin:0 auto}
</style>`;

const grab = `
<script>
window.addEventListener('load', () => {
  const q = new URLSearchParams(location.search);
  const src = q.get('src') || 'solo';
  const idx = Number(q.get('i') || 0);
  setTimeout(() => {
    if (src === 'solo') {
      document.getElementById('result').hidden = false;
    } else {
      document.querySelector('[data-view="duo"]').click();
      document.getElementById('duoA').value = '一只鹿';
      document.getElementById('duoB').value = '小满';
      document.getElementById('duoBtn').click();
    }
    setTimeout(() => {
      const scope = src === 'solo' ? '#result .card' : '#duoResult .card';
      const el = document.querySelectorAll(scope)[idx];
      if (!el) { document.title = 'ERR no card'; return; }
      const clone = el.cloneNode(true);
      clone.style.cssText = 'width:1040px;margin:0;border:0;border-radius:0;box-shadow:none;background:#fff;';
      document.body.innerHTML = '';
      document.body.style.cssText = 'margin:0;padding:0;background:#fff;width:1040px;';
      const wrap = document.createElement('div');
      wrap.style.cssText = 'width:1040px;padding:0;margin:0';
      wrap.appendChild(clone);
      document.body.appendChild(wrap);
      setTimeout(() => {
        const h = Math.ceil(clone.getBoundingClientRect().height);
        document.title = 'CLONE ' + h;
      }, 80);
    }, 2800);
  }, 400);
});
</script>`;

fs.writeFileSync(
  path.join(root, '_cap_only.html'),
  src.replace('</head>', KILL + '</head>').replace('</body>', grab + '</body>')
);
console.log('written _cap_only.html');
