"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { Play, Pause, RotateCcw, FastForward } from "lucide-react";

// --- CONFIGURATION ---
const PHASES = [
  { id: 0, duration: 2000, label: "Raw Data Input" },
  { id: 1, duration: 2000, label: "Centering Data" },
  { id: 2, duration: 2000, label: "Centered Matrix" },
  { id: 3, duration: 2000, label: "Transpose Setup" },
  { id: 4, duration: 3000, label: "Calculating Variance" },
  { id: 5, duration: 3000, label: "Calculating Covariance" },
  { id: 6, duration: 3000, label: "Covariance Matrix Formed" },
  { id: 7, duration: 5000, label: "Characteristic Equation Setup" }, 
  { id: 8, duration: 5000, label: "Computing Determinant" },      
  { id: 9, duration: 5000, label: "Solving for Lambda" },         
  { id: 10, duration: 6000, label: "Eigen Decomposition Result" },
];

// --- GEOMETRY HELPERS ---
const SCALE = 40; 
const CENTER_X = 150; 
const CENTER_Y = 150; 

// Raw Data Points (Excitement, Seriousness)
const POINTS = [
  { x: 5, y: 1, id: 0 },
  { x: 2, y: 4, id: 1 },
  { x: 3, y: 2, id: 2 },
];
const MEANS = { x: 3.33, y: 2.33 };

