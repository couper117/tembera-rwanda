import type { Metadata } from "next";
import "./globals.css";
// Bootstrap grid/utilities + the legacy base site styles are global.
import "../public/assets/bootstrap/css/bootstrap.min.css";
import "../public/assets/css/style.css";
import "../public/assets/css/nav.css";

export const metadata: Metadata = {
  title: "Visit Rwanda — Experience the Remarkable",
  description: "Your all-in-one pocket guide to Rwanda.",
  keywords: ["Rwanda", "Tourism", "Travel", "Kigali", "Tembera"],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        {/* FontAwesome icons (used pervasively across the ported pages). */}
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
