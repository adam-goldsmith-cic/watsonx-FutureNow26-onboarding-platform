import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "IBM Onboarding Platform",
  description: "Modular, org-customisable onboarding — IBM Future Now",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
