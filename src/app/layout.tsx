import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const pixelMono = JetBrains_Mono({
  variable: "--font-pixel-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "A2I2 Sandbox",
  description: "A privacy-first sandbox for AI agent experiments on Robinhood Chain.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${pixelMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
