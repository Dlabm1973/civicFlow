import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CivicFlow · GMM Indigent Support",
  description:
    "CivicFlow case management and Khula resident-assistance pilot for Govan Mbeki Local Municipality.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-ZA">
      <body className="antialiased">{children}</body>
    </html>
  );
}
