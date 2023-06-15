export class MappedQueue<T> {
  private queues = new Map<string, T[]>();

  constructor() {}

  initKey(...keys: string[]) {
    for (const key of keys) {
      this.queues.set(key, []);
    }
  }

  pushToAll(value: T) {
    for (const key of this.queues.keys()) {
      this.push(key, value);
    }
  }

  push(key: string, value: T) {
    let queue = this.queues.get(key);
    if (queue == null) {
      queue = [];
      this.queues.set(key, queue);
    }

    queue.push(value);
    queue.splice(50);
  }

  pop(key: string) {
    let queue = this.queues.get(key);
    if (queue == null) {
      queue = [];
      this.queues.set(key, queue);
    }

    return queue.shift();
  }

  keys() {
    return this.queues.keys();
  }
}
