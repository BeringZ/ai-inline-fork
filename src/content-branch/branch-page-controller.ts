import { logger } from '../utils/logger';
import { browserApi } from '../browser/ext';
import { deepseekBranchAdapter } from '../adapters/branch/phase1-branch-adapter';
import type { ExtensionMessage } from '../core/message-types';

class BranchPageController {
  private initialized = false;
  private stopObserving: (() => void) | null = null;

  init() {
    if (this.initialized) return;
    this.initialized = true;

    // 从 URL 读取 fork_id
    const params = new URLSearchParams(window.location.search);
    const forkThreadId = params.get('fork_id');

    if (!forkThreadId) {
      // 不是分支标签页，不启动
      return;
    }

    logger.info(`Branch page initialized for fork: ${forkThreadId}`);

    // 通知 background 副会话已就绪
    browserApi.runtime.sendMessage({
      type: 'branch:ready',
      payload: { forkThreadId },
    } as ExtensionMessage);

    // 监听 branch:init
    browserApi.runtime.onMessage.addListener((msg: ExtensionMessage) => {
      if (msg.type === 'branch:init') {
        this.runAutomation(msg.payload.forkThreadId, msg.payload.finalPrompt);
      }
    });
  }

  private async runAutomation(forkThreadId: string, finalPrompt?: string) {
    const adapter = deepseekBranchAdapter;
    let prompt = finalPrompt;

    try {
      logger.info('Waiting for branch page ready...');
      await adapter.waitUntilReady(20000);
      logger.info('Branch page ready');

      if (!prompt) {
        logger.error('No prompt provided');
        browserApi.runtime.sendMessage({
          type: 'fork:error',
          payload: {
            forkThreadId,
            status: 'manual_recovery',
            message: '未收到 Prompt',
          },
        } as ExtensionMessage);
        return;
      }

      logger.info('Injecting prompt...');
      await adapter.injectPrompt(prompt);
      await sleep(500);

      logger.info('Submitting...');
      await adapter.submitPrompt();
      await sleep(1000);

      logger.info('Waiting for generation start...');
      await adapter.waitGenerationStart(30000);
      logger.info('Generation started');

      logger.info('Starting stream observation...');
      this.stopObserving = adapter.observeStreamingAnswer((snapshot) => {
        browserApi.runtime.sendMessage({
          type: 'fork:stream_snapshot',
          payload: {
            forkThreadId,
            text: snapshot.text,
            seq: Date.now(),
            status: snapshot.status,
            updatedAt: Date.now(),
          },
        } as ExtensionMessage);
      });

    } catch (err) {
      logger.error('Branch automation failed:', err);
      browserApi.runtime.sendMessage({
        type: 'fork:error',
        payload: {
          forkThreadId,
          status: 'manual_recovery',
          message: String(err),
        },
      } as ExtensionMessage);
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const branchPageController = new BranchPageController();
