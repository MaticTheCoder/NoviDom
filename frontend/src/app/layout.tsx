import type { Metadata } from "next";
import { Bricolage_Grotesque, Public_Sans } from "next/font/google";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

// »Smreka in ploščica« (#92): naslovi v Bricolage Grotesque, besedilo, obrazci in tabele v Public Sans.
// latin-ext vsebuje šumnike (č, š, ž).
const display = Bricolage_Grotesque({ variable: "--font-display", subsets: ["latin", "latin-ext"], display: "swap" });
const body = Public_Sans({ variable: "--font-body", subsets: ["latin", "latin-ext"], display: "swap" });

export const metadata: Metadata = {
  title: "Novi dom",
  description: "Posvojitev psov in mačk iz zavetišča",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    // Spremenljivke pisav morajo biti na <html>, ker globals.css nanj nastavi font-sans.
    <html lang="sl" className={`${display.variable} ${body.variable}`}>
      <body className="flex min-h-screen flex-col antialiased">
        <a
          href="#vsebina"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground"
        >
          Preskoči na vsebino
        </a>
        <SiteHeader />
        <div id="vsebina" className="flex flex-1 flex-col">
          {children}
        </div>
        <SiteFooter />
      </body>
    </html>
  );
}
