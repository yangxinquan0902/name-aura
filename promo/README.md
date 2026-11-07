# 宣传图生产流程

这套宣传图不是「生成的图片」，而是**用 HTML 排版 + 真实产品截图**渲染出来的，所以文案、数字、界面都跟线上完全一致，改文案只需改 HTML 重跑一次。

## 六张图

| 编号 | 主题 | 说明 |
| --- | --- | --- |
| 01 | 主图 | 品牌 + 主张 + 真实分数卡 + 双人合盘强调条 + 四个数字 |
| 02 | 17 个维度 | DISC / 大五 / 人品牌照 / 深交潜力，各配界面缩略图 |
| 03 | 12 种原型 | 12 个原型全列 + 每种附带什么 |
| 04 | 交互玩法 | 真实扫描界面 + 5 个细节 + 5 个功能标签 |
| 05 | 真实案例 | 5 份实跑出来的报告 |
| 06 | 双人合盘 | 完整合盘结果 + 匹配度分档 + 6 种关系类型 |
| 07 | 使用流程 | 打开 → 输入昵称 → 六步扫描 → 报告，再分叉到「继续玩」和「双人合盘」，配 `07-使用流程.txt` 文字版 |

## 文件

| 文件 | 作用 |
| --- | --- |
| `cards.html` | 6 张图的版式与文案，`?c=1`…`?c=6` 切换单张 |
| `flow.html` | 使用流程图版式（1080×1440，单独渲染） |
| `promo.css` | 视觉系统（暖纸底 / 宋体标题 / 微信绿 + 紫） |
| `cap2.js` | 单人卡片截图 harness：把结果页单张卡片克隆出来单独渲染 |
| `capduo.js` | 合盘截图 harness：克隆 `#duoResult` 整段，带对称白边 |
| `probe.js` | 版式体检：测量每张图的内容高度、留白与是否溢出 |
| `bbox.js` | 测量素材内容边界，用来算精确裁切 |
| `shots.sh` | 批量截取单人卡片素材 |
| `assets/` | 真实产品截图（hero / disc / radar / moral / deep / scan / duo） |
| `out/` | 最终成品，2160×2880（1080×1440 的 2x），含小红书合规清单与笔记文案 |

## 重新生成

```bash
# 1. 生成 harness 页
node promo/cap2.js && node promo/capduo.js

# 2. 截取素材（需要 Edge）
bash promo/shots.sh
# 合盘需要单独跑，窗口高度用 dump-dom 里读到的 CLONE 值

# 3. 版式体检
node promo/probe.js

# 4. 渲染 6 张成品
for i in 1 2 3 4 5 6; do
  "/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe" \
    --headless=new --disable-gpu --hide-scrollbars --allow-file-access-from-files \
    --force-device-scale-factor=2 --window-size=1080,1440 \
    --screenshot="promo/out/0$i.png" \
    "file:///$PWD/promo/cards.html?c=$i"
done
```

## 三条硬规矩

1. **截图不裁切**：`.shot` 容器宽高必须等于素材可见区 × 缩放比，`--iw` 填素材原始 CSS 宽度、`--k` 填 `容器宽 / 素材宽`，横向永远不出画。
2. **抓图等动画结束**：分数环和雷达图有 1.2–1.7s 动画，克隆时机不对会截到中间值（86 变 26）。合盘要多等，约 6.5s。
3. **素材自己要有白边**：克隆容器加对称 padding，否则卡片圆角贴在图片边缘，放大后看起来像被切掉。

## 流程图重渲染

```bash
"/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe" \
  --headless=new --disable-gpu --hide-scrollbars --allow-file-access-from-files \
  --force-device-scale-factor=2 --window-size=1080,1440 \
  --screenshot="promo/out/07-使用流程.png" "file:///$PWD/promo/flow.html"
```

## 发布合规

- `out/小红书-合规检查清单.md`：12 处已改 + 3 个灰区提示 + 7 条发布红线
- `out/小红书-笔记文案.md`：标题 / 正文两版 / 话题 / 图片顺序 / 评论区承接话术
