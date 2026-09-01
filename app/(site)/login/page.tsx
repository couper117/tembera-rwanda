import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import LoginForm from "./LoginForm";

// Already signed in? There's nothing to do on the login screen — send them to
// their profile.
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) redirect("/profile");

  // `?email=` prefills the field. It is a convenience only: it is displayed in
  // an input and nowhere else, so a crafted link can put text on this screen
  // and achieve nothing more than a typed address would.
  const { email } = await searchParams;
  return <LoginForm email={typeof email === "string" ? email : undefined} />;
}
