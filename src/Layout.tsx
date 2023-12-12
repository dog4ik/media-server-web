import { ErrorBoundary, ParentProps, Suspense } from "solid-js";
import NotificationsProvider from "./context/NotificationContext";
import NavBar from "./components/NavBar";
import PageLayout from "./layouts/PageLayout";
import ServerStatusProvider from "./context/ServerStatusContext";
import ServerNotAvailable from "./pages/ServerNotAvailable";
import BackdropProvider from "./context/BackdropContext";

export default function Layout(props: ParentProps) {
  return (
    <div class="bg-black p-2 flex gap-2 overflow-hidden max-h-screen">
      <NotificationsProvider>
        <ServerStatusProvider>
          <NavBar />
          <BackdropProvider>
            <PageLayout>
              <ErrorBoundary
                fallback={(err, reset) => (
                  <ServerNotAvailable error={err} reset={reset} />
                )}
              >
                <Suspense fallback={<div>Loading...</div>}>
                  {props.children}
                </Suspense>
              </ErrorBoundary>
            </PageLayout>
          </BackdropProvider>
        </ServerStatusProvider>
      </NotificationsProvider>
    </div>
  );
}
