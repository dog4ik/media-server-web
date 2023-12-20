import { ErrorBoundary, ParentProps, Show, Suspense } from "solid-js";
import NotificationsProvider from "./context/NotificationContext";
import NavBar from "./components/NavBar";
import PageLayout from "./layouts/PageLayout";
import ServerStatusProvider from "./context/ServerStatusContext";
import ServerNotAvailable from "./pages/ServerNotAvailable";
import BackdropProvider from "./context/BackdropContext";
import { useLocation } from "@solidjs/router";

export default function Layout(props: ParentProps) {
  let location = useLocation();
  return (
    <div class="bg-black p-2 flex gap-2 overflow-hidden max-h-screen">
      <NotificationsProvider>
        <ServerStatusProvider>
          <Show when={!location.pathname.startsWith("/watch")}>
            <NavBar />
          </Show>
          <BackdropProvider>
            <PageLayout>{props.children}</PageLayout>
          </BackdropProvider>
        </ServerStatusProvider>
      </NotificationsProvider>
    </div>
  );
}
