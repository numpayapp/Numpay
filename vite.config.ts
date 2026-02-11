import react from "@vitejs/plugin-react-swc";
import path from "path";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "favicon.svg", "main2.png"],
      workbox: {
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024, // 4 MB
      },
      manifest: {
        name: "NumPay",
        short_name: "NumPay",
        description: "NumPay - Financial Management Platform",
        theme_color: "#ffffff",
        background_color: "#ffffff",
        display: "standalone",
        scope: "/",
        id:"/",
        start_url: "/",
        icons: [
          {
            src: "/AppImages/android/android-launchericon-48-48.png",
            sizes: "48x48",
            type: "image/png",
          },
          {
            src: "/AppImages/android/android-launchericon-72-72.png",
            sizes: "72x72",
            type: "image/png",
          },
          {
            src: "/AppImages/android/android-launchericon-96-96.png",
            sizes: "96x96",
            type: "image/png",
          },
          {
            src: "/AppImages/android/android-launchericon-144-144.png",
            sizes: "144x144",
            type: "image/png",
          },
          {
            src: "/AppImages/android/android-launchericon-192-192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/AppImages/android/android-launchericon-512-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/AppImages/android/android-launchericon-512-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
    }),
  ],
}));