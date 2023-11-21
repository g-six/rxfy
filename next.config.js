/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  async rewrites() {
    return {
      afterFiles: [
      {
        source: '/opensearch/:path*',
        destination: '/api/opensearch/:path*',
      },
      ]
    }
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
      {
        protocol: 'https',
        hostname: 's3.us-west-2.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: 'api.mapbox.com',
      },
    ],
  },
};

module.exports = nextConfig;
