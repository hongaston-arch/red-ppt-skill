# Red PPT Skill

基于 [Guizang PPT Skill](https://github.com/op7418/guizang-ppt-skill) 的多风格 HTML 演示 Skill。目标是共享演讲功能，为每种风格保留独立的设计规则、版式和校验。

[English](README.en.md) · [使用入口](SKILL.md) · [风格包契约](docs/style-packs.md) · [维护流程](docs/maintenance.md)

新聊天先读 [CONTEXT.md](CONTEXT.md)。风格确定按 [确认流程](docs/style-confirmation.md) 执行；[Swiss定义卡 draft-01](styles/swiss/spec.md) 已记录来源规则、冲突与待确认项，尚未获得方向或样张批准。有规格的风格会在生成目录保存规格快照，便于后续聊天核对创作依据。

## 当前状态

首批基础改造：登记原有两种风格，提供初始化与校验命令。模板和演讲者运行时沿用上游，尚未提取共享源，也尚未新增第三种风格。工作分支需经 PR 验证后合并到 main。

| 风格 ID | 名称 | 适用内容 | 指南 |
|---|---|---|---|
| magazine | 电子杂志 × 电子墨水 | 观点、故事、行业分享 | [Magazine](styles/magazine/guide.md) |
| swiss | 瑞士国际主义 | 产品、事实、方法论 | [Swiss](styles/swiss/guide.md) |

两者沿用上游已有风格。换配色不等于新增风格，复杂表格和长篇培训课件仍不属于当前强项。

## 安装与使用

此分支合并后，安装稳定主分支：

```bash
npx skills add https://github.com/hongaston-arch/red-ppt-skill --skill red-ppt-skill
```

安装命令需在目标 Agent 环境中验证；本仓库自动化检查不验证第三方安装器。安装后可请求：

> 使用 red-ppt-skill，把这份大纲做成 8 页瑞士风演讲 PPT，保留原始截图，并补齐演讲备注。

脚本需要 Node.js 20 或更新版本。在仓库根目录：

```bash
node scripts/styles.mjs
node scripts/new-deck.mjs --style swiss --title "产品介绍" ./work/my-talk
```

该命令只创建创作骨架。按风格指南填充页面、备注、图片和配色，删除示例与占位内容后：

```bash
node scripts/validate-deck.mjs --style swiss ./work/my-talk/index.html
```

交付整个生成目录。模板会使用外部字体、图标或动效 CDN；不能未经断网检查就承诺完全离线。静态校验通过后仍须打开浏览器检查视觉和演讲者交互。

## 持续扩展

新增风格从 experimental 开始，具备真实模板、布局、配色、示例和验证记录后再升级。公共演讲者契约不随风格另建一套。具体见 [风格包契约](docs/style-packs.md)。

开发在 feat/fix 分支进行，main 保持稳定；通过草稿 PR 检查与审查后再合并。当前维护约定不等于已配置 GitHub 分支保护。

## 来源与许可

原始框架由歸藏维护，Red 是 hongaston-arch 的独立 fork。初始上游版本记录在 [基线文件](docs/upstream-baseline.json)，保留 [AGPL-3.0 许可证](LICENSE)。上游赞助关系见 [SPONSORS.md](SPONSORS.md)，不代表赞助方支持本 fork。

当前尚未移植 html-ppt 代码；后续引入时会记录具体文件及相应许可声明。
