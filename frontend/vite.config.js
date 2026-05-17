import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiUrl = env.VITE_API_URL || "http://localhost:4000";

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        "/api": {
          target: apiUrl,
          changeOrigin: true,
        },
        "/socket.io": {
          target: apiUrl,
          changeOrigin: true,
          ws: true,
        },
      },
    },
    build: {
      outDir: "dist",
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ["react", "react-dom", "react-router-dom"],
            socket: ["socket.io-client"],
          },
        },
      },
    },
    define: {
      "import.meta.env.VITE_MIDTRANS_CLIENT_KEY": JSON.stringify(
        env.VITE_MIDTRANS_CLIENT_KEY || "",
      ),
      "import.meta.env.VITE_MIDTRANS_PRODUCTION": JSON.stringify(
        env.VITE_MIDTRANS_PRODUCTION || "false",
      ),
    },
  };
});

