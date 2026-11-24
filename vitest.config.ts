import { defineConfig } from "vitest/config";
import { readFileSync } from "node:fs";

const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));

export default defineConfig({
  define: { __APP_VERSION__: JSON.stringify(version) },
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    restoreMocks: true,
    clearMocks: true,
  },
});
