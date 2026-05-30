export function generateId(): string {
  return `fork_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function textHash(text: string): string {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}
