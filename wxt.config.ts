import { defineConfig } from 'wxt';

export default defineConfig({
  manifestVersion: 3,
  manifest: {
    name: 'AI Inline Fork',
    version: '0.1.0',
    description: '在 AI 回答中选中片段，创建分支追问，自动同步回答',
    permissions: ['storage', 'tabs', 'scripting'],
    host_permissions: ['*://chat.deepseek.com/*'],
    action: {},
    content_scripts: [
      {
        matches: ['*://chat.deepseek.com/*'],
        js: ['content-main.js'],
        run_at: 'document_idle',
      },
      {
        matches: ['*://chat.deepseek.com/*'],
        js: ['content-branch.js'],
        run_at: 'document_idle',
      },
    ],
  },
  webExt: {
    startUrls: ['https://chat.deepseek.com/'],
  },
});
