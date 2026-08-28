import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import { AppDemo } from "./AppDemo";
import { RadiusDemo } from "./RadiusDemo";
import { RadiusExport } from "./RadiusExport";
import { RadiusComposition } from "./RadiusComposition";
import { ThinnessComposition } from "./ThinnessComposition";
import { ReflectionComposition } from "./ReflectionComposition";
import "./styles.css";

const routes: Record<string, React.ComponentType> = {
  "/": App,
  "/app-demo": AppDemo,
  "/radius-demo": RadiusDemo,
  "/radius-export": RadiusExport,
  "/radius-composition": RadiusComposition,
  "/thinness-composition": ThinnessComposition,
  "/reflection-composition": ReflectionComposition,
};

const Root = routes[window.location.pathname] ?? App;

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
);
