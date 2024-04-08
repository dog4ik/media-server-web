import { ParentProps } from "solid-js";
import NotificationsProvider from "./context/NotificationContext";
import ServerStatusProvider from "./context/ServerStatusContext";
import BackdropProvider from "./context/BackdropContext";

export default function Layout(props: ParentProps) {
  return (
    <div class="flex max-h-screen gap-2 overflow-hidden">
      <NotificationsProvider>
        <ServerStatusProvider>
          <BackdropProvider>{props.children}</BackdropProvider>
        </ServerStatusProvider>
      </NotificationsProvider>
    </div>
  );
}
