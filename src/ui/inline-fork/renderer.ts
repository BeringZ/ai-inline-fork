import type { ForkRunStatus } from '../../core/fork-thread';
import { FORK_STYLES } from './styles';

export type ForkState = {
  question: string;
  answer: string;
  status: ForkRunStatus;
  error?: string;
  collapsed: boolean;
};

export class InlineForkRenderer {
  private host: HTMLElement;
  private shadow: ShadowRoot;
  private state: ForkState;

  constructor(container: HTMLElement, state: ForkState) {
    this.host = container;
    this.shadow = container.attachShadow({ mode: 'closed' });
    this.state = state;
    this.render();
  }

  updateState(partial: Partial<ForkState>) {
    this.state = { ...this.state, ...partial };
    this.render();
  }

  getState(): ForkState {
    return this.state;
  }

  private render() {
    const style = document.createElement('style');
    style.textContent = FORK_STYLES;

    const root = document.createElement('div');
    root.className = 'fork-container';

    root.innerHTML = `
      <div class="fork-header">
        <div class="fork-header-title">
          <span>🔀 分支追问</span>
          <span class="fork-status-badge ${this.badgeClass()}">${this.statusText()}</span>
        </div>
        <button class="fork-btn" data-action="toggle">${this.state.collapsed ? '展开' : '折叠'}</button>
      </div>
      ${this.state.collapsed ? '' : `
        <div class="fork-question">
          <span class="fork-question-label">追问：</span>
          ${this.escapeHtml(this.state.question)}
        </div>
        <div class="fork-answer ${this.state.status === 'fork_created' || this.state.status === 'opening_branch_tab' || this.state.status === 'waiting_generation_start' ? 'loading' : ''}">
          ${this.renderAnswer()}
        </div>
        ${this.state.error ? `<div class="fork-error">${this.escapeHtml(this.state.error)}</div>` : ''}
        <div class="fork-actions">
          ${this.renderActions()}
        </div>
      `}
    `;

    this.shadow.innerHTML = '';
    this.shadow.appendChild(style);
    this.shadow.appendChild(root);

    this.attachEvents(root);
  }

  private renderAnswer(): string {
    if (this.state.status === 'fork_created' || this.state.status === 'opening_branch_tab') {
      return '<span class="fork-spinner"></span> 正在创建分支会话……';
    }
    if (this.state.status === 'branch_page_loading' || this.state.status === 'branch_page_ready') {
      return '<span class="fork-spinner"></span> 正在准备副会话……';
    }
    if (this.state.status === 'prompt_injecting') {
      return '<span class="fork-spinner"></span> 正在注入 Prompt……';
    }
    if (this.state.status === 'submitting') {
      return '<span class="fork-spinner"></span> 正在发送……';
    }
    if (this.state.status === 'waiting_generation_start') {
      return '<span class="fork-spinner"></span> 等待生成开始……';
    }
    if (this.state.status === 'streaming') {
      return this.state.answer
        ? this.escapeHtml(this.state.answer)
        : '<span class="fork-spinner"></span> 正在同步回答……';
    }
    return this.state.answer ? this.escapeHtml(this.state.answer) : '(空)';
  }

  private renderActions(): string {
    const actions: string[] = [];
    if (this.state.status === 'streaming' || this.state.status === 'completed' || this.state.status === 'mirrored_final') {
      actions.push('<button class="fork-btn" data-action="open-branch">打开副会话</button>');
      actions.push('<button class="fork-btn" data-action="copy">复制回答</button>');
    }
    if (this.isErrorStatus()) {
      actions.push('<button class="fork-btn primary" data-action="retry">重试</button>');
    }
    return actions.join('');
  }

  private attachEvents(root: HTMLElement) {
    root.addEventListener('click', (e) => {
      const btn = (e.target as HTMLElement).closest('[data-action]') as HTMLElement | null;
      if (!btn) return;
      const action = btn.dataset.action;
      if (action === 'toggle') {
        this.updateState({ collapsed: !this.state.collapsed });
      }
      this.host.dispatchEvent(new CustomEvent(`fork:${action}`, { bubbles: true, composed: true }));
    });
  }

  private badgeClass(): string {
    if (this.state.status === 'streaming') return 'streaming';
    if (this.state.status === 'completed' || this.state.status === 'mirrored_final') return 'completed';
    if (this.isErrorStatus()) return 'error';
    return '';
  }

  private statusText(): string {
    const map: Partial<Record<ForkRunStatus, string>> = {
      fork_created: '创建中',
      opening_branch_tab: '打开副会话',
      branch_page_loading: '加载中',
      branch_page_ready: '已就绪',
      prompt_injecting: '注入中',
      submitting: '发送中',
      waiting_generation_start: '等待生成',
      streaming: '生成中',
      completed: '已完成',
      mirrored_final: '已完成',
      open_failed: '打开失败',
      page_timeout: '超时',
      prompt_inject_failed: '注入失败',
      submit_failed: '发送失败',
      generation_timeout: '生成超时',
      stream_interrupted: '同步中断',
      recovering: '恢复中',
      manual_recovery: '需手动处理',
    };
    return map[this.state.status] || this.state.status;
  }

  private isErrorStatus(): boolean {
    return [
      'open_failed', 'page_timeout', 'prompt_inject_failed',
      'submit_failed', 'generation_timeout', 'stream_interrupted',
      'manual_recovery',
    ].includes(this.state.status);
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
