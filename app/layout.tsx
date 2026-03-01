import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Anabolic Kitchen",
  description: "Sistem nutrițional: rețete + macro calculator + tracker.",
  manifest: "/manifest.webmanifest",
  themeColor: "#0B0F14",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ro">
      <body>{children}</body>
    </html>
  );
}
