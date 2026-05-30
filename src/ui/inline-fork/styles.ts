export const FORK_STYLES = `
:host {
  all: initial;
  display: block;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 14px;
  line-height: 1.6;
  color: #1f2937;
}
.fork-container {
  margin: 12px 0;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #f9fafb;
  overflow: hidden;
}
.fork-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: #f3f4f6;
  border-bottom: 1px solid #e5e7eb;
  font-size: 12px;
  font-weight: 600;
  color: #4b5563;
}
.fork-header-title {
  display: flex;
  align-items: center;
  gap: 6px;
}
.fork-status-badge {
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
}
.fork-status-badge.streaming {
  background: #dbeafe;
  color: #1d4ed8;
}
.fork-status-badge.completed {
  background: #d1fae5;
  color: #065f46;
}
.fork-status-badge.error {
  background: #fef2f2;
  color: #991b1b;
}
.fork-question {
  padding: 8px 12px;
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
  font-size: 13px;
  color: #374151;
}
.fork-question-label {
  font-weight: 600;
  color: #6b7280;
  margin-right: 4px;
}
.fork-answer {
  padding: 12px;
  min-height: 40px;
  font-size: 14px;
  line-height: 1.6;
  color: #1f2937;
  white-space: pre-wrap;
  word-break: break-word;
}
.fork-answer.loading {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #9ca3af;
}
.fork-spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid #e5e7eb;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: fork-spin 0.6s linear infinite;
}
@keyframes fork-spin {
  to { transform: rotate(360deg); }
}
.fork-actions {
  display: flex;
  gap: 6px;
  padding: 6px 12px;
  border-top: 1px solid #e5e7eb;
}
.fork-btn {
  padding: 4px 10px;
  font-size: 12px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: #fff;
  color: #374151;
  cursor: pointer;
  transition: background 0.15s;
}
.fork-btn:hover {
  background: #f3f4f6;
}
.fork-btn:active {
  background: #e5e7eb;
}
.fork-btn.primary {
  background: #3b82f6;
  color: #fff;
  border-color: #3b82f6;
}
.fork-btn.primary:hover {
  background: #2563eb;
}
.fork-error {
  padding: 8px 12px;
  background: #fef2f2;
  color: #991b1b;
  font-size: 13px;
  border-top: 1px solid #fecaca;
}
`;
