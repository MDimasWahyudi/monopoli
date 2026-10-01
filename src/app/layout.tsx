import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Monopoli Nusantara",
  description: "Game monopoli sederhana bertema kota-kota Indonesia",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
