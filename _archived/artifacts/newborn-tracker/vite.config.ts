import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { fileURLToPath } from "url";

// import.meta.dirname requires Node 21+; this works on Node 18+
const _dirname = path.dirname(fileURLToPath(import.meta.url));

const port = Number(process.env.PORT || "3000");
const basePath = process.env.BASE_PATH || "/";
const isReplit = process.env.REPL_ID !== undefined;
const isDev = process.env.NODE_ENV !== "production";

// Only load Replit plugins when actually running on Replit.
// On Vercel (or any non-Replit env) these packages may not import cleanly
// and would crash the entire build.
const replitPlugins = isReplit
  ? [
      (await import("@replit/vite-plugin-runtime-error-modal")).default(),
      ...(isDev
        ? [
            await import("@replit/vite-plugin-cartographer").then((m) =>
              m.cartographer({ root: path.resolve(_dirname, "..") }),
            ),
            await import("@replit/vite-plugin-dev-banner").then((m) =>
              m.devBanner(),
            ),
          ]
        : []),
    ]
  : [];

export default defineConfig({
  base: basePath,
  plugins: [react(), tailwindcss(), ...replitPlugins],
  resolve: {
    alias: {
      "@": path.resolve(_dirname, "src"),
      "@assets": path.resolve(_dirname, "..", "..", "attached_assets"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(_dirname),
  build: {
    outDir: path.resolve(_dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    port,
    strictPort: true,
    host: "0.0.0.0",
    allowedHosts: true,
    fs: {
      strict: true,
    },
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
