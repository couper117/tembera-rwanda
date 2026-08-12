import { Suspense } from "react";
import AppShell from "@/components/app/AppShell";
import BottomNav from "@/components/app/BottomNav";
import DesktopRail from "@/components/app/DesktopRail";
import { groupSummaries } from "@/lib/places/catalog";
import { AccountProvider } from "@/lib/client/account";
import { CatalogMetaProvider } from "@/lib/client/catalogMeta";
import { LocationProvider } from "@/lib/client/location";
import { SavedProvider } from "@/lib/client/saved";

/**
 * The app shell: persistent navigation plus the client state every screen
 * reads (where the user is, what they've saved, the category counts).
 *
 * Counts are computed here on the server and passed down as plain data — no
 * client component imports the catalog, which would drag the raw datasets into
 * the browser bundle.
 *
 * Screen-level headers are rendered by the pages themselves — top-level
 * screens use <AppHeader>, sub-screens use <PageHeader> with a back button —
 * so a detail page never stacks two bars.
 */
export default function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const summaries = groupSummaries();

  return (
    <CatalogMetaProvider summaries={summaries}>
      <LocationProvider>
        <AccountProvider>
          <SavedProvider>
            <AppShell>
              {/* CategoryNav reads useSearchParams, which needs a Suspense
                  boundary so it doesn't force every page to render
                  dynamically. */}
              <Suspense fallback={null}>
                <DesktopRail />
              </Suspense>
              {children}
              <BottomNav />
            </AppShell>
          </SavedProvider>
        </AccountProvider>
      </LocationProvider>
    </CatalogMetaProvider>
  );
}
