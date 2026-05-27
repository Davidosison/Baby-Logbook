import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { fileURLToPath } from "url";

const _dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(_dirname, "src"),
      "@assets": path.resolve(_dirname, "attached_assets"),
    },
    dedupe: ["react", "react-dom"],
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          // React core — changes almost never, long cache lifetime
          "vendor-react": ["react", "react-dom"],
          // Radix UI / shadcn — large but stable
          "vendor-radix": [
            "@radix-ui/react-dialog",
            "@radix-ui/react-select",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-tooltip",
            "@radix-ui/react-popover",
            "@radix-ui/react-tabs",
          ],
          // Supabase + React Query — data layer
          "vendor-data": ["@supabase/supabase-js", "@tanstack/react-query"],
          // Animation + charts — only needed on certain pages
          "vendor-ui": ["framer-motion", "recharts"],
        },
      },
    },
  },
  server: {
    port: 5173,
    host: "0.0.0.0",
  },
});
