/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    staleTimes: {
      dynamic: 0,
      static: 0,
    },
    // isomorphic-dompurify depends on jsdom, which reads asset files (e.g.
    // default-stylesheet.css) from its own package dir at runtime. Bundling it
    // into the server output breaks that lookup (ENOENT during page-data
    // collection), so keep it external and load it from node_modules instead.
    serverComponentsExternalPackages: ["isomorphic-dompurify"],
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
