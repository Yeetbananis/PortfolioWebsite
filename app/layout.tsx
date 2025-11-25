import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar";
import "katex/dist/katex.min.css";
import ParticleBackground from "./components/ParticleBackground";
import PageTransition from "./components/PageTransition";
import CommandTerminal from "./components/CommandTerminal";
import siteConfig from '@/site.config.js';
import { generatePageMetadata } from "./lib/metadata";
import Footer from "./components/Footer";
import { NavigationProvider } from './NavigationContext'; // Import Provider
import ContentWrapper from "./components/ContentWrapper"; // Import the new client component

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
        <NavigationProvider>
            <ParticleBackground />
            <CommandTerminal />
            
            <ContentWrapper>
                <Navbar />
                <PageTransition>
                    <main>{children}</main>
                    <Footer />
                </PageTransition>
            </ContentWrapper>
        </NavigationProvider>
      </body>
    </html>
  );
}