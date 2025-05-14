import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:5000/api/:path*',
      },
      {
        source: '/forum/api/:path*',
        destination: 'http://localhost:5000/forum/api/:path*',
      },
      {
        source: '/static/:path*',
        destination: 'http://localhost:5000/static/:path*',
      },
    ];
  },
};

export default nextConfig;
