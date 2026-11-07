const fs = require('fs');
const path = require('path');

const dir = __dirname;
const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>
<script>
const im = new Image();
im.onload = () => {
  const c = document.createElement('canvas');
  c.width = im.width; c.height = im.height;
  const x = c.getContext('2d');
  x.drawImage(im, 0, 0);
  const d = x.getImageData(0, 0, c.width, c.height).data;
  const W = c.width, H = c.height;
  const isContent = (px) => {
    const i = px * 4;
    return !(d[i] > 250 && d[i + 1] > 250 && d[i + 2] > 250);
  };
  let left = W, right = 0, top = H, bottom = 0;
  for (let px = 0; px < W; px++) {
    for (let py = 0; py < H; py++) {
      if (isContent(py * W + px)) {
        if (px < left) left = px;
        if (px > right) right = px;
        if (py < top) top = py;
        if (py > bottom) bottom = py;
      }
    }
  }
  document.title = 'BBOX ' + [left, top, right, bottom, W, H].join(' ');
};
im.src = 'assets/duo.png';
</script></body></html>`;
fs.writeFileSync(path.join(dir, '_bbox.html'), html);
console.log('ok');
