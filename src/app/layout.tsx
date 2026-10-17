
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tawassol Sihi | Bureau",
  description: "Espace privé de gestion du club Tawassol Sihi.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
