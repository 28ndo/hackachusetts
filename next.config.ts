import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  images: {
    // Demo photos link to the city's Cloudinary host (Open311 media). We never re-host.
    remotePatterns: [
      { protocol: "https", hostname: "spot-boston-res.cloudinary.com" },
    ],
  },
};

export default nextConfig;
