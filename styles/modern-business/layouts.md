# 版式与容量 · draft-01

所有页面：`section.slide.light[data-layout][data-slide-id] > .canvas-card`，依次为.mb-chrome、main.mb-main、.mb-foot。每页一个h1；主区域不得越过页脚。示例中的中性内容是实测容量参照，不能保证任意同字数文字都合适。

| ID | 骨架 | 容量与拆页条件 |
|---|---|---|
| MB01 | main.mb-main.mb-cover；.mb-cover-copy + .mb-cover-panel | 两行主标题、1段导语、面板3条索引；长导语先改写，不加第4条 |
| MB02 | main.mb-main；h1 + .mb-statement-detail | 两行中文标题（样张每行8字）；左1段解释、右.mb-principles固定3条.mb-principle；不要缩小正文塞长段落 |
| MB03 | main.mb-main；h1 + .mb-modules | 2×2固定4个.mb-module；各含编号、小标题、1段正文；样张每段约40–55字。超过容量拆页 |
| MB04 | main.mb-main；h1 + .mb-evidence | 一个figure含原图和figcaption + 一个aside含2条说明；图片槽高35vh、宽约54vw，contain不裁图。小字截图不可只以装入为由声称可读，关键细节应另页原图局部放大并保留全图 |
| MB05 | main.mb-main；h1 + ol.mb-steps | 固定5个li.mb-step，每项编号、4字标题、简短说明（样张8–12字）；不承诺任意复杂流程 |
| MB06 | main.mb-main.mb-closing | 左.mb-closing-heading标题与1段收束，右.mb-takeaways固定3条.mb-takeaway（编号、小标题、1句行动） |

容器统一10px圆角；正文保持20px以上。禁止用整体缩放来绕过容量检查。新增表格、图表、代码等结构先登记新ID、实际样例和验证，不把Swiss Sxx当作本包布局。
