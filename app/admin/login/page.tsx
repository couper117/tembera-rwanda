import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import AdminLoginForm from "./AdminLoginForm";

export const dynamic = "force-dynamic";

// Route admins straight to the dashboard; tell a signed-in non-admin clearly
// that their account lacks access; show the form to everyone else.
export default async function AdminLoginPage() {
  const user = await getCurrentUser();
  if (user?.role === "ADMIN") redirect("/admin");
  return <AdminLoginForm signedInEmail={user ? user.email : null} />;
}
