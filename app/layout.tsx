import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./components.css";

export const metadata: Metadata = {
  title: {
    default: "Tembera — Find places in Rwanda",
    template: "%s · Tembera",
  },
  description:
    "Search restaurants, stays, markets, museums, parks and more across Rwanda. Find what's near you and get directions.",
  keywords: ["Rwanda", "Kigali", "places", "directory", "discover", "Tembera"],
  applicationName: "Tembera",
};

export const viewport: Viewport = {
  themeColor: "#faf9f7",
  // The app uses safe-area insets for its tab bar, so it needs the full
  // viewport on notched devices.
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
