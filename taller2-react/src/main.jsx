import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

// Estilos de terceros primero, luego los propios, para que el CSS
// propio pueda sobrescribir a Bootstrap cuando haga falta.
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./index.css";

import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
