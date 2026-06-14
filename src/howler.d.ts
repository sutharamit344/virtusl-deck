import type { Howl } from "howler";

declare global {
  interface Window {
    Howler?: {
      ctx?: AudioContext;
    };
  }
}

export {};
