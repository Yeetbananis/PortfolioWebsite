// app/page.tsx
import { generatePageMetadata } from "./lib/metadata";
import ProjectsPageContent from "./components/ProjectsPageContent"; // Corrected component name
import { projects } from "@/data/content";

export const metadata = generatePageMetadata({ title: "Projects" });

export default function HomePage() {
  return <ProjectsPageContent projects={projects} />;
}