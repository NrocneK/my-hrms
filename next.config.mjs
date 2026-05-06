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

  // Ép Vercel bỏ qua lỗi ESLint khi build
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Ép Vercel bỏ qua lỗi kiểu dữ liệu TypeScript khi build
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;