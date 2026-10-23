# 现代商务 draft-01：六页与运行时验证

## 范围与确认

2026-10-22，独立分支codex/modern-business-style，父提交108837b（Swiss草稿PR #3）；新增modern-business experimental包，未合并main。用户只选择现代商务优先和中等字号、小圆角、模块化方向。具体蓝灰、10px圆角、字号及六页效果仍待视觉审阅，工程检查不替代确认。

六页使用同一中性主题“定义风格与记录交接”：MB01封面/索引、MB02两行八字长标题、MB03四项2×2正文、MB04原截图/说明、MB05五步流程、MB06三条收尾。没有经营数据或效率提升承诺。MB04复用历史本地测试UI的原PNG和源HTML，并明确其两种风格数量是历史状态；未重画或裁切，不是客户业务界面。

## 实际结果

- 34项Node测试通过，含新风格脚手架/最终稿以及未知布局、卡片/流程容量、图片角色和证据cover反例。所有清单资源、3个模板的共享源一致性和预组装检查通过。
- 三套模板分别通过演讲者静态校验；两个空骨架的“无页面”warning属预期。新六页为6页/6条备注，0错误、0警告，并通过现代商务结构检查。
- Chrome155.0.8059.85、Playwright1.64.1、本机系统字体回退；Lucide1.61.0由本地UMD路由提供，Google Fonts请求被阻止（本风格本身未引用Google Fonts）。localhost HTTP、deviceScaleFactor=1、headless。
- 1920×1080、1600×900、1280×720下，6页×3视口：文字处于本包候选5–95vw/5–89vh区域，正文不小于20px，无受测文本/图片相互重叠或导航/工具条遮挡；MB03为2列，卡片10px圆角，标题700。
- 原截图加载1800×1000，computed object-fit为contain，图片槽在页面范围内。保真只证明完整显示及原文件一致，不保证任意密集截图的小字可读。
- 4个浏览器故障注入均被识别：标题移出内容区、正文缩到10px、圆角改到40px、原截图改为cover。结构测试另覆盖容量和未知布局；不是所有CSS错误的证明。
- 三视口均执行前后翻页流程、Home、ESC总览开关、B静态六页可见；另测1280×720早期切入静态。1920×1080演讲者/观众同步、末页回到开头、计时启停清零、总览选页、备注按ID保存、关闭并重开观众窗口通过；pageErrors为空。
- 首轮发现入场目标尚未标记、实际未执行淡入，已改为主内容.mb-main淡入并给样页加data-anim标记。最终第二轮在修正后的HTML上全部通过；内容初始可见，静态不会留下隐藏项。
- 人工查看六页1920截图及演讲者截图，未发现受测内容裁切或重叠；此记录是助手检查，不是用户视觉认可。

完整测量与交互结果：[report.json](modern-business/report.json)。截图：[封面](modern-business/01-MB01.png)、[长标题](modern-business/02-MB02.png)、[正文](modern-business/03-MB03.png)、[原图](modern-business/04-MB04.png)、[流程](modern-business/05-MB05.png)、[收尾](modern-business/06-MB06.png)、[演讲者](modern-business/presenter.png)。

## 复现

```bash
node scripts/styles.mjs --check
node --test tests/*.test.mjs
node scripts/check-presenter-runtime-sync.mjs
node scripts/build-presenter-runtime.mjs --check
node scripts/validate-presenter-mode.mjs assets/template.html
node scripts/validate-presenter-mode.mjs assets/template-swiss.html
node scripts/validate-presenter-mode.mjs assets/template-modern-business.html
node scripts/validate-deck.mjs --style modern-business examples/modern-business-review/index.html
node scripts/build-modern-business-example.mjs work/new-modern-review
```

在仓库根用本地HTTP服务后执行（浏览器及QA依赖须自行安装，不是deck依赖）：

```bash
node scripts/check-modern-business-browser.mjs \
  --url http://127.0.0.1:8765/examples/modern-business-review/index.html \
  --output work/new-modern-qa \
  --playwright-module work/browser-qa/node_modules/playwright/index.mjs \
  --chrome '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' \
  --lucide-umd work/browser-qa/node_modules/lucide/dist/umd/lucide.min.js \
  --system-fonts
```

最终HTML SHA-256：`c6a55eb353939329e7af7c40f122f11b1967eada6a64c3dc737345e8b486df30`。
模板：`cecbdbf6a583897fa59a2fb9d6d1975bb3f52396b5ba1a506b199437f68ddcb6`。
原截图：`6f64c7517368ff509e72d8864960d1ddab137cdae28669c15a3e777b0a292368`，与Swiss历史原文件逐字节一致。旧样张、两个继承模板和共享runtime源均未改动。

## 限制

CI只运行Node/静态检查，本机浏览器结果不可写成CI视觉认证。没有跨操作系统/真实投影/手机/4:3验证；没有新风格照片cover、财务表格、代码或多系列图表；辅助语义色尚未有图表样张。没有断网测试，Lucide本地替代不能证明交付物完全离线。文字范围和元素盒检测不理解图片含义，也不证明所有祖先裁切、遮挡和CSS组合都正确。需要真实内容时继续人工审阅，不能用当前样张代替事实证据。
