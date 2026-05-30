import { logger } from '../utils/logger';
import { browserApi } from '../browser/ext';
import { forkThreadStore } from '../storage/fork-thread-store';
import { routeTable } from './route-table';
import { taskQueue } from './task-queue';
import { transitionForkStatus } from '../core/state-machine';
import { buildPrompt } from '../core/prompt-builder';
import type { ForkThread, ForkRoute } from '../core/fork-thread';
import type { ExtensionMessage, CreateForkPayload } from '../core/message-types';

class Orchestrator {
  private initialized = false;

  init() {
    if (this.initialized) return;
    this.initialized = true;

    browserApi.runtime.onMessage.addListener((msg: ExtensionMessage, sender) => {
      this.handleMessage(msg, sender).catch((err) => {
        logger.error('Message handler error:', err);
      });
    });

    logger.info('Orchestrator initialized');
  }

  private async handleMessage(
    msg: ExtensionMessage,
    sender: { tab?: { id?: number } },
  ) {
    switch (msg.type) {
      case 'fork:create':
        await this.handleForkCreate(msg.payload, sender);
        break;

      case 'branch:ready':
        await this.handleBranchReady(msg.payload);
        break;

      case 'fork:stream_snapshot':
        await this.handleStreamSnapshot(msg.payload, sender);
        break;

      case 'route:register':
        routeTable.register(msg.payload);
        break;

      case 'fork:get_threads':
        await this.handleGetThreads(msg.payload, sender);
        break;
    }
  }

  private async handleForkCreate(
    payload: CreateForkPayload,
    sender: { tab?: { id?: number } },
  ) {
    const forkThreadId = payload.forkThreadId;
    const mainTabId = sender.tab?.id;
    if (!mainTabId) {
      logger.error('No sender tab ID');
      return;
    }

    const now = Date.now();
    const thread: ForkThread = {
      id: forkThreadId,
      source: {
        siteId: payload.siteId,
        mainTabId,
        mainConversationUrl: payload.mainConversationUrl,
        mainConversationId: payload.mainConversationId,
        sourceMessageId: payload.sourceMessageId,
        sourceMessageTextHash: '',
        selectedText: payload.selectedText,
        selectedRangeHint: payload.selectedRangeHint,
      },
      branch: {
        providerSiteId: payload.siteId,
        mode: 'auto_stream_mirror',
        visibility: 'background_tab',
      },
      prompt: {
        mainUserQuestion: payload.mainUserQuestion,
        assistantMessage: payload.assistantMessage,
        selectedText: payload.selectedText,
        branchQuestion: payload.branchQuestion,
        finalPrompt: buildPrompt({
          mainUserQuestion: payload.mainUserQuestion,
          assistantMessage: payload.assistantMessage,
          selectedText: payload.selectedText,
          branchQuestion: payload.branchQuestion,
          forkThreadId,
        }),
      },
      messages: [],
      stream: {
        status: 'fork_created',
        currentText: '',
        lastSeq: 0,
        startedAt: now,
        updatedAt: now,
      },
      ui: {
        collapsed: false,
        anchorStatus: 'exact',
        inlineContainerId: `fork-inline-${forkThreadId}`,
      },
      createdAt: now,
      updatedAt: now,
    };

    await forkThreadStore.saveThread(thread);
    logger.info(`ForkThread created: ${forkThreadId}`);

    // 通知主页面 fork 已创建
    browserApi.tabs.sendMessage(mainTabId, {
      type: 'fork:created',
      payload: { forkThreadId, inlineContainerId: thread.ui.inlineContainerId },
    } as ExtensionMessage);

    // 开始打开副会话
    await this.openBranchTab(thread);
  }

  private async openBranchTab(thread: ForkThread) {
    thread.stream.status = transitionForkStatus(thread.stream.status, 'opening_branch_tab');
    await forkThreadStore.saveThread(thread);

    try {
      const branchUrl = `https://chat.deepseek.com/?fork_id=${thread.id}`;
      const tab = await browserApi.tabs.create(branchUrl);

      thread.branch.branchTabId = tab.id;
      thread.stream.status = transitionForkStatus(thread.stream.status, 'branch_page_loading');
      await forkThreadStore.saveThread(thread);

      // 注册路由
      if (thread.source.mainTabId && tab.id) {
        const route: ForkRoute = {
          forkThreadId: thread.id,
          mainTabId: thread.source.mainTabId,
          branchTabId: tab.id,
          inlineContainerId: thread.ui.inlineContainerId,
          createdAt: Date.now(),
        };
        routeTable.register(route);
        await forkThreadStore.saveRoute(route);
      }

      logger.info(`Branch tab opened: ${tab.id}`);
    } catch (err) {
      thread.stream.status = transitionForkStatus(thread.stream.status, 'open_failed');
      thread.stream.error = String(err);
      await forkThreadStore.saveThread(thread);

      this.notifyMain(thread.id, 'open_failed', '打开副会话失败');
    }
  }

  private async handleBranchReady(payload: { forkThreadId: string }) {
    const thread = await forkThreadStore.getThread(payload.forkThreadId);
    if (!thread) return;

    thread.stream.status = transitionForkStatus(thread.stream.status, 'branch_page_ready');
    await forkThreadStore.saveThread(thread);

    // 发送 branch:init 给副会话
    const route = routeTable.get(payload.forkThreadId);
    if (route?.branchTabId) {
      browserApi.tabs.sendMessage(route.branchTabId, {
        type: 'branch:init',
        payload: {
          forkThreadId: thread.id,
          finalPrompt: thread.prompt.finalPrompt,
        },
      } as ExtensionMessage);
    }
  }

  private async handleStreamSnapshot(
    payload: { forkThreadId: string; text: string; seq: number; status: 'streaming' | 'completed' },
    _sender: { tab?: { id?: number } },
  ) {
    const route = routeTable.get(payload.forkThreadId);
    if (!route) return;

    // 更新存储
    const thread = await forkThreadStore.getThread(payload.forkThreadId);
    if (thread) {
      thread.stream.currentText = payload.text;
      thread.stream.lastSeq = payload.seq;
      thread.stream.updatedAt = Date.now();
      if (payload.status === 'completed') {
        thread.stream.status = transitionForkStatus(thread.stream.status, 'completed');
      } else {
        thread.stream.status = transitionForkStatus(thread.stream.status, 'streaming');
      }
      await forkThreadStore.saveThread(thread);
    }

    // 转发给主页面
    browserApi.tabs.sendMessage(route.mainTabId, {
      type: 'fork:stream_snapshot',
      payload,
    } as ExtensionMessage);
  }

  private async handleGetThreads(
    payload: { url: string },
    sender: { tab?: { id?: number } },
  ) {
    const tabId = sender.tab?.id;
    if (!tabId) return;

    const allThreads = await forkThreadStore.getAllThreads();
    const matching = allThreads.filter(
      (t) => t.source.mainConversationUrl === payload.url && t.source.mainTabId === tabId,
    );

    browserApi.tabs.sendMessage(tabId, {
      type: 'fork:threads',
      payload: { threads: matching },
    } as ExtensionMessage);
  }

  private notifyMain(forkThreadId: string, status: string, message?: string) {
    const route = routeTable.get(forkThreadId);
    if (!route) return;

    browserApi.tabs.sendMessage(route.mainTabId, {
      type: 'fork:status',
      payload: { forkThreadId, status, message },
    } as ExtensionMessage);
  }
}

export const orchestrator = new Orchestrator();
