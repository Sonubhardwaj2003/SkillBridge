import React, { useEffect, useState } from "react";

const DISMISS_KEY = "skillbridge_install_dismissed";

const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Don't show again this session if the user already dismissed it once
    if (sessionStorage.getItem(DISMISS_KEY)) return;

    // Already running as an installed app? Nothing to show.
    if (window.matchMedia("(display-mode: standalone)").matches) return;

    const handler = (e) => {
      e.preventDefault(); // stop the browser's default mini-infobar
      setDeferredPrompt(e);
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    // Whether accepted or dismissed, the browser won't refire this event
    // until conditions change again, so just clean up either way.
    setDeferredPrompt(null);
    setVisible(false);
  };

  const handleDismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, "1");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-md animate-fade-in">
      <div className="card p-4 flex items-center gap-3 shadow-glow border-amber/30">
        <span className="w-10 h-10 rounded-lg bg-amber/15 flex items-center justify-center shrink-0 text-lg">
          ✨
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-chalk">Install SkillBridge</p>
          <p className="text-xs text-muted">Add it to your home screen for quick access.</p>
        </div>
        <button onClick={handleDismiss} className="text-xs text-muted hover:text-chalk px-2 py-1 shrink-0">
          Not now
        </button>
        <button onClick={handleInstall} className="btn-primary text-xs !px-3 !py-1.5 shrink-0">
          Install
        </button>
      </div>
    </div>
  );
};

export default InstallPrompt;
