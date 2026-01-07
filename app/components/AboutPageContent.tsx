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
import CareerSimulation from "./interactive/CareerSimulation";

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
    // --- Year 1 ---
    { id: "cpsc110", code: "CPSC 110", title: "Computation, Programs, and Programming", status: "completed", line: "cs", year: "Y1", desc: "Fundamental programming and systematic problem solving; critical for designing recursive algorithms and functional software used in high-frequency data processing.", topics: ["Systematic Program Design", "Functional Programming", "Recursion"] },
    { id: "dsci100", code: "DSCI 100", title: "Introduction to Data Science", status: "completed", line: "stats", year: "Y1", desc: "Use of data science tools to summarize and visualize data; provides the initial toolkit for exploratory data analysis (EDA) and cleaning messy financial datasets.", topics: ["Data Wrangling", "Visualization", "Statistical Inference"] },
    { id: "engl100", code: "ENGL 100", title: "Reading and Writing about Language and Literatures", status: "completed", line: "other", year: "Y1", desc: "University-level discourse and critical writing; essential for synthesizing complex research papers and communicating technical model assumptions to non-technical stakeholders.", topics: ["Composition", "Literary Analysis", "Rhetoric"] },
    { id: "math100", code: "MATH 100", title: "Differential Calculus with Applications", status: "completed", line: "math", year: "Y1", desc: "Derivatives and optimization; the mathematical bedrock for Delta-hedging, sensitivity analysis (The Greeks), and finding local extrema in cost functions.", topics: ["Limits", "Optimization", "Taylor Polynomials"] },
    { id: "phil220", code: "PHIL 220", title: "Symbolic Logic", status: "completed", line: "other", year: "Y1", desc: "Sentential and predicate logic; builds the formal verification skills required to debug complex logical chains in automated execution systems.", topics: ["Propositional Logic", "Predicate Logic", "Formal Proofs"] },

    // --- Year 2 (Completed) ---
    { id: "cpsc121", code: "CPSC 121", title: "Models of Computation", status: "completed", line: "cs", year: "Y2", desc: "Physical and mathematical structures of computation; essential for understanding hardware latency and the bit-level logic underlying low-latency trading infrastructure.", topics: ["Digital Logic", "Finite State Machines", "Induction"] },
    { id: "cpsc210", code: "CPSC 210", title: "Software Construction", status: "completed", line: "cs", year: "Y2", desc: "Development of robust software systems; focuses on design patterns (like Observer or Strategy) used to build scalable and maintainable backtesting engines.", topics: ["Object-Oriented Design", "Testing", "Java"] },
    { id: "math101", code: "MATH 101", title: "Integral Calculus with Applications", status: "completed", line: "math", year: "Y2", desc: "Techniques of integration; necessary for computing expected values, cumulative distribution functions (CDFs), and the area under volatility curves.", topics: ["Integration Techniques", "Sequences", "Series"] },
    { id: "psyc102", code: "PSYC 102", title: "Introduction to Developmental, Social, Personality, and Clinical Psychology", status: "completed", line: "other", year: "Y2", desc: "Intro to specialized psychology; provides a foundation for Behavioral Finance by exploring cognitive biases and group-think that drive market irrationality.", topics: ["Social Psychology", "Development", "Clinical Theory"] },
    { id: "chem121", code: "CHEM 121", title: "Structure and Bonding in Chemistry", status: "completed", line: "other", year: "Y2", desc: "Principles of atomic structure; develops high-level scientific intuition and the ability to model complex physical interactions, skills highly transferable to 'physics-based' financial modeling.", topics: ["Quantum Mechanics", "Molecular Orbitals", "Chemical Bonding"] },
    { id: "econ101", code: "ECON 101", title: "Principles of Microeconomics", status: "completed", line: "econ", year: "Y2", desc: "Individual decision-making and market structures; the basis for understanding supply/demand dynamics and price discovery mechanisms in various asset classes.", topics: ["Supply and Demand", "Elasticity", "Market Failure"] },
    { id: "math200", code: "MATH 200", title: "Calculus III", status: "completed", line: "math", year: "Y2", desc: "Multivariable calculus and optimization; essential for portfolios with multiple assets where risk and return are functions of several variables (Partial Derivatives).", topics: ["Partial Derivatives", "Multiple Integrals", "Lagrange Multipliers"] },
    { id: "math221", code: "MATH 221", title: "Matrix Algebra", status: "completed", line: "math", year: "Y2", desc: "Systems of linear equations and Eigenvalues; the primary language of Factor Models, PCA (Principal Component Analysis), and Portfolio Variance calculations.", topics: ["Linear Transformations", "Orthogonality", "Diagonalization"] },
    { id: "phys100", code: "PHYS 100", title: "Introductory Physics", status: "completed", line: "other", year: "Y2", desc: "Major concepts of energy and thermal physics; sharpens the ability to translate physical 'word problems' into solvable mathematical equations.", topics: ["Kinematics", "Energy", "Thermodynamics"] },
    { id: "econ102", code: "ECON 102", title: "Principles of Macroeconomics", status: "completed", line: "econ", year: "Y2", desc: "National income and monetary policy; critical for assessing 'top-down' systemic risk and how interest rate changes impact discount rates and equity valuations.", topics: ["GDP", "Inflation", "Fiscal Policy"] },
    { id: "math215", code: "MATH 215", title: "Elementary Differential Equations I", status: "completed", line: "math", year: "Y2", desc: "Linear differential equations and systems; used to model the continuous-time evolution of interest rates and derivative prices (e.g., the Black-Scholes PDE).", topics: ["Linear ODEs", "Systems of ODEs", "Laplace Transforms"] },
    { id: "math220", code: "MATH 220", title: "Mathematical Proof", status: "completed", line: "math", year: "Y2", desc: "Formal proof techniques and logic; vital for the rigorous validation of financial theorems and ensuring that model assumptions are mathematically sound.", topics: ["Set Theory", "Direct Proof", "Contradiction"] },
    { id: "phys170", code: "PHYS 170", title: "Mechanics I", status: "completed", line: "other", year: "Y2", desc: "Statics and dynamics of particles; emphasizes vector analysis and the use of Newton’s laws to model forces, directly analogous to modeling market 'momentum' and 'frictions'.", topics: ["Statics", "Rigid Body Dynamics", "Work-Energy"] },
    { id: "stat302", code: "STAT 302", title: "Introduction to Probability", status: "completed", line: "stats", year: "Y2", desc: "Laws of probability and random variables; the core framework for all quantitative risk assessment, Monte Carlo simulations, and option pricing theory.", topics: ["Probability Axioms", "Distributions", "Central Limit Theorem"] },

    // --- Prerequisites / Required ---
    { id: "scie113", code: "SCIE 113", title: "First-Year Seminar in Science", status: "planned", line: "other", year: "Y3", desc: "Scientific communication and peer review; develops the ability to critically audit technical reports and present evidence-based findings to colleagues.", topics: ["Scientific Method", "Peer Review", "Communication"] },
    { id: "biol111", code: "BIOL 111", title: "Principles of Biology", status: "planned", line: "other", year: "Y3", desc: "Evolution and genetics; introduces complex adaptive systems and 'evolutionary algorithms' which are often applied to optimizing trading strategies.", topics: ["Cell Biology", "Genetics", "Ecology"] },

    // --- Year 3 ---
    { id: "econ325", code: "ECON 325", title: "Introduction to Econometrics", status: "planned", line: "econ", year: "Y3", desc: "Statistical theory applied to economic relationships; the entry point for building predictive regression models and identifying statistically significant alpha factors.", topics: ["Multiple Regression", "Hypothesis Testing", "Asymptotics"] },
    { id: "stat305", code: "STAT 305", title: "Introduction to Statistical Inference", status: "planned", line: "stats", year: "Y3", desc: "Fundamental theory of estimation; crucial for determining the reliability of parameters in a financial model and avoiding over-fitting.", topics: ["Maximum Likelihood", "Likelihood Ratio Tests", "Consistency"] },
    { id: "econ301", code: "ECON 301", title: "Intermediate Microeconomic Analysis I", status: "planned", line: "econ", year: "Y3", desc: "Theories of consumer and firm behavior; provides the utility-maximization framework used in rational agent modeling and optimal execution strategies.", topics: ["Utility Maximization", "Cost Minimization", "Perfect Competition"] },
    { id: "math303", code: "MATH 303", title: "Introduction to Stochastic Processes", status: "planned", line: "math", year: "Y3", desc: "Markov chains and Poisson processes; the math of 'randomness over time,' used to model default risk, queueing in order books, and path-dependent options.", topics: ["Markov Chains", "Poisson Processes", "Random Walks"] },
    { id: "math307", code: "MATH 307", title: "Applied Linear Algebra", status: "planned", line: "math", year: "Y3", desc: "Advanced matrix decompositions (SVD, QR); essential for large-scale data compression, noise reduction in signals, and solving high-dimensional optimization problems.", topics: ["SVD", "Least Squares", "Matrix Decompositions"] },
    { id: "math319", code: "MATH 319", title: "Introduction to Real Analysis", status: "planned", line: "math", year: "Y3", desc: "Rigorous treatment of sequences and continuity; provides the deep theoretical understanding needed to study measure theory and advanced Ito Calculus.", topics: ["Convergence", "Metric Spaces", "Continuity"] },
    { id: "econ302", code: "ECON 302", title: "Intermediate Macroeconomic Analysis I", status: "planned", line: "econ", year: "Y3", desc: "Determinants of growth and fluctuations; used to forecast the 'macro regime', crucial for adjusting portfolio weights between defensive and cyclical assets.", topics: ["Solow Model", "IS-LM", "Business Cycles"] },
    { id: "econ326", code: "ECON 326", title: "Methods of Empirical Microeconomics", status: "planned", line: "econ", year: "Y3", desc: "Advanced micro-econometrics and causal inference; used to determine if a specific event (like a policy change) actually caused a price move or if it was just correlation.", topics: ["Instrumental Variables", "Difference-in-Differences", "Panel Data"] },

    // --- Year 4 ---
    { id: "math340", code: "MATH 340", title: "Introduction to Linear Programming", status: "planned", line: "math", year: "Y4", desc: "Theory of duality and the simplex method; the standard tool for constrained portfolio optimization (e.g., maximizing return given a strict risk budget).", topics: ["Simplex Method", "Duality Theory", "Sensitivity Analysis"] },
    { id: "math329", code: "MATH 329", title: "Introduction to Abstract Algebra", status: "planned", line: "math", year: "Y4", desc: "Study of groups, rings, and fields; builds high-level abstraction skills useful in cryptography and understanding the symmetry in complex financial instruments.", topics: ["Groups", "Rings", "Isomorphisms"] },
    { id: "math344", code: "MATH 344", title: "Mathematical Game Theory", status: "planned", line: "math", year: "Y4", desc: "Analysis of strategic interactions; used to model auction dynamics, market making competition, and 'adversarial' trading environments.", topics: ["Nash Equilibrium", "Cooperative Games", "Mechanism Design"] },
    { id: "econ425", code: "ECON 425", title: "Advanced Econometrics", status: "planned", line: "econ", year: "Y4", desc: "Advanced techniques for time-series; the gold standard for modeling non-stationary data, cointegration, and volatility clusters (GARCH).", topics: ["GMM", "Maximum Likelihood", "Stationarity"] },
    { id: "econ421", code: "ECON 421", title: "Introduction to Game Theory and Applications", status: "planned", line: "econ", year: "Y4", desc: "Games of incomplete information; critical for understanding asymmetric information in markets, signaling, and principal-agent problems in corporate finance.", topics: ["Subgame Perfection", "Bayesian Equilibrium", "Signaling"] },
    { id: "math441", code: "MATH 441", title: "Mathematical Modelling: Discrete Optimization Problems", status: "planned", line: "math", year: "Y4", desc: "Modeling with integer programming; applied to 'all-or-nothing' investment decisions, facility location, and complex scheduling in operations.", topics: ["Integer Programming", "Branch and Bound", "Complexity Theory"] },
    { id: "math442", code: "MATH 442", title: "Graphs and Networks", status: "planned", line: "math", year: "Y4", desc: "Network theory and flow problems; vital for analyzing financial contagion, counterparty risk networks, and the topology of global payment systems.", topics: ["Trees", "Network Flow", "Coloring"] },
    { id: "stat443", code: "STAT 443", title: "Time Series and Forecasting", status: "planned", line: "stats", year: "Y4", desc: "Theory of ARIMA and spectral analysis; used to identify cyclical patterns in asset prices and project future values based on historical momentum.", topics: ["ARIMA Models", "Stationarity", "Spectral Analysis"] },
    { id: "stat405", code: "STAT 405", title: "Bayesian Statistics", status: "planned", line: "stats", year: "Y4", desc: "Prior and posterior analysis; enables 'Black-Litterman' style portfolio management by combining subjective market views with objective historical data.", topics: ["Prior/Posterior", "MCMC", "Hierarchical Models"] },
    { id: "cpsc330", code: "CPSC 330", title: "Applied Machine Learning", status: "planned", line: "cs", year: "Y4", desc: "Modern ML algorithms; used for non-linear pattern recognition, sentiment analysis of news, and building high-dimensional predictive trading signals.", topics: ["Classification", "Clustering", "Neural Networks"] },
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

 // --- Animated Background Orbits ---
  const orbitGroup = container.append("g").attr("class", "orbits");
  const orbits = orbitGroup.selectAll("circle")
    .data(Object.values(YEAR_RADII))
    .enter()
    .append("circle")
    .attr("cx", width / 2)
    .attr("cy", height / 2)
    .attr("r", d => d)
    .attr("fill", "none")
    .attr("stroke", "#ffffff")
    .attr("stroke-opacity", 0.3)
    .attr("stroke-width", 1.5)
    .attr("stroke-dasharray", "2 4");

  // Slow rotation animation
  orbits.each(function(d, i) {
    const orbit = d3.select(this);
    (function repeat() {
      orbit.transition()
        .duration(60000 + i * 2000) // 60s+ small offset per orbit
        .attrTween("transform", () => d3.interpolateString("rotate(0," + width/2 + "," + height/2 + ")", "rotate(360," + width/2 + "," + height/2 + ")"))
        .on("end", repeat);
    })();
  });

