// next.config.mjs

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:5000/api/:path*', // Proxy to Flask backend
        cookiePathRewrite: { // Rewrite cookie paths from the backend
          '/api/': '/', // Example: if Flask sets a cookie with Path=/api/, rewrite to Path=/
          '*': '/' // Catch-all to rewrite any other paths to root
        }
      },
    ];
  },
};

export default nextConfig;