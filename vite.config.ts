import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"],
  },
  ssgOptions: {
    /**
     * nested: each route gets its own index.html
     *   /        → dist/index.html
     *   /learn   → dist/learn/index.html   ← required by the task
     *   /learn/x → dist/learn/x/index.html
     */
    dirStyle: 'nested',
    includedRoutes(paths) {
      // Always include the landing page, the /learn hub, and every article
      return paths.filter(p => p === '/' || p === '/learn' || p.startsWith('/learn/'));
    },
  }
}));
