/* @refresh reload */
import { render } from "solid-js/web";

import App from "./App";
import { Router } from "@solidjs/router";
import "./index.css"

const root = document.getElementById("root");

render(
  () => (
    <Router>
      <App />
    </Router>
  ),
  root!,
);
