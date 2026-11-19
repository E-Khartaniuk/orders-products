import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Inventory — Orders & Products",
    short_name: "Inventory",
    description: "Orders & Products inventory",
    id: "/",
    start_url: "/orders",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#f0f3f5",
    theme_color: "#8bc34a",
    lang: "ru",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/icons/icon.svg", sizes: "any", type: "image/svg+xml" },
    ],
  };
}
