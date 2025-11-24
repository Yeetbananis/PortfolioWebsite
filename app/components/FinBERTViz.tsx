"use client";
import React, { useState, useEffect, useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Text, Billboard, Float, OrbitControls, Line } from "@react-three/drei";
import { motion, AnimatePresence } from "framer-motion";
import * as THREE from "three";
import { Play, RotateCcw, BrainCircuit, Activity, Microscope, ArrowRight, ScanLine } from "lucide-react";

// --- DATA ---
const HEADLINES = [
  { id: 1, text: "Tesla margins tighten on price cuts", sentiment: -0.8, type: "neg", pos: [-3, 2, -1] },
  { id: 2, text: "Tech rally continues on AI hype", sentiment: 0.9, type: "pos", pos: [3, 3, 0] },
  { id: 3, text: "Fed signals rate cuts possible", sentiment: 0.7, type: "pos", pos: [2, -1, 2] }, // Neighbor
  { id: 4, text: "Oil stabilizes after supply shock", sentiment: -0.2, type: "neu", pos: [0, -2, 1] },
  { id: 5, text: "Retail spending slows in Q3", sentiment: -0.6, type: "neg", pos: [-2, -1, 0] },
  { id: 6, text: "NVIDIA earnings beat estimates", sentiment: 0.95, type: "pos", pos: [3.5, 2.5, 0.5] },
  { id: 7, text: "Housing market cools down", sentiment: -0.4, type: "neg", pos: [-1.5, -2, 2] },
  { id: 8, text: "USD weakens against Euro", sentiment: -0.1, type: "neu", pos: [0.5, 0, -2] },
  { id: 9, text: "Crypto volatility spikes", sentiment: 0.3, type: "neu", pos: [1, 1, 3] },
  // THE FINALE HEADLINE
  { id: 10, text: "Inflation data cools slightly", sentiment: 0.65, type: "pos", pos: [2.2, -0.8, 1.8] } // Target
];

// --- 3D COMPONENTS ---

const Axes = () => (
  <group>
    {/* X Axis (Red) */}
    <Line points={[[-5, 0, 0], [5, 0, 0]]} color="#ef4444" lineWidth={1} transparent opacity={0.3} />
    <Billboard position={[5.2, 0, 0]}><Text fontSize={0.2} color="#ef4444">X (Sentiment)</Text></Billboard>
    
    {/* Y Axis (Green) */}
    <Line points={[[0, -4, 0], [0, 4, 0]]} color="#22c55e" lineWidth={1} transparent opacity={0.3} />
    <Billboard position={[0, 4.2, 0]}><Text fontSize={0.2} color="#22c55e">Y (Magnitude)</Text></Billboard>

    {/* Z Axis (Blue) */}
    <Line points={[[0, 0, -4], [0, 0, 4]]} color="#3b82f6" lineWidth={1} transparent opacity={0.3} />
    <Billboard position={[0, 0, 4.2]}><Text fontSize={0.2} color="#3b82f6">Z (Topic)</Text></Billboard>

    <gridHelper args={[10, 10, 0x333333, 0x111111]} position={[0, -0.1, 0]} rotation={[0,0,0]} />
  </group>
);

interface DataNodeProps {
  item: typeof HEADLINES[0];
  isVisible: boolean;
}

const DataNode = ({ item, isVisible }: DataNodeProps) => {
  const mesh = useRef<THREE.Group>(null);
  const [spawned, setSpawned] = useState(false);

  useEffect(() => {
    if (isVisible) setTimeout(() => setSpawned(true), 50);
    else setSpawned(false);
  }, [isVisible]);

  useFrame((state) => {
    if (!mesh.current || !spawned) return;
    // Subtle float animation
    mesh.current.position.y = item.pos[1] + Math.sin(state.clock.elapsedTime + item.id) * 0.05;
  });

  if (!isVisible) return null;

  const color = item.sentiment > 0.3 ? "#4ade80" : item.sentiment < -0.3 ? "#f87171" : "#94a3b8";
  const scale = spawned ? 1 : 0;

  return (
    <group position={[item.pos[0], item.pos[1], item.pos[2]]} ref={mesh} scale={[scale, scale, scale]}>
      {/* Core Sphere */}
      <mesh>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2} />
      </mesh>
      {/* Glow */}
      <mesh>
        <sphereGeometry args={[0.25, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.15} />
      </mesh>
    </group>
  );
};

