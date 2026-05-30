import type { ForkRunStatus } from './fork-thread';
import { ForkError, ErrorCodes } from './errors';
import { logger } from '../utils/logger';

const TRANSITIONS: Record<ForkRunStatus, ForkRunStatus[]> = {
  fork_created: ['opening_branch_tab', 'open_failed'],
  opening_branch_tab: ['branch_page_loading', 'open_failed'],
  branch_page_loading: ['branch_page_ready', 'page_timeout', 'open_failed'],
  branch_page_ready: ['prompt_injecting', 'page_timeout'],
  prompt_injecting: ['prompt_injected', 'prompt_inject_failed'],
  prompt_injected: ['submitting', 'prompt_inject_failed'],
  submitting: ['waiting_generation_start', 'submit_failed'],
  waiting_generation_start: ['streaming', 'generation_timeout', 'submit_failed'],
  streaming: ['completed', 'mirrored_final', 'stream_interrupted'],
  completed: ['mirrored_final'],
  mirrored_final: [],
  open_failed: ['recovering', 'manual_recovery'],
  page_timeout: ['recovering', 'manual_recovery'],
  prompt_inject_failed: ['recovering', 'manual_recovery'],
  submit_failed: ['recovering', 'manual_recovery'],
  generation_timeout: ['recovering', 'manual_recovery'],
  stream_interrupted: ['recovering', 'streaming', 'manual_recovery'],
  recovering: ['opening_branch_tab', 'prompt_injecting', 'submitting', 'streaming', 'manual_recovery'],
  manual_recovery: [],
};

export function transitionForkStatus(
  current: ForkRunStatus,
  target: ForkRunStatus,
): ForkRunStatus {
  const allowed = TRANSITIONS[current];
  if (!allowed) {
    throw new ForkError(
      ErrorCodes.STORAGE_ERROR,
      `Unknown current status: ${current}`,
      false,
    );
  }
  if (!allowed.includes(target)) {
    logger.warn(`Invalid status transition: ${current} -> ${target}`);
    return current;
  }
  logger.info(`Status transition: ${current} -> ${target}`);
  return target;
}

export function isTerminal(status: ForkRunStatus): boolean {
  return ['completed', 'mirrored_final', 'manual_recovery'].includes(status);
}

export function isError(status: ForkRunStatus): boolean {
  return [
    'open_failed', 'page_timeout', 'prompt_inject_failed',
    'submit_failed', 'generation_timeout', 'stream_interrupted',
  ].includes(status);
}
