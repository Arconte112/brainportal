/** @type {import('next').NextConfig} */
// Force Node.js timezone to Santo Domingo, Dominican Republic
process.env.TZ = 'America/Santo_Domingo';
const nextConfig = {
  // Expose timezone to client-side code
  env: {
    NEXT_PUBLIC_TIME_ZONE: 'America/Santo_Domingo',
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  output: 'standalone',
}

export default nextConfig
