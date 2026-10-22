# Magazine

这是继承的 Guizang Style A。`stable` 表示沿用上游现有风格，不表示 Red 已对所有浏览器或内容做过视觉认证。

1. 读取 `references/guizang-authoring.md`，执行 Style A 的需求、节奏、图片和视觉检查；跳过 Style B 专属规则。
2. 从 `references/themes.md` 选择配色；按 `references/layouts.md` 的 10 类骨架编排页面。
3. 细节见 `references/components.md`；正式演讲读取 `references/presenter-mode.md`。
4. 正文、图注须在目标投屏尺寸可读，不能为了容纳内容无限缩小字号。

路径均相对于 Skill 根目录。`new-deck.mjs` 负责复制模板与本地动效依赖，替代旧指南中的手动复制步骤。

当前只有共用的演讲者静态校验，没有杂志风专属的自动布局测量。必须逐页检查实际渲染效果；不能宣称已经通过 Swiss 的布局测量。
