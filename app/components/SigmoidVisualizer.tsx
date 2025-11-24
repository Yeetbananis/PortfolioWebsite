"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, animate, useInView } from "framer-motion";

interface SigmoidVisualizerProps {
  mode?: 'P' | 'H'; // P = PCA (6.72), H = HFT (0.45)
}

export default function SigmoidVisualizer({ mode = 'P' }: SigmoidVisualizerProps) {
  // --- MODE CONFIGURATION ---
  const config = mode === 'P' 
    ? { targetZ: 6.72, targetPct: "99.98%" } 
    : { targetZ: 0.45, targetPct: "61%" };

  // Start at 0 to show the "journey" to target
  const [hoverX, setHoverX] = useState<number>(0); 
  const [isInteracting, setIsInteracting] = useState(false);
  
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, amount: 0.5 });

  // --- CHART DIMENSIONS ---
  const width = 400;
  const height = 200;
  const padding = 40;
  const graphWidth = width - padding * 2;
  const graphHeight = height - padding * 2;
  
  const xDomain = [-8, 8]; // Range of Z scores
  const yDomain = [0, 1];  // Range of Probabilities

  // --- HELPERS ---
  const xScale = (val: number) => {
    const pct = (val - xDomain[0]) / (xDomain[1] - xDomain[0]);
    return padding + pct * graphWidth;
  };
  
  const yScale = (val: number) => {
    const pct = (val - yDomain[0]) / (yDomain[1] - yDomain[0]);
    return (height - padding) - pct * graphHeight;
  };

  const xInvert = (pixel: number) => {
    const pct = (pixel - padding) / graphWidth;
    return xDomain[0] + pct * (xDomain[1] - xDomain[0]);
  };

  const sigmoid = (z: number) => 1 / (1 + Math.exp(-z));

  // --- ANIMATION ON VIEW ---
  useEffect(() => {
    if (isInView && !isInteracting) {
      // Animate from 0 -> targetZ based on mode
      const controls = animate(0, config.targetZ, {
        duration: 2.5,
        ease: [0.22, 1, 0.36, 1], // Custom cubic bezier for smooth "landing"
        onUpdate: (value) => setHoverX(value),
      });
      return () => controls.stop();
    }
  }, [isInView, isInteracting, config.targetZ]);

  // --- INTERACTION HANDLER ---
  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    setIsInteracting(true); // Stop auto-animation if user touches it
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    
    let relX = clientX - rect.left;
    relX = Math.max(padding, Math.min(width - padding, relX));
    
    const val = xInvert(relX);
    setHoverX(val);
  };

  // --- RENDER PREP ---
  const points = [];
  for (let x = xDomain[0]; x <= xDomain[1]; x += 0.1) {
    points.push(`${xScale(x)},${yScale(sigmoid(x))}`);
  }
  const pathData = `M ${points.join(" L ")}`;

  const currentProb = sigmoid(hoverX);
  const cx = xScale(hoverX);
  const cy = yScale(currentProb);

  return (
    <div ref={containerRef} className="my-12 w-full max-w-xl mx-auto select-none">
      <div className="bg-neutral-900/50 rounded-xl border border-white/10 p-6 shadow-2xl backdrop-blur-sm">
        
        {/* Header */}
        <div className="flex justify-between items-end mb-6">
            <div className="text-xs text-neutral-500 tracking-widest uppercase font-mono">
                Sigmoid Activation ({mode === 'P' ? 'PCA Optimization' : 'HFT Inference'})
            </div>
        </div>

        <div className="relative w-full cursor-crosshair"
             onMouseMove={handleMove}
             onTouchMove={handleMove}
        >
          <svg 
            ref={svgRef}
            viewBox={`0 0 ${width} ${height}`} 
            className="w-full overflow-visible"
          >
            {/* --- GRID & AXES --- */}
            <defs>
                <linearGradient id="grad" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="rgba(96, 165, 250, 0.2)" />
                    <stop offset="100%" stopColor="rgba(96, 165, 250, 0)" />
                </linearGradient>
            </defs>

            {/* Y Axis */}
            <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#333" strokeWidth="1" />
            <text x={padding - 10} y={padding} fill="#666" fontSize="10" textAnchor="end">1.0</text>
            <text x={padding - 10} y={height - padding} fill="#666" fontSize="10" textAnchor="end">0.0</text>
            <text x={padding - 10} y={yScale(0.5) + 4} fill="#666" fontSize="10" textAnchor="end">0.5</text>
            <line x1={padding} y1={yScale(0.5)} x2={width-padding} y2={yScale(0.5)} stroke="#333" strokeDasharray="2" strokeWidth="1" />

            {/* X Axis */}
            <line x1={padding} y1={yScale(0.5)} x2={width - padding} y2={yScale(0.5)} stroke="#555" strokeWidth="1" />
            {[-6, -4, -2, 0, 2, 4, 6].map(tick => (
                <g key={tick}>
                    <line x1={xScale(tick)} y1={yScale(0.5) - 4} x2={xScale(tick)} y2={yScale(0.5) + 4} stroke="#555" />
                    <text x={xScale(tick)} y={height - padding + 20} fill="#555" fontSize="10" textAnchor="middle">{tick}</text>
                </g>
            ))}
            <text x={width/2} y={height - 5} fill="#555" fontSize="10" textAnchor="middle">Logit Score (Z)</text>

            {/* --- DATA --- */}
            <path d={pathData} fill="none" stroke="#333" strokeWidth="4" />
            <path d={pathData} fill="none" stroke="#60A5FA" strokeWidth="2" />

            {/* Projection Lines (The Squish Visual) */}
            <g>
                <line 
                    x1={cx} y1={height - padding} x2={cx} y2={cy} 
                    stroke="#4ADE80" strokeWidth="1" strokeDasharray="4"
                />
                <line 
                    x1={cx} y1={cy} x2={padding} y2={cy} 
                    stroke="#4ADE80" strokeWidth="1" strokeDasharray="4" 
                />
                <circle 
                    cx={cx} cy={cy} r={6} 
                    fill="#4ADE80" stroke="#fff" strokeWidth="2"
                />
            </g>

            {/* Dynamic Labels */}
            <g transform={`translate(${cx}, ${cy - 15})`}>
                <text 
                    textAnchor={hoverX > 0 ? "end" : "start"} 
                    x={hoverX > 0 ? -10 : 10} 
                    fill="white" fontSize="12" fontWeight="bold" fontFamily="monospace"
                >
                    P ≈ {currentProb.toFixed(3)}
                </text>
                <text 
                    textAnchor={hoverX > 0 ? "end" : "start"} 
                    x={hoverX > 0 ? -10 : 10} 
                    y={14}
                    fill="#4ADE80" fontSize="10" fontFamily="monospace"
                >
                    (Z = {hoverX.toFixed(2)})
                </text>
            </g>

          </svg>
        </div>
        
        <div className="mt-4 text-center text-sm text-neutral-400">
            The raw score <span className="text-green-400 font-mono">{config.targetZ}</span> is squished into <span className="text-white font-bold">{config.targetPct}</span> probability.
        </div>
      </div>
    </div>
  );
}