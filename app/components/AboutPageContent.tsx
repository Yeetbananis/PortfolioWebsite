// app/components/AboutPageContent.tsx
'use client';

import AnimatedWords from "./AnimatedWords";
import { motion } from "framer-motion";
import { courses } from "@/data/content";
import siteConfig from '@/site.config.js';
import { FaGithub, FaLinkedin } from "react-icons/fa";
import { HiOutlineMail } from "react-icons/hi";

// Extracted from your resume for easy updating
const skills = {
  "Programming & Development": ["Python", "Git", "GitHub", "Tkinter", "Matplotlib", "Google Gemini API", "OANDA API", "Telegram Bot API"],
  "Quantitative & Machine Learning": ["Pandas", "NumPy", "Scikit-learn", "PyTorch", "Stable-Baselines3", "Gymnasium", "SHAP", "NLTK"],
  "Financial Concepts": ["Algorithmic Trading", "Derivatives Pricing", "Stochastic Modeling", "Backtesting", "Risk Management (VaR, Stress Testing)", "Portfolio Analysis"],
};

export default function AboutPageContent() {
  return (
    <motion.div
      className="container mx-auto max-w-5xl px-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {/* About Me Section */}
      <section className="py-24 text-center">
        <AnimatedWords el="h1" className="text-4xl font-bold md:text-5xl" text="About Me" />
        <div className="mt-8 mx-auto max-w-3xl text-lg leading-relaxed text-text-secondary">
          <p className="mb-4">
            Driven and analytical second-year Mathematics student at UBC with an Economics minor and a focus on quantitative finance.
          </p>
          <p>
            Experienced in algorithmic trading, stochastic modeling, and machine learning through the development of end-to-end trading platforms. Currently seeking a Summer 2026 quant trading or research internship.
          </p>
        </div>
      </section>

      {/* --- NEW: Education Section --- */}
      <section className="mb-24">
        <AnimatedWords el="h2" className="mb-8 text-center text-3xl font-bold" text="Education" />
        <div className="mx-auto max-w-2xl rounded-md border border-white/10 bg-white/5 p-6">
          <h3 className="text-xl font-bold text-text">The University of British Columbia (UBC)</h3>
          <p className="text-text-secondary">Bachelor of Science, Expected April 2028</p>
          <hr className="my-4 border-white/10" />
          <p><span className="font-semibold text-text">Major:</span> Mathematics</p>
          <p><span className="font-semibold text-text">Minor:</span> Economics</p>
        </div>
      </section>

      {/* Skills Section (Now Categorized) */}
      <section className="mb-24">
        <AnimatedWords el="h2" className="mb-8 text-center text-3xl font-bold" text="Technologies & Skills" />
        <div className="space-y-8">
          {Object.entries(skills).map(([category, skillList]) => (
            <div key={category}>
              <h3 className="mb-4 text-xl font-semibold text-text">{category}</h3>
              <div className="flex flex-wrap gap-3">
                {skillList.map((skill) => (
                  <div key={skill} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-text-secondary">
                    {skill}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Certifications Section */}
      <section className="mb-24">
        <AnimatedWords el="h2" className="mb-8 text-center text-3xl font-bold" text="Certifications & Coursework" />
        <div className="mx-auto max-w-2xl space-y-4">
          {courses.map((course) => (
            <div key={course.title} className="rounded-md border border-white/10 bg-white/5 p-4">
              <h3 className="font-bold text-text">{course.title}</h3>
              <p className="text-text-secondary">{course.issuer}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-24 text-center">
        <AnimatedWords el="h2" className="text-3xl font-bold" text="Get In Touch" />
        <AnimatedWords el="p" className="mx-auto mt-4 max-w-xl text-text-secondary" text="I'm always open to discussing new opportunities and interesting ideas. Feel free to connect with me." delay={0.1}/>
        <div className="mt-8 flex justify-center space-x-6">
          <a href={siteConfig.socials.github} target="_blank" rel="noopener noreferrer" className="text-text-secondary transition-colors hover:text-primary"><FaGithub size={32} /></a>
          <a href={siteConfig.socials.linkedin} target="_blank" rel="noopener noreferrer" className="text-text-secondary transition-colors hover:text-primary"><FaLinkedin size={32} /></a>
          <a href={`mailto:${siteConfig.email}`} className="text-text-secondary transition-colors hover:text-primary"><HiOutlineMail size={32} /></a>
        </div>
      </section>
    </motion.div>
  );
}