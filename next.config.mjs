/** @type {import('next').NextConfig} */
const nextConfig = {
  /**
   * Where the build goes.
   *
   * `next dev` and `next build` both write `.next` by default, so a production
   * build run while a dev server is up rips the ground out from under it: the
   * running server keeps its old routing manifest and server-action ids in
   * memory while serving freshly built client chunks off disk. What the browser
   * then reports is "Server Action was not found on the server", a 404 on a
   * route that exists, and "RSC payload created by a development version of
   * React ... while using a production version on the client" — three errors
   * that all look like application bugs and none of which are.
   *
   * scripts/serve.sh sets this so its builds land somewhere else entirely and
   * cannot touch a dev server's `.next`.
   */
  distDir: process.env.NEXT_DIST_DIR || ".next",

  // Legacy PHP kept for reference only — never build it.
  eslint: { ignoreDuringBuilds: false },
  images: {
    // The catalog pulls listing images straight from these CDNs.
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "images.pexels.com" },
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
