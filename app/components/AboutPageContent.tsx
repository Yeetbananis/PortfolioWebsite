"use client";

/**
 * PortfolioAboutSection.tsx
 *
 * A complete, self-contained "About Me" section with an integrated D3 course map.
 * Designed to be placed on an existing page with its own navigation and background.
 *
 * @features
 * - A single, semi-transparent "glassmorphism" overlay containing all content.
 * - Professional layout for personal info, education, and skills.
 * - Integrates the "Celestial Orb" D3 course map for a stunning visual centerpiece.
 * - Fully transparent background to blend with any site design.
 */

import React, { useEffect, useRef, useState, useMemo } from "react";
import * as d3 from "d3";
import { motion, AnimatePresence } from "framer-motion";
import { FiX, FiGithub, FiLinkedin } from "react-icons/fi";

//=============================================================================
// 1. D3 COURSE MAP COMPONENT (Self-Contained)
//=============================================================================

// --- TYPE DEFINITIONS ---
type Status = "completed" | "current" | "planned";
type LineKey = "math" | "stats" | "econ" | "cs" | "other";

interface Course {
  id: string;
  code: string;
  title: string;
  status: Status;
  line: LineKey;
  year: "Y1" | "Y2" | "Y3" | "Y4";
  desc: string; // The primary source for relevance text
  topics?: string[]; // Optional field for key topics
}

interface SimulationNode extends d3.SimulationNodeDatum, Course {
  r: number;
}

type SimulationLink = d3.SimulationLinkDatum<SimulationNode>;

