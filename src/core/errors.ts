export class ForkError extends Error {
  constructor(
    public code: string,
    message: string,
    public recoverable: boolean = true,
  ) {
    super(message);
    this.name = 'ForkError';
  }
}

export const ErrorCodes = {
  TAB_NOT_FOUND: 'TAB_NOT_FOUND',
  PAGE_TIMEOUT: 'PAGE_TIMEOUT',
  PROMPT_INJECT_FAILED: 'PROMPT_INJECT_FAILED',
  SUBMIT_FAILED: 'SUBMIT_FAILED',
  GENERATION_TIMEOUT: 'GENERATION_TIMEOUT',
  STREAM_INTERRUPTED: 'STREAM_INTERRUPTED',
  ADAPTER_NOT_FOUND: 'ADAPTER_NOT_FOUND',
  STORAGE_ERROR: 'STORAGE_ERROR',
} as const;
