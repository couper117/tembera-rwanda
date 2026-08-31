import { redirect } from "next/navigation";
import BusinessShell from "@/components/business/BusinessShell";
import { ThemeProvider } from "@/lib/client/theme";
import { requireBusiness } from "@/lib/auth";
import { getMyBusiness, getMyPlaces, getMySubmissions } from "@/lib/data/business";
import "../../../admin/admin.css";

export const dynamic = "force-dynamic";

/**
 * Every business screen sits under this layout, so the guard runs once here
 * rather than being repeated — a screen added to this group is protected by
 * existing. As with the admin, this covers READS only: each action calls
 * requireBusiness() itself, because a server action is its own endpoint.
 */
export default async function BusinessDashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await requireBusiness();
  const business = await getMyBusiness(user.id);

  // An ADMIN is let through requireBusiness so staff can see what a business
  // sees, but they have no business of their own — send them somewhere useful
  // rather than rendering a dashboard with nothing in it.
  if (!business) redirect(user.role === "ADMIN" ? "/admin/businesses" : "/business");

  // Read once here for the sidebar summary, so every screen shows the same
  // figures without each fetching them again.
  const [places, submissions] = await Promise.all([
    getMyPlaces(business.id),
    getMySubmissions(business.id),
  ]);

  return (
    <ThemeProvider>
      <BusinessShell
        businessName={business.name}
        status={business.status}
        plan={business.plan}
        listings={places.length}
        pending={submissions.filter((s) => s.status === "pending").length}
        name={user.name}
        email={user.email}
        role={user.role}
      >
        {children}
      </BusinessShell>
    </ThemeProvider>
  );
}
