/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  output: 'standalone',
  basePath: '/matchcountdown',
  assetPrefix: '/matchcountdown',
}

module.exports = nextConfig 