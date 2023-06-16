import EventEmitter from "node:events";

export class Reminder<T> extends EventEmitter {
  private tasks: { remindAt: number; value: T }[] = [];
  private currentTimeout: NodeJS.Timeout | null = null;

  on(eventName: "Remind", listener: (value: T) => void): this;
  on(eventName: string | symbol, listener: (...args: any[]) => void): this {
    return super.on(eventName, listener);
  }

  remind(remindAt: number, value: T) {
    this.tasks.push({ remindAt, value });
  }

  private tick() {
    console.log("reminder tick");

    for (let i = 0; i < this.tasks.length; ) {
      const task = this.tasks[i];
      const now = new Date().getTime();
      console.log("check task", task, task.remindAt, now);

      if (task.remindAt < now) {
        this.tasks.splice(i, 1);

        console.log("remind");
        this.emit("Remind", task.value);
        continue;
      }

      i++;
    }

    this.currentTimeout = setTimeout(() => this.tick(), 1000 * 10);
  }

  start() {
    this.tick();
  }

  stop() {
    if (this.currentTimeout) {
      clearTimeout(this.currentTimeout);
    }
  }
}
