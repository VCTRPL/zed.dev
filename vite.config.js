import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // three.js lives in its own lazy chunk (~520 kB) that loads only near the 3D card
  build: { chunkSizeWarningLimit: 600 },
});
