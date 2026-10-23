# Swiss Q06/Q07：安全区与图片处理验证

## 本轮范围

将用户选择的“93vh与实际导航至少16px”接入Swiss校验器，增加原始截图与照片两页测试。两套模板及共享演讲者源均未修改。规则与用户答复见Swiss draft-06；本轮工程结果不等于两张新样页获用户视觉批准。

## 结果与条件

Chrome 155.0.8059.85、Playwright 1.64.1、localhost HTTP、deviceScaleFactor=1。Google Fonts主动阻止以检查系统字体回退；Lucide使用本地1.61.0 UMD，Motion使用随稿资源。测量前进入低功耗最终态，逐页定位后等待800ms，防止水平切换过渡污染导航坐标。

共10页：前轮六类代表页、S15两页、新增图片两页。[汇总](swiss-safety-images/summary.json)及同目录各视口原始报告保留实际结果。

| 视口 | 页数 | 最小实测导航间距 | 93vh及16px |
|---|---:|---:|---|
| 1920×1080 | 10 | 71.89px | 通过 |
| 1600×900 | 10 | 59.30px | 通过 |
| 1280×720 | 10 | 46.70px | 通过 |

文字使用range边界；图片、SVG和登记内容图形参与测量，排除全高背景、半屏底色与ASCII装饰。93vh与16px分别判断，导航缺失或隐藏也不能通过。8vh仍只是模板padding token。旧标题间距启发式仍可能给出warning，未将它当作用户新定的全局字号比例或间距硬规则，也未顺便重排已确认样张。

五个故意损坏的版本均被实际浏览器校验拒绝：导航上移导致间距不足、内容越93vh、证据截图改cover后裁切、照片top对齐丢失声明主体、图片文件缺失。汇总报告记录实际错误信息。这些反例在本地work目录保留，没有混入可交付演示稿。

32项Node测试通过，其中新增6项检查图片几何、主体与严格浏览器模式；风格清单、共享源/模板同步、预组装状态与两模板演讲者静态检查通过。杂志空骨架的无页面warning仍是基线。普通完成稿校验默认找不到Playwright时会明确跳过测量；本轮真实测量通过显式模块路径与`--require-browser`执行，未把静态通过当作浏览器通过。

## 两张图片页

[完整HTML](../../examples/swiss-image-review/index.html)、[截图页](swiss-safety-images/evidence-contain.png)、[照片页](swiss-safety-images/photo-cover.png)。1920截图已人工查看；另外两视口执行测量，没有保存额外截图。

- 截图是本机浏览器实际渲染的测试UI，记录来自两份style.json的真实风格ID与运行时。不是现有业务系统，不使用生成式模型重画文字。原HTML、1800×1000原PNG及摘要随稿保存；contain完整显示，左上标题处于截图实际绘制区域之外，已检查横向不重叠。
- 照片为NASA/Bill Anders的[Earthrise](https://science.nasa.gov/resource/apollo-8s-iconic-earthrise/)，直接保留3000×3000原JPEG及SHA-256，按[NASA媒体使用指南](https://www.nasa.gov/nasa-brand-center/images-and-media/)注明来源，仅作信息性测试，无支持或背书含义。cover采用center 65%；人工查看原图后声明带留边的地球主体框，几何检查保留完整主体，月面只显示局部。该主体框不是自动识别结果。
- 21:9是新生成插图的槽位约束；本轮原始截图与照片保留原比例。数字02/01与像素尺寸来自实际素材及清单，不是模拟业绩。来源和处理见`sources.json`及`PROJECT.md`。

开发时人工发现第一版快速进入静态模式会隐藏部分统计标签。新样页已按S22配方补齐顶线、类别、数字结构与静态标记，并加入标签/数字可见性断言；模板动效未改。第一版报告只属于开发测量，不作为最终视觉通过记录。最终证据来自work/swiss-safety-final-v2，并核对生成稿HTML及原图摘要一致。

## 复现

QA依赖与系统Chrome用法同[前轮记录](swiss-s15.md)。先使用来源链接下载原JPEG，生成器核对既定SHA-256，拒绝把NASA署名附到别的图片上。生成与检查目录均须为新目录：

```bash
node scripts/build-swiss-image-review.mjs work/image-review \
  --photo /absolute/path/as08-14-2383-1.jpg \
  --playwright-module work/browser-qa/node_modules/playwright/index.mjs \
  --chrome '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
python3 -m http.server 8765 --bind 127.0.0.1
```

另一个终端：

```bash
node scripts/check-swiss-safety-browser.mjs \
  --images work/image-review/index.html --output work/safety-qa \
  --base-url http://127.0.0.1:8765/ \
  --playwright-module work/browser-qa/node_modules/playwright/index.mjs \
  --chrome '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' \
  --lucide-umd work/browser-qa/node_modules/lucide/dist/umd/lucide.min.js
```

单份检查可直接运行`validate-swiss-deck.mjs <file> --require-browser`并补充上述模块/Chrome选项；`--url`的HTTP正文必须与本地文件逐字相同，避免测量另一份页面。`--report`拒绝覆盖已有报告。

## 限制

未验证全部S01–S22、真实投影、Safari/Windows、在线字体/图标、密集业务截图、人像主体及所有祖先裁切/遮挡。图像角色由作者声明，自动检查针对object-fit/object-position几何和人工主体框，不能自动理解图片或保证所有可见文字可读；仍需人工对照原素材。没有重新测试全部演讲者工具；模板与共享源未改变，其前轮检查记录仍按原范围使用。