// --- DATA & CONFIGURATION ---
const COURSES: Course[] = [
    // Year 1
    { id: "cpsc110", code: "CPSC 110", title: "Computation, Programs, and Programming", status: "completed", line: "cs", year: "Y1", desc: "Introduces programming fundamentals and systematic problem solving which are important when building financial models or simulations.", topics: ["Systematic Program Design", "Functional Programming", "Data Structures"] },
    { id: "cpsc121", code: "CPSC 121", title: "Models of Computation", status: "completed", line: "cs", year: "Y1", desc: "Covers discrete math, logic, and computational models which strengthen reasoning and algorithmic thinking used in quant work.", topics: ["Propositional Logic", "Set Theory", "Finite Automata"] },
    { id: "cpsc210", code: "CPSC 210", title: "Software Construction", status: "completed", line: "cs", year: "Y1", desc: "Focuses on software design and testing which is crucial for writing reliable code for trading systems and analytics.", topics: ["Object-Oriented Design", "Design Patterns", "Unit Testing"] },
    { id: "math100", code: "MATH 100", title: "Differential Calculus", status: "completed", line: "math", year: "Y1", desc: "Introduces derivatives and rates of change which are the basis for optimization and continuous time models in finance.", topics: ["Limits", "Derivatives", "Optimization"] },
    { id: "math101", code: "MATH 101", title: "Integral Calculus", status: "completed", line: "math", year: "Y1", desc: "Covers integrals and their applications which connect to expected values, cumulative measures, and pricing formulas.", topics: ["Integration", "Series", "Applications of Integrals"] },
    { id: "psyc102", code: "PSYC 102", title: "Intro to Developmental, Social, Personality, Clinical Psychology", status: "completed", line: "other", year: "Y1", desc: "Explores human behavior and cognition which helps in understanding behavioral finance and decision making under risk.", topics: ["Cognitive Biases", "Social Influence", "Decision Making"] },
    { id: "phil220", code: "PHIL 220", title: "Symbolic Logic", status: "completed", line: "other", year: "Y1", desc: "Develops formal reasoning and proof skills which translate to clear logical thinking for quantitative problem solving.", topics: ["Formal Logic", "Proofs", "Logical Deduction"] },
    { id: "engl100", code: "ENGL 100", title: "Reading and Writing about Language and Literatures", status: "completed", line: "other", year: "Y1", desc: "Builds strong written communication and critical analysis skills which are important for reporting and collaboration in finance.", topics: ["Critical Analysis", "Academic Writing", "Rhetoric"] },
    { id: "dsci100", code: "DSCI 100", title: "Introduction to Data Science", status: "completed", line: "stats", year: "Y1", desc: "Introduces working with data, visualization, and statistical thinking which are directly applicable in finance analytics.", topics: ["Data Wrangling", "Visualization (ggplot)", "Statistical Inference"] },

    // Year 2
    { id: "math200", code: "MATH 200", title: "Multivariable Calculus", status: "current", line: "math", year: "Y2", desc: "Extends calculus to functions of several variables which helps when modeling systems with many financial factors.", topics: ["Partial Derivatives", "Multiple Integrals", "Vector Fields"] },
    { id: "math220", code: "MATH 220", title: "Linear Algebra", status: "current", line: "math", year: "Y2", desc: "Covers vectors, matrices, and eigenvalues which are essential in risk models, optimization, and factor analysis.", topics: ["Vector Spaces", "Matrix Operations", "Eigenvalues"] },
    { id: "math221", code: "MATH 221", title: "Calculus of Several Variables", status: "current", line: "math", year: "Y2", desc: "Focuses on partial derivatives and multiple integrals which connect to optimization and pricing models in finance.", topics: ["Gradient", "Divergence", "Curl", "Surface Integrals"] },
    { id: "stat200", code: "STAT 200", title: "Probability", status: "current", line: "stats", year: "Y2", desc: "Introduces probability theory which underpins all modeling of uncertainty and risk in finance.", topics: ["Probability Spaces", "Random Variables", "Common Distributions"] },
    { id: "stat302", code: "STAT 302", title: "Statistical Inference", status: "current", line: "stats", year: "Y2", desc: "Covers estimation and hypothesis testing which are necessary for validating models and making data driven decisions.", topics: ["Estimation", "Hypothesis Testing", "Confidence Intervals"] },
    { id: "phil336", code: "PHIL 336", title: "Philosophy Elective", status: "current", line: "other", year: "Y2", desc: "Builds advanced reasoning and ethical thinking skills which help in evaluating assumptions and choices in modeling.", topics: ["Advanced Logic", "Epistemology", "Ethics"] },
    { id: "phys100", code: "PHYS 100", title: "Mechanics, Heat, and Waves", status: "current", line: "other", year: "Y2", desc: "Introduces physics principles and problem solving which sharpen quantitative reasoning and modeling skills.", topics: ["Newtonian Mechanics", "Thermodynamics", "Oscillations"] },
    { id: "chem121", code: "CHEM 121", title: "Introductory Chemistry", status: "current", line: "other", year: "Y2", desc: "Covers lab science foundations which develop measurement, precision, and analytical habits useful in quantitative work.", topics: ["Stoichiometry", "Chemical Bonding", "Lab Techniques"] },
    { id: "econ101", code: "ECON 101", title: "Principles of Microeconomics", status: "current", line: "econ", year: "Y2", desc: "Explains individual and firm decision making which connects to market modeling, optimization, and strategy in finance.", topics: ["Supply and Demand", "Market Structures", "Consumer Theory"] },
    { id: "econ102", code: "ECON 102", title: "Principles of Macroeconomics", status: "current", line: "econ", year: "Y2", desc: "Covers aggregate economic behavior and policy which helps in understanding market cycles and systemic risks.", topics: ["GDP", "Inflation", "Monetary Policy"] },

    // Year 3
    { id: "math215", code: "MATH 215", title: "Elementary Differential Equations I", status: "planned", line: "math", year: "Y3", desc: "Introduces solving differential equations which are used in modeling rates, option pricing, and financial dynamics.", topics: ["First-Order DEs", "Second-Order DEs", "Laplace Transforms"] },
    { id: "stat305", code: "STAT 305", title: "Introduction to Statistical Inference", status: "planned", line: "stats", year: "Y3", desc: "Explores deeper inference methods which help in testing models and making confident conclusions from data.", topics: ["Bayesian Inference", "Likelihood Methods", "ANOVA"] },
    { id: "econ301", code: "ECON 301", title: "Intermediate Microeconomic Analysis I", status: "planned", line: "econ", year: "Y3", desc: "Studies consumer and firm behavior in detail which supports understanding of pricing, competition, and market design.", topics: ["Utility Maximization", "Profit Maximization", "Game Theory"] },
    { id: "econ325", code: "ECON 325", title: "Introduction to Econometrics I", status: "planned", line: "econ", year: "Y3", desc: "Teaches regression and empirical methods which are fundamental for analyzing financial data.", topics: ["Linear Regression", "Hypothesis Testing", "OLS"] },
    { id: "phys101", code: "PHYS 101", title: "Energy and Waves", status: "planned", line: "other", year: "Y3", desc: "Explores energy and wave phenomena which build intuition for mathematical modeling and handling periodic patterns.", topics: ["Wave Mechanics", "Electromagnetism", "Optics"] },
    { id: "math303", code: "MATH 303", title: "Introduction to Stochastic Processes", status: "planned", line: "math", year: "Y3", desc: "Focuses on random processes which directly apply to stock price models, risk dynamics, and interest rate models.", topics: ["Markov Chains", "Brownian Motion", "Poisson Processes"] },
    { id: "math307", code: "MATH 307", title: "Applied Linear Algebra", status: "planned", line: "math", year: "Y3", desc: "Covers computational methods in linear algebra which are important in portfolio optimization and large scale data analysis.", topics: ["SVD", "PCA", "Numerical Methods"] },
    { id: "math319", code: "MATH 319", title: "Introduction to Real Analysis", status: "planned", line: "math", year: "Y3", desc: "Provides rigorous foundations in analysis which sharpen proof skills and improve mathematical precision in finance.", topics: ["Limits", "Continuity", "Measure Theory"] },
    { id: "econ302", code: "ECON 302", title: "Intermediate Macroeconomic Analysis I", status: "planned", line: "econ", year: "Y3", desc: "Analyzes macroeconomic dynamics like growth, inflation, and policy which relate to financial markets and forecasting.", topics: ["Dynamic Models", "Economic Growth", "Business Cycles"] },
    { id: "econ326", code: "ECON 326", title: "Introduction to Econometrics II", status: "planned", line: "econ", year: "Y3", desc: "Extends econometrics to advanced techniques such as time series and panel data which are central to finance research.", topics: ["Time Series Analysis", "Panel Data", "Causal Inference"] },

    // Year 4
    { id: "math340", code: "MATH 340", title: "Introduction to Linear Programming", status: "planned", line: "math", year: "Y4", desc: "Covers optimization methods which are directly applied to portfolio selection and resource allocation problems.", topics: ["Simplex Method", "Duality", "Optimization"] },
    { id: "math329", code: "MATH 329", title: "Introduction to Abstract Algebra", status: "planned", line: "math", year: "Y4", desc: "Explores algebraic structures which build abstract thinking skills and connect indirectly through algorithms and cryptography.", topics: ["Group Theory", "Ring Theory", "Fields"] },
    { id: "math344", code: "MATH 344", title: "Mathematical Game Theory", status: "planned", line: "math", year: "Y4", desc: "Covers strategic interaction and equilibrium which apply to auctions, competition, and financial strategy.", topics: ["Nash Equilibrium", "Mechanism Design", "Auctions"] },
    { id: "econ425", code: "ECON 425", title: "Advanced Econometrics", status: "planned", line: "econ", year: "Y4", desc: "Teaches advanced econometric models which are crucial for forecasting and testing financial theories.", topics: ["Advanced Time Series", "Non-linear Models", "GMM"] },
    { id: "econ421", code: "ECON 421", title: "Introduction to Game Theory and Applications", status: "planned", line: "econ", year: "Y4", desc: "Introduces game theory concepts which help in modeling competition and strategic decisions in markets.", topics: ["Strategic Games", "Market Design", "Bargaining"] },
    { id: "math441", code: "MATH 441", title: "Mathematical Modelling: Discrete Optimization Problems", status: "planned", line: "math", year: "Y4", desc: "Covers discrete optimization methods which are used in scheduling, resource allocation, and combinatorial finance problems.", topics: ["Integer Programming", "Network Flows", "Combinatorics"] },
    { id: "math442", code: "MATH 442", title: "Graphs and Networks", status: "planned", line: "math", year: "Y4", desc: "Teaches graph theory and network analysis which apply to financial networks, contagion, and systemic risk.", topics: ["Graph Theory", "Network Analysis", "Systemic Risk"] },
    { id: "stat443", code: "STAT 443", title: "Time Series and Forecasting", status: "planned", line: "stats", year: "Y4", desc: "Covers ARIMA, GARCH, and forecasting methods which are directly used for modeling asset prices and volatility.", topics: ["ARIMA Models", "GARCH/Volatility", "Forecasting"] },
    { id: "stat306", code: "STAT 306", title: "Finding Relationships in Data", status: "planned", line: "stats", year: "Y4", desc: "Focuses on data exploration and regression which are essential for uncovering predictive relationships in finance.", topics: ["Regression Models", "Data Mining", "Feature Engineering"] },
    { id: "cpsc330", code: "CPSC 330", title: "Applied Machine Learning", status: "planned", line: "cs", year: "Y4", desc: "Applies machine learning techniques which are increasingly used for predictive models and trading strategies in finance.", topics: ["Supervised Learning", "Unsupervised Learning", "Neural Networks"] },
];

