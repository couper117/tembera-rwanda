import { Suspense } from "react";
import "./auth.css";
import AppShell from "@/components/app/AppShell";
import BottomNav from "@/components/app/BottomNav";
import DesktopRail from "@/components/app/DesktopRail";
import { groupSummaries } from "@/lib/data/places";
import { getCategories } from "@/lib/data/categories";
import { getCurrentUser } from "@/lib/auth";
import { getSavedPlaceIds, getVisited } from "@/lib/data/user";
import { AccountProvider, type Account } from "@/lib/client/account";
import { CatalogMetaProvider } from "@/lib/client/catalogMeta";
import { CategoryProvider } from "@/lib/client/categories";
import { LocationProvider } from "@/lib/client/location";
import { SavedProvider } from "@/lib/client/saved";
import { ThemeProvider } from "@/lib/client/theme";
import { VisitedProvider } from "@/lib/client/visited";

/**
 * The app shell: persistent navigation plus the client state every screen reads
 * (who the user is, where they are, what they've saved/visited, the category
 * counts). Category counts and the taxonomy are computed on the server and
 * passed down as plain data; per-user saved/visited come from the account when
 * signed in, and localStorage otherwise.
 */
export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [summaries, categories, user] = await Promise.all([
    groupSummaries(),
    getCategories(),
    getCurrentUser(),
  ]);

  const authed = Boolean(user);
  const [savedIds, visits] = user
    ? await Promise.all([getSavedPlaceIds(user.id), getVisited(user.id)])
    : [[] as string[], [] as { id: string; at: number }[]];

  const account: Account | null = user
    ? {
        name: user.name,
        handle: user.handle,
        email: user.email,
        bio: user.bio,
        homeCity: user.homeCity,
        joinedAt: user.createdAt.toISOString(),
      }
    : null;

  return (
    <ThemeProvider>
      <CategoryProvider categories={categories}>
        <CatalogMetaProvider summaries={summaries}>
          <LocationProvider>
            <AccountProvider
              authed={authed}
              isAdmin={user?.role === "ADMIN"}
              initialAccount={account}
            >
              <SavedProvider authed={authed} initialIds={savedIds}>
                <VisitedProvider authed={authed} initialVisits={visits}>
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
                </VisitedProvider>
              </SavedProvider>
            </AccountProvider>
          </LocationProvider>
        </CatalogMetaProvider>
      </CategoryProvider>
    </ThemeProvider>
  );
}
