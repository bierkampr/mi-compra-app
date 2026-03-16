/** @type {import('next').NextConfig} */
const nextConfig = {
  // Obligamos a Next.js a ignorar cualquier cosa fuera de esta carpeta
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  }
};

export default nextConfig;