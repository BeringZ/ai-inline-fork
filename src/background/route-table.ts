import type { ForkRoute } from '../core/fork-thread';
import { logger } from '../utils/logger';

class RouteTable {
  private routes = new Map<string, ForkRoute>();

  register(route: ForkRoute) {
    this.routes.set(route.forkThreadId, route);
    logger.info(`Route registered: ${route.forkThreadId}`);
  }

  get(forkThreadId: string): ForkRoute | undefined {
    return this.routes.get(forkThreadId);
  }

  getByMainTab(tabId: number): ForkRoute[] {
    return Array.from(this.routes.values()).filter((r) => r.mainTabId === tabId);
  }

  getByBranchTab(tabId: number): ForkRoute | undefined {
    return Array.from(this.routes.values()).find((r) => r.branchTabId === tabId);
  }

  remove(forkThreadId: string): boolean {
    return this.routes.delete(forkThreadId);
  }

  removeByMainTab(tabId: number) {
    for (const [id, route] of this.routes) {
      if (route.mainTabId === tabId) this.routes.delete(id);
    }
  }

  getAll(): ForkRoute[] {
    return Array.from(this.routes.values());
  }
}

export const routeTable = new RouteTable();
