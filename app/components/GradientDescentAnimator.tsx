"use client";
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import * as THREE from "three";
import { Play, RotateCcw, CheckCircle2, ArrowRight, CornerDownRight, MoveDown, Sigma } from "lucide-react";

// --- CONFIG ---
const TARGET_X = 2.0;
const TARGET_Y = 1.5;
const START_POS = { x: -3.5, y: -2.5 };
const MAX_STEPS = 100;
const LEARNING_RATE = 0.08; 
const MOMENTUM = 0.8;
const VISUAL_SCALE = 18; // Large scale for the "Super Step"

const getCost = (x: number, y: number) => {
  const dx = x - TARGET_X;
  const dy = y - TARGET_Y;
  const globalBowl = (dx * dx + dy * dy) / 8;
  const localRipples = -0.5 * Math.cos(dx * 1.5) - 0.5 * Math.cos(dy * 1.5);
  return globalBowl + localRipples + 1.5;
};

const getGradient = (x: number, y: number) => {
  const dx = x - TARGET_X;
  const dy = y - TARGET_Y;
  return {
    dx: (dx / 4) + 0.75 * Math.sin(dx * 1.5),
    dy: (dy / 4) + 0.75 * Math.sin(dy * 1.5)
  };
};

const getGridColor = (z: number) => {
  const t = Math.min(1, Math.max(0, (z + 2) / 14));
  const c = new THREE.Color();
  if (t < 0.25) c.lerpColors(new THREE.Color(0x00ffff), new THREE.Color(0x8a2be2), t / 0.25);
  else c.lerpColors(new THREE.Color(0x8a2be2), new THREE.Color(0xff0080), (t - 0.25) / 0.75);
  return c;
};

type Phase = 
  | 'idle' 
  | 'zooming-in' 
  | 'math-x' | 'arrow-x' 
  | 'math-y' | 'arrow-y' 
  | 'math-z' | 'arrow-z' 
  | 'ball-slide' 
  | 'show-error'
  | 'zooming-out' 
  | 'running' 
  | 'finished';

