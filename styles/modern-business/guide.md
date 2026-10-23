# 现代商务制作入口

experimental；先读[定义卡](spec.md)，确认方向与具体视觉细节的状态。用于方案汇报、复盘和产品介绍；不声称已支持复杂财务表格、长篇课程或可编辑PPTX。

1. 按[版式](layouts.md)分配内容，保留MB01–MB06骨架和容量。每页唯一稳定data-slide-id，并填写对应SPEAKER_NOTES；共享契约见../../references/presenter-mode.md。
2. 按[配色](themes.md)设置角色。当前只有经过样张实现的蓝灰候选，不把其他配色宣称为已验证。标题、正文和容器规则见spec.md，不读取Swiss版式锁。
3. 初始化：`node scripts/new-deck.mjs --style modern-business --title "汇报标题" <新目录>`。模板为空骨架；以scripts/build-modern-business-example.mjs为六类实际标记参考。观众页面使用mb-main与canvas-card结构，备注在演讲者视图。
4. 图片原文件放images/，说明出处和角色；evidence使用contain，禁止通过重画或裁切改写证据。照片cover须人工检查主体。本轮只有原截图contain示例，没有照片cover认证。
5. 完成稿：`node scripts/validate-deck.mjs --style modern-business <index.html>`。这是结构检查；浏览器按scripts/check-modern-business-browser.mjs另测。三种16:9视口为本轮范围，4:3、手机、跨平台字体另验。
6. 普通内容使用280ms淡入，B静态、ESC总览、P演讲者及观众同步沿用共享契约。无需Motion或Google Fonts；演讲者图标仍引用Lucide CDN。完全离线须另行验证和打包，不据本轮本地替代路由宣称离线通过。

示例构建：`node scripts/build-modern-business-example.mjs <新目录>`。测试条件与限制见../../docs/qa/modern-business.md。只有用户确认具体样张并经PR审查后再评估stable。