const PALETTE: Record<LineKey, { color: string; gradient: [string, string] }> = {
  math: { color: "#3b82f6", gradient: ["#60a5fa", "#3b82f6"] },
  stats: { color: "#8b5cf6", gradient: ["#c4b5fd", "#8b5cf6"] },
  econ: { color: "#ec4899", gradient: ["#f9a8d4", "#ec4899"] },
  cs: { color: "#14b8a6", gradient: ["#5eead4", "#14b8a6"] },
  other: { color: "#64748b", gradient: ["#cbd5e1", "#64748b"] },
};

const NODE_RADIUS = 16;
const YEAR_RADII: Record<Course["year"], number> = { Y1: 120, Y2: 220, Y3: 320, Y4: 420 };

// --- HELPER FUNCTIONS ---
function buildLinks(nodes: Course[]): { source: string; target: string }[] {
  const links: { source: string; target: string }[] = [];
  const byLine = d3.groups(nodes, (d: Course) => d.line);
  byLine.forEach(([_, courseList]: [LineKey, Course[]]) => {
    courseList.sort((a, b) => a.year.localeCompare(b.year));
    for (let i = 0; i < courseList.length - 1; i++) {
      links.push({ source: courseList[i].id, target: courseList[i + 1].id });
    }
  });
  return links;
}

