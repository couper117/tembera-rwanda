import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Dashboard — Tembera",
};

// Admin sits OUTSIDE the (site) route group, so it gets none of the app shell.
// It also keeps the legacy Bootstrap + FontAwesome dependencies that its markup
// relies on; those used to be loaded globally, which meant the public app paid
// for them on every page too.
export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-css-tags */}
      <link rel="stylesheet" href="/assets/bootstrap/css/bootstrap.min.css" />
      {/* eslint-disable-next-line @next/next/no-css-tags */}
      <link rel="stylesheet" href="/assets/css/admin.css" />
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
      />
      {children}
    </>
  );
}
