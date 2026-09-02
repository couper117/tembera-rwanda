import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import ForgotForm from "./ForgotForm";

export const metadata: Metadata = {
  title: "Reset your password — Tembera",
  // Recovery screens have no business in a search index.
  robots: { index: false, follow: false },
};

export default async function ForgotPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  // Someone already signed in does not need to recover anything; the settings
  // screen changes a password properly, by asking for the current one.
  const user = await getCurrentUser();
  if (user) redirect("/settings");

  // Prefilled from the login screen, so a failed sign-in does not cost the
  // address a second time. Same reasoning — and same safety — as the `?email=`
  // on /login: it lands in an input and nowhere else.
  const { email } = await searchParams;
  return <ForgotForm email={typeof email === "string" ? email : undefined} />;
}
