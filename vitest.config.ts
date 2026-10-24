import { defineConfig } from "vitest/config";
import { loadEnv } from "vite";
import { fileURLToPath } from "node:url";

// Vitest does not load .env.local into process.env the way Next.js does, so the
// Postgres integration test (skipped when DATABASE_URL is missing) can't see it
// by default. loadEnv(mode, dir, "") reads .env, .env.local, .env.<mode> and
// .env.<mode>.local with no prefix filter; "test" is the mode vitest runs under.
// ("local" is rejected by Vite because it collides with the .local suffix.)
const env = loadEnv("test", process.cwd(), "");
for (const key of ["DATABASE_URL", "DATABASE_URL_UNPOOLED"]) {
  if (env[key] && !process.env[key]) process.env[key] = env[key];
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
