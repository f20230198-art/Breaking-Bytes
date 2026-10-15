import type { Metadata } from "next";
import { Archivo_Black, Inter, Special_Elite } from "next/font/google";
import "./globals.css";

const archivoBlack = Archivo_Black({ variable: "--font-archivo-black", weight: "400", subsets: ["latin"] });
const specialElite = Special_Elite({ variable: "--font-special-elite", weight: "400", subsets: ["latin"] });
const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Breaking Bytes — The Underground Hackathon",
  description: "A 24-hour underground hackathon. Assemble your crew, pick your supplier, cook something 99.1% pure.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${archivoBlack.variable} ${specialElite.variable} ${inter.variable} antialiased`}>
      <body className="paper-grain min-h-full">
        {/* Shared SVG filters: "carve" gives UI blocks a hand-cut linocut edge */}
        <svg width="0" height="0" className="absolute" aria-hidden>
          <filter id="carve">
            <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="2" seed="3" />
            <feDisplacementMap in="SourceGraphic" scale="3" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </svg>
        {children}
      </body>
    </html>
  );
}
