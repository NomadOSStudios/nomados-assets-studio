import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NomadOS Assets Studio — Game UI Designer",
  description:
    "Design buttons, panels, and animated effects. Export transparent assets for your Unity game.",
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
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
