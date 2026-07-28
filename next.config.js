/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,

  experimental: {
    serverComponentsExternalPackages: ['knex', 'pg', 'argon2', 'express'],
  },

  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push(
        'oracledb',
        'mariadb/callback',
        'mariadb',
        'mysql',
        'mysql2',
        'sqlite3',
        'tedious',
        'pg-query-stream',
        'better-sqlite3'
      );
    }
    return config;
  },

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
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },

  async rewrites() {
    return [];
  },

  // Expose training mode to client
  env: {
    NEXT_PUBLIC_MODE: process.env.NEXT_PUBLIC_MODE || 'training',
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || '/api',
  },
};

module.exports = nextConfig;
