/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,

  images: {
    domains: [
      'localhost',
      'socialsphere.local',
      'images.unsplash.com',
      'pbs.twimg.com',
      'avatars.githubusercontent.com',
    ],
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '9000',
        pathname: '/socialsphere/**',
      },
    ],
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // ⚠️ TRAINING: These headers intentionally missing for labs
          // 🔒 SECURE: Uncomment for production
          // { key: 'X-Frame-Options', value: 'DENY' },
          // { key: 'X-Content-Type-Options', value: 'nosniff' },
          // { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },

  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/:path*`,
      },
    ];
  },

  // Expose training mode to client
  env: {
    NEXT_PUBLIC_MODE: process.env.NEXT_PUBLIC_MODE || 'training',
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:4000',
  },
};

module.exports = nextConfig;
