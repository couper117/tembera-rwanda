import type { Metadata } from "next";
import PageHeader from "@/components/app/PageHeader";
import RegisterBusinessForm from "@/components/business/RegisterBusinessForm";
import { getCities } from "@/lib/data/cities";
import "../../../admin/admin.css";

export const metadata: Metadata = {
  title: "Register your business",
  description: "Manage how your business appears on Tembera.",
};

export const dynamic = "force-dynamic";

/**
 * Pulls in the admin stylesheet for its form controls. The public site has no
 * form of this size, and duplicating the inputs so a marketing page could own
 * them would leave two sets to keep in step.
 */
export default async function RegisterBusinessPage() {
  const cities = await getCities();

  return (
    <>
      <PageHeader title="Register your business" fallbackHref="/business" revealTitleOnScroll />
      <main className="t-main">
        <div className="t-page" style={{ maxWidth: 720 }}>
          <div className="t-section">
            <h1 className="t-display">Manage your listing</h1>
            <p className="t-body" style={{ marginTop: "var(--t-3)", lineHeight: 1.6 }}>
              Tembera already lists hundreds of Rwandan businesses. Create an
              account to correct your details, add photos and opening hours, and
              see what visitors are saying.
            </p>
            <p className="t-small t-muted" style={{ marginTop: "var(--t-2)" }}>
              New accounts are checked before their changes go live.
            </p>
          </div>

          <div className="t-section">
            <RegisterBusinessForm cities={cities.map((c) => c.name)} />
          </div>
        </div>
      </main>
    </>
  );
}
