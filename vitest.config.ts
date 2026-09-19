import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./', import.meta.url)) },
  },
  // tsconfig sets jsx: "preserve" for Next's compiler, which leaves esbuild
  // with nothing to do and JSX unparsed in .tsx tests. Vitest needs the
  // automatic runtime spelled out here.
  esbuild: { jsx: 'automatic' },
  test: {
    environment: 'node',
    include: ['**/*.test.ts', '**/*.test.tsx'],
    exclude: ['node_modules/**', '.next/**'],
    server: { deps: { inline: ['next'] } },
  },
})
