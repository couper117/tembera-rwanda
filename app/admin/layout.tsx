import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Dashboard — Visit Rwanda",
};

// Admin sits OUTSIDE the (site) route group, so it does not get the public
// Nav / Footer / Preloader chrome.
export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-css-tags */}
      <link rel="stylesheet" href="/assets/css/admin.css" />
      {children}
    </>
  );
}
