import { redirect } from "next/navigation";
import { getCurrentUser, isStaff } from "@/lib/auth";
import AdminLoginForm from "./AdminLoginForm";
// Login sits outside the (dash) group, so it pulls the admin styles in itself.
import "../admin.css";

export const dynamic = "force-dynamic";

/**
 * Staff go straight to the dashboard; a signed-in visitor who is not staff is
 * told plainly that their account lacks access rather than being shown a form
 * their own credentials cannot get them through; everyone else gets the form.
 */
export default async function AdminLoginPage() {
  const user = await getCurrentUser();
  if (isStaff(user)) redirect("/admin");
  return <AdminLoginForm signedInEmail={user ? user.email : null} />;
}
