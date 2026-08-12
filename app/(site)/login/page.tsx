import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import LoginForm from "./LoginForm";

// Already signed in? There's nothing to do on the login screen — send them to
// their profile.
export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/profile");
  return <LoginForm />;
}
