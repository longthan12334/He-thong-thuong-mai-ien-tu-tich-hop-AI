/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  output: 'standalone',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
