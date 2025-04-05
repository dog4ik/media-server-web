import { onCleanup } from "solid-js";
import { fullUrl, Schemas } from "./serverApi";
import { hexHash } from "./formats";
import tracing from "./tracing";

type EventType = Schemas["Notification"];

type TaskProgressMap = {
  [T in EventType["task_type"]]: Extract<EventType, { task_type: T }>;
};

export class ServerStatus {
  private socket: WebSocket;
  private handlers: [
    keyof TaskProgressMap,
    (status: TaskProgressMap[keyof TaskProgressMap]) => void,
  ][];
  private torrentHandlers: Map<string, (v: Schemas["TorrentProgress"]) => void>;
  private allTorrentsPromise:
    | ((torrents: Schemas["TorrentState"][]) => void)
    | undefined;
  private ready: Promise<void>;
  private readyRes: () => void;
  constructor() {
    let ws = new WebSocket(fullUrl("/api/ws", {}));
    ws.addEventListener("message", this._onMessage.bind(this));
    ws.addEventListener("error", this._onError.bind(this));
    this.handlers = [];
    this.torrentHandlers = new Map();
    this.socket = ws;
    this.allTorrentsPromise = undefined;
    let { promise, resolve } = Promise.withResolvers<void>();
    ws.addEventListener("open", this._onOpen.bind(this));
    this.ready = promise;
    this.readyRes = resolve;
  }

  _onError() {}
  _onOpen() {
    this.readyRes();
  }
  _onMessage(msg: MessageEvent<any>) {
    let event: Schemas["WsMessage"] = JSON.parse(msg.data);
    if (event.type == "progress") {
      for (let [eventType, handler] of this.handlers) {
        if (eventType == event.progress.task_type) {
          handler(event.progress);
        }
      }
      return;
    }
    if (event.type == "torrentprogress") {
      let handler = this.torrentHandlers.get(
        hexHash(event.progress.torrent_hash),
      );
      if (handler) {
        handler(event.progress);
      }
      return;
    }
    if (event.type == "alltorrents" && this.allTorrentsPromise) {
      try {
        this.allTorrentsPromise(event.torrents);
      } catch (_) {}
      this.allTorrentsPromise = undefined;
    }
    if (event.type == "connected") {
      tracing.info("established ws connection to the server");
    }
  }

  async subscribeTorrents() {
    await this.ready;
    let { promise, resolve } =
      Promise.withResolvers<Schemas["TorrentState"][]>();
    this.allTorrentsPromise = resolve;
    this.send({ type: "torrentsubscribe" });
    return await promise;
  }

  unsubcribeTorents() {
    this.send({ type: "torrentunsubscribe" });
  }

  private send(message: Schemas["WsRequest"]) {
    try {
      this.socket.send(JSON.stringify(message));
    } catch (e) {
      tracing.error("Failed to send ws request", e);
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

  setTorrentHandler(
    hash: string,
    handler: (progress: Schemas["TorrentProgress"]) => void,
  ) {
    this.torrentHandlers.set(hash, handler);
  }

  removeTorrentHandler(hash: string) {
    this.torrentHandlers.delete(hash);
  }
}
