import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  devIndicators: false,
  images: {
    remotePatterns: [
      {
        hostname: 'pokeapi.co',
        protocol: 'https',
      },
      {
        hostname: 'raw.githubusercontent.com',
        protocol: 'https',
      }
    ]
  }
};

export default nextConfig;
