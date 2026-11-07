// 生成合盘结果素材：只克隆 #duoResult 内容，整幅渲染，避免任何裁切
const fs = require('fs');
const path = require('path');

const root = 'C:/Users/15016/WorkBuddy/2026-11-07-09-23-27/name-aura';
const src = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

const KILL = `<style>
*,*::before,*::after{animation:none!important;transition:none!important}
.view{opacity:1!important}
.reveal{opacity:1!important;transform:none!important}
html,body{background:#fff!important}
.grain,.blob,.nav,.foot,.hero,.duo-hero{display:none!important}
main{max-width:1120px;margin:0 auto;padding:0!important}
#view-duo{padding:0!important;margin:0!important}
#duoResult{display:block!important;margin:0!important;padding:0!important}
#duoResult .actions{display:none!important}
</style>`;

const grab = `
<script>
window.addEventListener('load', () => {
  setTimeout(() => {
    document.querySelector('[data-view="duo"]').click();
    document.getElementById('duoA').value = '一只鹿';
    document.getElementById('duoB').value = '小满';
    document.getElementById('duoBtn').click();
    setTimeout(() => {
      const res = document.getElementById('duoResult');
      const clone = res.cloneNode(true);
      clone.removeAttribute('hidden');
      clone.style.cssText = 'display:block;margin:0;padding:0;width:1120px';
      document.body.innerHTML = '';
      document.body.style.cssText = 'margin:0;padding:0;background:#fff;width:1120px';
      const wrap = document.createElement('div');
      wrap.style.cssText = 'width:1120px;margin:0;padding:14px 60px 20px';
      wrap.appendChild(clone);
      document.body.appendChild(wrap);
      setTimeout(() => {
        document.title = 'CLONE ' + Math.ceil(wrap.getBoundingClientRect().height);
      }, 120);
    }, 6500);
  }, 400);
});
</script>`;

fs.writeFileSync(
  path.join(root, '_cap_duo2.html'),
  src.replace('</head>', KILL + '</head>').replace('</body>', grab + '</body>')
);
console.log('written _cap_duo2.html');
