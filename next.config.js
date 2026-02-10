/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // Enable standalone output for Docker/Cloud Run
  webpack: (config) => {
    // Required for pdfjs-dist to work with Next.js
    config.resolve.alias.canvas = false;
    return config;
  },
};

module.exports = nextConfig;
