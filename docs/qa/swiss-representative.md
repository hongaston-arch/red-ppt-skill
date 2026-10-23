# Swiss 六类代表页：检查与审阅记录

## 范围与确认状态

沿既有节奏补齐封面、长中文标题、较密正文、图片、流程与收尾。用户已认可前一轮展示的S15测试，本轮六类样张仍待用户审阅。本次没有新增风格，也没有修改两套模板、演讲者运行时或全局校验指标。

[完整示例](../../examples/swiss-representative-review/index.html)使用模板默认IKB蓝作为测试配色；这不表示用户已为正式项目选择蓝色。所有文案为布局演示，图片为代码生成的本地几何示意图；三项数字是素材自身的比例、几何组数与图源数量，无业务结论。页面具有稳定ID和对应备注，不填造演讲时长。

## 页面与来源核对

| 页 | 登记版式 | 本次保留的骨架 | 审阅重点 |
|---|---|---|---|
| 1 | SWISS-COVER-ASCII | 强调色满屏、ASCII背景、中文大字与底部副标 | 大字层级、背景是否影响阅读 |
| 2 | S03 | split双半屏，左主张、右灰底解释 | 每行八字的换行、左右层级 |
| 3 | S19 | 80px强调色短线、四列等权说明 | 四段正文密度、400正文与500小标题 |
| 4 | S22 | 顶部图片、左上标题白块、底部说明与三项指标 | 全图保留、叠加标题、图片与文字的比例 |
| 5 | S11 | auto 1fr头部、五步横向时间线 | 标签与节点对齐、上下交替的阅读顺序 |
| 6 | S10 | split左侧主张、右侧三条列表 | 首尾呼应、列表与留白 |

来源中存在以下差异；没有原始PPT可供核对，不声称已经复原其全部页面：

- 历史P3片段是单屏statement，而版式锁S03要求split；本例按锁保留双半屏。P10点阵片段同样不能直接标为S10；本例S10沿用模板现有split closing骨架。
- 历史P11片段使用`.tl-h-node/.lbl`，模板CSS和动效实际依赖`.th-node/.label`；本例采用模板实际类名。
- S19来源登记了`.four-cards/.fc-col`骨架，模板没有对应静态CSS；本例仅在生成稿内提供局部实现，未顺便改模板。
- S22的21:9指素材比例。16:9页面顶部60%高的容器并非21:9；本例用contain保留2100×900素材，背景色与素材一致，避免以裁切掩盖比例差异。此处不等同于照片主体裁切或真实证据截图验证。

这些差异已在版式说明入口标出。样张的字号、间距与内容容量只用于本次审阅，不自动升级为全局规则。Q04–Q07仍待确认：本例保留来源时间线圆点和演讲者圆角UI；中文标题与正文按角色分别设置，未宣称满足全局8:1；93vh测量线不等于模板8vh底部留白；图片页仅展示本地示意图contain。

## 工程检查

Chrome 155.0.8059.85、Playwright 1.64.1、deviceScaleFactor=1、localhost HTTP，系统字体回退模式。实际结果见[浏览器原始报告](swiss-representative/report.json)。

| 视口 | 实测页数 | 所有页面中文字最下边界 | 主要正文最小字号 | 流程标签水平偏移 | 结果 |
|---|---:|---:|---:|---:|---|
| 1920×1080 | 6 | 980.52px | 20.16px | 0px | 通过 |
| 1600×900 | 6 | 816.70px | 18px | 0px | 通过 |
| 1280×720 | 6 | 652.91px | 18px | 0px | 通过 |

逐页检查文字range边界未超出当前93vh测量线，所选标题/段落/卡片块无相互覆盖；主要正文400–500，S19恰好四列，S11五个节点，S03/S10双半屏，S22本地2100×900资源完整加载且使用contain。三视口均验证前向翻页、Home回首页、ESC总览与低功耗最终态。1920下另测演讲者/观众同步、跳尾与重新开始、计时开始/暂停/重置、宫格跳页、按ID保存备注、关闭观众窗口后恢复当前页；无页面脚本错误。常规返回键未在此脚本逐项重测；演讲者上一页返回已测。

1920截图已人工查看：[封面](swiss-representative/01-SWISS-COVER-ASCII.png)、[长标题](swiss-representative/02-S03.png)、[正文](swiss-representative/03-S19.png)、[图片](swiss-representative/04-S22.png)、[流程](swiss-representative/05-S11.png)、[收尾](swiss-representative/06-S10.png)、[演讲者](swiss-representative/presenter.png)。其他视口执行了测量与交互检查，未额外保存逐页截图。

初次检查两次在流程页碰到入场可见性断言失败；单独导航复查显示正常。最终脚本等待2500ms，再要求当前页及祖先容器可见且动画结束，完整三视口检查通过。早期失败报告保留在本地work/representative-qa-v1与v2，不将其计作通过；未以隐藏动效或修改模板绕过检查。

20项Node测试、风格引用检查、两个模板的演讲者静态校验与CSS/JS字节同步通过。完成稿静态校验6页/6条备注通过；通用Swiss校验器因根目录不可解析Playwright明确跳过浏览器测量，本记录的真实浏览器结果来自专用QA脚本。

## 复现

生成器拒绝覆盖已有目录。Playwright与Lucide仅用于QA，演示运行不依赖安装这些Node包。与S15检查相同，使用本地Lucide UMD并主动阻止Google Fonts，测试系统字体回退；Motion从示例目录加载。这不属于在线字体CDN或完全离线验收。

```bash
node scripts/build-swiss-representative-example.mjs work/representative-review
python3 -m http.server 8765 --bind 127.0.0.1
```

另一个终端执行（QA依赖安装方式见[前一轮记录](swiss-s15.md)）：

```bash
node scripts/check-swiss-representative-browser.mjs \
  --url http://127.0.0.1:8765/work/representative-review/index.html \
  --output work/representative-qa \
  --playwright-module work/browser-qa/node_modules/playwright/index.mjs \
  --chrome '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' \
  --lucide-umd work/browser-qa/node_modules/lucide/dist/umd/lucide.min.js \
  --system-fonts
```

## 未覆盖范围

未验证真实投影视距、Windows/Safari、在线Web字体、正式内容、照片裁切、真实截图小字保真、四套配色的全部组合。未在本轮逐项重测激光/圈选、自动翻页、排练历史、黑白屏与冻结。未展示的S01–S22版式不能因这六页通过而声称全部验收。
