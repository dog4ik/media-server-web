import { ParentProps } from "solid-js";
import NotificationsProvider from "./context/NotificationContext";
import ServerStatusProvider from "./context/ServerStatusContext";
import BackdropProvider from "./context/BackdropContext";
import { MetaProvider } from "@solidjs/meta";

export default function Layout(props: ParentProps) {
  return (
    <MetaProvider>
      <NotificationsProvider>
        <ServerStatusProvider>
          <BackdropProvider>{props.children}</BackdropProvider>
        </ServerStatusProvider>
      </NotificationsProvider>
    </MetaProvider>
  );
}
