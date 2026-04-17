import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import { PortalRoutes } from "./routes/PortalRoutes";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <PortalRoutes />
    </BrowserRouter>
  </React.StrictMode>
);
