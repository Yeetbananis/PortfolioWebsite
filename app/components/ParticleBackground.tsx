'use client';

import { Suspense, useMemo, useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Line, Points, Html, Float, OrbitControls } from '@react-three/drei';
import { AdditiveBlending, Group, Vector3, MathUtils } from 'three';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import { useRouter } from 'next/navigation';
import { useNavigation } from '../NavigationContext';

// --- THEME ENGINE ---
const THEMES = [
  { name: 'Deep Ocean', primary: '#00f0ff', hueBase: 0.33, hueRange: 0.4 }, 
  { name: 'Inferno', primary: '#ff4d00', hueBase: 0.0, hueRange: 0.17 }, 
  { name: 'Neon Cyberpunk', primary: '#d000ff', hueBase: 0.72, hueRange: 0.23 },
  { name: 'Biohazard', primary: '#39ff14', hueBase: 0.28, hueRange: 0.12 }
];

// --- LORENZ CONSTANTS ---
const LORENZ_SIGMA = 10;
const LORENZ_RHO = 28;
const LORENZ_BETA = 8 / 3;
const LORENZ_DT = 0.01; 
const LORENZ_MAX_POINTS = 3000;
const LORENZ_SPEED = 8; 
const LORENZ_SCALE = 0.5;

// --- MAP DATA ---
const SITE_MAP: any = {
  about: { id: 'about', position: [0, 2.5, 0], label: 'ABOUT', type: 'category', url: '/about', connections: ['projects', 'articles'] },
  projects: { id: 'projects', position: [-4.0, -1.5, 0], label: 'PROJECTS', type: 'category', connections: ['about', 'articles'], children: ['quant', 'forex', 'sentiment'] },
  articles: { id: 'articles', position: [4.0, -1.5, 0], label: 'ARTICLES', type: 'category', connections: ['about', 'projects'], children: ['art1', 'art2', 'art3', 'art4', 'art5', 'art6', 'art7'] },
  quant: { id: 'quant', position: [-6, -0.5, 1], label: 'Quant Platform', type: 'leaf', url: '/projects/quant-analysis-platform', parent: 'projects' },
  forex: { id: 'forex', position: [-5.5, -3.5, 1], label: 'Forex AI', type: 'leaf', url: '/projects/dual-ai-forex-assistant', parent: 'projects' },
  sentiment: { id: 'sentiment', position: [-2.5, -4.0, 0.5], label: 'News Sentiment', type: 'leaf', url: '/projects/news-sentiment-model-HFT', parent: 'projects' },
  art1: { id: 'art1', position: [6.0, 0.5, 1], label: 'Futures Basics', type: 'leaf', url: '/articles/1-futures-basics', parent: 'articles' },
  art2: { id: 'art2', position: [6.5, -1.0, 0], label: 'Intro to Options', type: 'leaf', url: '/articles/2-options-intro', parent: 'articles' },
  art3: { id: 'art3', position: [5.5, -3.0, 1], label: 'Moneyness (ITM/OTM)', type: 'leaf', url: '/articles/3-option-positioning', parent: 'articles' },
  art4: { id: 'art4', position: [3.5, -4.0, 0], label: 'Black-Scholes', type: 'leaf', url: '/articles/4-black-scholes-model', parent: 'articles' },
  art5: { id: 'art5', position: [2.0, -3.0, 1], label: 'The Greeks', type: 'leaf', url: '/articles/5-intro-to-the-greeks', parent: 'articles' },
  art6: { id: 'art6', position: [2.5, 0.5, 0.5], label: 'Advanced Greeks', type: 'leaf', url: '/articles/6-advanced-risk-management', parent: 'articles' },
  art7: { id: 'art7', position: [5.0, 1.5, -1], label: 'PCA & Linear Algebra', type: 'leaf', url: '/articles/7-pca-linear-algebra-ml', parent: 'articles' },
};

