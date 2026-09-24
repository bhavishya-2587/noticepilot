import { loadEnv } from "vite";
import { defineConfig } from "vitest/config";

const projectRoot = new URL("../", import.meta.url).pathname;
const environment = loadEnv("test", projectRoot, "");

if (environment.GROQ_API_KEY) {
  process.env.GROQ_API_KEY = environment.GROQ_API_KEY;
}

export default defineConfig({
  root: projectRoot,

  resolve: {
    alias: {
      "@": projectRoot,
      "server-only": new URL(
        "../test/server-only.ts",
        import.meta.url,
      ).pathname,
    },
  },

  test: {
    environment: "node",
    include: ["evaluation/intelligence-real-evaluation.test.ts"],
  },
});