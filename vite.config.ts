import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  base: "/threejs-drive-3d/",
  plugins: [react()],
  // Rapier uses a WASM module; exclude it from pre-bundling and ensure WASM is treated as an asset
  optimizeDeps: {
    exclude: ["@dimforge/rapier3d-compat"],
  },
  assetsInclude: ["**/*.wasm"],
  build: {
    target: "esnext",
  },
});
