import type { ForkThread, ForkRoute } from '../core/fork-thread';
import { storage } from './storage';

const THREAD_KEY = 'threads';
const ROUTE_KEY = 'routes';

export const forkThreadStore = {
  async saveThread(thread: ForkThread): Promise<void> {
    const threads = await storage.get<Record<string, ForkThread>>(THREAD_KEY) || {};
    threads[thread.id] = thread;
    await storage.set(THREAD_KEY, threads);
  },

  async getThread(id: string): Promise<ForkThread | undefined> {
    const threads = await storage.get<Record<string, ForkThread>>(THREAD_KEY) || {};
    return threads[id];
  },

  async getAllThreads(): Promise<ForkThread[]> {
    const threads = await storage.get<Record<string, ForkThread>>(THREAD_KEY) || {};
    return Object.values(threads);
  },

  async getThreadsByUrl(url: string): Promise<ForkThread[]> {
    const all = await this.getAllThreads();
    return all.filter((t) => t.source.mainConversationUrl === url);
  },

  async deleteThread(id: string): Promise<void> {
    const threads = await storage.get<Record<string, ForkThread>>(THREAD_KEY) || {};
    delete threads[id];
    await storage.set(THREAD_KEY, threads);
  },

  async saveRoute(route: ForkRoute): Promise<void> {
    const routes = await storage.get<Record<string, ForkRoute>>(ROUTE_KEY) || {};
    routes[route.forkThreadId] = route;
    await storage.set(ROUTE_KEY, routes);
  },

  async getRoute(forkThreadId: string): Promise<ForkRoute | undefined> {
    const routes = await storage.get<Record<string, ForkRoute>>(ROUTE_KEY) || {};
    return routes[forkThreadId];
  },

  async deleteRoute(forkThreadId: string): Promise<void> {
    const routes = await storage.get<Record<string, ForkRoute>>(ROUTE_KEY) || {};
    delete routes[forkThreadId];
    await storage.set(ROUTE_KEY, routes);
  },
};
