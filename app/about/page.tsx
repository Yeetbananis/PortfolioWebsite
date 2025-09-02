// app/about/page.tsx
import { generatePageMetadata } from "../lib/metadata"; // 1. Import helper
import AboutPageContent from "../components/AboutPageContent";

// 2. Add this metadata function
export const metadata = generatePageMetadata({ title: "About" });

export default function AboutPage() {
  return <AboutPageContent />;
}