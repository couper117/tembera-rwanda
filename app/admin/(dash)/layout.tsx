import AdminShell from "@/components/admin/AdminShell";
import { ThemeProvider } from "@/lib/client/theme";
import { PENDING_SUBMISSIONS } from "@/lib/admin/placeholder";
import { requireStaff } from "@/lib/auth";
import "../admin.css";

// Counts change with every approval, so the chrome cannot be cached.
export const dynamic = "force-dynamic";

/**
 * Every admin screen sits under this layout, which makes it the one place that
 * gates the whole dashboard. The guard runs here rather than being repeated by
 * each page, so a new screen added to this group is protected by existing.
 *
 * This covers READS. It does not cover writes: a server action is a POST
 * endpoint reachable by anyone who can craft a request, whether or not the
 * button that calls it was ever rendered. Every mutating action therefore
 * calls requireStaff() or requireAdmin() as its own first line.
 *
 * ADMIN and EDITOR both get in. The screens only an ADMIN may use — accounts,
 * roles, settings, business standing — enforce that themselves via
 * requireAdmin(); the nav hides them, but hiding is presentation, not
 * permission.
 */
export default async function AdminDashLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const staff = await requireStaff();

  return (
    <ThemeProvider>
      <AdminShell
        email={staff.email}
        name={staff.name}
        role={staff.role}
        counts={{ submissions: PENDING_SUBMISSIONS }}
      >
        {children}
      </AdminShell>
    </ThemeProvider>
  );
}
