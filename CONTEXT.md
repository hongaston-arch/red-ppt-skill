# Red PPT：当前工作上下文

## 恢复入口

先核对`git status --short --branch`与`git remote -v`，再读本文件。仓库为`hongaston-arch/red-ppt-skill`；基础改造在`feat/style-registry-foundation`草稿[PR #1](https://github.com/hongaston-arch/red-ppt-skill/pull/1)，共享演讲者源在`codex/shared-presenter-runtime`草稿[PR #2](https://github.com/hongaston-arch/red-ppt-skill/pull/2)。当前`codex/swiss-safety-images`从PR #2的`2ac5efb`创建，另提交依赖它的草稿[PR #3](https://github.com/hongaston-arch/red-ppt-skill/pull/3)，实际状态以GitHub查询为准。各草稿均不自动合并；前序审查后再评估重新定基与改目标。

## 用户目标与已作决定

- 以 Guizang 为基础，持续扩展具有独立设计规则的风格；GitHub 开发维护由助手执行。
- 使用稳定 main 与功能分支；当前 PR 保持草稿，完成审查后再合并。
- 建立风格定义、样张确认与跨聊天恢复机制；先用 Swiss 填写定义卡。
- 早先的“可以”确认机制的落实；2026-10-22用户另以“同意，4 3 吧”确认Swiss Q01/Q02/Q03方向。确切范围与依据见spec.md的draft-02记录；不能扩展到其余问题或未生成样张。

## 当前范围

已有：两个继承风格注册、初始化/校验工具、Swiss S15及六类样张；Q01–Q05确定，Q06/Q07按方案继续验证。本分支新增runtime/presenter.css与presenter.js单一维护源、组装/检查命令与运行时集成检查；两个模板保留内嵌代码，与提取前字节一致。普通导航、各风格动效与通用布局测量没有在本轮提取。

本次：Swiss `draft-06`，Q06安全区接入和Q07原图处理检查已完成所列条件的工程验证。新增examples/swiss-image-review两页；照片原文件、截图原HTML/PNG与摘要均保留，新样页尚未获用户视觉确认。具体规则只维护在[spec.md](styles/swiss/spec.md)，确认流程见docs/style-confirmation.md。

尚未完成：全部Swiss版式、密集业务截图/人像、跨平台/投影验收、普通导航源提取、第三种风格、稳定发布与分支保护。图片检查依赖作者角色和人工主体框，不自动理解图片或所有遮挡。历史QA与规格快照保留生成时状态，后续决定查当前规格。CI以实际提交为准。

当前验证见docs/qa/swiss-safety-images.md：32项Node测试；10页×3视口安全区、图片几何与5个故障反例通过，最小导航间距46.70px。静态模式早期丢标签已在新样页修复并加入可见性断言；两模板和共享源未改。前轮演讲者交互见docs/qa/presenter-source.md，未重测项目不扩大为本轮通过。

## 新聊天如何继续

1. 读本文件和 `AGENTS.md`，按任务选择“新增风格 / 修改风格 / 制作单份 PPT”。
2. 涉及 Swiss 时，读其 `style.json`、`spec.md` 和 `guide.md`；按需再读所引用的详细布局与配色，不先载入其他风格。
3. 用三句话说明当前目标、规格版本与确认状态、下一步。仓库与文件一致时直接继续，不重复询问已经记录的决定。
4. 执行独立工作；只有需要作出待定视觉选择或出现相互矛盾的要求时，询问具体冲突点。
5. 结束前更新本文件的当前范围、未决事项和下一步；实际决定写回对应规格或项目记录，避免只存在聊天中。

## 下一步

审阅新增图片样页与各草稿PR；第三种风格按docs/proposals/next-style.md确认优先方向，建议现代商务，另有暗色发布与终端技术讲解候选。该文档仅提案，尚未注册新包或实现新模板。确认后独立分支制作完整定义卡与六类样张，不把Swiss限制复制过去；不重复询问已有决定，不自动合并或发布。

## 新聊天启动语

> 请先读取本仓库 AGENTS.md 和 CONTEXT.md，核对仓库、分支和实际文件，再继续当前任务。涉及 Swiss 时读取 styles/swiss/spec.md。区分来源规则、建议、已确认决定和实际验证；只询问仍影响工作的待定项。
