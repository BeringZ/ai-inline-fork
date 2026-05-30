export interface SelectionAnchor {
  element: HTMLElement;
  paragraphIndex?: number;
  startText?: string;
  endText?: string;
}

export interface MainPageAdapter {
  siteId: string;
  detect(): boolean;
  findAssistantMessages(): HTMLElement[];
  findMessageContainer?(el: HTMLElement | null): HTMLElement | null;
  getMessageId(element: HTMLElement): string;
  getMessageText(element: HTMLElement): string;
  getConversationId?(): string | undefined;
  getConversationUrl(): string;
  resolveSelectionAnchor(selection: Selection): SelectionAnchor | null;
  mountInlineFork(anchor: SelectionAnchor, threadId: string): HTMLElement;
}