export default function PCAMathAnimator() {
  const [phase, setPhase] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // --- Playback Engine ---
  useEffect(() => {
    if (isPlaying) {
      const currentPhaseConfig = PHASES[phase];
      if (!currentPhaseConfig) {
        setIsPlaying(false);
        return;
      }
      timerRef.current = setTimeout(() => {
        setPhase((p) => {
          if (p >= PHASES.length - 1) {
            setIsPlaying(false);
            return p;
          }
          return p + 1;
        });
      }, currentPhaseConfig.duration);
    }
    return () => clearTimeout(timerRef.current!);
  }, [isPlaying, phase]);

  // --- SHARED HELPERS ---
  const Bracket = ({ side, height = "100%" }: { side: "left" | "right"; height?: string }) => (
    <motion.div
      className={`absolute top-0 ${side === "left" ? "left-0 border-r-0 rounded-l-lg" : "right-0 border-l-0 rounded-r-lg"} w-3 border-2 border-white/30`}
      style={{ height }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
    />
  );

  return (
    <div className="w-full my-12 flex flex-col gap-8 select-none">
      
      {/* HEADER / PROGRESS */}
      <div className="flex justify-between items-center border-b border-white/10 pb-4">
         <div className="text-xs font-mono text-neutral-500 uppercase tracking-widest">
            Step {phase + 1}/{PHASES.length}: {PHASES[phase]?.label}
         </div>
         <div className="flex gap-1">
            {PHASES.map((_, i) => (
                <div 
                    key={i} 
                    className={`h-1 w-3 rounded-full transition-colors ${i === phase ? "bg-blue-500" : "bg-white/10"}`} 
                />
            ))}
         </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 lg:gap-0">
        
        {/* ==========================================
            LEFT SIDE: GEOMETRY (SVG) 
           ========================================== */}
        <div className="w-full lg:w-1/2 min-h-[350px] flex items-center justify-center relative bg-neutral-900/30 rounded-xl border border-white/5">
            
            <svg width="300" height="300" viewBox="0 0 300 300" className="overflow-visible">
                {/* Background Grid */}
                <defs>
                    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1"/>
                    </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />

                {/* Axes */}
                <line x1={CENTER_X} y1="0" x2={CENTER_X} y2="300" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
                <line x1="0" y1={CENTER_Y} x2="300" y2={CENTER_Y} stroke="rgba(255,255,255,0.2)" strokeWidth="2" />

                {/* DATA DOTS ANIMATION */}
                {POINTS.map((pt, i) => {
                    const targetX = phase === 0 ? pt.x : (pt.x - MEANS.x);
                    const targetY = phase === 0 ? pt.y : (pt.y - MEANS.y);
                    const cx = CENTER_X + (targetX * SCALE);
                    const cy = CENTER_Y - (targetY * SCALE);

                    return (
                        <motion.circle
                            key={i} cx={cx} cy={cy} r={6}
                            fill={i === 0 ? "#60A5FA" : i === 1 ? "#F87171" : "#34D399"}
                            initial={false}
                            animate={{ cx, cy }}
                            transition={{ type: "spring", stiffness: 50, damping: 15 }}
                        />
                    );
                })}

                {/* EIGENVECTORS (Phase 10 Only) */}
                <AnimatePresence>
                    {phase === 10 && (
                        <>
                            {/* PC1 (Long Green) */}
                            <motion.line
                                initial={{ pathLength: 0, opacity: 0 }}
                                animate={{ pathLength: 1, opacity: 1 }}
                                transition={{ duration: 1.5 }}
                                x1={CENTER_X - (4 * SCALE)} y1={CENTER_Y - (4 * SCALE)} 
                                x2={CENTER_X + (4 * SCALE)} y2={CENTER_Y + (4 * SCALE)}
                                stroke="#4ADE80"
                                strokeWidth="2" strokeLinecap="round"
                            />
                            {/* PC2 (Short Grey) */}
                            <motion.line
                                initial={{ pathLength: 0, opacity: 0 }}
                                animate={{ pathLength: 1, opacity: 1 }}
                                transition={{ duration: 1.5, delay: 0.5 }}
                                x1={CENTER_X - (2 * SCALE)} y1={CENTER_Y + (2 * SCALE)} 
                                x2={CENTER_X + (2 * SCALE)} y2={CENTER_Y - (2 * SCALE)}
                                stroke="#9CA3AF"
                                strokeWidth="2" strokeLinecap="round" strokeDasharray="4"
                            />
                            <motion.text 
                                initial={{ opacity: 0 }} animate={{ opacity: 0.8 }} transition={{ delay: 1 }}
                                x={CENTER_X + 120} y={CENTER_Y + 120} fill="#4ADE80" fontSize="12"
                            >
                                PC1
                            </motion.text>
                        </>
                    )}
                </AnimatePresence>
            </svg>

            <div className="absolute bottom-4 right-4 text-xs text-neutral-500 font-mono text-right">
                X: Excitement<br/>Y: Seriousness
            </div>
        </div>

        {/* ==========================================
            RIGHT SIDE: ALGEBRA (MATH) 
           ========================================== */}
        <div className="w-full lg:w-1/2 min-h-[350px] flex flex-col items-center justify-center relative perspective-1000">
            <LayoutGroup>
                 <AnimatePresence mode="wait">
                    
                    {/* PHASE 0-2: TABLES */}
                    {phase <= 2 && (
                        <motion.div 
                            key="step-tables"
                            exit={{ opacity: 0, x: 50 }}
                            className="flex gap-8 font-mono"
                        >
                            <div className="flex flex-col gap-2 items-center">
                                <span className="text-neutral-500 text-xs">Excitement</span>
                                {[5, 2, 3].map((v, i) => (
                                    <div key={i} className="h-10 flex items-center gap-2">
                                        <motion.span layoutId={`val-exc-${i}`} className="text-white font-bold">
                                            {phase === 0 ? v : (v - MEANS.x).toFixed(2)}
                                        </motion.span>
                                        {phase === 1 && <motion.span initial={{opacity:0}} animate={{opacity:1}} className="text-red-400 text-xs">- {MEANS.x}</motion.span>}
                                    </div>
                                ))}
                            </div>
                            <div className="flex flex-col gap-2 items-center">
                                <span className="text-neutral-500 text-xs">Seriousness</span>
                                {[1, 4, 2].map((v, i) => (
                                    <div key={i} className="h-10 flex items-center gap-2">
                                        <motion.span layoutId={`val-ser-${i}`} className="text-white font-bold">
                                            {phase === 0 ? v : (v - MEANS.y).toFixed(2)}
                                        </motion.span>
                                        {phase === 1 && <motion.span initial={{opacity:0}} animate={{opacity:1}} className="text-red-400 text-xs">- {MEANS.y}</motion.span>}
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* PHASE 3-6: MATRIX MATH */}
                    {phase >= 3 && phase <= 6 && (
                        <motion.div 
                            key="step-math"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -50 }}
                            className="flex flex-col items-center"
                        >
                            <div className="flex items-center gap-4 mb-8">
                                {/* Transpose Matrix */}
                                <div className="relative px-2">
                                    <Bracket side="left" />
                                    <div className="flex flex-col gap-1">
                                        <div className={`flex gap-2 p-1 rounded ${phase === 4 ? "bg-blue-500/20" : ""}`}>
                                            <span className="w-10 text-center text-sm">1.67</span>
                                            <span className="w-10 text-center text-sm">-1.33</span>
                                            <span className="w-10 text-center text-sm">-0.33</span>
                                        </div>
                                        <div className={`flex gap-2 p-1 rounded ${phase === 5 ? "bg-blue-500/20" : ""}`}>
                                            <span className="w-10 text-center text-sm">-1.33</span>
                                            <span className="w-10 text-center text-sm">1.67</span>
                                            <span className="w-10 text-center text-sm">-0.33</span>
                                        </div>
                                    </div>
                                    <Bracket side="right" />
                                    <div className="absolute -bottom-5 w-full text-center text-[10px] text-neutral-500">X Transpose</div>
                                </div>
                                
                                <div className="text-xl">·</div>

                                {/* Centered Matrix */}
                                <div className="relative px-2">
                                    <Bracket side="left" />
                                    <div className="flex gap-1">
                                        <div className={`flex flex-col gap-1 p-1 rounded ${phase === 4 ? "bg-blue-500/20" : ""}`}>
                                            <span className="h-5 flex items-center text-sm">1.67</span>
                                            <span className="h-5 flex items-center text-sm">-1.33</span>
                                            <span className="h-5 flex items-center text-sm">-0.33</span>
                                        </div>
                                        <div className={`flex flex-col gap-1 p-1 rounded ${phase === 5 ? "bg-blue-500/20" : ""}`}>
                                            <span className="h-5 flex items-center text-sm">-1.33</span>
                                            <span className="h-5 flex items-center text-sm">1.67</span>
                                            <span className="h-5 flex items-center text-sm">-0.33</span>
                                        </div>
                                    </div>
                                    <Bracket side="right" />
                                    <div className="absolute -bottom-5 w-full text-center text-[10px] text-neutral-500">X Center</div>
                                </div>
                            </div>
                            
                            {/* Result Box */}
                            <AnimatePresence mode="wait">
                                {(phase >= 4 && phase <= 6) && (
                                    <motion.div 
                                        key="calc-box"
                                        initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0 }}
                                        className="bg-neutral-800 p-4 rounded-lg border border-white/10 w-full max-w-[350px] text-center"
                                    >
                                        {phase === 4 && <div className="font-mono text-sm">0.5 · (1.67² + ...) = <span className="font-bold text-white text-lg">2.33</span></div>}
                                        {phase === 5 && <div className="font-mono text-sm">0.5 · (1.67 · -1.33 + ...) = <span className="font-bold text-white text-lg">-2.17</span></div>}
                                        {phase === 6 && (
                                            <div className="grid grid-cols-2 gap-6 font-mono text-xl font-bold">
                                                <span className="text-green-400">2.33</span><span className="text-neutral-500">-2.17</span>
                                                <span className="text-neutral-500">-2.17</span><span className="text-green-400">2.33</span>
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    )}

                    {/* PHASE 7-9: DETAILED ALGEBRA ANIMATION */}
                    {phase >= 7 && phase <= 9 && (
                        <motion.div 
                            key="algebra-step"
                            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, x: -50 }}
                            className="flex flex-col items-center w-full font-mono"
                        >
                            <div className="text-neutral-400 text-xs mb-4 tracking-widest uppercase">
                                {phase === 7 ? "Setup Characteristic Eq" : phase === 8 ? "Compute Determinant" : "Solve for Lambda"}
                            </div>
                            
                            <div className="flex flex-col gap-4 bg-neutral-800/50 p-6 rounded-xl border border-white/5 w-full max-w-md shadow-xl">
                                {/* Step 1: The Matrix Setup */}
                                <div className={`transition-opacity duration-500 ${phase > 7 ? "opacity-50" : "opacity-100"}`}>
                                    <div className="flex items-center justify-center gap-3 text-lg">
                                        <span>det</span>
                                        <div className="relative px-3 py-2">
                                            <Bracket side="left" />
                                            <div className="flex flex-col gap-2">
                                                <div className="flex gap-4">
                                                    <span className="text-green-400">2.33 - λ</span>
                                                    <span className="text-neutral-500">-2.17</span>
                                                </div>
                                                <div className="flex gap-4">
                                                    <span className="text-neutral-500">-2.17</span>
                                                    <span className="text-green-400">2.33 - λ</span>
                                                </div>
                                            </div>
                                            <Bracket side="right" />
                                        </div>
                                        <span>= 0</span>
                                    </div>
                                </div>

                                {/* Step 2: The Expansion (ad - bc) */}
                                {phase >= 8 && (
                                    <motion.div 
                                        initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                                        className={`flex flex-col items-center gap-2 border-t border-white/10 pt-4 ${phase > 8 ? "opacity-50" : "opacity-100"}`}
                                    >
                                        <div className="text-sm text-neutral-400">(ad - bc) expansion:</div>
                                        <div className="text-white text-center">
                                            (2.33 - λ)(2.33 - λ) - (-2.17)(-2.17) = 0
                                        </div>
                                        <div className="text-blue-300 text-center font-bold">
                                            (2.33 - λ)² - 4.70 = 0
                                        </div>
                                    </motion.div>
                                )}

                                {/* Step 3: The Solution */}
                                {phase >= 9 && (
                                    <motion.div 
                                        initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                                        className="flex flex-col items-center gap-2 border-t border-white/10 pt-4"
                                    >
                                        <div className="text-white text-lg">(2.33 - λ)² = 4.70</div>
                                        <div className="text-neutral-400 text-sm">Square Root both sides:</div>
                                        <div className="text-white text-lg">2.33 - λ = ± 2.17</div>
                                        
                                        <div className="flex gap-8 mt-2">
                                            <div className="flex flex-col items-center">
                                                <span className="text-xs text-neutral-500">λ = 2.33 + 2.17</span>
                                                <span className="text-xl font-bold text-green-400">λ ≈ 4.5</span>
                                            </div>
                                            <div className="flex flex-col items-center">
                                                <span className="text-xs text-neutral-500">λ = 2.33 - 2.17</span>
                                                <span className="text-xl font-bold text-neutral-300">λ ≈ 0.16</span>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {/* PHASE 10: FINAL RESULTS */}
                    {phase === 10 && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-4 w-full">
                            <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-lg">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-green-400 font-bold">PC 1</span>
                                    <span className="text-xs text-green-400/60">Primary Trend</span>
                                </div>
                                <div className="text-3xl font-bold mb-1">λ = 4.5</div>
                                <div className="text-xs text-neutral-400">Captures 96% of info (Variance)</div>
                            </div>
                             <div className="bg-white/5 border border-white/10 p-4 rounded-lg opacity-60">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-neutral-300 font-bold">PC 2</span>
                                    <span className="text-xs text-neutral-500">Orthogonal</span>
                                </div>
                                <div className="text-3xl font-bold mb-1">λ = 0.17</div>
                                <div className="text-xs text-neutral-400">Captures 4% of info (Noise)</div>
                            </div>
                        </motion.div>
                    )}

                 </AnimatePresence>
            </LayoutGroup>
        </div>

      </div>

      {/* CONTROLS */}
      <div className="flex justify-center gap-4 mt-4">
        <button 
            onClick={() => { setPhase(0); setIsPlaying(true); }} 
            className="p-3 rounded-full bg-white/5 hover:bg-white/10 hover:text-green-400 transition"
        >
            <RotateCcw size={20} />
        </button>
        <button 
            onClick={() => setIsPlaying(!isPlaying)} 
            className="p-4 rounded-full bg-blue-600 hover:bg-blue-500 text-white shadow-lg hover:scale-105 transition"
        >
            {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
        </button>
        <button 
            onClick={() => setPhase(prev => Math.min(prev + 1, PHASES.length - 1))} 
            className="p-3 rounded-full bg-white/5 hover:bg-white/10 hover:text-blue-400 transition"
        >
            <FastForward size={20} />
        </button>
      </div>
    </div>
  );
}