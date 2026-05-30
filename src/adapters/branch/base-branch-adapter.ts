export interface BranchPageAdapter {
  siteId: string;
  detect(): boolean;
  waitUntilReady(timeoutMs: number): Promise<void>;
  injectPrompt(prompt: string): Promise<void>;
  submitPrompt(): Promise<void>;
  waitGenerationStart(timeoutMs: number): Promise<void>;
  getLastAssistantMessageElement(): HTMLElement | null;
  extractAssistantText(element: HTMLElement): string;
  isGenerating(): boolean;
  observeStreamingAnswer(
    onSnapshot: (snapshot: { text: string; status: 'streaming' | 'completed' }) => void,
  ): () => void;
  getConversationUrl(): string;
  getConversationId?(): string | undefined;
}
