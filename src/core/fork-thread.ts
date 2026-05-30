export type ForkRunStatus =
  | 'fork_created'
  | 'opening_branch_tab'
  | 'branch_page_loading'
  | 'branch_page_ready'
  | 'prompt_injecting'
  | 'prompt_injected'
  | 'submitting'
  | 'waiting_generation_start'
  | 'streaming'
  | 'completed'
  | 'mirrored_final'
  | 'open_failed'
  | 'page_timeout'
  | 'prompt_inject_failed'
  | 'submit_failed'
  | 'generation_timeout'
  | 'stream_interrupted'
  | 'recovering'
  | 'manual_recovery';

export interface ForkMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  source: 'inline_user' | 'branch_mirror';
  runId?: string;
  seq?: number;
  createdAt: number;
  updatedAt?: number;
  status?: 'streaming' | 'completed' | 'failed';
}

export interface ForkThread {
  id: string;
  source: {
    siteId: string;
    mainTabId?: number;
    mainConversationUrl: string;
    mainConversationId?: string;
    sourceMessageId: string;
    sourceMessageTextHash: string;
    selectedText: string;
    selectedRangeHint: {
      paragraphIndex?: number;
      startText?: string;
      endText?: string;
      selectionHash?: string;
    };
  };
  branch: {
    providerSiteId: string;
    branchTabId?: number;
    branchWindowId?: number;
    branchConversationUrl?: string;
    branchConversationId?: string;
    mode: 'auto_stream_mirror';
    visibility: 'background_tab' | 'active_tab' | 'popup_window';
  };
  prompt: {
    mainUserQuestion?: string;
    assistantMessage: string;
    selectedText: string;
    branchQuestion: string;
    finalPrompt: string;
  };
  messages: ForkMessage[];
  stream: {
    status: ForkRunStatus;
    currentText: string;
    lastSeq: number;
    startedAt?: number;
    updatedAt?: number;
    completedAt?: number;
    error?: string;
  };
  ui: {
    collapsed: boolean;
    anchorStatus: 'exact' | 'message_bottom' | 'lost';
    inlineContainerId: string;
  };
  createdAt: number;
  updatedAt: number;
}

export interface ForkRoute {
  forkThreadId: string;
  mainTabId: number;
  branchTabId: number;
  inlineContainerId: string;
  createdAt: number;
}
