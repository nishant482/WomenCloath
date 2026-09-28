import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";

const apiProxy = {
  target: "http://127.0.0.1:3001",
  configure(proxy) {
    proxy.on("error", (_error, _req, res) => {
      if (res.writeHead && !res.headersSent) {
        res.writeHead(503, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "The store server is temporarily unavailable. Please try again shortly." }));
      }
    });
  },
};
export default defineConfig({
  server: { strictPort: true, proxy: { "/api": apiProxy } },
  preview: { proxy: { "/api": apiProxy } },
  build: {
    rollupOptions: {
      input: {
        storefront: fileURLToPath(new URL("./index.html", import.meta.url)),
        admin: fileURLToPath(new URL("./admin/index.html", import.meta.url)),
      },
    },
  },
});
