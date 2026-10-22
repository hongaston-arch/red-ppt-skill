# Swiss

这是继承的 Guizang Style B。`stable` 表示沿用上游现有风格，不表示 Red 已对所有浏览器或内容做过视觉认证。

1. 读取 `references/guizang-authoring.md`，执行 Style B 工作流，跳过 Style A 专属规则。
2. 先读 `references/swiss-layout-lock.md`，再读 `references/layouts-swiss.md`；保留 S01–S22 与登记封面、收尾的约束。
3. 从 `references/themes-swiss.md` 的四套配色选择。无圆角、无渐变、单一强调色等规则仅属于本风格。
4. 读取 `references/presenter-mode.md`，保持稳定页面 ID 与对应备注。原始模板包含示例封面和收尾；正式创作时补齐 `data-layout` 并替换示例内容。
5. 按需读取截图、地图与配图指南；截图保真优先，不因裁切或重画丢失证据。

路径均相对于 Skill 根目录。`new-deck.mjs` 替代旧指南中的手动复制步骤。完成后运行 `validate-deck.mjs --style swiss`，再做浏览器视觉与演讲者交互检查。

Swiss 校验器只有找到 Playwright 时才做浏览器测量；必须检查其输出，不能把静态通过当成浏览器测量完成。
