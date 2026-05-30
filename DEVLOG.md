# AI Inline Fork 开发日志

> 基于网页端副会话的 AI Inline Fork 浏览器插件
> 目标：用户在 AI 回答中选中一段文字 → 创建独立分支追问 → 副会话自动回答并流式镜像回主页面

---

## 构建工具

- **框架**: WXT (Vite + TypeScript)
- **构建**: `npx wxt build` → `.output/chrome-mv3/`, `npx wxt build -b firefox` → `.output/firefox-mv3/`
- **开发**: `npx wxt` (HMR)
- **浏览器支持**: Chrome MV3 + Firefox MV3 (Edge 复用 Chromium 构建)

---

## 架构分层 (五层)

```
主会话 Content Script → Inline Fork UI
                    → Background Orchestrator → 副会话 Content Script
                                              → Storage Layer
```

### 各层职责

| 层 | 目录 | 职责 |
|---|---|---|
| 主会话脚本 | `content-main/` | 选区监听、浮动按钮、Inline Fork 挂载、渲染 |
| 副会话脚本 | `content-branch/` | 页面就绪、注入 Prompt、自动发送、流式监听 |
| 后台调度器 | `background/` | 状态机、标签页管理、消息路由、任务队列、错误恢复 |
| 存储层 | `storage/` | ForkThread、ForkRoute 持久化 |
| UI 层 | `ui/` | Shadow DOM 隔离的 Inline Fork 组件 |

### 关键设计原则

1. **主页面永不发送分支问题** — 只做读取选区、挂载容器、接收镜像
2. **副会话是唯一真实生成源** — Inline Fork 只是镜像视图
3. **流式同步用完整快照** — 不是 DOM delta，持续读取完整 AI 回答文本
4. **适配器与核心解耦** — DOM 选择器全在 adapter，核心 orchestrator 不感知站点
5. **跨浏览器统一封装** — 通过 `src/browser/ext.ts`，业务代码不用 `chrome.xxx`

---

## 文件结构

```
entrypoints/
  background.ts         → background service worker
  content-main.ts       → 主会话页面 content script (匹配 /chat/*)
  content-branch.ts     → 副会话页面 content script (匹配 /*, 自检 fork_id)

src/
  core/
    fork-thread.ts        ForkThread / ForkRoute / ForkRunStatus 类型
    message-types.ts      插件内部消息协议
    state-machine.ts      状态转移表 + 合法性校验
    prompt-builder.ts     生成自包含分支 Prompt
    errors.ts             错误类型 + 错误码

  adapters/main/
    base-main-adapter.ts    MainPageAdapter 接口
    phase1-main-adapter.ts  DeepSeek 主页面适配器

  adapters/branch/
    base-branch-adapter.ts  BranchPageAdapter 接口
    phase1-branch-adapter.ts DeepSeek 副会话适配器

  background/
    orchestrator.ts         核心调度器：消息处理、标签页管理、路由
    route-table.ts          ForkThreadId → {mainTab, branchTab} 映射
    task-queue.ts           并发任务队列

  content-main/
    main-page-controller.ts 主页面控制器：创建 fork、恢复、消息处理
    selection-listener.ts   mouseup 选区监听

  content-branch/
    branch-page-controller.ts 副会话自动化控制器

  ui/
    inline-fork/             Shadow DOM Inline Fork 容器
    floating-button/         浮动按钮 "追问这段" + 输入弹窗

  storage/
    storage.ts              通用 storage 封装 (local)
    fork-thread-store.ts    ForkThread + ForkRoute CRUD

  browser/
    ext.ts                  chrome/browser API 统一封装

  utils/
    hash.ts                  ID 生成 + 文本哈希
    logger.ts               带前缀的日志
```

---

## 核心数据类型

### ForkRunStatus 状态机流转

```
fork_created → opening_branch_tab → branch_page_loading
  → branch_page_ready → prompt_injecting → prompt_injected
  → submitting → waiting_generation_start → streaming
  → completed → mirrored_final

错误状态：
  → open_failed / page_timeout / prompt_inject_failed
  → submit_failed / generation_timeout / stream_interrupted
  → recovering → (重试) → manual_recovery
```

### 消息协议 (ExtensionMessage)

| 消息 | 方向 | 说明 |
|---|---|---|
| `fork:create` | 主页面 → Background | 创建分支 |
| `fork:created` | Background → 主页面 | 确认创建 |
| `fork:status` | Background → 主页面 | 状态更新 |
| `fork:stream_snapshot` | 副会话 → Background → 主页面 | 流式快照 |
| `fork:error` | → 主页面 | 错误通知 |
| `fork:get_threads` / `fork:threads` | 主页面 ↔ Background | 刷新恢复 |
| `branch:ready` | 副会话 → Background | 页面就绪 |
| `branch:init` | Background → 副会话 | 发送 Prompt |

---

## DeepSeek 适配器详情

### DOM 结构 (2026-05-30 确认)

