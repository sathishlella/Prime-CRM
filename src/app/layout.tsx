import type { Metadata, Viewport } from "next";
import "./globals.css";
import OfflineBanner from "@/components/OfflineBanner";
import SessionGuard from "@/components/SessionGuard";

export const metadata: Metadata = {
  title: {
    default: "ConsultPro CRM",
    template: "%s | ConsultPro CRM",
  },
  description: "Student job consultancy — full transparency for every application",
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
      </head>
      <body>
        <OfflineBanner />
        <SessionGuard />
        {children}
      </body>
    </html>
  );
}
