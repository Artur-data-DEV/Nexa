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
        hostname: "nexa-backend2-1044548850970.southamerica-east1.run.app",
        pathname: "/storage/**",
      },
      {
        protocol: "https",
        hostname: "nexa-backend2-bwld7w5onq-rj.a.run.app",
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
      {
        protocol: "https",
        hostname: "via.placeholder.com",
        pathname: "/**",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/creator/payment-method",
        destination: "/dashboard/payment-methods",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