// --- MAIN COMPONENT ---

export default function FinBERTViz() {
  const [step, setStep] = useState<number>(0); 
  const [runId, setRunId] = useState(0); 
  const [stage, setStage] = useState<"idle" | "tokenizing" | "vectorizing" | "mapping" | "analysis">("idle"); 
  const [processed, setProcessed] = useState<number[]>([]);
  
  const targetItem = HEADLINES[9];
  const neighborItem = HEADLINES[2];

  // Safety check
  const currentHeadline = HEADLINES[step] || HEADLINES[0]; 

  useEffect(() => {
    if (stage === "idle" || stage === "analysis") return;

    let mounted = true;
    const isFinale = step === 9;
    const isBatch = step >= 3 && step < 9;

    const runSequence = async () => {
      if (!mounted) return;

      // 1. Tokenize
      setStage("tokenizing");
      await new Promise(r => setTimeout(r, isFinale ? 1500 : (isBatch ? 400 : 1200)));
      if (!mounted) return;

      // 2. Vectorize (Skip for Batch)
      if (!isBatch) {
        setStage("vectorizing");
        await new Promise(r => setTimeout(r, isFinale ? 1500 : 1200));
        if (!mounted) return;
      }

      // 3. Map (Launch)
      setStage("mapping");
      setProcessed(prev => {
        if (prev.includes(currentHeadline.id)) return prev;
        return [...prev, currentHeadline.id];
      });
      
      // Wait for dot to land
      await new Promise(r => setTimeout(r, isFinale ? 2000 : (isBatch ? 300 : 800)));
      if (!mounted) return;

      // 4. Decide Next
      if (step < 9) {
        setStep(prev => prev + 1);
      } else {
        // Finale Sequence - just go straight to analysis
        setStage("analysis");
      }
    };

    runSequence();

    return () => { mounted = false; };
  }, [step, runId]); 

  const startDemo = () => {
    setStep(0);
    setProcessed([]);
    setStage("tokenizing");
    setRunId(prev => prev + 1);
  };

  const vectorString = useMemo(() => {
    if (!currentHeadline) return "";
    return `[${currentHeadline.sentiment.toFixed(2)}, ${currentHeadline.pos[0].toFixed(1)}, ${currentHeadline.pos[2].toFixed(1)}, ... 768 dims]`;
  }, [currentHeadline]);

  return (
    <div className="w-full my-16 flex justify-center font-sans">
      <div className="bg-neutral-950 w-full max-w-5xl h-[650px] rounded-xl border border-white/10 shadow-2xl relative overflow-hidden flex flex-col">
        
        {/* 3D SCENE */}
        <div className="absolute inset-0 z-0">
          <Canvas camera={{ position: [6, 4, 8], fov: 35 }}>
            <color attach="background" args={["#050505"]} />
            <ambientLight intensity={0.2} />
            <pointLight position={[10, 10, 10]} intensity={1} />
            
            <Axes />
            
            <Float speed={1} rotationIntensity={0.1} floatIntensity={0.1}>
              {HEADLINES.map((item) => (
                <DataNode 
                  key={item.id} 
                  item={item} 
                  isVisible={processed.includes(item.id)} 
                />
              ))}
            </Float>

            <OrbitControls 
              makeDefault 
              enableZoom={true} 
              autoRotate={stage === "mapping" || stage === "idle"} 
              autoRotateSpeed={0.5}
            />
          </Canvas>
        </div>

        {/* UI OVERLAY */}
        <div className="relative z-10 h-full pointer-events-none flex flex-col justify-between p-6">
          
          {/* Header */}
          <div className="flex justify-between items-start">
            <div className="bg-black/60 backdrop-blur border border-white/10 p-3 rounded-lg">
              <h3 className="text-white font-bold text-sm flex items-center gap-2">
                <BrainCircuit size={16} className="text-blue-400"/> FinBERT Vector Space
              </h3>
              <div className="flex gap-4 mt-2 text-[10px] font-mono text-neutral-400">
                <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500"/> Negative</span>
                <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500"/> Positive</span>
              </div>
            </div>
          </div>

          {/* CENTER PROCESSING STAGE */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <AnimatePresence mode="wait">
              
              {/* STAGE 1: TOKENIZING */}
              {stage === "tokenizing" && currentHeadline && (
                <motion.div 
                  key="text"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-neutral-900/90 border border-white/20 px-6 py-4 rounded-xl shadow-2xl text-center"
                >
                  <div className="text-[10px] text-blue-400 font-mono mb-2 tracking-widest flex items-center justify-center gap-2">
                    {step === 9 ? <ScanLine className="animate-pulse" size={12}/> : null}
                    {step === 9 ? "CLASSIFYING HEADLINE..." : "INCOMING HEADLINE"}
                  </div>
                  <div className="text-white text-lg font-medium">"{currentHeadline.text}"</div>
                </motion.div>
              )}

              {/* STAGE 2: VECTORIZING */}
              {stage === "vectorizing" && (
                <motion.div 
                  key="vec"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.5, filter: "blur(10px)" }}
                  className="bg-blue-900/20 border border-blue-500/30 px-6 py-4 rounded-xl shadow-2xl backdrop-blur text-center"
                >
                  <div className="text-[10px] text-blue-300 font-mono mb-2 tracking-widest">CONVERTING TO VECTOR</div>
                  <div className="text-blue-100 font-mono text-sm">{vectorString}</div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>

          {/* FINALE ANALYSIS PANEL (Bottom Left) */}
          <AnimatePresence>
            {stage === "analysis" && (
              <motion.div 
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute bottom-24 left-6 w-80 bg-black/80 backdrop-blur-xl border border-white/10 rounded-xl p-5 shadow-2xl pointer-events-auto"
              >
                <div className="flex items-center gap-2 mb-4 border-b border-white/10 pb-3">
                  <Microscope className="text-purple-400" size={18} />
                  <span className="text-sm font-bold text-white">SEMANTIC ANALYSIS</span>
                </div>

                <div className="space-y-4">
                  <div className="relative pl-4 border-l-2 border-green-500">
                    <div className="text-[10px] text-neutral-500 uppercase mb-1">Target Vector</div>
                    <div className="text-sm text-white font-medium leading-tight">"{targetItem.text}"</div>
                    <div className="mt-1 text-xs font-mono text-green-400">Sentiment: {targetItem.sentiment}</div>
                  </div>

                  <div className="flex justify-center text-neutral-500">
                    <ArrowRight className="rotate-90" size={16} />
                  </div>

                  <div className="relative pl-4 border-l-2 border-blue-500">
                    <div className="text-[10px] text-neutral-500 uppercase mb-1">Nearest Neighbor</div>
                    <div className="text-sm text-neutral-300 font-medium leading-tight">"{neighborItem.text}"</div>
                    <div className="mt-1 text-xs font-mono text-blue-400">Euclidean Dist: 0.12</div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-white/5 bg-white/5 p-3 rounded text-[11px] text-neutral-300 leading-relaxed">
                  <span className="text-purple-400 font-bold">Insight:</span> The model clusters "Cooling Inflation" with "Rate Cuts", identifying a bullish macroeconomic pivot.
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* FOOTER / CONTROLS */}
          <div className="mt-auto w-full flex justify-between items-end">
            <div className="font-mono text-[10px] text-neutral-600">
              <Activity size={12} className="inline mr-1"/> 
              {stage === "analysis" ? "SYSTEM IDLE" : "PROCESSING FEED..."}
            </div>
            
            {(stage === "idle" || stage === "analysis") && (
              <button 
                onClick={startDemo} 
                className="pointer-events-auto flex items-center gap-2 bg-white hover:bg-neutral-200 text-black px-6 py-3 rounded-full text-xs font-bold tracking-wide transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)]"
              >
                {stage === "idle" ? <Play size={14} fill="currentColor"/> : <RotateCcw size={14}/>}
                {stage === "idle" ? "INITIATE VECTORIZATION" : "REPLAY SEQUENCE"}
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}