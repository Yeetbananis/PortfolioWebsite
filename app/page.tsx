// app/page.tsx
import ProjectCard from "./components/ProjectCard";
import { projects } from "@/data/projects";

export default function HomePage() {
  return (
    <div className="container mx-auto max-w-5xl px-4">
      {/* Hero Section */}
      <section className="py-20 text-center md:py-32">
        <h1 className="text-5xl font-bold md:text-7xl">
          Tim Generalov
        </h1>
        <p className="mt-4 text-xl text-text-secondary">
          Quantitative Trader
        </p>
      </section>

      {/* Project Grid */}
      <section>
        <h2 className="mb-8 text-center text-3xl font-bold">My Projects</h2>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {projects.map((project) => (
            <ProjectCard
              key={project.title}
              title={project.title}
              description={project.description}
              image={project.image}
              link={project.link}
            />
          ))}
        </div>
      </section>
    </div>
  );
}