// --- D3 COMPONENT ---
function CourseMapD3({ data = [] }: { data?: Course[] }) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [hoveredCourse, setHoveredCourse] = useState<Course | null>(null);

  const courseData = useMemo(() => (data.length > 0 ? data : COURSES), [data]);

  useEffect(() => {
    if (!svgRef.current || !wrapperRef.current) return;
    const svg = d3.select(svgRef.current);
    const { clientWidth: width, clientHeight } = wrapperRef.current;
    const height = Math.max(520, clientHeight);
    svg.selectAll("*").remove();

    const container = svg.attr("viewBox", `0 0 ${width} ${height}`).append("g");
    const defs = container.append("defs");

    const glowFilter = defs.append("filter").attr("id", "glow");
    glowFilter.append("feGaussianBlur").attr("stdDeviation", "3.5").attr("result", "coloredBlur");
    const feMerge = glowFilter.append("feMerge");
    feMerge.append("feMergeNode").attr("in", "coloredBlur");
    feMerge.append("feMergeNode").attr("in", "SourceGraphic");

    Object.entries(PALETTE).forEach(([key, value]) => {
      defs.append("radialGradient").attr("id", `grad-${key}`)
        .selectAll("stop")
        .data([{ offset: "0%", color: value.gradient[0] }, { offset: "100%", color: value.gradient[1] }])
        .enter().append("stop")
        .attr("offset", d => d.offset).attr("stop-color", d => d.color);
    });

    // --- Background Orbits ---
  container.append("g").selectAll("circle")
    .data(Object.values(YEAR_RADII)).enter()
    .append("circle")
    .attr("cx", width / 2).attr("cy", height / 2)
    .attr("r", d => d)
    .attr("fill", "none")
    .attr("stroke", "#ffffff")
    .attr("stroke-opacity", 0.3) // Increased opacity
    .attr("stroke-width", 1.5)   // Thicker line
    .attr("stroke-dasharray", "2 4"); // Denser dot pattern

    const nodes: SimulationNode[] = courseData.map(d => ({ ...d, r: NODE_RADIUS }));
    const links: SimulationLink[] = buildLinks(nodes).map(l => ({ ...l }));

    const simulation = d3.forceSimulation<SimulationNode>(nodes)
      .force("link", d3.forceLink<SimulationNode, SimulationLink>(links).id(d => d.id).strength(0.8))
      .force("charge", d3.forceManyBody().strength(-60))
      .force("radial", d3.forceRadial<SimulationNode>(d => YEAR_RADII[d.year], width / 2, height / 2).strength(1))
      .force("collide", d3.forceCollide<SimulationNode>(d => d.r + 5));

    const link = container.append("g").attr("class", "links")
      .selectAll("line").data(links).enter()
      .append("line")
      .attr("stroke-width", 2).attr("stroke", d => PALETTE[(d.source as SimulationNode).line].color)
      .style("filter", "url(#glow)").attr("stroke-opacity", 0.5);

    const nodeGroup = container.append("g").attr("class", "nodes")
      .selectAll("g").data(nodes).enter()
      .append("g").attr("class", "node-group")
      .style("cursor", "pointer")
      .on("mouseenter", (_, d) => setHoveredCourse(d))
      .on("mouseleave", () => setHoveredCourse(null))
      .on("click", (_, d) => setSelectedCourse(d));

    nodeGroup.append("circle").attr("r", d => d.r).attr("fill", d => `url(#grad-${d.line})`).style("filter", "url(#glow)");
    nodeGroup.append("circle").attr("r", d => d.r * 0.5).attr("fill", d => PALETTE[d.line].gradient[0]);
    nodeGroup.append("circle").attr("r", d => d.r + 2)
      .attr("fill", "none").attr("stroke", "#ffffff").attr("stroke-width", 1.5)
      .attr("stroke-dasharray", d => d.status === "planned" ? "3 3" : (d.status === "completed" ? "1 4" : "none"))
      .attr("stroke-opacity", d => d.status === "completed" ? 0.5 : 1);

    nodeGroup.call(d3.drag<SVGGElement, SimulationNode>()
        .on("start", (event, d) => { if (!event.active) simulation.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
        .on("drag", (event, d) => { d.fx = event.x; d.fy = event.y; })
        .on("end", (event, d) => { if (!event.active) simulation.alphaTarget(0); d.fx = null; d.fy = null; })
    );
      
    const zoom = d3.zoom<SVGSVGElement, unknown>().scaleExtent([0.4, 3]).on("zoom", e => container.attr("transform", e.transform.toString()));
    svg.call(zoom);

    simulation.on("tick", () => {
      link
        .attr("x1", d => (d.source as SimulationNode).x!).attr("y1", d => (d.source as SimulationNode).y!)
        .attr("x2", d => (d.target as SimulationNode).x!).attr("y2", d => (d.target as SimulationNode).y!);
      nodeGroup.attr("transform", d => `translate(${d.x!}, ${d.y!})`);
    });

    return () => { simulation.stop(); };
  }, [courseData]);

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    const isHovering = hoveredCourse != null;
    svg.selectAll<SVGGElement, SimulationNode>(".node-group").transition().duration(300)
      .style("opacity", d => isHovering ? (d.line === hoveredCourse!.line ? 1 : 0.2) : 1);
    svg.selectAll<SVGLineElement, SimulationLink>(".links line").transition().duration(300)
      .attr("stroke-opacity", d => isHovering ? ((d.source as SimulationNode).line === hoveredCourse!.line ? 0.8 : 0.05) : 0.5)
      .style("filter", d => isHovering && (d.source as SimulationNode).line === hoveredCourse!.line ? "url(#glow)" : "none");
  }, [hoveredCourse]);

  const getCourseLevel = (code: string) => {
      const level = parseInt(code.split(' ')[1][0]);
      if (level === 1) return "100-Level Foundational";
      if (level === 2) return "200-Level Intermediate";
      if (level >= 3) return "Upper-Level Specialization";
      return "General";
  };

  return (
    <div className="relative flex h-full min-h-[700px] w-full gap-6 bg-transparent text-slate-100">
      <div ref={wrapperRef} className="flex-1 rounded-lg p-2">
        <svg ref={svgRef} className="h-full w-full" />
        <AnimatePresence>
          {hoveredCourse && !selectedCourse && (
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
              className="pointer-events-none absolute left-4 top-4 rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 text-sm shadow-lg backdrop-blur-md"
            >
              <span style={{ color: PALETTE[hoveredCourse.line].color }} className="font-bold">{hoveredCourse.code}</span>
              <span className="text-slate-200"> — {hoveredCourse.title}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {selectedCourse && (
          <motion.aside
            initial={{ x: "100%", opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="relative w-full max-w-sm rounded-xl border border-white/10 bg-black/30 p-6 shadow-2xl backdrop-blur-xl lg:w-[380px]"
          >
            <button
              onClick={() => setSelectedCourse(null)}
              className="absolute right-4 top-4 rounded-full p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"
              aria-label="Close course details"
            ><FiX size={20} /></button>
            <div className="mt-2">
              <h3 className="text-xl font-bold" style={{ color: PALETTE[selectedCourse.line].color }}>{selectedCourse.code}</h3>
              <h4 className="text-lg font-medium text-slate-200 -mt-1">{selectedCourse.title}</h4>
              <p className="mt-1 text-sm text-slate-400">
                {selectedCourse.year} • Status: <span className="font-semibold capitalize text-slate-300">{selectedCourse.status}</span>
              </p>
              <div className="my-6 h-px bg-white/10" />
              
              <div className="space-y-5 text-sm text-slate-300">
                  <div>
                      <h5 className="font-semibold text-slate-100 mb-2">Quantitative Relevance</h5>
                      <p className="text-slate-400">{selectedCourse.desc}</p>
                  </div>
                  <div>
                      <h5 className="font-semibold text-slate-100 mb-2">Course Details</h5>
                      <ul className="space-y-2 text-slate-400">
                          <li className="flex items-center">
                            <span className="w-20 font-medium text-slate-300">Level</span>
                            <span>{getCourseLevel(selectedCourse.code)}</span>
                          </li>
                          {selectedCourse.topics && (
                            <li className="flex items-start">
                                <span className="w-20 font-medium text-slate-300 shrink-0">Key Topics</span>
                                <div className="flex flex-wrap gap-2">
                                    {selectedCourse.topics.map(topic => (
                                        <span key={topic} className="text-xs rounded-full bg-white/5 px-2 py-0.5 text-slate-300">{topic}</span>
                                    ))}
                                </div>
                            </li>
                          )}
                      </ul>
                  </div>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
}

//=============================================================================
// 2. MAIN PAGE WRAPPER COMPONENT
//=============================================================================

const GlassCard = ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={`rounded-xl border border-white/10 bg-black/20 p-6 shadow-2xl backdrop-blur-lg ${className}`}>
        {children}
    </div>
);

const SkillTag = ({ children }: { children: React.ReactNode }) => (
    <span className="inline-block rounded-full bg-white/10 px-3 py-1 text-sm font-medium text-slate-300">
        {children}
    </span>
);

export default function PortfolioAboutSection() {
    return (
        <div className="w-full bg-transparent text-slate-300 font-sans p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-7xl rounded-2xl border border-white/10 bg-slate-900/1 p-4 shadow-2xl backdrop-blur-2xl sm:p-6 lg:p-8">
                <main>
                    <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
                        {/* LEFT COLUMN */}
                        <div className="lg:col-span-1 space-y-8">
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                               <GlassCard>
                                    <h2 className="text-xl font-semibold text-white">About Me</h2>
                                    <p className="mt-4 text-slate-300">
                                        Driven and analytical second-year Mathematics student at UBC with an Economics minor and a focus on quantitative finance. Experienced in algorithmic trading, stochastic modeling, and machine learning through the development of end-to-end trading platforms.
                                    </p>
                                    <p className="mt-4 font-semibold text-blue-300">
                                        Currently seeking a Summer 2026 quant trading or research internship.
                                    </p>
                               </GlassCard>
                            </motion.div>
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                                <GlassCard>
                                    <h2 className="text-xl font-semibold text-white">Education</h2>
                                    <div className="mt-4">
                                        <h3 className="font-bold text-slate-100">The University of British Columbia (UBC)</h3>
                                        <p className="text-sm text-slate-400">Bachelor of Science, Expected April 2028</p>
                                        <ul className="mt-2 list-inside list-disc space-y-1 text-sm">
                                            <li><span className="font-semibold text-slate-200">Major:</span> Mathematics</li>
                                            <li><span className="font-semibold text-slate-200">Focus:</span> Mathematics of Information</li>
                                            <li><span className="font-semibold text-slate-200">Minor:</span> Economics</li>
                                        </ul>
                                    </div>
                                </GlassCard>
                            </motion.div>
                        </div>

                        {/* RIGHT COLUMN */}
                        <div className="lg:col-span-2 space-y-8">
                             <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                                <GlassCard>
                                    <h2 className="text-xl font-semibold text-white">Technologies & Skills</h2>
                                    <div className="mt-4 space-y-4">
                                        <div>
                                            <h3 className="font-semibold text-teal-300">Programming & Development</h3>
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                <SkillTag>Python</SkillTag><SkillTag>Git</SkillTag><SkillTag>GitHub</SkillTag><SkillTag>Tkinter</SkillTag><SkillTag>Matplotlib</SkillTag><SkillTag>Google Gemini API</SkillTag><SkillTag>OANDA API</SkillTag><SkillTag>Telegram Bot API</SkillTag>
                                            </div>
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-violet-300">Quantitative & Machine Learning</h3>
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                <SkillTag>Pandas</SkillTag><SkillTag>NumPy</SkillTag><SkillTag>Scikit-learn</SkillTag><SkillTag>PyTorch</SkillTag><SkillTag>Stable-Baselines3</SkillTag><SkillTag>Gymnasium</SkillTag><SkillTag>SHAP</SkillTag><SkillTag>NLTK</SkillTag>
                                            </div>
                                        </div>
                                         <div>
                                            <h3 className="font-semibold text-pink-300">Financial Concepts</h3>
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                <SkillTag>Algorithmic Trading</SkillTag><SkillTag>Derivatives Pricing</SkillTag><SkillTag>Stochastic Modeling</SkillTag><SkillTag>Backtesting</SkillTag><SkillTag>Risk Management</SkillTag><SkillTag>Portfolio Analysis</SkillTag>
                                            </div>
                                        </div>
                                    </div>
                                </GlassCard>
                            </motion.div>
                        </div>
                    </div>
                    
                    {/* COURSE MAP SECTION */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                        <div className="mt-12">
                            <h2 className="text-2xl font-bold text-white text-center">My Academic Journey</h2>
                            <p className="text-center text-slate-400 mt-2">An interactive map of my coursework at UBC. Hover to focus on a subject, click for details.</p>
                            <CourseMapD3 />
                        </div>
                    </motion.div>

                    <footer className="mt-16 border-t border-white/10 pt-8 pb-8 text-center text-slate-400">
                        <h2 className="text-xl font-semibold text-white">Get In Touch</h2>
                        <p className="mt-2">I'm always open to discussing new opportunities and interesting ideas.</p>
                        <div className="mt-6 flex justify-center space-x-6">
                            <a href="https://github.com/Yeetbananis" className="hover:text-white transition"><FiGithub size={24} /></a>
                            <a href="https://www.linkedin.com/in/tim-generalov/" className="hover:text-white transition"><FiLinkedin size={24} /></a>
                        </div>
                         <p className="mt-8 text-sm">&copy; {new Date().getFullYear()} Tim Generalov</p>
                    </footer>
                </main>
            </div>
        </div>
    );
}