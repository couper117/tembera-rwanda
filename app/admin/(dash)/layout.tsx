import AdminShell from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/auth";
import { ThemeProvider } from "@/lib/client/theme";
import { prisma } from "@/lib/prisma";
import { PENDING_SUBMISSIONS } from "@/lib/admin/placeholder";
import "../admin.css";

// Counts change with every approval, so the chrome cannot be cached.
export const dynamic = "force-dynamic";

/**
 * Every authenticated admin screen sits under this layout. The guard runs here
 * once instead of being repeated by each page as it was before, and the shell
 * is mounted once rather than re-wrapped nine times.
 *
 * /admin/login deliberately sits outside this group so it can render bare.
 */
export default async function AdminDashLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const admin = await requireAdmin();

  // Claims and bookings are real queues. Submissions still has no table, so
  // that badge counts the sample queue — the row itself is marked as sample in
  // the nav, so the number is never read as live.
  const [bookings, claims] = await Promise.all([
    prisma.booking.count({ where: { status: "pending" } }),
    prisma.businessClaim.count({ where: { status: "pending" } }),
  ]);

  return (
    <ThemeProvider>
      <AdminShell
        email={admin.email}
        name={admin.name}
        counts={{ submissions: PENDING_SUBMISSIONS, bookings, claims }}
      >
        {children}
      </AdminShell>
    </ThemeProvider>
  );
}
