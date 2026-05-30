type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const PREFIX = '[AI-Inline-Fork]';

function log(level: LogLevel, ...args: unknown[]) {
  const fn = level === 'error' ? console.error : level === 'warn' ? console.warn : level === 'info' ? console.info : console.debug;
  fn(PREFIX, ...args);
}

export const logger = {
  debug: (...args: unknown[]) => log('debug', ...args),
  info: (...args: unknown[]) => log('info', ...args),
  warn: (...args: unknown[]) => log('warn', ...args),
  error: (...args: unknown[]) => log('error', ...args),
};
