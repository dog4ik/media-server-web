import { ParentProps } from "solid-js";
import NotificationsProvider from "./context/NotificationContext";
import ServerStatusProvider from "./context/ServerStatusContext";
import BackdropProvider from "./context/BackdropContext";
import { MetaProvider } from "@solidjs/meta";
import Title from "./utils/Title";
import NavigationProvider from "./context/NavigationContext";

export default function Layout(props: ParentProps) {
  return (
    <div class="flex max-h-screen gap-2 overflow-hidden">
      <MetaProvider>
        <NavigationProvider>
          <Title text="" />
          <NotificationsProvider>
            <ServerStatusProvider>
              <BackdropProvider>{props.children}</BackdropProvider>
            </ServerStatusProvider>
          </NotificationsProvider>
        </NavigationProvider>
      </MetaProvider>
    </div>
  );
}
