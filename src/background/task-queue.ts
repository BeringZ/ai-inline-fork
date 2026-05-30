import { logger } from '../utils/logger';

interface Task {
  id: string;
  execute: () => Promise<void>;
  priority: number;
}

class TaskQueue {
  private queue: Task[] = [];
  private running = false;
  private maxConcurrent = 2;

  async enqueue(task: Task): Promise<void> {
    this.queue.push(task);
    this.queue.sort((a, b) => b.priority - a.priority);
    logger.info(`Task enqueued: ${task.id}, queue length: ${this.queue.length}`);
    if (!this.running) await this.process();
  }

  private async process() {
    this.running = true;
    while (this.queue.length > 0 && this.running) {
      const task = this.queue.shift()!;
      try {
        await task.execute();
      } catch (err) {
        logger.error(`Task failed: ${task.id}`, err);
      }
    }
    this.running = false;
  }

  clear() {
    this.queue = [];
    this.running = false;
  }

  get length() {
    return this.queue.length;
  }
}

export const taskQueue = new TaskQueue();
