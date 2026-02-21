type PromiseWithResolvers = <T>() => {
  promise: Promise<T>;
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason?: unknown) => void;
};

// Polyfill for Promise.withResolvers (ES2024) – required by pdfjs-dist on iOS Safari & older browsers
const promiseWithResolvers = Promise as PromiseConstructor & {
  withResolvers?: PromiseWithResolvers;
};

if (typeof promiseWithResolvers.withResolvers === "undefined") {
  promiseWithResolvers.withResolvers = function <T>() {
    let resolve!: (value: T | PromiseLike<T>) => void;
    let reject!: (reason?: unknown) => void;
    const promise = new Promise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve, reject };
  };
}

import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App.tsx";
import "./index.css";

registerSW({
  immediate: true,
  onRegisteredSW(swScriptUrl) {
    console.info("Service Worker registriert:", swScriptUrl);
  },
  onRegisterError(error) {
    console.error("Service Worker Registrierung fehlgeschlagen", error);
  },
});

createRoot(document.getElementById("root")!).render(<App />);
