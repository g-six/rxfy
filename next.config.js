/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'leagent-strapi-dev-s3.s3.us-west-2.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: 'leagent-strapi-s3.s3.us-west-2.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: 'e52tn40a.cdn.imgeng.in',
      },
    ],
  },
};

module.exports = nextConfig;
