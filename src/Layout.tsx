import type { ParentProps } from "solid-js";
import BackdropProvider from "./context/BackdropContext";
import NotificationsProvider from "./context/NotificationContext";
import ServerStatusProvider from "./context/ServerStatusContext";
import { applyTheme, loadSavedTheme } from "./lib/themes";

let saved = loadSavedTheme();
if (saved) applyTheme(saved.vars);

export default function Layout(props: ParentProps) {
  return (
    <NotificationsProvider>
      <ServerStatusProvider>
        <BackdropProvider>{props.children}</BackdropProvider>
      </ServerStatusProvider>
    </NotificationsProvider>
  );
}
