// app/components/ArticlesPageContent.tsx
'use client'; 

import AnimatedWords from "./AnimatedWords";
import { motion } from "framer-motion";

export default function ArticlesPageContent() {
  return (
    <motion.div
      className="container mx-auto max-w-5xl px-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <section className="py-32 text-center">
        <AnimatedWords el="h1" className="text-4xl font-bold md:text-5xl" text="Articles & Insights" />
        <AnimatedWords 
          el="p" 
          className="mt-4 mx-auto max-w-2xl text-lg text-text-secondary" 
          text="A collection of my thoughts and deep dives into quantitative finance, trading strategies, and technology. The write-up on my understanding of options will be the first article featured here."
          delay={0.1}
        />
        <p className="mt-8 text-text-secondary">More content coming soon.</p>
      </section>
    </motion.div>
  );
}