// --- COMPONENT: 4D TESSERACT ENGINE ---
function TesseractWidget({ isActive, theme }: { isActive: boolean, theme: any }) {
    const groupRef = useRef<Group>(null!);
    const geometryRef = useRef<THREE.BufferGeometry>(null!);
    const [angle, setAngle] = useState(0);

    // 1. GENERATE 4D HYPERCUBE VERTICES
    // 16 points: (±1, ±1, ±1, ±1)
    const points4D = useMemo(() => {
        const p = [];
        for (let i = 0; i < 16; i++) {
            p.push([
                (i & 1) ? 1 : -1,
                (i & 2) ? 1 : -1,
                (i & 4) ? 1 : -1,
                (i & 8) ? 1 : -1
            ]);
        }
        return p;
    }, []);

    // 2. DEFINE EDGES (32 edges connecting points with hamming distance 1)
    const edges = useMemo(() => {
        const e = [];
        for (let i = 0; i < 16; i++) {
            for (let j = i + 1; j < 16; j++) {
                // Check if indices differ by exactly one bit (power of 2)
                const diff = i ^ j;
                if ((diff & (diff - 1)) === 0) {
                    e.push([i, j]);
                }
            }
        }
        return e;
    }, []);

    useFrame((state, delta) => {
        if (!geometryRef.current) return;

        // Transition Logic: Scale up/down based on active state
        const targetScale = isActive ? 2 : 0;
        groupRef.current.scale.lerp(new Vector3(targetScale, targetScale, targetScale), delta * 2);
        groupRef.current.visible = groupRef.current.scale.x > 0.01;

        if (!isActive && groupRef.current.scale.x < 0.01) return;

        // ROTATION ANGLES
        setAngle(a => a + delta * 0.4);
        const ang = angle;

        // 3. 4D ROTATION MATRICES
        // We rotate in the XW and ZW planes to show the "inside-out" 4D effect
        const cos = Math.cos(ang);
        const sin = Math.sin(ang);

        const currentPositions: Vector3[] = [];

        for (let i = 0; i < 16; i++) {
            let [x, y, z, w] = points4D[i];

            // Rotate XW
            const x1 = x * cos - w * sin;
            const w1 = x * sin + w * cos;
            x = x1; w = w1;

            // Rotate ZW (Double rotation for complexity)
            const z2 = z * cos - w * sin;
            const w2 = z * sin + w * cos;
            z = z2; w = w2;

            // Rotate XY (Standard 3D tumble)
            const x3 = x * Math.cos(ang * 0.5) - y * Math.sin(ang * 0.5);
            const y3 = x * Math.sin(ang * 0.5) + y * Math.cos(ang * 0.5);
            x = x3; y = y3;

            // 4. PROJECTION: 4D -> 3D
            // Perspective projection w/ distance 2
            const distance = 2.5;
            const wFactor = 1 / (distance - w); 
            
            const px = x * wFactor * 3;
            const py = y * wFactor * 3;
            const pz = z * wFactor * 3;

            currentPositions.push(new Vector3(px, py, pz));
        }

        // 5. BUILD LINE GEOMETRY
        const finalPoints: number[] = [];
        const finalColors: number[] = [];
        const colorObj = new THREE.Color(theme.primary);

        edges.forEach(([start, end]) => {
            const p1: Vector3 = currentPositions[start];
            const p2: Vector3 = currentPositions[end];

            finalPoints.push(p1.x, p1.y, p1.z);
            finalPoints.push(p2.x, p2.y, p2.z);

            // Add slight gradient to edges based on depth
            finalColors.push(colorObj.r, colorObj.g, colorObj.b);
            finalColors.push(colorObj.r * 0.5, colorObj.g * 0.5, colorObj.b * 0.5);
        });

        geometryRef.current.setAttribute('position', new THREE.Float32BufferAttribute(finalPoints, 3));
        geometryRef.current.setAttribute('color', new THREE.Float32BufferAttribute(finalColors, 3));
        geometryRef.current.attributes.position.needsUpdate = true;
        geometryRef.current.attributes.color.needsUpdate = true;
    });

    return (
        <group ref={groupRef} scale={[0, 0, 0]}>
            <lineSegments>
                <bufferGeometry ref={geometryRef} />
                <lineBasicMaterial vertexColors transparent opacity={0.8} blending={AdditiveBlending} linewidth={2} />
            </lineSegments>
             {/* Glow Core */}
            <mesh>
                <sphereGeometry args={[0.2, 16, 16]} />
                <meshBasicMaterial color={theme.primary} transparent opacity={0.5} blending={AdditiveBlending} />
            </mesh>
        </group>
    );
}

