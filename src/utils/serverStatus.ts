import { onCleanup } from "solid-js";
import { fullUrl, Schemas } from "./serverApi";
import tracing from "./tracing";
import { useServerStatus } from "@/context/ServerStatusContext";

type EventType = Schemas["Notification"];

type TaskProgressMap = {
  [T in EventType["task_type"]]: Extract<EventType, { task_type: T }>;
};

const BASE_RECONNECT_DELAY = 1_000;
const MAX_RECONNECT_DELAY = 30_000;

export class ServerConnection {
  private socket: WebSocket | undefined;
  private reconnectAttempts = 0;
  private reconnectTimeout: ReturnType<typeof setTimeout> | undefined =
    undefined;

  private handlers: [
    keyof TaskProgressMap,
    (status: TaskProgressMap[keyof TaskProgressMap]) => void,
  ][];
  private torrentHandler:
    | ((v: Schemas["TorrentProgress"] | Schemas["SessionState"]) => void)
    | undefined;
  private allTorrentsPromise:
    | ((torrents: Schemas["SessionState"]) => void)
    | undefined;
  private ready: Promise<void>;
  private readyRes: () => void;
  private wakeSubscribers: Set<() => void>;
  constructor() {
    this.handlers = [];
    this.torrentHandler = undefined;
    this.connect();
    this.allTorrentsPromise = undefined;
    let { promise, resolve } = Promise.withResolvers<void>();
    this.ready = promise;
    this.readyRes = resolve;
    this.wakeSubscribers = new Set();
  }

  connect() {
    this.socket = new WebSocket(fullUrl("/api/ws", {}));
    this.socket.addEventListener("open", () => {
      tracing.info(
        { attempts: this.reconnectAttempts },
        "Established websocket connection to the server",
      );
      this.reconnectAttempts = 0;
      this.onOpen();
    });

    this.socket.addEventListener("message", this.onMessage.bind(this));

    this.socket.addEventListener("close", () => {
      this.scheduleReconnect();
    });
    this.socket.addEventListener("error", () => {
      this.scheduleReconnect();
    });
  }

  private scheduleReconnect() {
    if (this.reconnectTimeout) return;

    const delay = Math.min(
      BASE_RECONNECT_DELAY * Math.pow(2, this.reconnectAttempts),
      MAX_RECONNECT_DELAY,
    );

    tracing.debug(
      { attempts: this.reconnectAttempts },
      `Scheduled ws reconnect in ${delay} ms`,
    );

    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = undefined;
      this.reconnectAttempts += 1;
      this.connect();
    }, delay);
  }

  private onOpen() {
    tracing.trace("Socket is ready");
    if (this.torrentHandler !== undefined) {
      tracing.debug(`WS reconnect requests full torrent session state`);
      this.send({ type: "torrentsubscribe" });
    }
    this.readyRes();
    for (let waker of this.wakeSubscribers) {
      waker();
      tracing.trace("Executed waker callback");
    }
  }
  private onMessage(msg: MessageEvent<any>) {
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
      if (this.torrentHandler) {
        this.torrentHandler(event.progress);
      }
      return;
    }
    if (event.type == "torrentsessionstate") {
      tracing.trace("Got full session state");
      if (this.allTorrentsPromise) {
        try {
          this.allTorrentsPromise(event.session);
        } catch (_) {}
        this.allTorrentsPromise = undefined;
      } else if (this.torrentHandler !== undefined) {
        tracing.trace(`Dispatched reconnection torrent state`);
        this.torrentHandler(event.session);
      }
    }
    if (event.type == "connected") {
      tracing.info("Successfuly received connect event from the server");
    }
  }

  async subscribeTorrents() {
    await this.ready;
    let { promise, resolve } = Promise.withResolvers<Schemas["SessionState"]>();
    this.allTorrentsPromise = resolve;
    this.send({ type: "torrentsubscribe" });
    return await promise;
  }

  unsubscribeTorrents() {
    this.send({ type: "torrentunsubscribe" });
  }

  async trackWatchSession(task_id: string) {
    this.send({ type: "trackwatchsession", task_id });
  }

  private send(message: Schemas["WsRequest"]) {
    if (this.socket && this.socket.readyState == this.socket.OPEN) {
      try {
        tracing.trace("Sent socket message");
        this.socket.send(JSON.stringify(message));
      } catch (e) {
        tracing.error({ error: e }, "Failed to send ws request");
      }
    } else {
      tracing.warn("Socket is not ready, message is not sent");
    }
  }

  close() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = undefined;
    }
    this.socket?.close();
  }

  addProgressHandler<T extends keyof TaskProgressMap>(
    eventType: T,
    handler: (progress: TaskProgressMap[T]) => void,
  ) {
    tracing.trace(`Adding progress handler for ${eventType}`);
    this.handlers.push([eventType, handler as any]);
    onCleanup(() => this.removeProgressHandler(handler));
  }

  removeProgressHandler<T extends keyof TaskProgressMap>(
    handler: (progress: TaskProgressMap[T]) => void,
  ) {
    let idx = this.handlers.findIndex(([_, h]) => h == handler);
    if (idx === -1) {
      tracing.warn("Event handler not found");
      return;
    }
    tracing.trace(`Removing event listener for ${this.handlers[idx][0]}`);
    this.handlers.splice(idx, 1);
    this.handlers = this.handlers.filter(([_, h]) => h != handler);
  }

  setTorrentHandler(
    handler: (
      progress: Schemas["TorrentProgress"] | Schemas["SessionState"],
    ) => void,
  ) {
    this.torrentHandler = handler;
  }

  removeTorrentHandler() {
    this.torrentHandler = undefined;
  }

  addWaker(callback: () => void) {
    if (this.socket?.readyState !== WebSocket.OPEN) {
      tracing.debug("Registered server wakeup handler")
      this.wakeSubscribers.add(callback);
    } else {
      callback();
      tracing.error(`Redundant waker add`);
    }
  }
  removeWaker(callback: () => void) {
    this.wakeSubscribers.delete(callback);
  }
}

export function onServerWakeup(callback: () => void) {
  let [{ serverStatus }] = useServerStatus();
  serverStatus.addWaker(callback);
  onCleanup(() => {
    serverStatus.removeWaker(callback);
  });
}
