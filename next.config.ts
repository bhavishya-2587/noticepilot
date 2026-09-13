import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["tesseract.js", "tesseract.js-core"],
  outputFileTracingIncludes: {
    "/api/notices/ingest": [
      "./node_modules/tesseract.js/src/worker-script/**/*",
    ],
  },
};

export default nextConfig;