```
用户消息:
  div[data-virtual-list-item-key]
    div.d29f3d7d.ds-message
      div.fbb737a4       ← 用户消息文本
    div._11d6b3a          ← 操作按钮区域

AI 回答:
  div[data-virtual-list-item-key] (class: _4f9bf79)
    div.ds-message        ← 没有 d29f3d7d 类
      div._74c0879        ← Markdown 渲染内容容器
        div.ds-markdown-*
        pre.md-code-block
        ...

输入框:
  textarea[placeholder="给 DeepSeek 发送消息 "]
  class: _27c9245 ds-scroll-area ds-scroll-area--show-on-focus-within d96f2d2a
  有 name="search", rows="2"

消息列表:
  ds-scroll-area 包含 data-virtual-list-item-key 子元素

对话 URL: /chat/{sessionId} (hex)
新对话页: / (root)

选择器稳定性说明:
  ds-message — 稳定
  d29f3d7d / _74c0879 / fbb737a4 — CSS modules hashed，可能随版本变化
  当前适配器通过 "排除 d29f3d7d 类" 和 "检查 fbb737a4 子元素" 区分用户/AI
  DeepSeek CSS 类名变更时需要更新 phase1-main-adapter.ts
```

### 副会话自动化流程

```
1. 新标签页打开 https://chat.deepseek.com/?fork_id={threadId}
2. 等待 textarea 就绪 (最长 20s)
3. 用 nativeInputValueSetter 注入 Prompt + dispatch input/change 事件
4. 模拟 Enter keydown 发送 (React 监听 keydown)
5. 等待 AI 回答文本出现 (最长 30s)
6. requestAnimationFrame 轮询最后一条 AI 回答文本
7. 有变化 → fork:stream_snapshot 发回 background
8. 连续 30 帧 (~500ms) 无变化 → 标记 completed
```

---

## 已完成功能

- [x] 项目骨架 (WXT + TypeScript + Chrome/Firefox 双目标)
- [x] 跨浏览器 API 封装
- [x] 核心类型定义 + 状态机
- [x] Prompt 生成器 (自包含分支 Prompt)
- [x] 主页面选区监听 + 浮动按钮 (Shadow DOM)
- [x] Inline Fork 渲染器 (Shadow DOM)
- [x] DeepSeek 主页面适配器
- [x] DeepSeek 副会话适配器
- [x] Background Orchestrator + 路由表
- [x] 流式快照同步 (完整文本方案)
- [x] 页面刷新恢复 (锚点匹配 → 重新挂载)
- [x] Chrome + Firefox 构建

---

## 已知问题 / 待优化

### 高优先级
1. **DeepSeek CSS 类名哈希** — `d29f3d7d`、`_74c0879` 等类名可能随 DeepSeek 前端构建变化，适配器需定期验证。更稳定的方案是使用结构特征（如检查子元素内容）而非 hashed class
2. **`?fork_id=` 参数持久性** — DeepSeek SPA 可能用 `replaceState` 清除 query params，需要在 orchestrator 中 fallback（如通过 tab ID 匹配或 storage 传递）

### 中优先级
3. **发送按钮缺失** — DeepSeek 可能没有显式发送按钮（仅用 Enter 发送），当前用 Enter keydown 模拟。如 UI 变动需调整
4. **生成状态检测** — 当前靠文本变化 + 稳定帧数判断完成，没有可靠 DOM 信号。DeepSeek 的停止按钮选择器不稳定
5. **并发控制** — task-queue.ts 已实现但默认未限制并发（当前单次只打开一个副会话）

### 低优先级
6. **Firefox manifest 差异** — WXT 处理大部分，但 Firefox 的 `manifest.json` 可能需额外权限
7. **Markdown 渲染** — 当前用纯文本转义（`escapeHtml`），无代码高亮。阶段三引入 marked + highlight.js
8. **Notification 样式** — 当前无通知系统
9. **Popup 页面** — 未实现设置页、分支管理面板
10. **日志系统** — 当前 console.log，没有日志级别控制或持久化

---

## 适配新站点的流程

1. 实现 `MainPageAdapter` (src/adapters/main/):
   - `detect()` — 判断当前页面是否是该站点
   - `findAssistantMessages()` — 返回所有 AI 回答元素
   - `getMessageId()` — 稳定的消息 ID
   - `getMessageText()` — 提取回答文本
   - `resolveSelectionAnchor()` — 选区定位到对应 AI 回答
   - `mountInlineFork()` — 在 AI 回答后挂载容器

2. 实现 `BranchPageAdapter` (src/adapters/branch/):
   - `detect()` — 判断是否是该站点的副会话页
   - `waitUntilReady()` — 等待输入框可用
   - `injectPrompt()` — 设置输入框内容（React SPA 需用 nativeInputValueSetter）
   - `submitPrompt()` — 触发发送
   - `observeStreamingAnswer()` — 监听流式变化

3. 分别注册到 `src/adapters/main/generic-main-adapter.ts` 和 `src/adapters/branch/generic-branch-adapter.ts`（阶段二实现统一注册）

---

## 构建产物

```
.output/
  chromium/  ← 也兼容 Edge
  firefox-mv3/
```

当前构建大小: ~41KB (total)
