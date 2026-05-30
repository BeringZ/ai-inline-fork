import { browserApi } from '../browser/ext';

const PREFIX = 'fork:';

export const storage = {
  async get<T>(key: string): Promise<T | undefined> {
    const fullKey = PREFIX + key;
    const result = await browserApi.storage.local.get<Record<string, T>>(fullKey);
    return result[fullKey];
  },

  async set<T>(key: string, value: T): Promise<void> {
    await browserApi.storage.local.set({ [PREFIX + key]: value });
  },

  async remove(key: string): Promise<void> {
    await browserApi.storage.local.remove(PREFIX + key);
  },

  async getAll<T>(prefix?: string): Promise<Record<string, T>> {
    const all = await browserApi.storage.local.get<Record<string, T>>(null);
    const result: Record<string, T> = {};
    const filter = prefix ? PREFIX + prefix : PREFIX;
    for (const [key, value] of Object.entries(all)) {
      if (key.startsWith(filter)) {
        result[key.slice(PREFIX.length)] = value as T;
      }
    }
    return result;
  },
};
