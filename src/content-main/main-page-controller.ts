import { logger } from '../utils/logger';
import { browserApi } from '../browser/ext';
import { deepseekMainAdapter } from '../adapters/main/phase1-main-adapter';
import { SelectionListener } from './selection-listener';
import { FloatingForkButton } from '../ui/floating-button/FloatingForkButton';
import { InlineForkRenderer } from '../ui/inline-fork/renderer';
import { generateId } from '../utils/hash';
import type { ForkRunStatus } from '../core/fork-thread';
import type { ExtensionMessage, CreateForkPayload } from '../core/message-types';
import type { SelectionAnchor } from '../adapters/main/base-main-adapter';

class MainPageController {
  private selectionListener = new SelectionListener();
  private floatingButton = new FloatingForkButton();
  private forkRenderers = new Map<string, InlineForkRenderer>();
  private currentAnchor: SelectionAnchor | null = null;
  private currentSelectedText = '';
  private initialized = false;
  private lastCheckedUrl = '';

  init() {
    if (this.initialized) return;
    this.initialized = true;

    this.selectionListener.start((anchor, text) => {
      this.currentAnchor = anchor;
      this.currentSelectedText = text;
      this.showFloatingButton(anchor);
    });

    // SPA 导航检测
    this.watchUrlChanges();

    browserApi.runtime.onMessage.addListener((msg: ExtensionMessage) => {
      this.handleMessage(msg);
    });

    logger.info('Main page controller initialized');

    this.restoreThreads();
  }

  private watchUrlChanges() {
    this.lastCheckedUrl = window.location.href;

    const origPushState = history.pushState.bind(history);
    const origReplaceState = history.replaceState.bind(history);

    history.pushState = (...args) => {
      origPushState(...args);
      this.onUrlChange();
    };
    history.replaceState = (...args) => {
      origReplaceState(...args);
      this.onUrlChange();
    };
    window.addEventListener('popstate', () => this.onUrlChange());
  }

  private onUrlChange() {
    const currentUrl = window.location.href;
    if (currentUrl === this.lastCheckedUrl) return;
    this.lastCheckedUrl = currentUrl;
    logger.info('URL changed:', currentUrl);
  }

  private async restoreThreads() {
    const url = deepseekMainAdapter.getConversationUrl();
    browserApi.runtime.sendMessage({
      type: 'fork:get_threads',
      payload: { url },
    } as ExtensionMessage);
  }

  private restoreThread(thread: import('../core/fork-thread').ForkThread) {
    // 尝试通过消息 ID 或文本匹配找到对应的 AI 回答元素
    const messages = deepseekMainAdapter.findAssistantMessages();
    let anchor: HTMLElement | null = null;

    for (const msg of messages) {
      const mid = deepseekMainAdapter.getMessageId(msg);
      if (mid === thread.source.sourceMessageId) {
        anchor = msg;
        break;
      }
      const text = deepseekMainAdapter.getMessageText(msg);
      if (text.includes(thread.source.selectedText.slice(0, 30))) {
        anchor = msg;
        break;
      }
    }

    if (!anchor) {
      // 锚点丢失，挂到最后一条回答底部
      anchor = messages[messages.length - 1] || null;
      if (!anchor) return;
      thread.ui.anchorStatus = 'lost';
    }

    const container = document.createElement('div');
    container.id = thread.ui.inlineContainerId;
    container.dataset.forkThreadId = thread.id;
    anchor.insertAdjacentElement('afterend', container);

    const renderer = new InlineForkRenderer(container, {
      question: thread.prompt.branchQuestion,
      answer: thread.stream.currentText || '',
      status: thread.stream.status,
      error: thread.stream.error,
      collapsed: thread.ui.collapsed,
    });
    this.forkRenderers.set(thread.id, renderer);
  }

  private showFloatingButton(anchor: SelectionAnchor) {
    const rect = anchor.element.getBoundingClientRect();
    this.floatingButton.show(rect.right - 120, rect.top - 40, (question) => {
      this.createFork(question);
    });
  }

  private async createFork(question: string) {
    if (!this.currentAnchor) return;

    const assistantMessage = deepseekMainAdapter.getMessageText(this.currentAnchor.element);
    const sourceMessageId = deepseekMainAdapter.getMessageId(this.currentAnchor.element);
    const conversationUrl = deepseekMainAdapter.getConversationUrl();
    const conversationId = deepseekMainAdapter.getConversationId?.();
    const selectedText = this.currentSelectedText;

    const forkThreadId = generateId();

    // 先挂载 Inline Fork 容器
    const container = deepseekMainAdapter.mountInlineFork(this.currentAnchor, forkThreadId);
    const renderer = new InlineForkRenderer(container, {
      question,
      answer: '',
      status: 'fork_created',
      collapsed: false,
    });
    this.forkRenderers.set(forkThreadId, renderer);

    const payload: CreateForkPayload = {
      forkThreadId,
      selectedText,
      branchQuestion: question,
      assistantMessage,
      mainUserQuestion: '',
      sourceMessageId,
      mainConversationUrl: conversationUrl,
      mainConversationId: conversationId,
      siteId: deepseekMainAdapter.siteId,
      selectedRangeHint: {
        startText: selectedText.slice(0, 50),
        endText: selectedText.slice(-50),
      },
    };

    // 发送给 background
    browserApi.runtime.sendMessage({
      type: 'fork:create',
      payload,
    } as ExtensionMessage);
  }

  private handleMessage(msg: ExtensionMessage) {
    switch (msg.type) {
      case 'fork:created': {
        logger.info('Fork created:', msg.payload);
        break;
      }

      case 'fork:status': {
        const renderer = this.forkRenderers.get(msg.payload.forkThreadId);
        if (renderer) {
          renderer.updateState({
            status: msg.payload.status as ForkRunStatus,
            error: msg.payload.message,
          });
        }
        break;
      }

      case 'fork:stream_snapshot': {
        const { forkThreadId, text, status } = msg.payload;
        const renderer = this.forkRenderers.get(forkThreadId);
        if (renderer) {
          renderer.updateState({
            answer: text,
            status: status === 'completed' ? 'completed' : 'streaming',
          });
        }
        break;
      }

      case 'fork:error': {
        const renderer = this.forkRenderers.get(msg.payload.forkThreadId);
        if (renderer) {
          renderer.updateState({
            status: msg.payload.status as ForkRunStatus,
            error: msg.payload.message,
          });
        }
        break;
      }

      case 'fork:threads': {
        for (const thread of msg.payload.threads) {
          this.restoreThread(thread);
        }
        break;
      }
    }
  }
}

export const mainPageController = new MainPageController();
