const fs = require('fs');
const path = require('path');

const src = fs.readFileSync(path.join(__dirname, 'cards.html'), 'utf8');
const probe = `
<script>
window.addEventListener('load', () => {
  setTimeout(() => {
    const out = [];
    document.querySelectorAll('.card').forEach((c, ci) => {
      c.classList.add('on');
      const ch = c.getBoundingClientRect().height;
      const foot = c.querySelector('.foot');
      const fTop = foot.getBoundingClientRect().top - c.getBoundingClientRect().top;
      let lastBottom = 0, lastName = '';
      [...c.children].forEach(el => {
        if (el.classList.contains('foot')) return;
        const r = el.getBoundingClientRect();
        const b = r.bottom - c.getBoundingClientRect().top;
        if (b > lastBottom) { lastBottom = b; lastName = el.className || el.tagName; }
      });
      const clips = [];
      c.querySelectorAll('.shot').forEach((s, si) => {
        const sr = s.getBoundingClientRect();
        const im = s.querySelector('img');
        const ir = im.getBoundingClientRect();
        const overR = ir.right - sr.right;
        const overB = ir.bottom - sr.bottom;
        if (overR > 1) clips.push('s' + si + ' right+' + overR.toFixed(0));
        clips.push('s' + si + ' bottom+' + (overB > 1 ? overB.toFixed(0) : '0'));
      });
      out.push('C' + (ci + 1) + ' h=' + ch.toFixed(0) + ' last=' + lastName.slice(0, 12) + '@' + lastBottom.toFixed(0) + ' footTop=' + fTop.toFixed(0) + ' gap=' + (fTop - lastBottom).toFixed(0) + (clips.length ? ' | ' + clips.join(',') : ''));
      c.classList.remove('on');
    });
    document.title = 'PROBE::' + out.join(' ;; ');
  }, 1200);
});
</script>
`;
fs.writeFileSync(path.join(__dirname, '_probe.html'), src.replace('</body>', probe + '</body>'));
console.log('probe written');