// --- COMPONENT: INTERACTIVE NODE (UNCHANGED) ---
const InteractiveNode = ({ id, position, label, type, isTarget, onClick, isVisible, url, themeColor }: any) => {
    const meshRef = useRef<THREE.Mesh>(null!);
    const [hovered, setHover] = useState(false);
    useFrame((state) => {
        if (!meshRef.current) return;
        const time = state.clock.getElapsedTime();
        const pulse = Math.sin(time * 3) * 0.1 + 1;
        const baseScale = hovered || isTarget ? 1.6 : 1.0;
        const targetScale = isVisible ? baseScale * pulse : 0;
        meshRef.current.scale.lerp(new Vector3(targetScale, targetScale, targetScale), 0.1);
    });
    const handleClick = (e: any) => { e.stopPropagation(); onClick(); }
    return (
        <group position={position}>
             <Float speed={2} rotationIntensity={0.2} floatIntensity={0.2}>
                {isVisible && (
                    <mesh onClick={handleClick} onPointerOver={() => { setHover(true); document.body.style.cursor = 'pointer'; }} onPointerOut={() => { setHover(false); document.body.style.cursor = 'auto'; }}>
                        <sphereGeometry args={[0.4, 16, 16]} />
                        <meshBasicMaterial transparent opacity={0} side={THREE.DoubleSide} />
                    </mesh>
                )}
                <mesh ref={meshRef}>
                    <sphereGeometry args={[0.15, 32, 32]} />
                    <meshBasicMaterial color={isTarget || hovered ? "white" : themeColor} toneMapped={false} transparent opacity={isVisible ? 1 : 0} />
                </mesh>
                {isVisible && (
                    <mesh scale={1.2}>
                        <sphereGeometry args={[0.3, 32, 32]} />
                        <meshBasicMaterial color={themeColor} transparent opacity={0.3} blending={AdditiveBlending} depthWrite={false} />
                    </mesh>
                )}
                {isVisible && (
                    <Html position={[0, 0.6, 0]} center distanceFactor={8} style={{ pointerEvents: 'none' }}>
                        <div className={`font-mono ${type === 'category' ? 'text-2xl' : 'text-lg'} font-bold tracking-widest px-3 py-1 transition-all duration-300 whitespace-nowrap select-none`}
                        style={{ color: hovered || isTarget ? '#ffffff' : themeColor, textShadow: hovered || isTarget ? `0 0 20px ${themeColor}80` : 'none', opacity: hovered || isTarget ? 1 : 0.8 }}>
                            {label}
                        </div>
                    </Html>
                )}
            </Float>
        </group>
    );
};

