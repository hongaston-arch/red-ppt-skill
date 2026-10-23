# 开发、验证与合并

## 仓库关系

- `origin`：https://github.com/hongaston-arch/red-ppt-skill.git
- `upstream`：https://github.com/op7418/guizang-ppt-skill.git
- 初始基线见 `upstream-baseline.json`，不得把 Red 的功能提交误记为上游提交。

使用一个 Red 仓库即可隔离稳定与实验工作。无需为测试复制第三个仓库；如果未来确需独立权限或独立产品生命周期，再评估拆分。

## 分支与 PR

- `main`：供稳定安装与推荐。
- `feat/<topic>`、`fix/<topic>`：每项改造独立分支；同步上游用 `sync/guizang-<short-sha>`。
- 首批基础改造提交草稿 PR。列明最终范围、检查结果和未验证项；审查完成后再合并 main。
- 不需要长期 dev 分支；同时进行多个功能时各自开分支，避免把无关变更捆绑验收。
- 本文件是维护约定，不代表 GitHub 分支保护已配置。当前连接报告仓库权限，不等于每项管理 API 都可调用。

## 基础检查

在仓库根目录执行：

```bash
node scripts/styles.mjs --check
node --test tests/*.test.mjs
node scripts/check-presenter-runtime-sync.mjs
node scripts/build-presenter-runtime.mjs --check
node scripts/validate-presenter-mode.mjs assets/template.html
node scripts/validate-presenter-mode.mjs assets/template-swiss.html
```

杂志模板是空骨架，演讲者校验的无页面 warning 是已知基线，不能当作完成稿。Swiss 模板的封面/收尾也是示例，完成稿仍需通过 `validate-deck.mjs --style swiss <file>`。

修改模板、布局或运行时还需实际浏览器检查：文字与图片边界、前后翻页、总览、静态模式、演讲者/观众同步、关闭并恢复观众窗口。静态测试不能代替这些检查。

演讲者CSS/JS只在`runtime/`维护，再用`node scripts/build-presenter-runtime.mjs --write`更新登记模板。维护源、预组装产物与宿主接口见[presenter-runtime.md](presenter-runtime.md)。组装不更新历史示例快照，行为变更时须明确需要重建和验证哪些示例。

## 同步上游

在干净工作区先 fetch，比较记录基线与目标上游提交。在独立同步分支合并；处理 Red 入口、README、风格清单与上游变更的冲突。保留来源和许可证。运行上述检查，并按受影响风格补充视觉及交互检查，再提交 PR。

只有同步完成且检查通过后，才更新 `upstream-baseline.json` 中的上游 SHA。不要在生成 PPT 前自动 pull 上游覆盖 Red。

## 当前里程碑

1. 本 PR：Red 入口、两个既有风格的清单适配、初始化/校验 CLI、自动化检查与维护约定。
2. 独立PR：先提取共享演讲者源，验证两套模板字节与行为不变；普通导航和通用布局测量另行评估，不混作已完成。
3. 后续 PR：选择第三种风格，以 experimental 包完成完整示例并验证扩展接口。
4. 验收后：风格预览目录与版本发布。

本阶段不声称已经完成多风格框架重构、第三套风格、完整离线包或 GitHub Pages 发布。
