import { ParentProps } from "solid-js";
import NotificationsProvider from "./context/NotificationContext";
import ServerStatusProvider from "./context/ServerStatusContext";
import BackdropProvider from "./context/BackdropContext";
import { MetaProvider } from "@solidjs/meta";
import Title from "./utils/Title";

export default function Layout(props: ParentProps) {
  return (
    <div class="flex max-h-screen gap-2 overflow-hidden">
      <MetaProvider>
        <Title text="" />
        <NotificationsProvider>
          <ServerStatusProvider>
            <BackdropProvider>{props.children}</BackdropProvider>
          </ServerStatusProvider>
        </NotificationsProvider>
      </MetaProvider>
    </div>
  );
}
