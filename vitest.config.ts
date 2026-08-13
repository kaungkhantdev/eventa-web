import { defineConfig } from 'vitest/config'
import { fileURLToPath, URL } from 'node:url'

/**
 * Unit tests for the RULES — mappers, formatting, permission gates — which are
 * plain functions and need no DOM. Markup is verified in the browser against
 * `../eventa-ui-kit`, not in jsdom; see AGENTS.md §"Test-driven development".
 */
export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    include: ['src/**/*.spec.ts'],
    environment: 'node',
    coverage: { include: ['src/**/*.ts'], exclude: ['src/**/*.spec.ts'] },
  },
})
