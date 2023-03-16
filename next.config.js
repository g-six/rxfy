/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  images: {
    remotePatterns: [{
      protocol: 'https',
      hostname: 'leagent-strapi-dev-s3.s3.us-west-2.amazonaws.com'
    }, {
      protocol: 'https',
      hostname: 'leagent-strapi-s3.s3.us-west-2.amazonaws.com'
    }]
  }
}

module.exports = nextConfig
