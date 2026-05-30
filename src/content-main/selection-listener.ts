import { deepseekMainAdapter } from '../adapters/main/phase1-main-adapter';
import type { MainPageAdapter, SelectionAnchor } from '../adapters/main/base-main-adapter';
import { logger } from '../utils/logger';

type SelectionCallback = (anchor: SelectionAnchor, selectedText: string) => void;

export class SelectionListener {
  private adapter: MainPageAdapter;
  private callback: SelectionCallback | null = null;
  private mouseUpHandler = this.handleMouseUp.bind(this);

  constructor() {
    this.adapter = deepseekMainAdapter;
  }

  start(callback: SelectionCallback) {
    this.callback = callback;
    document.addEventListener('mouseup', this.mouseUpHandler);
    logger.info('Selection listener started');
  }

  stop() {
    document.removeEventListener('mouseup', this.mouseUpHandler);
    this.callback = null;
  }

  private handleMouseUp(e: MouseEvent) {
    // 如果是点击插件自身元素，忽略
    const target = e.target as HTMLElement;
    if (target.closest('[data-fork-thread-id]') || target.closest('[data-fork-root]')) return;

    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;

    const selectedText = selection.toString().trim();
    if (!selectedText || selectedText.length < 2) return;

    // 用 requestAnimationFrame 延迟处理，让 selection 稳定
    requestAnimationFrame(() => {
      const currentSelection = window.getSelection();
      if (!currentSelection || !currentSelection.rangeCount) return;
      const text = currentSelection.toString().trim();
      if (!text) return;

      const anchor = this.adapter.resolveSelectionAnchor(currentSelection);
      if (!anchor) return;

      this.callback?.(anchor, text);
    });
  }
}
