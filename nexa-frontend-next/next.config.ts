import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // reactCompiler: true, // reactCompiler is not yet standard in stable next.js types sometimes, keeping it commented if issues arise, or enable if on canary
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "8000",
        pathname: "/storage/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
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
