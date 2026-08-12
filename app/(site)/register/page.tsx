import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import RegisterForm from "./RegisterForm";

// Already signed in? Skip registration and go to the profile.
export default async function RegisterPage() {
  const user = await getCurrentUser();
  if (user) redirect("/profile");
  return <RegisterForm />;
}
