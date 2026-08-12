import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Dashboard — Tembera",
};

// Admin sits OUTSIDE the (site) route group, so it gets none of the public app
// shell. This layout deliberately does NOT guard — it also wraps /admin/login.
// Every non-login page calls `await requireAdmin()` itself and renders the
// <AdminShell> chrome (sidebar + nav). The login page renders bare.
export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
