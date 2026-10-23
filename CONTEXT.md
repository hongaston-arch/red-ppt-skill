# Red PPT：当前工作上下文

## 恢复入口

先核对`git status --short --branch`与`git remote -v`，再读本文件。仓库为`hongaston-arch/red-ppt-skill`；基础改造为草稿[PR #1](https://github.com/hongaston-arch/red-ppt-skill/pull/1)，共享演讲者源为草稿[PR #2](https://github.com/hongaston-arch/red-ppt-skill/pull/2)，Swiss安全区/原图为草稿[PR #3](https://github.com/hongaston-arch/red-ppt-skill/pull/3)。当前`codex/modern-business-style`从PR #3的`108837b`创建，目标为`codex/swiss-safety-images`，现代商务为依赖它的草稿[PR #4](https://github.com/hongaston-arch/red-ppt-skill/pull/4)，实际状态以GitHub查询为准。各草稿均不自动合并；前序审查后再评估重新定基与改目标。main仍为稳定安装基线。

## 用户目标与已作决定

- 以 Guizang 为基础，持续扩展具有独立设计规则的风格；GitHub 开发维护由助手执行。
- 使用稳定 main 与功能分支；当前 PR 保持草稿，完成审查后再合并。
- 建立风格定义、样张确认与跨聊天恢复机制；先用 Swiss 填写定义卡。
- 2026-10-22用户选择第三套优先“现代商务：中等字号、小圆角、模块化汇报”；已实施experimental包，具体颜色、字号数值、圆角尺寸和六页效果未获确认。详情只维护在styles/modern-business/spec.md及其引用。
- 早先的“可以”确认机制的落实；2026-10-22用户另以“同意，4 3 吧”确认Swiss Q01/Q02/Q03方向。确切范围与依据见spec.md的draft-02记录；不能扩展到其余问题或未生成样张。

## 当前范围

已有：两个继承风格注册、初始化/校验工具、Swiss S15及六类样张；Q01–Q05确定，Q06/Q07按方案继续验证。runtime/presenter.css与presenter.js为单一维护源，所有登记模板保留预组装代码。普通导航、各风格动效与通用布局测量没有提取为独立共享源。

本次：modern-business / draft-01 / experimental；独立定义卡、指南、配色、六种布局、模板、生成器、结构校验及浏览器检查。examples/modern-business-review为六页中性主题，MB03为2×2正文，MB04保留历史本地UI截图并明确不是当前风格数量。视觉规则不继承Swiss限制；原有两模板和runtime源未改。规格只维护在[现代商务定义卡](styles/modern-business/spec.md)及其引用；确认流程见docs/style-confirmation.md。

尚未完成：现代商务六页的用户视觉审阅、复杂表格/图表/代码与照片cover扩展；全部Swiss版式、密集业务截图/人像、跨平台/投影验收、普通导航源提取、稳定发布与分支保护。历史QA与规格快照保留生成时状态，后续决定查当前规格。CI以实际提交为准。

当前验证条件与结果见docs/qa/modern-business.md；静态检查34项，浏览器报告按实际记录。Swiss上轮记录在docs/qa/swiss-safety-images.md，不扩大为本轮全部Swiss重测通过。原图、规格快照与确认状态均需分开理解。

功能提交6860ec2的Style foundation与Presenter runtime sync两项CI已实际查询为success。交付目录为`/Users/rxck01/Desktop/codex/2026-10-21/new-chat/outputs/modern-business-review`，同级有zip；包含6页HTML、原截图、规格快照、完整定义卡、7张预览图与报告。交付HTML/素材与仓库样张逐字节一致，zip CRC已检查；详情见交付目录delivery.json。工程完成不代表用户已认可样张。

## 新聊天如何继续

1. 读本文件和 `AGENTS.md`，按任务选择“新增风格 / 修改风格 / 制作单份 PPT”。
2. 现代商务任务读styles/modern-business/style.json、spec.md、guide.md；Swiss任务读其对应文件；按需再读详细布局与配色，不先载入其他风格。
3. 用三句话说明当前目标、规格版本与确认状态、下一步。仓库与文件一致时直接继续，不重复询问已经记录的决定。
4. 执行独立工作；只有需要作出待定视觉选择或出现相互矛盾的要求时，询问具体冲突点。
5. 结束前更新本文件的当前范围、未决事项和下一步；实际决定写回对应规格或项目记录，避免只存在聊天中。

## 下一步

交付并审阅现代商务draft-01六页，优先看中等字号是否合适、10px圆角/蓝灰角色及2×2正文是否符合预期。记录用户答复的准确范围后再修订，不重复询问优先方向，不推导未展示结构已通过。Swiss新增图片页仍待审阅，各草稿PR仍待审查。暗色发布和终端技术讲解保留后续候选，不自动合并或发布。

## 新聊天启动语

> 请先读取本仓库 AGENTS.md 和 CONTEXT.md，核对仓库、分支和实际文件，再继续当前任务。当前优先现代商务时读取 styles/modern-business/spec.md；涉及Swiss才读其规格。区分来源规则、建议、已确认决定和实际验证；只询问仍影响工作的待定项。
