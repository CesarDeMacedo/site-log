import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Rendered server-side only (report route); bundling it breaks its internal
  // font/asset resolution, so it must stay external.
  serverExternalPackages: ["@react-pdf/renderer"],
};

export default nextConfig;
