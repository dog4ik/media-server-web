import { onCleanup } from "solid-js";
import { fullUrl, Schemas } from "./serverApi";
import tracing from "./tracing";
import { useServerStatus } from "@/context/ServerStatusContext";
import { UnavailableError } from "./errors";

type EventType = Schemas["Notification"];

type TaskProgressMap = {
  [T in EventType["task_type"]]: Extract<EventType, { task_type: T }>;
};

const BASE_RECONNECT_DELAY = 1_000;
const MAX_RECONNECT_DELAY = 30_000;

export class ServerConnection {
  private socket: WebSocket | undefined;
  private reconnectAttempts = 0;
  private reconnectTimeout: ReturnType<typeof setTimeout> | undefined = undefined;

  private handlers: {
    [T in keyof TaskProgressMap]?: ((progress: TaskProgressMap[T]) => void)[];
  };
  private torrentHandler:
    | ((v: Schemas["TorrentProgress"] | Schemas["SessionState"]) => void)
    | undefined;
  private connectedHandler: ((state: Schemas["TasksSnapshot"]) => void) | undefined;
  private allTorrentsPromise: ((torrents: Schemas["SessionState"]) => void) | undefined;
  private ready: Promise<void>;
  private readyRes: () => void;
  private wakeSubscribers: Set<() => void>;
  constructor() {
    this.handlers = {};
    this.torrentHandler = undefined;
    this.connectedHandler = undefined;
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

    tracing.debug({ attempts: this.reconnectAttempts }, `Scheduled ws reconnect in ${delay} ms`);

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
      const { task_type } = event.progress;
      let handlers = this.handlers[task_type];
      if (handlers) {
        for (let handler of handlers) {
          (handler as (progress: EventType) => void)(event.progress);
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
      tracing.info("Successfully received connect event from the server");
      if (this.connectedHandler) {
        this.connectedHandler(event.state);
      }
    }
  }

  async subscribeTorrents() {
    await Promise.race([
      this.ready,
      new Promise((res) => setTimeout(res, 5_000)).then(() => {
        throw new UnavailableError("Bittorrent timeout");
      }),
    ]);
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
      throw new UnavailableError("Websocket is not ready");
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
    if (!this.handlers[eventType]) {
      this.handlers[eventType] = [];
    }
    this.handlers[eventType]!.push(handler);
    onCleanup(() => this.removeProgressHandler(eventType, handler));
  }

  removeProgressHandler<T extends keyof TaskProgressMap>(
    eventType: T,
    handler: (progress: TaskProgressMap[T]) => void,
  ) {
    let handlers = this.handlers[eventType];
    if (!handlers) {
      tracing.warn("Event handler not found");
      return;
    }
    let idx = handlers.indexOf(handler as any);
    if (idx === -1) {
      tracing.warn("Event handler not found");
      return;
    }
    tracing.trace(`Removing event listener for ${eventType}`);
    handlers.splice(idx, 1);
  }

  setTorrentHandler(
    handler: (progress: Schemas["TorrentProgress"] | Schemas["SessionState"]) => void,
  ) {
    this.torrentHandler = handler;
  }

  removeTorrentHandler() {
    this.torrentHandler = undefined;
  }

  setConnectedHandler(handler: (state: Schemas["TasksSnapshot"]) => void) {
    this.connectedHandler = handler;
  }

  addWaker(callback: () => void) {
    if (this.socket?.readyState !== WebSocket.OPEN) {
      tracing.debug("Registered server wakeup handler");
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
