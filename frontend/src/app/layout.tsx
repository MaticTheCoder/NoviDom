import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

// latin-ext vsebuje šumnike (č, š, ž).
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "latin-ext"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin", "latin-ext"],
});

export const metadata: Metadata = {
  title: "Novi dom",
  description: "Posvojitev psov in mačk iz zavetišča",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // Spremenljivke pisav morajo biti na <html>, ker globals.css nanj nastavi font-sans.
    <html lang="sl" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="flex min-h-screen flex-col antialiased">
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
