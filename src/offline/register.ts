export const PWA_UPDATE_AVAILABLE = "academix:pwa-update-available";
let waiting: ServiceWorkerRegistration | undefined;
export function waitingPwaUpdate() { return waiting; }

export function registerPwa(): void {
  if (!import.meta.env.PROD || !("serviceWorker" in navigator)) return;
  window.addEventListener("load", () => {
    void navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, {
      scope: import.meta.env.BASE_URL,
      updateViaCache: "none",
    }).then((registration) => {
      const announce = () => {
        if (!registration.waiting || !navigator.serviceWorker.controller) return;
        waiting = registration;
        window.dispatchEvent(new Event(PWA_UPDATE_AVAILABLE));
      };
      announce();
      registration.addEventListener("updatefound", () => {
        registration.installing?.addEventListener("statechange", announce);
      });
      window.addEventListener("online", () => { void registration.update().catch(() => undefined); });
      window.addEventListener("focus", () => { void registration.update().catch(() => undefined); });
      return registration.update();
    }).catch(() => {
      window.dispatchEvent(new CustomEvent("academix:pwa-error"));
    });
  }, { once: true });
}
