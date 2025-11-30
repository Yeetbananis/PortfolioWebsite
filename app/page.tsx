'use client'; // 1. Must be a Client Component to use Theme Context

import { projects, articles } from '@/data/content';
import ProjectCard from './components/ProjectCard';
import AnimatedWords from './components/AnimatedWords';
import AnimatedBlock from './components/AnimatedBlock';
import { FaGithub, FaLinkedin, FaEnvelope, FaFileDownload, FaArrowRight } from 'react-icons/fa';
import Link from 'next/link';
import { useNavigation } from './NavigationContext'; // 2. Import the hook

export default function Home() {
  const { currentTheme } = useNavigation(); // 3. Get the current theme

  // --- CUSTOM ARTICLE SELECTION ---
  const selectedTitles = [
    "The Power of Choice: An Introduction to Options",
    "The Price Is Right: Inside the Black-Scholes Model",
    "Linear Algebra in Machine Learning: Principal Component Analysis (PCA)"
  ];

  const featuredArticles = selectedTitles
    .map(title => articles.find(article => article.title === title))
    .filter(Boolean);

  return (
    <div className="container mx-auto px-4 py-24 min-h-screen flex flex-col justify-center max-w-6xl">
      
      {/* --- 1. HERO SECTION --- */}
      <div className="mb-32 mt-12">


        <AnimatedBlock delay={0.2}>
          <h1 className="text-5xl md:text-8xl font-bold tracking-tighter mb-8 text-white">
            {/* 4. DYNAMIC THEME GRADIENT APPLIED HERE */}
            <span 
              className="text-transparent bg-clip-text bg-gradient-to-r"
              style={{
                backgroundImage: `linear-gradient(to right, ${currentTheme.primary}, ${currentTheme.galaxyColors.core})`
              }}
            >
              Timofey Generalov
            </span>
          </h1>
        </AnimatedBlock>

        <AnimatedBlock delay={0.3}>
          <h2 className="text-2xl md:text-4xl text-slate-300 font-light mb-8 max-w-3xl leading-tight">
            Aspiring Quant & Math Major <span className="text-slate-500">@ UBC</span>
          </h2>
        </AnimatedBlock>

        <AnimatedBlock delay={0.4}>
          <p className="text-lg text-slate-400 leading-relaxed mb-10 max-w-2xl">
            I build autonomous trading systems and market analysis tools. My work combines quantitative finance with machine learning to model volatility, analyze sentiment, and automate execution entirely in Python.
          </p>
        </AnimatedBlock>

        {/* Links & Resume */}
        <AnimatedBlock delay={0.5}>
          <div className="flex flex-wrap items-center gap-6">
            <a 
              href="/images/Tim_Generalov_Resume.pdf" 
              target="_blank"
              className="flex items-center gap-2 px-6 py-3 bg-white text-black font-bold rounded-full hover:scale-105 transition-all duration-300"
              style={{ 
                 // Optional: Hover color matching theme
                 '--theme-color': currentTheme.primary 
              } as React.CSSProperties}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = currentTheme.primary}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
            >
              <FaFileDownload /> Resume
            </a>
            
            <div className="h-8 w-[1px] bg-white/20 mx-2"></div>

            <div className="flex gap-6 text-2xl text-slate-400">
                <a href="https://github.com/Yeetbananis" target="_blank" rel="noopener noreferrer" className="hover:text-white hover:scale-110 transition-all"><FaGithub /></a>
                <a href="https://www.linkedin.com/in/tim-generalov/" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 hover:scale-110 transition-all"><FaLinkedin /></a>
                <a href="mailto:timofey.generalov@example.com" className="hover:scale-110 transition-all" style={{ color: undefined }} onMouseEnter={(e) => e.currentTarget.style.color = currentTheme.primary} onMouseLeave={(e) => e.currentTarget.style.color = ''}><FaEnvelope /></a>
            </div>
          </div>
        </AnimatedBlock>
      </div>

      {/* --- 2. TECH STACK --- */}
      <AnimatedBlock delay={0.6}>
        <div className="mb-24 border-y border-white/10 py-10">
            <div className="flex flex-col md:flex-row md:items-center gap-6">
                <span className="text-sm font-mono text-slate-500 uppercase tracking-widest whitespace-nowrap">Technical Arsenal</span>
                <div className="flex flex-wrap gap-x-6 gap-y-3">
                {[
                    'Python (NumPy/Pandas)', 'PyTorch & AI', 'Monte Carlo Simulation', 
                    'NLP (BERT)', 'Algorithmic Trading', 'Scikit-Learn', 'Risk Modeling', 'Linear Algebra'
                ].map((skill) => (
                    <span key={skill} className="text-lg text-slate-300 font-light">
                    {skill}
                    </span>
                ))}
                </div>
            </div>
        </div>
      </AnimatedBlock>

      {/* --- 3. SELECTED WORKS (Portfolio) --- */}
      <AnimatedBlock delay={0.7}>
        <div id="portfolio" className="mb-24 scroll-mt-24"> 
          <div className="flex items-end justify-between mb-12">
            <div>
                <h3 className="text-4xl font-bold text-slate-100 mb-2">Portfolio</h3>
                <p className="text-slate-400">Algorithmic trading systems and research tools.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {projects.map((project, index) => (
              <AnimatedBlock key={project.title} delay={0.1 * index}>
                <ProjectCard
                  title={project.title}
                  description={project.description}
                  image={project.image}
                  link={project.link}
                  tags={project.tags}
                />
              </AnimatedBlock>
            ))}
          </div>
        </div>
      </AnimatedBlock>

      {/* --- 4. TECHNICAL INSIGHTS (Articles) --- */}
      <AnimatedBlock delay={0.8}>
        <div className="mb-20">
            <h3 className="text-2xl font-bold text-slate-100 mb-8">Technical Insights</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {featuredArticles.map((article: any) => (
                    <Link href={article.link} key={article.title} className="group block bg-white/5 p-6 rounded-lg border border-white/5 hover:border-white/20 transition-all hover:-translate-y-1">
                        {/* Dynamic Theme Color for Category */}
                        <span 
                            className="text-xs font-mono mb-2 block" 
                            style={{ color: currentTheme.primary }}
                        >
                            {article.category.split(':')[0]}
                        </span>
                        
                        <h4 className="text-lg font-bold text-slate-200 transition-colors mb-3 group-hover:text-white">
                            {article.title}
                        </h4>
                        
                        <p className="text-sm text-slate-400 line-clamp-3">{article.description}</p>
                        
                        <div 
                            className="mt-4 flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider transition-colors"
                            style={{ '--hover-color': currentTheme.primary } as React.CSSProperties}
                        >
                            <span className="group-hover:text-[var(--hover-color)] transition-colors flex items-center gap-2">
                                Read Article <FaArrowRight />
                            </span>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
      </AnimatedBlock>

    </div>
  );
}