// --- COMPONENT: LORENZ ATTRACTOR (UNCHANGED LOGIC, JUST RE-PASTED FOR COMPLETENESS) ---
function LorenzAttractor({ isActive, theme }: { isActive: boolean, theme: any }) {
  const lineRef = useRef<any | null>(null);
  const geometryRef = useRef<THREE.BufferGeometry | null>(null);
  const headMeshRef = useRef<THREE.Mesh>(null!); 
  const groupRef = useRef<Group>(null!);

  const head = useRef({ x: 0.1, y: 0, z: 0 });
  const points = useRef<Float32Array>(new Float32Array(LORENZ_MAX_POINTS * 3));
  const colors = useRef<Float32Array>(new Float32Array(LORENZ_MAX_POINTS * 3));
  const count = useRef(0);

  useEffect(() => {
    if (isActive && count.current === 0) {
       head.current = { x: 0.1, y: 0, z: 0 };
    }
  }, [isActive]);

  useFrame((state, delta) => {
    if (!geometryRef.current || !lineRef.current) return;
    if (groupRef.current) groupRef.current.rotation.y += delta * 0.2;

    const positions = points.current;
    const cols = colors.current;

    if (isActive) {
        let { x, y, z } = head.current;
        for (let s = 0; s < LORENZ_SPEED; s++) {
            const dx = LORENZ_SIGMA * (y - x) * LORENZ_DT;
            const dy = (x * (LORENZ_RHO - z) - y) * LORENZ_DT;
            const dz = (x * y - LORENZ_BETA * z) * LORENZ_DT;
            x += dx; y += dy; z += dz;

            if (count.current >= LORENZ_MAX_POINTS) {
                positions.set(positions.subarray(3), 0);
                cols.set(cols.subarray(3), 0);
                count.current = LORENZ_MAX_POINTS - 1;
            }
            const idx = count.current;
            positions[idx * 3] = x;
            positions[idx * 3 + 1] = y;
            positions[idx * 3 + 2] = z;
            // Vibrant Color Logic
            const hue = theme.hueBase + (z / 50) * theme.hueRange; 
            const color = new THREE.Color().setHSL(hue, 1.0, 0.6);
            cols[idx * 3] = color.r;
            cols[idx * 3 + 1] = color.g;
            cols[idx * 3 + 2] = color.b;
            count.current++;
        }
        head.current = { x, y, z };
        if (headMeshRef.current) {
            headMeshRef.current.position.set(x, y, z);
            headMeshRef.current.visible = true; 
        }
    } else {
        if (count.current > 0) {
            const rewindSpeed = 25; 
            count.current = Math.max(0, count.current - rewindSpeed);
            if (headMeshRef.current) {
                const idx = Math.floor(count.current);
                const px = positions[idx * 3];
                const py = positions[idx * 3 + 1];
                const pz = positions[idx * 3 + 2];
                headMeshRef.current.position.set(px, py, pz);
                headMeshRef.current.visible = true;
            }
        } else {
            if (headMeshRef.current) headMeshRef.current.visible = false;
        }
    }
    geometryRef.current.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometryRef.current.setAttribute('color', new THREE.BufferAttribute(cols, 3));
    geometryRef.current.setDrawRange(0, count.current);
    geometryRef.current.attributes.position.needsUpdate = true;
    geometryRef.current.attributes.color.needsUpdate = true;
  });

  return (
    <group ref={groupRef} scale={[LORENZ_SCALE, LORENZ_SCALE, LORENZ_SCALE]}>
      <line ref={lineRef}>
        <bufferGeometry ref={geometryRef}>
          <bufferAttribute attach="attributes-position" count={LORENZ_MAX_POINTS} array={points.current} itemSize={3} />
          <bufferAttribute attach="attributes-color" count={LORENZ_MAX_POINTS} array={colors.current} itemSize={3} />
        </bufferGeometry>
        <lineBasicMaterial vertexColors transparent opacity={0.8} blending={AdditiveBlending} />
      </line>
      <mesh ref={headMeshRef} position={[0.1, 0, 0]} visible={false}>
         <sphereGeometry args={[0.7, 16, 16]} />
         <meshBasicMaterial color="white" toneMapped={false} />
      </mesh>
    </group>
  );
}