export default function InteractiveGradientDescent() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [stepIndex, setStepIndex] = useState(0);
  const [displayWeights, setDisplayWeights] = useState(START_POS);
  
  // ThreeJS Refs
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const ballRef = useRef<THREE.Mesh | null>(null);
  const arrowXRef = useRef<THREE.ArrowHelper | null>(null);
  const arrowYRef = useRef<THREE.ArrowHelper | null>(null);
  const arrowZRef = useRef<THREE.ArrowHelper | null>(null);

  const camTarget = useRef({ radius: 30, theta: Math.PI * 0.25, phi: Math.PI * 0.15, lookAt: new THREE.Vector3(0,0,0) });

  // --- PRE-CALCULATE PATH ---
  const [pathData, setPathData] = useState<{x:number, y:number}[]>([]);
  const [demoStep, setDemoStep] = useState<{dX: number, dY: number, endX: number, endY: number, startZ: number, endZ: number}>({dX:0, dY:0, endX:0, endY:0, startZ:0, endZ:0});

  useEffect(() => {
    // 1. Calculate Initial Gradient
    const startG = getGradient(START_POS.x, START_POS.y);
    
    // 2. Calculate the "Visual Super Step"
    const dX_visual = -LEARNING_RATE * startG.dx * VISUAL_SCALE;
    const dY_visual = -LEARNING_RATE * startG.dy * VISUAL_SCALE;
    const nextX_visual = START_POS.x + dX_visual;
    const nextY_visual = START_POS.y + dY_visual;

    setDemoStep({
      dX: dX_visual,
      dY: dY_visual,
      endX: nextX_visual,
      endY: nextY_visual,
      startZ: getCost(START_POS.x, START_POS.y),
      endZ: getCost(nextX_visual, nextY_visual)
    });

    // 3. Generate the rest of the path
    let current = { x: nextX_visual, y: nextY_visual };
    let velocity = { x: 0, y: 0 };
    const p = [{...START_POS}, {x: nextX_visual, y: nextY_visual}];
    
    for (let i = 0; i < MAX_STEPS; i++) {
      const grad = getGradient(current.x, current.y);
      velocity.x = MOMENTUM * velocity.x + LEARNING_RATE * grad.dx;
      velocity.y = MOMENTUM * velocity.y + LEARNING_RATE * grad.dy;
      if (Math.abs(velocity.x) < 0.001 && Math.abs(velocity.y) < 0.001 && i > 20) break;
      current = { x: current.x - velocity.x, y: current.y - velocity.y };
      p.push(current);
    }
    setPathData(p);
  }, []);

  // --- THREE JS INIT ---
  useEffect(() => {
    if (!containerRef.current) return;
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050505);
    scene.fog = new THREE.FogExp2(0x050505, 0.02);

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    cameraRef.current = camera;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);

    const geometry = new THREE.BufferGeometry();
    const segments = 150; const size = 50;
    const vertices = [], colors = [];
    for (let i = 0; i <= segments; i++) {
      const y = (i * (size/segments)) - (size/2);
      for (let j = 0; j <= segments; j++) {
        const x = (j * (size/segments)) - (size/2);
        const z = getCost(x, y);
        vertices.push(x, z, y);
        const c = getGridColor(z);
        colors.push(c.r, c.g, c.b);
      }
    }
    const indices = [];
    for (let i = 0; i < segments; i++) {
      for (let j = 0; j < segments; j++) {
        const a = i * (segments + 1) + j;
        const b = i * (segments + 1) + j + 1;
        const c = (i + 1) * (segments + 1) + j + 1;
        const d = (i + 1) * (segments + 1) + j;
        indices.push(a, b, d); indices.push(b, c, d);
      }
    }
    geometry.setIndex(indices);
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    geometry.computeVertexNormals();

    const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ vertexColors: true, wireframe: true, transparent: true, opacity: 0.15 }));
    const meshFill = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ color: 0x050505, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 }));
    scene.add(meshFill); scene.add(mesh);

    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.3, 32, 32), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    ballRef.current = ball;
    scene.add(ball);

    const origin = new THREE.Vector3(0,0,0);
    arrowXRef.current = new THREE.ArrowHelper(new THREE.Vector3(1,0,0), origin, 0, 0x3b82f6, 0.7, 0.4);
    arrowYRef.current = new THREE.ArrowHelper(new THREE.Vector3(0,0,1), origin, 0, 0xa855f7, 0.7, 0.4);
    arrowZRef.current = new THREE.ArrowHelper(new THREE.Vector3(0,-1,0), origin, 0, 0xef4444, 0.7, 0.4);

    [arrowXRef, arrowYRef, arrowZRef].forEach(a => { if(a.current) { a.current.visible = false; scene.add(a.current); }});

    let animId: number;
    let camR = 30, camTheta = Math.PI * 0.25, camPhi = Math.PI * 0.15;
    let lookAt = new THREE.Vector3(0,0,0);

    const render = () => {
      animId = requestAnimationFrame(render);
      camR += (camTarget.current.radius - camR) * 0.04;
      camTheta += (camTarget.current.theta - camTheta) * 0.04;
      camPhi += (camTarget.current.phi - camPhi) * 0.04;
      lookAt.lerp(camTarget.current.lookAt, 0.04);

      if (cameraRef.current) {
        cameraRef.current.position.x = lookAt.x + camR * Math.sin(camPhi) * Math.sin(camTheta);
        cameraRef.current.position.y = lookAt.y + camR * Math.cos(camPhi);
        cameraRef.current.position.z = lookAt.z + camR * Math.sin(camPhi) * Math.cos(camTheta);
        cameraRef.current.lookAt(lookAt);
      }
      renderer.render(scene, cameraRef.current!);
    };
    render();

    return () => {
      cancelAnimationFrame(animId);
      if (containerRef.current && renderer.domElement) containerRef.current.removeChild(renderer.domElement);
      geometry.dispose();
    };
  }, []);

  // --- ORCHESTRATION ---
  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (phase === 'zooming-in') {
      camTarget.current = {
        radius: 12.5, 
        theta: Math.PI * 0.25,
        phi: Math.PI * 0.32, 
        lookAt: new THREE.Vector3(START_POS.x, demoStep.startZ, START_POS.y)
      };
      timer = setTimeout(() => setPhase('math-x'), 2000);
    }

    else if (phase === 'math-x') {
      timer = setTimeout(() => setPhase('arrow-x'), 2500);
    }

    else if (phase === 'arrow-x') {
      if (!arrowXRef.current) return;
      const origin = new THREE.Vector3(START_POS.x, demoStep.startZ + 0.3, START_POS.y);
      arrowXRef.current.position.copy(origin);
      arrowXRef.current.setDirection(new THREE.Vector3(demoStep.dX > 0 ? 1 : -1, 0, 0));
      arrowXRef.current.visible = true;

      let p = 0;
      const anim = setInterval(() => {
        p += 0.03;
        const ease = 1 - Math.pow(1 - p, 4);
        if(p>=1) { clearInterval(anim); setPhase('math-y'); }
        arrowXRef.current?.setLength(Math.max(0.01, Math.abs(demoStep.dX) * ease), 0.5, 0.3);
      }, 16);
    }

    else if (phase === 'math-y') {
      timer = setTimeout(() => setPhase('arrow-y'), 2500);
    }

    else if (phase === 'arrow-y') {
      if (!arrowYRef.current) return;
      const startX = START_POS.x + demoStep.dX;
      const startY = START_POS.y;
      const origin = new THREE.Vector3(startX, demoStep.startZ + 0.3, startY);

      arrowYRef.current.position.copy(origin);
      arrowYRef.current.setDirection(new THREE.Vector3(0, 0, demoStep.dY > 0 ? 1 : -1));
      arrowYRef.current.visible = true;

      let p = 0;
      const anim = setInterval(() => {
        p += 0.03;
        const ease = 1 - Math.pow(1 - p, 4);
        if(p>=1) { clearInterval(anim); setPhase('math-z'); }
        arrowYRef.current?.setLength(Math.max(0.01, Math.abs(demoStep.dY) * ease), 0.5, 0.3);
      }, 16);
    }

    else if (phase === 'math-z') {
      timer = setTimeout(() => setPhase('arrow-z'), 2000);
    }

    else if (phase === 'arrow-z') {
      if (!arrowZRef.current) return;
      const tipX = START_POS.x + demoStep.dX;
      const tipY = START_POS.y + demoStep.dY;
      
      const origin = new THREE.Vector3(tipX, demoStep.startZ + 0.3, tipY);
      const dropHeight = (demoStep.startZ + 0.3) - demoStep.endZ;

      arrowZRef.current.position.copy(origin);
      arrowZRef.current.setDirection(new THREE.Vector3(0, -1, 0));
      arrowZRef.current.visible = true;

      let p = 0;
      const anim = setInterval(() => {
        p += 0.03;
        const ease = 1 - Math.pow(1 - p, 4);
        if(p>=1) { clearInterval(anim); setPhase('ball-slide'); }
        arrowZRef.current?.setLength(Math.max(0.01, dropHeight * ease), 0.5, 0.3);
      }, 16);
    }

    else if (phase === 'ball-slide') {
      const startV = new THREE.Vector3(START_POS.x, demoStep.startZ, START_POS.y);
      const endV = new THREE.Vector3(demoStep.endX, demoStep.endZ, demoStep.endY);

      let p = 0;
      const anim = setInterval(() => {
        p += 0.015;
        const ease = 1 - Math.pow(1 - p, 3);
        if(p>=1) { 
            clearInterval(anim); 
            [arrowXRef, arrowYRef, arrowZRef].forEach(a => a.current && (a.current.visible = false));
            setPhase('show-error'); 
        }
        
        // Update Ball 3D Position
        ballRef.current?.position.lerpVectors(startV, endV, ease);
        
        // Update Metrics Display (Interpolated Weights)
        setDisplayWeights({
          x: START_POS.x + (demoStep.endX - START_POS.x) * ease,
          y: START_POS.y + (demoStep.endY - START_POS.y) * ease
        });
      }, 16);
    }

    else if (phase === 'show-error') {
      timer = setTimeout(() => setPhase('zooming-out'), 3000);
    }

    else if (phase === 'zooming-out') {
      camTarget.current = { radius: 30, theta: Math.PI * 0.25, phi: Math.PI * 0.15, lookAt: new THREE.Vector3(0,0,0) };
      timer = setTimeout(() => setPhase('running'), 2500);
    }

    else if (phase === 'running') {
      setStepIndex(1);
      const interval = setInterval(() => {
        setStepIndex(prev => {
          if (prev >= pathData.length - 1) {
            clearInterval(interval);
            setPhase('finished');
            return prev;
          }
          const next = pathData[prev + 1];
          if (ballRef.current) ballRef.current.position.set(next.x, getCost(next.x, next.y), next.y);
          
          // Update Display Weights continuously
          setDisplayWeights({x: next.x, y: next.y});
          
          return prev + 1;
        });
      }, 30);
      return () => clearInterval(interval);
    }

    else if (phase === 'idle') {
      if (ballRef.current) ballRef.current.position.set(START_POS.x, demoStep.startZ, START_POS.y);
      [arrowXRef, arrowYRef, arrowZRef].forEach(a => a.current && (a.current.visible = false));
      setStepIndex(0);
      setDisplayWeights(START_POS);
    }

    return () => clearTimeout(timer);
  }, [phase, demoStep, pathData]);

  const reset = () => {
    setPhase('idle');
    camTarget.current = { radius: 30, theta: Math.PI * 0.25, phi: Math.PI * 0.15, lookAt: new THREE.Vector3(0,0,0) };
  };

  const currentPos = pathData[stepIndex] || START_POS;
  const currentCost = getCost(displayWeights.x, displayWeights.y);
  const startGrad = getGradient(START_POS.x, START_POS.y);

  const isMath = ['math-x', 'arrow-x', 'math-y', 'arrow-y', 'math-z', 'arrow-z', 'ball-slide', 'show-error'].includes(phase);

  return (
    <div className="w-full my-12 flex justify-center">
      <div className="bg-neutral-950 w-full max-w-5xl h-[700px] rounded-xl border border-white/10 shadow-2xl relative overflow-hidden select-none font-sans">
        <div ref={containerRef} className="w-full h-full" />

        {/* --- MATH PANEL (Top Left - Skinnier) --- */}
        <AnimatePresence>
          {isMath && (
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              // Changed w-96 to w-72 for skinnier profile, p-4 for tighter padding
              className="absolute top-4 left-4 w-72 bg-neutral-900/95 backdrop-blur-md border border-white/20 rounded-xl p-4 shadow-2xl z-40"
            >
              <div className="flex items-center gap-2 mb-3 border-b border-white/10 pb-2">
                <Sigma size={16} className="text-white"/>
                <span className="text-xs font-bold text-white uppercase tracking-wider">Gradient Math</span>
              </div>

              {/* RSI Step */}
              <motion.div animate={{ opacity: (phase === 'math-x' || phase === 'arrow-x') ? 1 : 0.2 }}>
                <div className="flex justify-between items-center mb-1">
                   <div className="text-[10px] font-mono text-blue-400 font-bold flex items-center gap-2">
                     <ArrowRight size={10}/> UPDATE w_rsi
                   </div>
                </div>
                <div className="bg-black/50 p-2.5 rounded border border-white/10 font-mono text-[10px] space-y-1.5 mb-2 text-neutral-300">
                    <div className="flex justify-between">
                      <span>∇rsi:</span>
                      <span className="text-white">{startGrad.dx.toFixed(4)}</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-1">
                       <span>Step:</span>
                       <span className="text-blue-300">{-LEARNING_RATE * startGrad.dx * 1}</span>
                    </div>
                    <div className="flex justify-between pt-0.5">
                        <span>New w_rsi:</span>
                        <span className="text-white font-bold">{START_POS.x.toFixed(2)} + ({(-LEARNING_RATE * startGrad.dx).toFixed(3)})</span>
                    </div>
                </div>
              </motion.div>

              {/* Vol Step */}
              <motion.div animate={{ opacity: (phase === 'math-y' || phase === 'arrow-y') ? 1 : 0.2 }}>
                <div className="flex justify-between items-center mb-1">
                   <div className="text-[10px] font-mono text-purple-400 font-bold flex items-center gap-2">
                     <CornerDownRight size={10}/> UPDATE w_vol
                   </div>
                </div>
                <div className="bg-black/50 p-2.5 rounded border border-white/10 font-mono text-[10px] space-y-1.5 mb-2 text-neutral-300">
                    <div className="flex justify-between">
                      <span>∇vol:</span>
                      <span className="text-white">{startGrad.dy.toFixed(4)}</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-1">
                       <span>Step:</span>
                       <span className="text-purple-300">{-LEARNING_RATE * startGrad.dy * 1}</span>
                    </div>
                    <div className="flex justify-between pt-0.5">
                        <span>New w_vol:</span>
                        <span className="text-white font-bold">{START_POS.y.toFixed(2)} + ({(-LEARNING_RATE * startGrad.dy).toFixed(3)})</span>
                    </div>
                </div>
              </motion.div>

              {/* Cost Step */}
              <motion.div animate={{ opacity: ['math-z', 'arrow-z', 'ball-slide', 'show-error'].includes(phase) ? 1 : 0.2 }}>
                <div className="flex justify-between items-center mb-1">
                   <div className="text-[10px] font-mono text-red-400 font-bold flex items-center gap-2">
                     <MoveDown size={10}/> CALCULATING LOSS
                   </div>
                </div>
                <div className="bg-red-900/10 border border-red-500/20 p-2.5 rounded font-mono text-[10px]">
                    <div className="flex justify-between text-neutral-400">
                        <span>Prev Loss:</span><span>{demoStep.startZ.toFixed(4)}</span>
                    </div>
                    {phase === 'show-error' && (
                       <div className="flex justify-between text-green-400 font-bold mt-1">
                          <span>New Loss:</span><span>{demoStep.endZ.toFixed(4)}</span>
                       </div>
                    )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* --- LIVE METRICS (Bottom Left) --- */}
        <motion.div 
            className="absolute bottom-6 left-6 z-30"
            animate={phase === 'finished' ? { opacity: 0 } : { opacity: 1 }}
        >
            <div className="bg-neutral-900/90 backdrop-blur border border-white/10 rounded-xl p-4 shadow-2xl min-w-[260px] flex gap-6">
                <div>
                    <div className="text-[10px] text-neutral-500 uppercase font-bold mb-1">Total Loss</div>
                    <div className={`text-2xl font-mono font-bold ${currentCost < 0.5 ? "text-green-400" : "text-white"}`}>
                        {currentCost.toFixed(4)}
                    </div>
                </div>
                <div className="flex flex-col justify-center gap-1 border-l border-white/10 pl-6">
                    <div className="flex justify-between gap-4 text-xs font-mono">
                         <span className="text-blue-400">w_rsi:</span>
                         <span className="text-white">{displayWeights.x.toFixed(3)}</span>
                    </div>
                    <div className="flex justify-between gap-4 text-xs font-mono">
                         <span className="text-purple-400">w_vol:</span>
                         <span className="text-white">{displayWeights.y.toFixed(3)}</span>
                    </div>
                </div>
            </div>
        </motion.div>

        {/* --- MAIN TITLE (Top Left - shifts if panel active) --- */}
        <motion.div 
            className="absolute top-8 left-8 z-10 pointer-events-none"
            animate={isMath ? { opacity: 0 } : { opacity: 1 }}
        >
            <h1 className="text-3xl font-bold text-white tracking-tighter drop-shadow-lg">Gradient Descent</h1>
            <p className="text-neutral-400 text-sm font-mono mt-1">Optimization Landscape Visualization</p>
        </motion.div>

        {/* --- START BTN --- */}
        {phase === 'idle' && (
            <div className="absolute bottom-8 right-8 z-20">
                <button 
                    onClick={() => setPhase('zooming-in')} 
                    className="flex items-center gap-3 px-8 py-4 rounded-full bg-white text-black hover:bg-neutral-200 shadow-xl transition-all font-bold tracking-wide"
                >
                    <Play size={20} fill="currentColor" /> START DEMO
                </button>
            </div>
        )}

        {/* --- ENDING SUMMARY --- */}
        <AnimatePresence>
            {phase === 'finished' && (
                <motion.div 
                    initial={{opacity: 0}} animate={{opacity: 1}} 
                    className="absolute inset-0 z-50 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center p-6"
                >
                    <motion.div 
                        initial={{scale: 0.9, y: 20}} animate={{scale: 1, y: 0}}
                        className="bg-neutral-900 border border-white/10 p-8 rounded-3xl max-w-lg w-full text-center shadow-2xl"
                    >
                        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 ring-1 ring-green-500/40">
                            <CheckCircle2 className="text-green-400 w-8 h-8" />
                        </div>
                        
                        <h2 className="text-3xl font-bold text-white mb-2">Optimization Complete</h2>
                        <p className="text-neutral-400 text-sm mb-8">The model converged to the global minimum.</p>

                        <div className="grid grid-cols-2 gap-4 mb-8">
                            <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                <div className="text-[10px] text-neutral-500 uppercase font-bold mb-2">Final Loss</div>
                                <div className="text-2xl font-mono text-green-400 font-bold">{currentCost.toFixed(5)}</div>
                            </div>
                            <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                <div className="text-[10px] text-neutral-500 uppercase font-bold mb-2">Iterations</div>
                                <div className="text-2xl font-mono text-white font-bold">{pathData.length}</div>
                            </div>
                            <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                <div className="text-[10px] text-neutral-500 uppercase font-bold mb-2">Final w_rsi</div>
                                <div className="text-xl font-mono text-blue-300">{displayWeights.x.toFixed(3)}</div>
                            </div>
                            <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                <div className="text-[10px] text-neutral-500 uppercase font-bold mb-2">Final w_vol</div>
                                <div className="text-xl font-mono text-purple-300">{displayWeights.y.toFixed(3)}</div>
                            </div>
                        </div>

                        <button onClick={reset} className="w-full py-4 rounded-xl bg-white text-black font-bold hover:bg-neutral-200 transition flex items-center justify-center gap-2">
                            <RotateCcw size={18} /> Replay
                        </button>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
      </div>
    </div>
  );
}