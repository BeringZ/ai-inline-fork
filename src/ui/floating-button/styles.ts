export const FLOATING_BUTTON_STYLES = `
:host {
  all: initial;
  display: block;
  position: fixed;
  z-index: 999999;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
.fork-btn-trigger {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  font-size: 13px;
  font-weight: 500;
  color: #fff;
  background: #3b82f6;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
  transition: background 0.15s, transform 0.1s;
  white-space: nowrap;
}
.fork-btn-trigger:hover {
  background: #2563eb;
}
.fork-btn-trigger:active {
  transform: scale(0.97);
}
.fork-input-popup {
  margin-top: 6px;
  padding: 10px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
}
.fork-input-popup textarea {
  width: 280px;
  min-height: 60px;
  padding: 8px;
  font-size: 13px;
  font-family: inherit;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  resize: vertical;
  outline: none;
  box-sizing: border-box;
  color: #1f2937;
}
.fork-input-popup textarea:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.15);
}
.fork-input-actions {
  display: flex;
  gap: 6px;
  margin-top: 6px;
  justify-content: flex-end;
}
.fork-input-actions button {
  padding: 4px 12px;
  font-size: 12px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  cursor: pointer;
  background: #fff;
  color: #374151;
}
.fork-input-actions button.primary {
  background: #3b82f6;
  color: #fff;
  border-color: #3b82f6;
}
.fork-input-actions button.primary:hover {
  background: #2563eb;
}
`;
