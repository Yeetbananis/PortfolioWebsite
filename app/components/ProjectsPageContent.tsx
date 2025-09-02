// app/components/ProjectsPageContent.tsx
'use client';

import ProjectCard from "./ProjectCard";
import AnimatedWords from "./AnimatedWords";
import { motion } from "framer-motion";

type Project = {
  title: string;
  description: string;
  image: string;
  link: string;
};

export default function ProjectsPageContent({ projects }: { projects: Project[] }) {
  return (
    <motion.div
      className="container mx-auto max-w-5xl px-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <section className="py-32 text-center">
        <AnimatedWords el="h1" className="text-5xl font-bold md:text-7xl" text="Tim Generalov" />
        <AnimatedWords el="p" className="mt-4 text-xl text-text-secondary" text="Quantitative Trader" delay={0.1} />
      </section>

      <section>
        <AnimatedWords el="h2" className="mb-8 text-center text-3xl font-bold" text="My Projects" />
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
    </motion.div>
  );
}