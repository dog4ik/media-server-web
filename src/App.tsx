import { Route, RouteLoadFuncArgs, Router } from "@solidjs/router";
import Home from "./pages/Home";
import Watch from "./pages/Watch";
import Dashboard from "./pages/Dashboard";
import Shows from "./pages/Shows";
import Movies from "./pages/Movies";
import Movie from "./pages/Movie";
import Show from "./pages/Show";
import Episode from "./pages/Episode";
import Torrent from "./pages/Torrent";
import Settings from "./pages/Settings";
import Logs from "./pages/Logs";
import Layout from "./Layout";
import { MetadataProvider, getAllShows, getShow } from "./utils/serverApi";
import Library from "./pages/Settings/Library";
import General from "./pages/Settings/General";
import Metadata from "./pages/Settings/Metadata";
import SettingsLayout from "./layouts/SettingsLayout";
import PageLayout from "./layouts/PageLayout";
import WatchLayout from "./layouts/WatchLayout";
import SearchPage from "./pages/Search";
import NotFound from "./pages/NotFound";

function loadShows() {
  getAllShows();
}

function loadShow({ params, location }: RouteLoadFuncArgs) {
  let provider = location.query.provider ?? "local";
  getShow(params.id, provider as MetadataProvider);
}

function App() {
  return (
    <Router root={Layout}>
      <Route path="/watch/" component={WatchLayout}>
        <Route path="/:video_id" component={Watch} />
      </Route>
      <Route path="/" component={PageLayout}>
        <Route path="/" component={Home} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/movies" component={Movies} />
        <Route path="/movies/:id" component={Movie} />
        <Route path="/shows" component={Shows} load={loadShows} />
        <Route path="/shows/:id" component={Show} load={loadShow} />
        <Route path="/shows/:id/:season/:episode" component={Episode} />
        <Route path="/torrent" component={Torrent} />
        <Route path="/settings" component={Settings} />
        <Route path="/search" component={SearchPage} />
        <Route path="/settings/*" component={SettingsLayout}>
          <Route path="/library" component={Library} />
          <Route path="/general" component={General} />
          <Route path="/metadata" component={Metadata} />
        </Route>
        <Route path="/logs" component={Logs} />
        <Route path="*" component={NotFound}></Route>
      </Route>
      <Route path="404*" component={NotFound}></Route>
    </Router>
  );
}

export default App;
