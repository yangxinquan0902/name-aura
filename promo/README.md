# 宣传图生产流程

这套宣传图不是「生成的图片」，而是**用 HTML 排版 + 真实产品截图**渲染出来的，所以文案、数字、界面都跟线上完全一致，改文案只需改 HTML 重跑一次。

## 文件

| 文件 | 作用 |
| --- | --- |
| `cards.html` | 6 张图的版式与文案，`?c=1`…`?c=6` 切换单张 |
| `promo.css` | 视觉系统（暖纸底 / 宋体标题 / 微信绿 + 紫） |
| `cap2.js` | 生成截图 harness：把结果页单张卡片克隆出来单独渲染 |
| `build-assets.js` / `shots.sh` | 批量截图脚本 |
| `assets/` | 从真实产品截的卡片素材（hero / disc / radar / moral / deep / scan / duo） |
| `out/` | 最终成品，2160×2880（1080×1440 的 2x） |

## 重新生成

```bash
# 1. 生成 harness 页面
node promo/cap2.js

# 2. 截取单张卡片素材（需要 Edge）
bash promo/shots.sh

# 3. 渲染 6 张成品
for i in 1 2 3 4 5 6; do
  "/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe" \
    --headless=new --disable-gpu --hide-scrollbars --allow-file-access-from-files \
    --force-device-scale-factor=2 --window-size=1080,1440 \
    --screenshot="promo/out/0$i.png" \
    "file:///$PWD/promo/cards.html?c=$i"
done
```

## 注意

- 截图必须在动画结束后抓（`cap2.js` 里延迟 2800ms），否则分数环会停在中间值。
- 用「克隆单张卡片」的方式取景，避免把页面边距和相邻卡片一起截进来。
- `duo.png` 用的是整页截图，靠 `--x / --y` 偏移裁切。
