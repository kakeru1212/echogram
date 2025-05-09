/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  images: {
    domains: [
      'scontent.fhnd7-1.fna.fbcdn.net',
    ],
  },
};

module.exports = nextConfig; 