// --- COMPONENT: THE NETWORK ---
function NeuralNetwork({ theme }: { theme: any }) {
  const standardGroupRef = useRef<Group>(null!);
  const { isNavigating, targetNode, setTargetNode, setNavigating, isChaosMode, isTesseractMode } = useNavigation();
  const router = useRouter();

  // --- TRANSITION LOGIC ---
  // Local state to manage visual visibility.
  // This allows us to delay the "Entry" of a new mode until the "Exit" of the old one is complete.
  const [activeChaos, setActiveChaos] = useState(isChaosMode);
  const [activeTesseract, setActiveTesseract] = useState(isTesseractMode);

  // Refs to track current visual state instantly inside effects
  const chaosRef = useRef(isChaosMode);
  const tessRef = useRef(isTesseractMode);
  useEffect(() => { chaosRef.current = activeChaos; }, [activeChaos]);
  useEffect(() => { tessRef.current = activeTesseract; }, [activeTesseract]);

  useEffect(() => {
    // 1. HANDLE CHAOS SIGNAL
    if (isChaosMode) {
        if (tessRef.current) {
            // If Tesseract is visible, kill it -> Wait 1.2s (Shrink time) -> Start Chaos
            setActiveTesseract(false);
            const t = setTimeout(() => setActiveChaos(true), 1200);
            return () => clearTimeout(t);
        } else {
            setActiveChaos(true);
        }
    } else {
        setActiveChaos(false); // Kill immediately (triggers rewind)
    }

    // 2. HANDLE TESSERACT SIGNAL
    if (isTesseractMode) {
        if (chaosRef.current) {
            // If Chaos is visible, kill it -> Wait 2.2s (Rewind time) -> Start Tesseract
            setActiveChaos(false);
            const t = setTimeout(() => setActiveTesseract(true), 2200);
            return () => clearTimeout(t);
        } else {
            setActiveTesseract(true);
        }
    } else {
        setActiveTesseract(false); // Kill immediately (triggers collapse)
    }
  }, [isChaosMode, isTesseractMode]);

  // --- SQUISH LOGIC ---
  const [shouldSquish, setShouldSquish] = useState(false);

  useEffect(() => {
    // If ANY special mode is active (or transitioning), squish the network
    if (isChaosMode || isTesseractMode) {
        setShouldSquish(true);
    } else {
        // Only unsquish when everything is truly off. 
        // Wait for the longest exit animation (Lorenz ~2s) to ensure clean empty space before network expands.
        const timer = setTimeout(() => {
            setShouldSquish(false);
        }, 2000); 
        return () => clearTimeout(timer);
    }
  }, [isChaosMode, isTesseractMode]);

  // --- STANDARD NETWORK GENERATION (Preserved) ---
  const { particles, lines, paths, mainLines, satelliteLines, satellitePoints } = useMemo(() => {
    const numLayers = 5; const pointsPerLayer = 150; const layerDepth = 2; const xySpread = 20; 
    const particles: Vector3[] = [];
    const connections: number[][] = Array.from({ length: numLayers * pointsPerLayer }, () => []);
    for (let i = 0; i < numLayers; i++) {
      for (let j = 0; j < pointsPerLayer; j++) {
        particles.push(new Vector3((Math.random() - 0.5) * xySpread, (Math.random() - 0.5) * xySpread, i * layerDepth - ((numLayers - 1) * layerDepth) / 2));
      }
    }
    const lines: Vector3[] = [];
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        if (particles[i].distanceTo(particles[j]) < 2) { lines.push(particles[i], particles[j]); connections[i].push(j); connections[j].push(i); }
      }
    }
    const paths: Vector3[][] = [];
    for (let i = 0; i < 25; i++) {
      const path: Vector3[] = []; let current = Math.floor(Math.random() * particles.length);
      for(let j=0; j < 30; j++) { path.push(particles[current]); const neighbors = connections[current]; if (neighbors.length > 0) current = neighbors[Math.floor(Math.random() * neighbors.length)]; else break; }
      if (path.length > 2) paths.push(path);
    }
    const mLines: Vector3[] = []; const sLines: Vector3[] = []; const sPoints: Vector3[] = [];
    Object.values(SITE_MAP).forEach((node: any) => {
          const nodePos = new Vector3(...node.position);
          if (node.connections) node.connections.forEach((targetId: string) => { const target = SITE_MAP[targetId]; if(target) { mLines.push(nodePos); mLines.push(new Vector3(...target.position)); } });
          let connectionsFound = 0;
          for(const p of particles) { if (nodePos.distanceTo(p) < 4.5 && nodePos.distanceTo(p) > 1.0) { sLines.push(nodePos); sLines.push(p); sPoints.push(p); connectionsFound++; if (connectionsFound >= 5) break; } }
          if (node.children) node.children.forEach((childId: string) => { const child = SITE_MAP[childId]; if(child) { const childPos = new Vector3(...child.position); sLines.push(nodePos); sLines.push(childPos); } });
    });
    return { particles, lines, paths, mainLines: mLines, satelliteLines: sLines, satellitePoints: sPoints };
  }, []);

  useFrame((state, delta) => {
    if (standardGroupRef.current) {
        if (isNavigating) {
            standardGroupRef.current.rotation.y = MathUtils.lerp(standardGroupRef.current.rotation.y, 0, delta * 3);
            standardGroupRef.current.rotation.x = MathUtils.lerp(standardGroupRef.current.rotation.x, 0, delta * 3);
        } else {
            standardGroupRef.current.rotation.y += delta * 0.04;
            standardGroupRef.current.rotation.x += delta * 0.01;
        }
        const targetScale = shouldSquish ? 0 : 1; 
        const currentScale = standardGroupRef.current.scale.x;
        const nextScale = MathUtils.lerp(currentScale, targetScale, delta * 3.5); 
        standardGroupRef.current.scale.setScalar(nextScale);
        standardGroupRef.current.visible = nextScale > 0.01;
    }
  });

  const handleNodeClick = (key: string) => {
      const node = SITE_MAP[key]; setTargetNode(key);
      if ((node.type === 'leaf' || key === 'about') && node.url) { setTimeout(() => { router.push(node.url); setTimeout(() => { setNavigating(false); setTargetNode(null); }, 800); }, 800); }
  };

  return (
    <>
        <group ref={standardGroupRef}>
            <Points positions={particles as unknown as Float32Array} raycast={() => {}}> <pointsMaterial color={theme.primary} size={0.06} blending={AdditiveBlending} transparent opacity={0.3} /> </Points>
            <Line points={lines} color="white" lineWidth={0.2} transparent opacity={0.05} raycast={() => {}} />
            <Sparks count={50} paths={paths} />
            <Line points={mainLines} color={theme.primary} lineWidth={1.5} transparent opacity={isNavigating ? 0.4 : 0} raycast={() => {}} />
            <Line points={satelliteLines} color="white" lineWidth={0.5} transparent opacity={isNavigating ? 0.05 : 0} raycast={() => {}} />
            <Points positions={satellitePoints as unknown as Float32Array} raycast={() => {}}> <pointsMaterial color={theme.primary} size={0.06} blending={AdditiveBlending} transparent opacity={isNavigating ? 0.5 : 0} /> </Points>
            {Object.keys(SITE_MAP).map(key => {
                const node = SITE_MAP[key];
                let isVisible = false;
                if (isNavigating) { if (!targetNode && (node.type === 'category' || key === 'about')) isVisible = true; if (targetNode) { if (key === targetNode) isVisible = true; if (node.parent === targetNode) isVisible = true; if (SITE_MAP[targetNode].parent === node.parent) isVisible = true; } }
                return <InteractiveNode key={key} {...node} isTarget={targetNode === key} isVisible={isVisible && !isChaosMode && !isTesseractMode} onClick={() => handleNodeClick(key)} themeColor={theme.primary} />;
            })}
        </group>
        
        {/* Pass LOCAL active states, not global context flags */}
        <LorenzAttractor isActive={activeChaos} theme={theme} />
        <TesseractWidget isActive={activeTesseract} theme={theme} />
    </>
  );
}

