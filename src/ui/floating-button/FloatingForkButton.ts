import { FLOATING_BUTTON_STYLES } from './styles';

export type ForkButtonCallback = (question: string) => void;

export class FloatingForkButton {
  private host: HTMLElement;
  private shadow: ShadowRoot;
  private callback: ForkButtonCallback | null = null;

  constructor() {
    this.host = document.createElement('div');
    this.host.style.position = 'fixed';
    this.host.style.zIndex = '999999';
    this.shadow = this.host.attachShadow({ mode: 'closed' });
    document.body.appendChild(this.host);
  }

  show(x: number, y: number, callback: ForkButtonCallback) {
    this.callback = callback;

    // 边界检查：防止按钮超出屏幕
    const maxX = window.innerWidth - 130;
    const minX = 10;
    const maxY = window.innerHeight - 50;
    const minY = 10;

    this.host.style.left = `${Math.max(minX, Math.min(x, maxX))}px`;
    this.host.style.top = `${Math.max(minY, Math.min(y, maxY))}px`;
    this.host.style.display = 'block';

    const style = document.createElement('style');
    style.textContent = FLOATING_BUTTON_STYLES;

    const root = document.createElement('div');
    root.innerHTML = `
      <button class="fork-btn-trigger" data-action="trigger">
        🔎 追问这段
      </button>
    `;

    this.shadow.innerHTML = '';
    this.shadow.appendChild(style);
    this.shadow.appendChild(root);

    root.querySelector('[data-action="trigger"]')?.addEventListener('click', () => {
      this.showInput();
    });
  }

  private showInput() {
    const style = document.createElement('style');
    style.textContent = FLOATING_BUTTON_STYLES;

    const root = document.createElement('div');
    root.innerHTML = `
      <div class="fork-btn-trigger" style="opacity:0.7;pointer-events:none">🔎 追问这段</div>
      <div class="fork-input-popup">
        <textarea placeholder="输入你的追问..." rows="3"></textarea>
        <div class="fork-input-actions">
          <button data-action="cancel">取消</button>
          <button class="primary" data-action="confirm">发送追问</button>
        </div>
      </div>
    `;

    this.shadow.innerHTML = '';
    this.shadow.appendChild(style);
    this.shadow.appendChild(root);

    const textarea = root.querySelector('textarea')!;

    root.querySelector('[data-action="cancel"]')?.addEventListener('click', () => this.hide());
    root.querySelector('[data-action="confirm"]')?.addEventListener('click', () => {
      const question = textarea.value.trim();
      if (!question) return;
      this.callback?.(question);
      this.hide();
    });

    textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        const question = textarea.value.trim();
        if (!question) return;
        this.callback?.(question);
        this.hide();
      }
      if (e.key === 'Escape') this.hide();
    });

    setTimeout(() => textarea.focus(), 50);
  }

  hide() {
    this.host.style.display = 'none';
    this.shadow.innerHTML = '';
  }

  get visible(): boolean {
    return this.host.style.display !== 'none';
  }
}
