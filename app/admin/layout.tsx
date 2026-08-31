import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Dashboard — Tembera",
};

// Admin sits OUTSIDE the (site) route group, so it gets none of the public app
// shell. There is no separate admin sign-in: everyone signs in at /login and
// is routed to their own dashboard by role, so the (dash) layout below can
// guard the whole area in one place.
export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
