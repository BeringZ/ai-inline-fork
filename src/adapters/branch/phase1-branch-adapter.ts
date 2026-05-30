import type { BranchPageAdapter } from './base-branch-adapter';
import { logger } from '../../utils/logger';

/**
 * DeepSeek 副会话适配器
 *
 * DOM 结构:
 *   输入框: textarea[placeholder="给 DeepSeek 发送消息 "]
 *          class: _27c9245 ds-scroll-area ds-scroll-area--show-on-focus-within d96f2d2a
 *   发送区域: textarea 后的兄弟 div.b13855df
 *   消息列表: ds-scroll-area 包含 data-virtual-list-item-key 子元素
 *   最后一条 AI: 最后一个 div.ds-message:not(.d29f3d7d)
 *   AI 内容: div._74c0879 (内部含 markdown 渲染)
 *   生成状态检测: 如果最后一条 AI 内容正在变化
 */

const TEXTAREA_SELECTORS = [
  'textarea[placeholder*="DeepSeek" i]',
  'textarea[placeholder*="消息" i]',
  'textarea',
];

function findTextarea(): HTMLTextAreaElement | null {
  for (const selector of TEXTAREA_SELECTORS) {
    const el = document.querySelector<HTMLTextAreaElement>(selector);
    if (el) return el;
  }
  return null;
}

export const deepseekBranchAdapter: BranchPageAdapter = {
  siteId: 'deepseek',

  detect(): boolean {
    return window.location.hostname === 'chat.deepseek.com'
      && !!findTextarea();
  },

  async waitUntilReady(timeoutMs: number): Promise<void> {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const input = findTextarea();
      if (input && input.isConnected) return;
      await sleep(200);
    }
    throw new Error('页面就绪超时');
  },

  async injectPrompt(prompt: string): Promise<void> {
    const input = findTextarea();
    if (!input) throw new Error('找不到输入框');

    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLTextAreaElement.prototype, 'value'
    )?.set;
    nativeInputValueSetter?.call(input, prompt);

    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    await sleep(500);
  },

  async submitPrompt(): Promise<void> {
    const input = findTextarea();
    if (!input) throw new Error('找不到输入框');

    input.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'Enter',
      code: 'Enter',
      keyCode: 13,
      which: 13,
      shiftKey: false,
      ctrlKey: false,
      metaKey: false,
      bubbles: true,
      cancelable: true,
    }));

    await sleep(1500);
  },

  async waitGenerationStart(timeoutMs: number): Promise<void> {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const msg = this.getLastAssistantMessageElement();
      if (msg) {
        const text = this.extractAssistantText(msg);
        if (text.length > 10) return;
      }
      await sleep(300);
    }
    throw new Error('生成开始超时');
  },

  getLastAssistantMessageElement(): HTMLElement | null {
    const messages = document.querySelectorAll<HTMLElement>('div.ds-message');
    for (let i = messages.length - 1; i >= 0; i--) {
      const el = messages[i];
      if (!el.matches('div.d29f3d7d.ds-message') && !el.matches('div.d29f3d7d')) {
        return el;
      }
    }
    // 回退：取最后一个 ds-message
    if (messages.length > 0) {
      return messages[messages.length - 1];
    }
    return null;
  },

  extractAssistantText(element: HTMLElement): string {
    const contentEl = element.querySelector<HTMLElement>('div._74c0879')
      || element.querySelector<HTMLElement>('.ds-markdown')
      || element.querySelector<HTMLElement>('[class*="markdown"]')
      || element;
    return contentEl.textContent?.trim() || '';
  },

  isGenerating(): boolean {
    const lastMsg = this.getLastAssistantMessageElement();
    if (!lastMsg) return false;

    const stopBtn = document.querySelector<HTMLElement>(
      'button[class*="stop"], [class*="pause"], [class*="generating"]'
    );
    if (stopBtn && stopBtn.offsetParent !== null) return true;

    const text = this.extractAssistantText(lastMsg);
    return text.length === 0;
  },

  observeStreamingAnswer(
    onSnapshot: (snapshot: { text: string; status: 'streaming' | 'completed' }) => void,
  ): () => void {
    let lastText = '';
    let rafId = 0;
    let completed = false;
    let stableCount = 0;

    const check = () => {
      if (completed) return;

      const assistant = this.getLastAssistantMessageElement();
      if (assistant) {
        const text = this.extractAssistantText(assistant);
        const hasContent = text.length > 0;

        if (hasContent) {
          if (text !== lastText) {
            lastText = text;
            stableCount = 0;
            onSnapshot({ text, status: 'streaming' });
          } else {
            stableCount++;
            // 连续 ~30 帧 (约 500ms) 没变化且内容是最终状态
            if (stableCount > 30) {
              // 再次确认不是生成中
              onSnapshot({ text, status: 'completed' });
              completed = true;
              return;
            }
          }
        }
      }

      rafId = requestAnimationFrame(check);
    };

    rafId = requestAnimationFrame(check);

    return () => {
      completed = true;
      cancelAnimationFrame(rafId);
    };
  },

  getConversationUrl(): string {
    return window.location.href;
  },

  getConversationId(): string | undefined {
    const match = window.location.pathname.match(/\/chat\/([a-f0-9]+)/i);
    return match?.[1] ?? undefined;
  },
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
