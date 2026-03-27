/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.rebrickable.com",
      },
      {
        protocol: "https",
        hostname: "img.bricklink.com",
      },
    ],
  },
};

module.exports = nextConfig;
