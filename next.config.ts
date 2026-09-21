import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  serverExternalPackages: ["pg-boss", "puppeteer", "qrcode"],
};

export default nextConfig;
