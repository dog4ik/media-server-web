import { onCleanup } from "solid-js";
import { fullUrl, Schemas } from "./serverApi";

type EventType = Schemas["Notification"];

type TaskProgressMap = {
  [T in EventType["task_type"]]: Extract<EventType, { task_type: T }>;
};

export class ServerStatus {
  private socket: EventSource;
  private handlers: [
    keyof TaskProgressMap,
    (status: TaskProgressMap[keyof TaskProgressMap]) => void,
  ][];
  constructor() {
    let sse = new EventSource(fullUrl("/api/tasks/progress", {}));
    sse.addEventListener("message", this._onMessage.bind(this));
    sse.addEventListener("open", this._onOpen.bind(this));
    sse.addEventListener("error", this._onError.bind(this));
    this.handlers = [];
    this.socket = sse;
  }

  _onError() {}
  _onOpen() {}
  _onMessage(msg: MessageEvent<any>) {
    let event: Schemas["Notification"] = JSON.parse(msg.data);
    for (let [eventType, handler] of this.handlers) {
      if (eventType == event.task_type) {
        handler(event);
      }
    }
  }

  close() {
    this.socket.close();
  }

  addProgressHandler<T extends keyof TaskProgressMap>(
    eventType: T,
    handler: (progress: TaskProgressMap[T]) => void,
  ) {
    this.handlers.push([eventType, handler as any]);
    onCleanup(() => this.removeProgressHandler(handler));
  }

  removeProgressHandler<T extends keyof TaskProgressMap>(
    handler: (progress: TaskProgressMap[T]) => void,
  ) {
    this.handlers = this.handlers.filter(([_, h]) => h != handler);
  }
}
