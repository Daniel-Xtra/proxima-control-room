import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  // Only API_BASE_URL is exposed besides the VITE_ variables, so other API_ settings never reach the browser.
  envPrefix: ["VITE_", "API_BASE_URL"],
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
});
