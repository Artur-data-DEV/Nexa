import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // reactCompiler: true, // reactCompiler is not yet standard in stable next.js types sometimes, keeping it commented if issues arise, or enable if on canary
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "8000",
        pathname: "/storage/**",
      },
      {
        protocol: "https",
        hostname: "www.nexacreators.com",
        pathname: "/storage/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "img.icons8.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "storage.googleapis.com",
        pathname: "/nexa-uploads-prod/**",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [
          {
            type: "host",
            value: "nexacreators.com",
          },
        ],
        destination: "https://www.nexacreators.com/:path*",
        permanent: true,
      },
      {
        source: "/creator/payment-method",
        destination: "/dashboard/payment-methods",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
