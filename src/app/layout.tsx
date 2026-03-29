import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ConsultPro CRM",
  description: "Student job consultancy — full transparency for every application",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
