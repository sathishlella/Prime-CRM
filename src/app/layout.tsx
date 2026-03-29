import type { Metadata, Viewport } from "next";
import "./globals.css";
import OfflineBanner from "@/components/OfflineBanner";
import SessionGuard from "@/components/SessionGuard";

export const metadata: Metadata = {
  title: {
    default: "F1 Dream Jobs CRM",
    template: "%s | F1 Dream Jobs",
  },
  description: "F1 Dream Jobs — premium career consultancy platform for international students",
  icons: { icon: "/favicon.ico" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body>
        <OfflineBanner />
        <SessionGuard />
        {children}
      </body>
    </html>
  );
}
