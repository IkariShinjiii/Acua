import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ACUA | Artisanal Fine Jewelry & Sculptural Relics",
  description:
    "Handcrafted coastal jewelry forged from molten recycled metals and raw oceanic gems.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable}`}>
      <body className="bg-[#F9F6F0] text-[#261C14] antialiased selection:bg-[#9B3B1C] selection:text-white">
        {children}
      </body>
    </html>
  );
}
