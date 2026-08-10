import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import Preloader from "@/components/Preloader";

// Chrome shared by every public page — replaces the per-page
// include(nav/preloader/footer) calls scattered through the legacy pages.
export default function SiteLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <Preloader />
      <Nav />
      {children}
      <Footer />
    </>
  );
}