// --- SYSTEM: SPARKS (Re-adding missing component) ---
function Sparks({ count, paths }: { count: number, paths: Vector3[][] }) {
  const sparks = useMemo(() => Array.from({ length: count }, () => ({ path: paths[Math.floor(Math.random() * paths.length)], progress: Math.random(), speed: Math.random() * 0.002 + 0.001, position: new Vector3() })), [count, paths]);
  const sparkRef = useRef<THREE.Points>(null!);
  useFrame(() => {
    if (!sparkRef.current) return;
    const positions = sparkRef.current.geometry.attributes.position.array as Float32Array;
    sparks.forEach((spark, i) => {
      spark.progress += spark.speed; if (spark.progress > 1) { spark.progress = 0; spark.path = paths[Math.floor(Math.random() * paths.length)]; }
      const currentPointIndex = Math.floor(spark.progress * (spark.path.length - 1));
      const p1 = spark.path[currentPointIndex]; const p2 = spark.path[(currentPointIndex + 1) % spark.path.length];
      spark.position.lerpVectors(p1, p2, (spark.progress * (spark.path.length - 1)) % 1);
      positions[i * 3] = spark.position.x; positions[i * 3 + 1] = spark.position.y; positions[i * 3 + 2] = spark.position.z;
    });
    sparkRef.current.geometry.attributes.position.needsUpdate = true;
  });
  return <Points ref={sparkRef} positions={new Float32Array(count * 3)} raycast={() => {}}> <pointsMaterial color="white" size={0.05} blending={AdditiveBlending} transparent opacity={0.9} depthWrite={false} /> </Points>;
}

