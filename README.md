# AI Inline Fork

> 浏览器插件：在 AI 对话中选中任意片段，即刻创建分支追问，回答自动流式同步回当前页面。不污染主会话。

A browser extension that lets you select any text in an AI response, fork it into an independent side-conversation, and stream the answer back inline — all without polluting the main thread.

---

## Demo

1. Select text in an AI response → floating "追问这段" button appears
2. Type your follow-up question → click send
3. Inline fork panel opens below the message → answer streams in real time

---

## Supported Sites

| Site | Status |
|------|--------|
| [DeepSeek](https://chat.deepseek.com) | Phase 1 |

---

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

- **Main Page**: Content script (`content-main`) — selection listener, fork UI, stream display
- **Background**: Orchestrator (`service worker`) — message routing, fork lifecycle, tab management
- **Branch Tab**: Content script (`content-branch`) — page automation, prompt injection, stream observation

---

## Tech Stack

- [WXT](https://wxt.dev) 0.20 — browser extension framework
- TypeScript 5.9
- Chrome Manifest V3 (Firefox MV3 compatible)
- Shadow DOM isolation for UI components
- Adapter pattern for multi-site support

---

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
│   ├── floating-button/   # "追问这段" floating button
│   └── inline-fork/       # Inline answer panel
├── storage/
│   └── fork-thread-store.ts
├── browser/ext.ts         # Cross-browser API wrapper
└── utils/
    ├── logger.ts
    ├── hash.ts
    └── debounce.ts
```

---

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

---

## Adding a New Site

1. Implement `MainPageAdapter` — define selectors for AI messages, textarea, message IDs
2. Implement `BranchPageAdapter` — define how to inject prompt, submit, and observe streaming
3. Register in `route-table.ts` if needed
4. Add URL pattern to `wxt.config.ts` content_scripts and host_permissions

---

## Known Limitations

- DeepSeek CSS class names are hashed (CSS Modules); may change with DeepSeek updates
- Streaming completion detection relies on text stability frames (no reliable DOM signal)
- Branch tab URL parameter (`?fork_id=`) may be lost during SPA redirects
- Firefox build not yet tested

---

## License

MIT
