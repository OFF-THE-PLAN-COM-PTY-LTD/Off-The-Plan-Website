/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    // Router Cache lifetimes (client-side). Was 0/0, which disabled the cache
    // entirely so every back/forward or re-visit re-ran all server queries —
    // the main reason admin screen-switching felt slow. 30s lets navigation
    // reuse the cached view; mutation flows call router.refresh() so edits
    // still show immediately (see listing form / row actions).
    staleTimes: {
      dynamic: 30,
      static: 180,
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "s3.ap-southeast-2.amazonaws.com",
      },
    ],
  },
};

export default nextConfig;
