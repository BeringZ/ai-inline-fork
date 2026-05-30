export const ext = globalThis.browser ?? globalThis.chrome;

export const browserApi = {
  runtime: {
    sendMessage(msg: unknown): Promise<unknown> {
      return ext.runtime.sendMessage(msg);
    },
    onMessage: ext.runtime.onMessage,
  },
  tabs: {
    create(url: string): Promise<chrome.tabs.Tab> {
      return new Promise((resolve) => {
        ext.tabs.create({ url, active: false }, resolve);
      });
    },
    sendMessage(tabId: number, msg: unknown): Promise<unknown> {
      return ext.tabs.sendMessage(tabId, msg);
    },
    update(tabId: number, props: chrome.tabs.UpdateProperties): Promise<chrome.tabs.Tab | null> {
      return ext.tabs.update(tabId, props);
    },
    get(tabId: number): Promise<chrome.tabs.Tab | null> {
      return ext.tabs.get(tabId).catch(() => null);
    },
    query(queryInfo: chrome.tabs.QueryInfo): Promise<chrome.tabs.Tab[]> {
      return ext.tabs.query(queryInfo);
    },
  },
  storage: {
    local: {
      get<T>(keys?: string | string[] | Record<string, unknown>): Promise<Record<string, T>> {
        return ext.storage.local.get(keys);
      },
      set(items: Record<string, unknown>): Promise<void> {
        return ext.storage.local.set(items);
      },
      remove(keys: string | string[]): Promise<void> {
        return ext.storage.local.remove(keys);
      },
    },
  },
};
