/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "192.168.1.100", // IP server
        port: "9000",
        pathname: "/products/**",
      },
    ],
  },
};

module.exports = nextConfig;