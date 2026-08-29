import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { registerSW } from "virtual:pwa-register";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { SocketProvider } from "./context/SocketContext.jsx";
import "./index.css";

// --- PWA update handling ---
// Installed (desktop/mobile) app windows tend to stay open for a long time
// and rarely trigger a fresh navigation, so the browser's own lazy/throttled
// service-worker update check often doesn't run for them - that's why
// deploying new code shows up instantly in a browser tab (which re-checks on
// most reloads) but never reaches an already-installed app window.
//
// Fix: register the service worker ourselves, then force an explicit
// update check every 60s AND whenever the app regains focus/visibility.
// registerType: "autoUpdate" (set in vite.config.js) means once a new
// service worker is found, it activates automatically - we just also
// reload the page so the new build is actually used right away.
if ("serviceWorker" in navigator) {
  const updateSW = registerSW({
    onRegisteredSW(_swUrl, registration) {
      if (!registration) return;

      setInterval(() => {
        registration.update();
      }, 60 * 1000);

      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") {
          registration.update();
        }
      });
    },
    onNeedRefresh() {
      updateSW(true);
    },
  });
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <App />
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
