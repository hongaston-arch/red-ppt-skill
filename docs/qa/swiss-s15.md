# Swiss S15：工程与视觉检查记录

## 范围

补齐用户已确认的S15四列三行容量，新增组件CSS、将入场波次从6列改为4列，并使汇总动效选择真实数字元素。其余布局规则与演讲者CSS/JS不在本次修改范围。

本记录是助手执行的检查结果；用户尚未批准样张。Q04–Q07与最终配色仍待后续处理，不能用本次检查替代这些决定。

## 实际样页

- [HTML](../../examples/swiss-s15-review/index.html)：8项亮底、12项暗底，稳定ID分别为matrix-8和matrix-12。
- [8项截图](swiss-s15/s15-8.png)、[12项截图](swiss-s15/s15-12.png)、[演讲者截图](swiss-s15/presenter.png)。
- [浏览器原始报告](swiss-s15/report.json)、[既有页面对比报告](swiss-s15/regression.json)。
- 数字8/12是页面中实际测试条目的数量，不是业务指标。蓝色为模板默认，未记为用户已选配色。

## 检查环境与结果

本机Chrome 155.0.8059.85，Playwright 1.64.1，deviceScaleFactor=1，localhost HTTP。Google Fonts请求被主动阻止以测试系统字体回退；Lucide从本地lucide 1.61.0 UMD提供，Motion从生成目录的本地资源加载。因此不将本次结果表述为字体CDN、图标CDN或完全离线验证。

| 视口 | 实际网格 | 汇总区底边 | 与分页的垂直间距 | 结果 |
|---|---|---:|---:|---|
| 1920×1080 | 两页均4列、3行 | 982.8px | 69.6px | 通过 |
| 1600×900 | 两页均4列、3行 | 819.0px | 57.0px | 通过 |
| 1280×720 | 两页均4列、3行 | 655.2px | 44.4px | 通过 |

逐页检查：标题/数字/说明未越出页面，单元格文字未越出容器，矩阵标题字重500，入场完成后所有内容可见；汇总区未进入当前validator的93vh线。截图是在导航锁与延迟配方执行完毕后获取，避免把动画中间态作为版式结论。此结果只验证当前样页，不据此解决全局安全区Q06。

三种视口均验证普通翻页、ESC总览与低功耗最终态。1920×1080另验证演讲者/观众翻页同步、尾页重新开始、计时开始/暂停/重置、宫格选页、按页面ID保存备注，以及观众窗口关闭后重新打开并恢复到当前页。没有页面脚本错误。激光/圈选、自动翻页、排练历史、黑白屏与冻结没有在本次脚本中逐项重测。

对比基线dcb5c79中的原模板：原示例封面、收尾与按原S22骨架构造的本地图片页进行1920×1080静态截图对比。封面242个像素最多相差1/255色阶；收尾和S22图片页像素一致。对比用于发现本次修改是否改变其他版式，不代表原模板占位内容是合格成品。S22本地SVG资源实际为2100×900，完整加载、contain保真；已人工查看图片页与演讲者截图。

## 自动化检查

20项Node测试通过，含8/12项样页生成与校验、拒绝少于8项和缺失汇总的S15页面。两套模板的演讲者CSS/JS字节同步检查通过；两个模板的演讲者静态检查通过，杂志空骨架仍有预期的无页面warning。

通用Swiss校验器在没有可解析Playwright时仍会明确报告“浏览器测量跳过”；本次真实浏览器结果由专用脚本提供，不能把跳过信息隐藏为通过。GitHub CI执行静态/Node检查；上述浏览器检查在本机执行。

## 复现

脚手架与浏览器检查输出目录须选择新目录，避免覆盖已有文件。Playwright是QA依赖，演示稿本身不要求安装：

```bash
npm install --prefix work/browser-qa --no-audit --no-fund playwright@1.64.1 lucide@1.61.0
node scripts/build-swiss-s15-example.mjs work/s15-review
python3 -m http.server 8765 --bind 127.0.0.1
```

另一个终端执行（Chrome路径按系统调整，或使用Playwright已安装的Chromium并省略--chrome）：

```bash
node scripts/check-swiss-s15-browser.mjs \
  --url http://127.0.0.1:8765/work/s15-review/index.html \
  --output work/s15-qa \
  --playwright-module work/browser-qa/node_modules/playwright/index.mjs \
  --chrome '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' \
  --lucide-umd work/browser-qa/node_modules/lucide/dist/umd/lucide.min.js \
  --system-fonts
```

## 待验收

用户审阅两张样页的层级、留白、卡片密度和明暗底表现；特别确认8项时保留第三行空位的视觉效果。尚未进行真实投影、Windows/Safari、在线Web字体与正式内容的验收。此页没有记录这些项目通过。
