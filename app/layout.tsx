// app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import "katex/dist/katex.min.css";
import ParticleBackground from "./components/ParticleBackground";
import PageTransition from "./components/PageTransition";
import CommandTerminal from "./components/CommandTerminal"; // <--- Import here
import siteConfig from '@/site.config.js';
import { generatePageMetadata } from "./lib/metadata";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = generatePageMetadata({
  title: "Portfolio",
  description: `The portfolio of ${siteConfig.author}...`,
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
        
        {/* Mount the Terminal at the top level */}
        <CommandTerminal />
        
        <Navbar />
        <PageTransition>
          <main>{children}</main>
          <Footer />
        </PageTransition>
      </body>
    </html>
  );
}