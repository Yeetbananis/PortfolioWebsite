// app/articles/page.tsx
import { generatePageMetadata } from "../lib/metadata";
import ArticlesPageContent from "../components/ArticlesPageContent";

// This is now a Server Component, so exporting metadata here is allowed.
export const metadata = generatePageMetadata({ title: "Articles" });

export default function ArticlesPage() {
  return <ArticlesPageContent />;
}