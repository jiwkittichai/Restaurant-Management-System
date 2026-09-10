import { networkInterfaces } from "node:os";

// QR links use the machine's LAN address; Next dev must also serve its scripts
// to those exact hosts. Never use a wildcard for development origins.
const localDevHosts = Object.values(networkInterfaces()).flatMap(addresses =>
  (addresses || []).filter(address => address.family === "IPv4" && !address.internal).map(address => address.address)
);
const qrPublicHost = process.env.QR_PUBLIC_BASE_URL ? new URL(process.env.QR_PUBLIC_BASE_URL).hostname : null;

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: [...new Set([...localDevHosts, ...(qrPublicHost ? [qrPublicHost] : [])])],
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