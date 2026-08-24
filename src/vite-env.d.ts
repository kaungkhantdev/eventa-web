/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of eventa-api, including the `/api/v1` prefix. */
  readonly VITE_API_URL?: string
  /**
   * Google Maps Embed API key. Optional: without it the venue map falls back to
   * the keyless embed, so a fresh checkout still shows a map. Public by design —
   * an Embed key is restricted by HTTP referrer at Google's end, not by secrecy.
   */
  readonly VITE_GOOGLE_MAPS_EMBED_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
