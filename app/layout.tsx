// app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar";
import ParticleBackground from "./components/ParticleBackground";
import PageTransition from "./components/PageTransition";
import siteConfig from '@/site.config.js';
import { generatePageMetadata } from "./lib/metadata"; // <-- This line was missing
import Footer from "./components/Footer"; // 1. Import the Footer

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = generatePageMetadata({
  title: "Portfolio",
  description: `The portfolio of ${siteConfig.author}, a Quantitative Trader specializing in algorithmic trading and stochastic modeling.`,
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} relative z-10 bg-background`}>
        <ParticleBackground />
        <Navbar />
        <PageTransition>
          <main>{children}</main>
          <Footer /> {/* 2. Add the Footer here */}
        </PageTransition>
      </body>
    </html>
  );
}
