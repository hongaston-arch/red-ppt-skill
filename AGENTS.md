# Red PPT maintenance

- 本仓库是 hongaston-arch/red-ppt-skill；上游为 op7418/guizang-ppt-skill。新聊天先核对仓库和分支，再读 CONTEXT.md，按当前任务读取相关风格 spec.md。维护时再读 docs/maintenance.md 与 docs/upstream-baseline.json。
- 风格确定按 docs/style-confirmation.md 执行；来源规则、建议、用户已确认和实际测试结果分别记录。更新 CONTEXT.md 以便下个聊天恢复，具体规则只维护在风格规格中。
- main 用于稳定安装；修改放在有明确用途的分支。本轮首批改造先提交草稿 PR，等待审查后再合并。不要把维护约定当成发布、删除仓库或改写历史的授权。
- 新风格遵守 docs/style-packs.md。视觉约束属于风格包，共同行为属于运行时契约。不要把 Swiss 限制推广到所有风格。
- 保留 LICENSE、来源和已有用户改动。模板变化需说明原因，并验证实际页面和演讲者交互；文档、注册及脚手架变更不得顺便重写模板。
- 基础检查：node scripts/styles.mjs --check；node --test tests/*.test.mjs；node scripts/check-presenter-runtime-sync.mjs；对两个模板分别运行 validate-presenter-mode.mjs。
- 浏览器检查未运行时直说，不将静态检查标为视觉通过。新增风格不得凭文档声明 stable；需要实际示例和验证记录。
- 默认不使用子代理；需要并行代理时由用户明确指定。
