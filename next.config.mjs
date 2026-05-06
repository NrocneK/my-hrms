/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "*.cloudinary.com" },
    ],
  },

  logging: {
    fetches: { fullUrl: false },
  },

  // Tối ưu bundle size
  experimental: {
    optimizePackageImports: ["recharts", "xlsx"],
  },
};

export default nextConfig;
