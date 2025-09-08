// app/articles/page.tsx
import { generatePageMetadata } from "../lib/metadata";
import ArticlesPageContent from "../components/ArticlesPageContent";
import { articles } from "@/data/content";

export const metadata = generatePageMetadata({ title: "Articles" });

export default function ArticlesPage() {
  return <ArticlesPageContent articles={articles} />;
}