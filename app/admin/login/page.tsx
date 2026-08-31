import AdminLoginForm from "./AdminLoginForm";
// Login sits outside the (dash) group, so it pulls the admin styles in itself.
import "../admin.css";

export const dynamic = "force-dynamic";

// Nobody can be signed in — there is no session store — so the form is always
// what renders. Submitting it explains that rather than pretending to fail.
export default async function AdminLoginPage() {
  return <AdminLoginForm signedInEmail={null} />;
}
