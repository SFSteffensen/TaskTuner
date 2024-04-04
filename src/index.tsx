import { createSignal } from "solid-js";
import { render } from "solid-js/web";
import { Router, Route } from "@solidjs/router";

import "./styles.css";
import Login from "./Routes/Login.tsx";
import DashBoard from "./Routes/DashBoard.tsx";
import NotFound from "./Routes/404.tsx";


render(() => (
  <Router>
    <Route path={"/"} component={() => <DashBoard  />} />
    <Route path={"/login"} component={() => <Login  />} />
    <Route path={"*404"} component={NotFound} />
  </Router>
), document.getElementById("root") as HTMLElement);
