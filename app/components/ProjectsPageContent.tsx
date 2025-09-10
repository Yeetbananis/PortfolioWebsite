// app/components/ProjectsPageContent.tsx
'use client';

import ProjectCard from "./ProjectCard";
import AnimatedWords from "./AnimatedWords";
import TypingAnimator from "./TypingAnimator";
import BouncingDotName from "./BouncingDotName"; // 1. Import the new component
import { motion } from "framer-motion";

export default function ProjectsPageContent({ projects }: { projects: any[] }) {

  const occupations = [
    "Quantitative Trader",
    "Coding Enthusiast",
    "Problem Solver",
    "Mountain Explorer",
  ];

  return (
    <motion.div
      className="container mx-auto max-w-5xl px-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <section className="py-32 text-center">
        {/* 2. Replace the old h1 with a div to center the new component */}
        <div className="flex justify-center items-center h-[150px]">
          <BouncingDotName />
        </div>
        
        <p className="mt-4 text-xl text-text-secondary">
          <TypingAnimator
            words={occupations}
            pauseDuration={5000}
            className="font-medium"
          />
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