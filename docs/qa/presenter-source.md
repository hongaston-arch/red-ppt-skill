# 共享演讲者源：检查记录

## 范围与字节证据

从两套既有模板提取相同的演讲者CSS/JS作为维护源，新增组装与检查命令。本轮没有改变块内逻辑、普通导航、风格CSS或动效；已提交模板继续内嵌代码，使用者无需构建。

对比基础分支`5f23ed2b8186c0a84a16a4dceec5487ef3f8e525`：`assets/template.html`为103183字节，`assets/template-swiss.html`为165895字节，两者前后各自完全一致，SHA-256见[字节记录](presenter-source/bytes.json)。`--write`报告2模板、0变化，源同步与`--check`通过。此证据说明提取不改变当前产物，不等同于未来源变更自动正确。

## 自动化与浏览器结果

26项Node测试通过，其中新增6项覆盖：预组装状态、源更新传播且保留风格字节、幂等、两模板相同偏移、边界缺失/重复/逆序及异常源、新增登记模板自动参与。两模板演讲者静态校验通过；杂志空骨架的“无页面”warning是既有基线。两份完成的测试稿各2页/2条备注通过完成稿校验。

Chrome 155.0.8059.85、Playwright 1.64.1、localhost HTTP、deviceScaleFactor=1；Google Fonts主动阻止以检查系统字体回退，Lucide使用本地1.61.0 UMD，Motion使用随稿本地资源。结果见[浏览器报告](presenter-source/report.json)。

| 风格 | 1600×900 | 1280×720 | 测试内容 |
|---|---|---|---|
| Magazine | 通过 | 通过 | 两页中性测试文案与对应备注 |
| Swiss | 通过 | 通过 | 既有S15的8/12项测试页 |

四个组合均测试End/上一页/Home、ESC总览、低功耗可见性、演讲者下一页/上一页与观众同步、备注标题对应及按ID保存、宫格选页、计时开始/暂停/重置、关闭观众窗口后恢复当前页、尾页重新开始；无页面脚本错误。等待导航和动效结束后检查，未通过屏蔽运行时逻辑或替换同步接口取巧。

1600下的[Magazine页面](presenter-source/magazine-deck.png)、[演讲者](presenter-source/magazine-presenter.png)、[Swiss页面](presenter-source/swiss-deck.png)、[演讲者](presenter-source/swiss-presenter.png)已人工查看。1280执行交互检查，未保存额外截图。此记录用于演讲者源提取的集成回归，不是全部布局或新风格的视觉认证，也不是Q06/Q07通用安全区与真实图片验收。

## 复现

QA依赖安装方式见[Swiss S15记录](swiss-s15.md)。以下两个输出目录须选择新目录，避免覆盖已有检查结果：

```bash
node scripts/build-presenter-review-fixtures.mjs work/presenter-review
python3 -m http.server 8765 --bind 127.0.0.1
```

另一个终端：

```bash
node scripts/check-presenter-browser.mjs \
  --magazine-url http://127.0.0.1:8765/work/presenter-review/magazine/index.html \
  --swiss-url http://127.0.0.1:8765/work/presenter-review/swiss/index.html \
  --output work/presenter-qa \
  --playwright-module work/browser-qa/node_modules/playwright/index.mjs \
  --chrome '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' \
  --lucide-umd work/browser-qa/node_modules/lucide/dist/umd/lucide.min.js
```

## 未覆盖

没有新增第三种风格、提取普通导航/动效或实现通用测量。本轮未逐项重测激光、圈选、自动翻页、排练历史、黑白屏、冻结；未验证Safari/Windows、真实投影、在线字体/图标CDN或完全断网。现有示例和演示稿属于历史快照，不由组装命令静默升级。
