import { Route, RouteLoadFuncArgs, Router } from "@solidjs/router";
import Home from "./pages/Home";
import Watch from "./pages/Watch";
import Dashboard from "./pages/Dashboard";
import Shows from "./pages/Shows";
import Movies from "./pages/Movies";
import Show from "./pages/Show";
import Episode from "./pages/Episode";
import Torrent from "./pages/Torrent";
import Settings from "./pages/Settings";
import Logs from "./pages/Logs";
import Layout from "./Layout";
import { getCachedAllShows, getCachedShowById } from "./utils/cachedApi";

function loadShows() {
  void getCachedAllShows();
}

function loadShow({ params }: RouteLoadFuncArgs) {
  void getCachedShowById(+params.show_id);
}

function App() {
  return (
    <Router root={Layout}>
      <Route path="/" component={Home} />
      <Route path="/watch/:video_id" component={Watch} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/movies" component={Movies} />
      <Route path="/movie/:movie_id" component={Movies} />
      <Route path="/shows" component={Shows} load={loadShows} />
      <Route path="/shows/:show_id" component={Show} load={loadShow} />
      <Route path="/shows/:show_id/:season/:episode" component={Episode} />
      <Route path="/torrent" component={Torrent} />
      <Route path="/settings" component={Settings} />
      <Route path="/logs" component={Logs} />
    </Router>
  );
}

export default App;
