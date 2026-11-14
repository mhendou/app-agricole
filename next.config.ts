import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Les polices du récap sont lues dans node_modules : à inclure dans le déploiement.
  outputFileTracingIncludes: {
    "/api/recap": [
      "./node_modules/@fontsource/fraunces/files/fraunces-latin-600-normal.woff",
      "./node_modules/@fontsource/inter/files/inter-latin-400-normal.woff",
      "./node_modules/@fontsource/inter/files/inter-latin-600-normal.woff",
    ],
  },
};

export default nextConfig;
