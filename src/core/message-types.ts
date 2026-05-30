import type { ForkRunStatus, ForkThread, ForkRoute } from './fork-thread';

export interface CreateForkPayload {
  forkThreadId: string;
  selectedText: string;
  branchQuestion: string;
  assistantMessage: string;
  mainUserQuestion: string;
  sourceMessageId: string;
  mainConversationUrl: string;
  mainConversationId?: string;
  siteId: string;
  selectedRangeHint: ForkThread['source']['selectedRangeHint'];
}

export interface StreamSnapshotPayload {
  forkThreadId: string;
  text: string;
  seq: number;
  status: 'streaming' | 'completed';
  updatedAt: number;
}

export type ExtensionMessage =
  | { type: 'fork:create'; payload: CreateForkPayload }
  | { type: 'fork:created'; payload: { forkThreadId: string; inlineContainerId: string } }
  | { type: 'fork:status'; payload: { forkThreadId: string; status: ForkRunStatus; message?: string } }
  | { type: 'fork:stream_snapshot'; payload: StreamSnapshotPayload }
  | { type: 'fork:error'; payload: { forkThreadId: string; status: ForkRunStatus; message: string } }
  | { type: 'branch:init'; payload: { forkThreadId: string; finalPrompt: string } }
  | { type: 'branch:ready'; payload: { forkThreadId: string } }
  | { type: 'route:register'; payload: ForkRoute }
  | { type: 'fork:get_threads'; payload: { url: string } }
  | { type: 'fork:threads'; payload: { threads: import('./fork-thread').ForkThread[] } };
