import AdminShell from "@/components/admin/AdminShell";
import { ThemeProvider } from "@/lib/client/theme";
import { BOOKINGS, CURRENT_ADMIN, PENDING_SUBMISSIONS } from "@/lib/admin/placeholder";
import "../admin.css";

// Counts change with every approval, so the chrome cannot be cached.
export const dynamic = "force-dynamic";

/**
 * Every admin screen sits under this layout, so the shell is mounted once
 * rather than re-wrapped nine times.
 *
 * There is no auth guard here any more: this build has no session store, so
 * there is nothing to check and nothing to protect — every admin screen is
 * read-only sample data. A real deployment must put the guard back here, which
 * is the one place that covers the whole group.
 *
 * /admin/login deliberately sits outside this group so it can render bare.
 */
export default async function AdminDashLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const admin = CURRENT_ADMIN;
  const bookings = BOOKINGS.filter((b) => b.status === "pending").length;

  return (
    <ThemeProvider>
      <AdminShell
        email={admin.email}
        name={admin.name}
        counts={{ submissions: PENDING_SUBMISSIONS, bookings }}
      >
        {children}
      </AdminShell>
    </ThemeProvider>
  );
}
