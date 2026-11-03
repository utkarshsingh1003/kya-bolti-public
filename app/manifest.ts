import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "क्या बोलती PUBLIC — जनता की बात, सबकी आवाज़",
    short_name: "Kya Bolti",
    description:
      "स्थानीय खबरें, जनप्रतिनिधि, नागरिक पोल और सरकारी योजनाओं की सरल जानकारी — हिंदी-पहले नागरिक मंच।",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#FFFAF3",
    theme_color: "#0A1F3A",
    lang: "hi",
    dir: "ltr",
    categories: ["news", "education", "government", "social"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "आज की खबरें", short_name: "खबरें", url: "/news", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "समस्या दर्ज करें", short_name: "समस्या", url: "/issues/new", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Public Saathi", short_name: "साथी", url: "/assistant", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
