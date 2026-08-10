/** @type {import('next').NextConfig} */
const nextConfig = {
  // Legacy PHP kept for reference only — never build it.
  eslint: { ignoreDuringBuilds: false },
  images: {
    // The legacy site pulls hero/listing images straight from these CDNs.
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "upload.wikimedia.org" },
      { protocol: "https", hostname: "encrypted-tbn0.gstatic.com" },
      { protocol: "https", hostname: "i.assetzen.net" },
      { protocol: "https", hostname: "live.staticflickr.com" },
    ],
  },
};

export default nextConfig;
