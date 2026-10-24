import { defineConfig } from "vitest/config";
import { loadEnv } from "vite";
import { fileURLToPath } from "node:url";

// Vitest does not load .env.local into process.env the way Next.js does.
// Only TEST_DATABASE_URL is passed through: the Postgres integration test drops
// and recreates every table, so it must never see the demo DATABASE_URL.
// loadEnv(mode, dir, "") reads .env, .env.local, .env.<mode> and
// .env.<mode>.local with no prefix filter; "test" is the mode vitest runs under.
const env = loadEnv("test", process.cwd(), "");
if (env.TEST_DATABASE_URL && !process.env.TEST_DATABASE_URL) {
  process.env.TEST_DATABASE_URL = env.TEST_DATABASE_URL;
}

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    include: ["src/**/*.test.ts", "tests/**/*.test.ts"],
    environment: "node",
  },
});
