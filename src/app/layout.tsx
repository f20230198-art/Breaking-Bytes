import type { Metadata } from "next";
import { Archivo_Black, Inter, Special_Elite, Stardos_Stencil } from "next/font/google";
import { EasterEggs } from "@/components/ui/EasterEggs";
import "./globals.css";

const archivoBlack = Archivo_Black({ variable: "--font-archivo-black", weight: "400", subsets: ["latin"] });
const specialElite = Special_Elite({ variable: "--font-special-elite", weight: "400", subsets: ["latin"] });
const stencil = Stardos_Stencil({ variable: "--font-stardos", weight: ["400", "700"], subsets: ["latin"] });
const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });

const description = "A 24-hour underground hackathon by GDG on Campus BITS Pilani Dubai. Assemble your crew, pick your supplier, cook something 99.1% pure.";

export const metadata: Metadata = {
  // absolute URLs for the share image (opengraph-image.jpg / twitter-image.jpg next to this file)
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: "Breaking Bytes — The Underground Hackathon",
  description,
  openGraph: { title: "Breaking Bytes — The Underground Hackathon", description, type: "website", siteName: "Breaking Bytes" },
  twitter: { card: "summary_large_image", title: "Breaking Bytes", description },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" suppressHydrationWarning /* the loader script may flag repeat visits on <html> before React loads */ className={`${archivoBlack.variable} ${specialElite.variable} ${inter.variable} ${stencil.variable} antialiased`}>
      <body className="paper-grain min-h-full">
        {/* Shared SVG filters: "carve" gives UI blocks a hand-cut linocut edge */}
        <svg width="0" height="0" className="absolute" aria-hidden>
          <filter id="carve">
            <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="2" seed="3" />
            <feDisplacementMap in="SourceGraphic" scale="3" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </svg>
        {children}
        <EasterEggs />
      </body>
    </html>
  );
}