// --- CLEAN TOP-RIGHT LEGEND ---
const legend = svg.append("g")
    .attr("class", "legend")
    .attr("transform", `translate(${width - 200}, 40)`); // top-right corner

// Title
legend.append("text")
    .attr("class", "legend-title")
    .attr("y", 0)
    .attr("fill", "#fff")
    .attr("font-size", 18)
    .attr("font-weight", "bold")
    .text("Map Guide");

// Rings explanation (split into separate lines for proper display)
legend.append("text")
    .attr("y", 28)
    .attr("fill", "#ccc")
    .attr("font-size", 14)
    .text("Rings correspond to");

legend.append("text")
    .attr("y", 46)
    .attr("fill", "#ccc")
    .attr("font-size", 14)
    .text("Academic Years: ");

legend.append("text")
    .attr("y", 70)
    .attr("fill", "#ccc")
    .attr("font-size", 14)
    .text("Inner → Year 1, Outer → Year 4");

// Subject names (manual full names)
const subjectNames = [
    "Mathematics",
    "Statistics",
    "Economics",
    "Computer Science",
    "Other Subjects"
    // add more as needed
];

// Fetch colors from PALETTE but keep names manual
subjectNames.forEach((name, i) => {
    const lineKey = Object.keys(PALETTE)[i] as LineKey; // get the corresponding key from PALETTE
    const color = PALETTE[lineKey].color;   // fetch color

    const y = 95 + i * 22;
    // Color circle
    legend.append("circle")
        .attr("cx", 0)
        .attr("cy", y - 6)
        .attr("r", 7)
        .attr("fill", color);
    // Label
    legend.append("text")
        .attr("x", 16)
        .attr("y", y)
        .attr("fill", "#ccc")
        .attr("font-size", 14)
        .attr("alignment-baseline", "middle")
        .text(name);
});


    const nodes: SimulationNode[] = courseData.map(d => ({ ...d, r: NODE_RADIUS }));
    const links: SimulationLink[] = buildLinks(nodes).map(l => ({ ...l }));

    // This is the new code block to add
    const uniqueLines = Array.from(new Set(nodes.map(n => n.line)));
    const angleStep = (2 * Math.PI) / uniqueLines.length;
    const lineAngles = new Map(uniqueLines.map((line, i) => [line, i * angleStep]));

    nodes.forEach(node => {
        const angle = lineAngles.get(node.line) || 0;
        const radius = YEAR_RADII[node.year];
        // Set initial positions based on angle and radius
        node.x = width / 2 + radius * Math.cos(angle);
        node.y = height / 2 + radius * Math.sin(angle);
    });

    const simulation = d3.forceSimulation<SimulationNode>(nodes)
      .force("link", d3.forceLink<SimulationNode, SimulationLink>(links).id(d => d.id).strength(0.8))
      .force("charge", d3.forceManyBody().strength(-60))
      .force("radial", d3.forceRadial<SimulationNode>(d => YEAR_RADII[d.year], width / 2, height / 2).strength(1))
      .force("collide", d3.forceCollide<SimulationNode>(d => d.r + 30));

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

    // Main node circle with pulsating glow for planned/current
  nodeGroup.append("circle")
    .attr("r", d => d.r)
    .attr("fill", d => `url(#grad-${d.line})`)
    .style("filter", "url(#glow)")
    .each(function(d) {
      if (d.status === "planned" || d.status === "current") {
        const node = d3.select(this);
        (function pulse() {
          node.transition()
            .duration(2000)
            .attr("r", d.r * 1.3)
            .transition()
            .duration(2000)
            .attr("r", d.r)
            .on("end", pulse);
        })();
      }
    });

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

// 2. Main Page Component Integration
export default function PortfolioAboutSection() {
    return (
        <div className="w-full bg-transparent text-slate-300 font-sans p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-7xl rounded-2xl border border-white/10 bg-slate-900/1 p-4 shadow-2xl backdrop-blur-2xl sm:p-6 lg:p-8">
                <main>
                    <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
                        {/* LEFT COLUMN (About & Education) */}
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

                        {/* RIGHT COLUMN (Career Sim & Skills) */}
                        <div className="lg:col-span-2 space-y-8">
                             {/* 3. CAREER SIMULATION INSERTED HERE */}
                             <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                                <CareerSimulation />
                             </motion.div>

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
                    </footer>
                </main>
            </div>
        </div>
    );
}