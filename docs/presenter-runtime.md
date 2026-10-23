# 共享演讲者源与预组装模板

## 当前范围

`runtime/presenter.css` 与 `runtime/presenter.js` 是演讲者界面、备注、计时、观众屏同步及恢复的维护源。从基础分支 `656f088a37f2d49a12444a178cfb41af98b8887d` 两模板已有且相同的标记块直接提取，保留来源代码与根目录AGPL许可证；来源关系仍见上游基线记录。

本轮只建立这两个块的单一维护入口。普通翻页、总览、低功耗实现、各风格背景、动效与布局仍在各自模板中；不是完整演示框架重构，也不改变风格规范。提取后两套HTML模板的字节应与上述提交完全相同。

## 维护与生成

修改共享源后执行：

```bash
node scripts/build-presenter-runtime.mjs --write
node scripts/build-presenter-runtime.mjs --check
node scripts/check-presenter-runtime-sync.mjs
```

默认行为与`--check`相同，只检查，不写入。`--write`只替换登记模板中已有的CSS/JS边界块，保留块外字节；处理前验证全部源和目标的唯一、顺序正确的标记。源文件包含完整标记块与一个结尾换行，不含其他外部代码。

目标从`styles/*/style.json`自动发现并按模板路径去重。今后新增风格也必须包含这两个标记块；不再只核对固定的两份文件。检查将每个模板与共享源比较，能发现“两模板发生同样偏移”的情况。

`assets/template*.html`继续保留组装好的内嵌代码并提交。`new-deck.mjs`照常复制模板，安装者与演示稿使用者无需运行构建，也不新增浏览器端模块路径或网络请求。已有示例与历史演示稿是快照，不在组装目标中；运行时行为发生变化时，按受影响范围重新生成并验证相关示例。

## 模板接入契约

JS块目前嵌入模板原有的经典script作用域，不是可独立执行的ES模块。模板须先提供`slides`、`idx`、`total`、`go(index, options)`、`overviewOn`、`toggleOverview()`，以及`window.__SPEAKER_NOTES__`和低功耗接口`window.__lowPowerMode/__setLowPowerMode`。导航调用`__pptPresenter.onSlideChange`，键盘先交给`handleKey`，初始定位后调用`initMode`。这些仍是继承契约，本轮未改为新的公共API。

风格负责观众页面的视觉规则。共享演讲者UI采用既有独立样式，不将Swiss直角、字号或布局锁施加到Magazine等其他风格。后续若改用显式依赖注入或提取普通导航，应另行说明API变化并验证两风格，不能只删除模板代码而保留未满足的隐式依赖。

## 验证

Node测试覆盖源更新传播、保留块外字节、幂等组装、相同偏移、异常边界和新增风格发现。基础检查仍按[维护流程](maintenance.md)执行；浏览器结果见[本轮QA](qa/presenter-source.md)。静态或字节一致性不能代替真实交互记录。
