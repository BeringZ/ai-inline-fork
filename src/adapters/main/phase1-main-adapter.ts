import type { MainPageAdapter, SelectionAnchor } from './base-main-adapter';
import { textHash } from '../../utils/hash';
import { logger } from '../../utils/logger';

/**
 * DeepSeek 主页面适配器
 *
 * DOM 结构（Chat DeepSeek SPA）:
 *   AI 回答内容在包含 markdown 的元素内
 *   消息通常由 ds-message 或类似类名的 div 包裹
 *
 *   类名是 CSS Modules 哈希值，可能随 DeepSeek 构建变化。
 *   适配器使用多层次回退策略：
 *     1. 已知类名 (ds-message, _74c0879 等)
 *     2. data 属性 (data-virtual-list-item-key)
 *     3. 结构特征 (含 .ds-markdown 的元素向上查找)
 */

// 已知的 AI 消息容器类名（按优先级排列，新类名在前）
const KNOWN_AI_MESSAGE_SELECTORS = [
  'div.ds-message:not(.d29f3d7d)',
  'div.ds-message',
];

// 已知的用户消息容器类名
const KNOWN_USER_MESSAGE_SELECTORS = [
  'div.d29f3d7d.ds-message',
  'div.d29f3d7d',
];

/** 从内容元素向上查找消息容器 */
function findMessageContainer(el: HTMLElement | null): HTMLElement | null {
  let node = el;
  while (node) {
    if (node.classList.contains('ds-message')) return node;
    if (node.hasAttribute?.('data-virtual-list-item-key')) {
      const msg = node.querySelector<HTMLElement>('.ds-message');
      if (msg) return msg;
    }
    node = node.parentElement;
  }
  return null;
}

export const deepseekMainAdapter: MainPageAdapter = {
  siteId: 'deepseek',

  detect(): boolean {
    return window.location.hostname === 'chat.deepseek.com'
      && !!document.querySelector('textarea[placeholder*="DeepSeek"]');
  },

  findAssistantMessages(): HTMLElement[] {
    // 策略1: 使用已知选择器
    for (const selector of KNOWN_AI_MESSAGE_SELECTORS) {
      const results = Array.from(document.querySelectorAll<HTMLElement>(selector));
      if (results.length > 0) return results;
    }

    // 策略2: 通过 data-virtual-list-item-key 找 ds-message
    const allMessages = Array.from(
      document.querySelectorAll<HTMLElement>('[data-virtual-list-item-key] div.ds-message'),
    );
    if (allMessages.length > 0) {
      return allMessages.filter((el) => {
        return !el.matches('div.d29f3d7d') && !el.querySelector('div.fbb737a4');
      });
    }

    // 策略3: 通过 .ds-markdown 向上查找消息容器
    const markdownEls = Array.from(document.querySelectorAll<HTMLElement>('.ds-markdown'));
    const seen = new Set<HTMLElement>();
    const messages: HTMLElement[] = [];
    for (const el of markdownEls) {
      const container = findMessageContainer(el);
      if (container && !seen.has(container)) {
        seen.add(container);
        messages.push(container);
      }
    }

    logger.info(`findAssistantMessages found ${messages.length} messages via ds-markdown`);
    return messages;
  },

  findMessageContainer,

  getMessageId(element: HTMLElement): string {
    const dataId = element.closest('[data-virtual-list-item-key]')?.getAttribute('data-virtual-list-item-key');
    if (dataId) return `ds_${dataId}`;
    return `ds_${textHash(this.getMessageText(element))}`;
  },

  getMessageText(element: HTMLElement): string {
    const contentEl = element.querySelector<HTMLElement>('div._74c0879')
      || element.querySelector<HTMLElement>('.ds-markdown')
      || element.querySelector<HTMLElement>('[class*="markdown"]')
      || element;
    return contentEl.textContent?.trim() || '';
  },

  getConversationId(): string | undefined {
    const match = window.location.pathname.match(/\/chat\/([a-f0-9]+)/i);
    return match?.[1] ?? undefined;
  },

  getConversationUrl(): string {
    return window.location.href;
  },

  resolveSelectionAnchor(selection: Selection): SelectionAnchor | null {
    if (!selection.rangeCount) return null;

    const range = selection.getRangeAt(0);
    let node: HTMLElement | null = range.startContainer instanceof HTMLElement
      ? range.startContainer
      : range.startContainer.parentElement;

    if (!node) {
      logger.warn('resolveSelectionAnchor: cannot find start node');
      return null;
    }

    // 向上查找消息容器（多策略）
    const messageEl = findMessageContainer(node);

    if (!messageEl) {
      logger.warn('resolveSelectionAnchor: no message container found for node:', node.tagName, node.className);
      return null;
    }

    const text = selection.toString().trim();
    if (!text) return null;

    logger.info('resolveSelectionAnchor: found message container', messageEl.className);

    return {
      element: messageEl,
      startText: text.slice(0, 50),
      endText: text.slice(-50),
    };
  },

  mountInlineFork(anchor: SelectionAnchor, threadId: string): HTMLElement {
    const container = document.createElement('div');
    container.id = `fork-inline-${threadId}`;
    container.dataset.forkThreadId = threadId;

    const messageEl = anchor.element;
    messageEl.insertAdjacentElement('afterend', container);
    return container;
  },
};
