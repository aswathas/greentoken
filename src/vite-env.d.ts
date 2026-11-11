/// <reference types="vite/client" />

/**
 * Vite injects `import.meta.env.*` at build time. The API base URL is
 * configurable so the same build can point at a different Worker.
 */
interface ImportMetaEnv {
  readonly VITE_API_BASE?: string;
}
