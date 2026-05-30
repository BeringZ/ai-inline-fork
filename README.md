<p align="center">
  <a href="#english">English</a> | <a href="#chinese">中文</a>
</p>

---

<a id="english"></a>

# AI Inline Fork

> Browser extension: select any text in an AI response, fork it into an independent branch, stream the answer back inline — without polluting the main thread.

## Demo

1. Select text in an AI response → floating **"追问这段"** button appears
2. Type your follow-up question → click send
3. Inline fork panel opens below the message → answer streams in real time

## Supported Sites

| Site | Status |
|------|--------|
| [DeepSeek](https://chat.deepseek.com) | Phase 1 |

## How It Works

```
Main Chat Page                    Background                  Branch Tab
──────────────                    ──────────                  ──────────
Select text → Fork UI
      │                              │
      ├── fork:create ──────────────►│
      │                              ├── open branch tab ────►│
      │                              │                        ├── inject prompt
      │                              │◄── branch:ready ───────┤
      │                              ├── branch:init ────────►│
      │                              │                        ├── submit & stream
      │◄── stream_snapshot ─────────┤◄── stream_snapshot ────┤
      │                              │                        │
   [inline answer]                   │                        │
```

- **Main Page**: Content script `content-main` — selection listener, fork UI, stream display
- **Background**: Orchestrator service worker — message routing, fork lifecycle, tab management
- **Branch Tab**: Content script `content-branch` — page automation, prompt injection, stream observation

## Tech Stack

- [WXT](https://wxt.dev) 0.20 — browser extension framework
- TypeScript 5.9
- Chrome Manifest V3 (Firefox MV3 compatible)
- Shadow DOM isolation for UI components
- Adapter pattern for multi-site support

## Project Structure

```
entrypoints/
├── background.ts          # Service worker entry
├── content-main.ts        # Main chat page content script
└── content-branch.ts      # Branch tab content script

src/
├── adapters/
│   ├── main/              # Main page adapters (site-specific)
│   │   ├── base-main-adapter.ts
│   │   └── phase1-main-adapter.ts   # DeepSeek
│   └── branch/            # Branch page adapters (site-specific)
│       ├── base-branch-adapter.ts
│       └── phase1-branch-adapter.ts  # DeepSeek
├── background/
│   ├── orchestrator.ts    # Core fork lifecycle manager
│   ├── route-table.ts     # Tab ID ↔ Fork ID mapping
│   └── task-queue.ts      # Task scheduling
├── content-main/
│   ├── main-page-controller.ts
│   └── selection-listener.ts
├── content-branch/
│   └── branch-page-controller.ts
├── core/
│   ├── fork-thread.ts     # Data types
│   ├── message-types.ts   # Message protocol
│   ├── state-machine.ts   # Status transition table
│   ├── prompt-builder.ts  # Branch prompt template
│   └── errors.ts
├── ui/
│   ├── floating-button/   # Floating fork trigger button
│   └── inline-fork/       # Inline answer panel
├── storage/
│   └── fork-thread-store.ts
├── browser/ext.ts         # Cross-browser API wrapper
└── utils/
    ├── logger.ts
    ├── hash.ts
    └── debounce.ts
```

## Development

```bash
# Install dependencies
npm install

# Dev mode (hot reload)
npx wxt

# Build for Chrome
npx wxt build

# Build for Firefox
npx wxt build -b firefox

# Load in browser
# 1. Open chrome://extensions or about:debugging#/runtime/this-firefox
# 2. Enable "Developer mode"
# 3. "Load unpacked" → select .output/chrome-mv3 or .output/firefox-mv3
```

## Adding a New Site

1. Implement `MainPageAdapter` — define selectors for AI messages, textarea, message IDs
2. Implement `BranchPageAdapter` — define how to inject prompt, submit, and observe streaming
3. Add URL pattern to `wxt.config.ts` `content_scripts` and `host_permissions`

## Known Limitations

- DeepSeek CSS class names are hashed (CSS Modules); may change with DeepSeek updates
- Streaming completion detection relies on text stability frames (no reliable DOM signal)
- Branch tab URL parameter (`?fork_id=`) may be lost during SPA redirects
- Firefox build not yet tested

## License

MIT

---

<a id="chinese"></a>

# AI Inline Fork

> 浏览器插件：在 AI 对话中选中任意片段，即刻创建分支追问，回答自动流式同步回当前页面。不污染主会话。

## 演示

1. 在 AI 回答中选中文字 → 浮动按钮 **"追问这段"** 出现
2. 输入追问内容 → 点击发送
3. 内联分支面板在消息下方展开 → 回答实时流式同步

## 已支持站点

| 站点 | 状态 |
|------|------|
| [DeepSeek](https://chat.deepseek.com) | 第一阶段 |

## 工作原理

```
主聊天页                          后台 Service                   分支标签页
──────────────                    ──────────                  ──────────
选中文字 → 分支 UI
      │                              │
      ├── fork:create ──────────────►│
      │                              ├── 打开分支标签页 ────────►│
      │                              │                          ├── 注入 Prompt
      │                              │◄── branch:ready ─────────┤
      │                              ├── branch:init ──────────►│
      │                              │                          ├── 提交 & 流式生成
      │◄── stream_snapshot ─────────┤◄── stream_snapshot ──────┤
      │                              │                          │
   [内联回答]                         │                          │
```

- **主页面**：Content script `content-main` — 文字选中监听、分支 UI、流式展示
- **后台**：Orchestrator service worker — 消息路由、分支生命周期、标签页管理
- **分支标签页**：Content script `content-branch` — 页面自动化、Prompt 注入、流式监控

## 技术栈

- [WXT](https://wxt.dev) 0.20 — 浏览器插件开发框架
- TypeScript 5.9
- Chrome Manifest V3（兼容 Firefox MV3）
- Shadow DOM 隔离 UI 组件样式
- 适配器模式支持多站点扩展

## 项目结构

```
entrypoints/
├── background.ts          # Service worker 入口
├── content-main.ts        # 主聊天页 content script
└── content-branch.ts      # 分支标签页 content script

src/
├── adapters/
│   ├── main/              # 主页面适配器（站点特定）
│   │   ├── base-main-adapter.ts
│   │   └── phase1-main-adapter.ts   # DeepSeek
│   └── branch/            # 分支页面适配器（站点特定）
│       ├── base-branch-adapter.ts
│       └── phase1-branch-adapter.ts  # DeepSeek
├── background/
│   ├── orchestrator.ts    # 核心分支生命周期管理
│   ├── route-table.ts     # 标签页 ID ↔ 分支 ID 映射
│   └── task-queue.ts      # 任务调度
├── content-main/
│   ├── main-page-controller.ts
│   └── selection-listener.ts
├── content-branch/
│   └── branch-page-controller.ts
├── core/
│   ├── fork-thread.ts     # 数据类型定义
│   ├── message-types.ts   # 消息协议
│   ├── state-machine.ts   # 状态转移表
│   ├── prompt-builder.ts  # 分支 Prompt 模板
│   └── errors.ts
├── ui/
│   ├── floating-button/   # "追问这段" 浮动按钮
│   └── inline-fork/       # 内联回答面板
├── storage/
│   └── fork-thread-store.ts
├── browser/ext.ts         # 跨浏览器 API 封装
└── utils/
    ├── logger.ts
    ├── hash.ts
    └── debounce.ts
```

## 开发

```bash
# 安装依赖
npm install

# 开发模式（热更新）
npx wxt

# 构建 Chrome 版本
npx wxt build

# 构建 Firefox 版本
npx wxt build -b firefox

# 加载到浏览器
# 1. 打开 chrome://extensions 或 about:debugging#/runtime/this-firefox
# 2. 开启"开发者模式"
# 3. "加载已解压的扩展程序" → 选择 .output/chrome-mv3 或 .output/firefox-mv3
```

## 添加新站点

1. 实现 `MainPageAdapter` — 定义 AI 消息、输入框、消息 ID 的 DOM 选择器
2. 实现 `BranchPageAdapter` — 定义 Prompt 注入、提交、流式监控方式
3. 在 `wxt.config.ts` 的 `content_scripts` 和 `host_permissions` 中添加 URL 匹配

## 已知限制

- DeepSeek CSS 类名为哈希值（CSS Modules），可能随 DeepSeek 版本更新而变化
- 流式生成完成检测依赖文本稳定帧数（无可靠 DOM 信号）
- 分支标签页 URL 参数（`?fork_id=`）可能在 SPA 重定向时丢失
- Firefox 版本尚未测试

## 许可证

MIT
