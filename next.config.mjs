/** @type {import('next').NextConfig} */
const nextConfig = {
  // Legacy PHP kept for reference only — never build it.
  eslint: { ignoreDuringBuilds: false },
  images: {
    // The catalog pulls listing images straight from these CDNs.
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "upload.wikimedia.org" },
      { protocol: "https", hostname: "encrypted-tbn0.gstatic.com" },
      { protocol: "https", hostname: "i.assetzen.net" },
      { protocol: "https", hostname: "live.staticflickr.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },

  // The old one-page-per-category routes are now views of a single catalog.
  // They stay linkable — bookmarks, the admin-managed collections and any
  // external links keep working — but resolve to the new category screens.
  async redirects() {
    // Keys are the legacy paths; values are groups in lib/places/taxonomy.ts.
    // Keep these in step with the taxonomy — a stale id here silently sends
    // old links to a 404.
    const map = {
      restaurants: "dining",
      homes: "stays",
      shops: "shopping",
      historics: "arts",
      wonders: "nature",
      playground: "recreation",
      gyms: "recreation",
      churches: "worship",
    };
    return Object.entries(map).map(([from, to]) => ({
      source: `/${from}`,
      destination: `/c/${to}`,
      permanent: true,
    }));
  },
};

export default nextConfig;