// --- SYSTEM: HYBRID CAMERA RIG (RESPONSIVE) ---
function CameraRig() {
    const { isNavigating, targetNode, isChaosMode, isTesseractMode } = useNavigation();
    const { camera, size } = useThree(); // Get screen size
    const controlsRef = useRef<any>(null);
    const isAutoPiloting = useRef(false);
    const lastInteractionTime = useRef(0); 

    // Responsive State
    const isMobile = size.width < 768; // Standard mobile breakpoint
    
    // Zoom Multiplier: Push camera back on mobile to fit the width
    const mobileZoomFactor = isMobile ? 2.2 : 1.0; 
    const mobileYOffset = isMobile ? -0.5 : 0; // Shift down slightly on mobile to center visually

    useEffect(() => {
        if (!targetNode || isNavigating || isChaosMode || isTesseractMode) {
            lastInteractionTime.current = (performance.now() / 1000) - 100; 
            isAutoPiloting.current = true;
        }
    }, [targetNode, isNavigating, isChaosMode, isTesseractMode]);

    useFrame((state, delta) => {
        const desiredPos = new Vector3(0, 0, 5);
        const desiredLook = new Vector3(0, 0, 0);

        if (isChaosMode || isTesseractMode) {
            // Chaos/Math modes need to be much further back on mobile to see the whole shape
            desiredPos.set(0, 0, 15 * (isMobile ? 1.5 : 1)); 
        } else if (isNavigating) {
            if (!targetNode) {
                // IDLE HOME STATE
                // Desktop: z=6, Mobile: z=13.2 (6 * 2.2)
                desiredPos.set(0, 0.5 + mobileYOffset, 6 * mobileZoomFactor); 
            } else {
                // FOCUSED NODE STATE
                const node = SITE_MAP[targetNode];
                // When looking at a specific node, we don't need to zoom out AS much, 
                // but still enough to not clip edges.
                const focusZoom = isMobile ? 1.5 : 1; 
                desiredPos.set(
                    node.position[0], 
                    node.position[1] + (isMobile ? 0 : 0), // Keep Y centered on node
                    node.position[2] + 4 * focusZoom
                );
                desiredLook.set(node.position[0], node.position[1], node.position[2]);
            }
        }
        
        const timeNow = performance.now() / 1000;
        const timeSinceInteraction = timeNow - lastInteractionTime.current;
        let shouldEngage = false;

        if (isChaosMode || isTesseractMode) shouldEngage = true; 
        else if (!isNavigating) shouldEngage = true; 
        else if (targetNode) shouldEngage = true; 
        else if (timeSinceInteraction > 3.0) shouldEngage = true; 

        if (shouldEngage && camera.position.distanceTo(desiredPos) > 0.05) isAutoPiloting.current = true;
        else if (!shouldEngage) isAutoPiloting.current = false;

        if (isAutoPiloting.current) {
            const speed = targetNode ? 4.0 : 1.5; 
            state.camera.position.lerp(desiredPos, delta * speed);
            if (controlsRef.current) { 
                controlsRef.current.target.lerp(desiredLook, delta * speed); 
                controlsRef.current.update(); 
            }
        }
    });

    return (
        <OrbitControls 
            ref={controlsRef} 
            enabled={isNavigating || isChaosMode || isTesseractMode} 
            enableDamping 
            dampingFactor={0.05} 
            rotateSpeed={0.5} 
            minDistance={2} 
            maxDistance={40} 
            onStart={() => { 
                isAutoPiloting.current = false; 
                lastInteractionTime.current = Infinity; 
            }} 
            onEnd={() => { 
                lastInteractionTime.current = performance.now() / 1000; 
            }} 
        />
    );
}
// --- MAIN EXPORT ---
const ParticleBackground = () => {
  const { isNavigating, targetNode, setTargetNode, isChaosMode, isTesseractMode } = useNavigation();
  const [themeIndex, setThemeIndex] = useState(0);
  const theme = THEMES[themeIndex] || THEMES[0];
  const toggleTheme = () => setThemeIndex((prev) => (prev + 1) % THEMES.length);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape' && targetNode) setTargetNode(null); };
    window.addEventListener('keydown', handleKeyDown); return () => window.removeEventListener('keydown', handleKeyDown);
  }, [targetNode, setTargetNode]);

  return (
    <div className="fixed inset-0 z-[-1] bg-black">
      <Canvas camera={{ position: [0, 0, 5], fov: 90 }} dpr={[1, 2]}>
        <Suspense fallback={null}>
          <NeuralNetwork theme={theme} />
          <CameraRig />
        </Suspense>
        <EffectComposer>
          <Bloom luminanceThreshold={0.1} intensity={1.5} mipmapBlur radius={0.5} />
        </EffectComposer>
      </Canvas>
      {targetNode && (
        <div className="absolute top-24 left-8 z-50 animate-fade-in">
            <button onClick={() => setTargetNode(null)} className="font-mono text-xs font-bold tracking-widest border bg-black/60 backdrop-blur-md px-4 py-2 rounded-sm transition-all duration-300 hover:text-white hover:scale-105" style={{ color: theme.primary, borderColor: `${theme.primary}4D` }}>
                {'< RETURN TO NETWORK'}
            </button>
        </div>
      )}
      <div className="absolute bottom-6 right-6 z-50 opacity-20 hover:opacity-100 transition-opacity duration-300 cursor-pointer p-4 group" onClick={toggleTheme} title={`Switch Theme: ${theme.name}`}>
         <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[10px] transform group-hover:-translate-y-1 transition-transform" style={{ borderBottomColor: theme.primary }} />
      </div>
      <div className={`absolute inset-0 bg-background pointer-events-none transition-opacity duration-1000 ${isNavigating || isChaosMode || isTesseractMode ? 'opacity-0' : 'opacity-80'}`} />
    </div>
  );
};

export default ParticleBackground;