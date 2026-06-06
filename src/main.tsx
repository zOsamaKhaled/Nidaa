import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AppProvider } from "./context/AppContext";
import { ReminderPopup } from "./components/ReminderPopup";
import { AzanPopup } from "./components/AzanPopup";
import "./i18n";
import "./styles/global.css";

const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);

// Popup windows load the same bundle with `?view=reminder|azan`. Render only the
// relevant popup there — no AppProvider/scheduler — so they stay lightweight and
// don't run a second background engine.
const view = new URLSearchParams(window.location.search).get("view");

if (view === "reminder") {
  root.render(
    <React.StrictMode>
      <ReminderPopup />
    </React.StrictMode>
  );
} else if (view === "azan") {
  root.render(
    <React.StrictMode>
      <AzanPopup />
    </React.StrictMode>
  );
} else {
  root.render(
    <React.StrictMode>
      <AppProvider>
        <App />
      </AppProvider>
    </React.StrictMode>
  );
}
