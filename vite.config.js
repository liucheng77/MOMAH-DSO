import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Build output goes to /dist. Use `npm run build` then deploy dist/.
const BUILD = new Date().toISOString().slice(0, 16).replace("T", " ") + " UTC";

export default defineConfig({
  plugins: [react()],
  base: "./",
  define: { BUILD_STAMP: JSON.stringify(BUILD) },
  build: { outDir: "dist" },
});
