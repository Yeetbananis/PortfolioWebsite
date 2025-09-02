// app/components/ProjectsPageContent.tsx
'use client';

import ProjectCard from "./ProjectCard";
import AnimatedWords from "./AnimatedWords";
import { motion } from "framer-motion";
import { projects } from "@/data/content";

export default function ProjectsPageContent({ projects }: { projects: any[] }) {
  return (
    <motion.div
      className="container mx-auto max-w-5xl px-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <section className="py-32 text-center">
        <h1 className="text-5xl font-bold md:text-7xl">
          <AnimatedWords text="Tim Generalov" />
        </h1>
        <p className="mt-4 text-xl text-text-secondary">
          <AnimatedWords text="Quantitative Trader" delay={0.1} />
        </p>
      </section>

      <section>
        <h2 className="mb-8 text-center text-3xl font-bold">
          <AnimatedWords text="My Projects" />
        </h2>
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