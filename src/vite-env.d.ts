/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of eventa-api, including the `/api/v1` prefix. */
  readonly VITE_API_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
