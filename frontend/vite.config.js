import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
    server: {
        port: 3000,
        host: true,
        proxy: {
            "/api": {
                target: "http://localhost:5134",
                changeOrigin: true,
            },
            "/hubs": {
                target: "http://localhost:5134",
                ws: true,
                changeOrigin: true,
            },
        },
    },
    build: {
        outDir: "dist",
        sourcemap: false,
        rollupOptions: {
            output: {
                manualChunks: function (id) {
                    if (id.includes("node_modules")) {
                        if (id.includes("@heroui") || id.includes("framer-motion")) {
                            return "vendor-ui";
                        }
                        return "vendor";
                    }
                },
            },
        },
    },
});
