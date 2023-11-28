import { Route, Routes } from "@solidjs/router";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Shows from "./pages/Shows";
import Movies from "./pages/Movies";
import Show from "./pages/Show";
import Episode from "./pages/Episode";
import Torrent from "./pages/Torrent";
import Settings from "./pages/Settings";
import Logs from "./pages/Logs";
import NavBar from "./components/NavBar";
import PageLayout from "./layouts/PageLayout";
import TaskContextProvider from "./context/ProgressContext";
import NotificationsProvider from "./context/NotificationContext";

function App() {
  return (
    <>
      <main class="bg-black p-2 flex gap-2 overflow-hidden max-h-screen">
        <NotificationsProvider>
          <TaskContextProvider>
            <NavBar />
            <PageLayout>
              <Routes>
                <Route path="/" component={Home} />
                <Route path="/dashboard" component={Dashboard} />
                <Route path="/movies" component={Movies} />
                <Route path="/shows" component={Shows} />
                <Route path="/shows/:show_id" component={Show} />
                <Route
                  path="/shows/:show_id/:season/:episode"
                  component={Episode}
                />
                <Route path="/torrent" component={Torrent} />
                <Route path="/settings" component={Settings} />
                <Route path="/logs" component={Logs} />
              </Routes>
            </PageLayout>
          </TaskContextProvider>
        </NotificationsProvider>
      </main>
    </>
  );
}

export default App;
