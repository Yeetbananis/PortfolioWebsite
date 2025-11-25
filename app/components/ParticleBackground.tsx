'use client';

import { Suspense, useMemo, useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Line, Points, Html, Float, OrbitControls } from '@react-three/drei';
import { AdditiveBlending, Group, Vector3, MathUtils } from 'three';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import { useNavigation } from '../NavigationContext'; 
import { useRouter } from 'next/navigation';

// --- CONFIGURATION ---
const THEME_PRIMARY = '#00f0ff'; 

// --- MAP DATA ---
// Layout: Inverted Triangle (About Top, Projects Left, Articles Right)
// This fits landscape screens better and keeps the camera neutral.
const SITE_MAP: any = {
  // --- MAIN HUBS ---
  about: { 
    id: 'about', 
    position: [0, 2.5, 0], // Top Center
    label: 'ABOUT', 
    type: 'category', // Acts as a category for visual weight
    url: '/about',
    connections: ['projects', 'articles']
  },
  projects: { 
    id: 'projects', 
    position: [-4.0, -1.5, 0], // Bottom Left
    label: 'PROJECTS', 
    type: 'category',
    connections: ['about', 'articles'],
    children: ['quant', 'forex', 'sentiment']
  },
  articles: { 
    id: 'articles', 
    position: [4.0, -1.5, 0], // Bottom Right
    label: 'ARTICLES', 
    type: 'category',
    connections: ['about', 'projects'],
    children: ['art1', 'art2', 'art3', 'art4', 'art5', 'art6', 'art7']
  },

  // --- SUB NODES: PROJECTS ---
  quant: { 
    id: 'quant', position: [-6, -0.5, 1], label: 'Quant Platform', type: 'leaf', 
    url: '/projects/quant-analysis-platform', parent: 'projects' 
  },
  forex: { 
    id: 'forex', position: [-5.5, -3.5, 1], label: 'Forex AI', type: 'leaf', 
    url: '/projects/dual-ai-forex-assistant', parent: 'projects' 
  },
  sentiment: { 
    id: 'sentiment', position: [-2.5, -4.0, 0.5], label: 'News Sentiment', type: 'leaf', 
    url: '/projects/news-sentiment-model-HFT', parent: 'projects' 
  },

  // --- SUB NODES: ARTICLES ---
  // Spread out in a constellation around [4, -1.5, 0]
  art1: { id: 'art1', position: [6.0, 0.5, 1], label: 'Futures Basics', type: 'leaf', url: '/articles/1-futures-basics', parent: 'articles' },
  art2: { id: 'art2', position: [6.5, -1.0, 0], label: 'Intro to Options', type: 'leaf', url: '/articles/2-options-intro', parent: 'articles' },
  art3: { id: 'art3', position: [5.5, -3.0, 1], label: 'Moneyness (ITM/OTM)', type: 'leaf', url: '/articles/3-option-positioning', parent: 'articles' },
  art4: { id: 'art4', position: [3.5, -4.0, 0], label: 'Black-Scholes', type: 'leaf', url: '/articles/4-black-scholes-model', parent: 'articles' },
  art5: { id: 'art5', position: [2.0, -3.0, 1], label: 'The Greeks', type: 'leaf', url: '/articles/5-intro-to-the-greeks', parent: 'articles' },
  art6: { id: 'art6', position: [2.5, 0.5, 0.5], label: 'Advanced Greeks', type: 'leaf', url: '/articles/6-advanced-risk-management', parent: 'articles' },
  art7: { id: 'art7', position: [5.0, 1.5, -1], label: 'PCA & Linear Algebra', type: 'leaf', url: '/articles/7-pca-linear-algebra-ml', parent: 'articles' },
};

// --- COMPONENT: SPARKS ---
function Sparks({ count, paths }: { count: number, paths: Vector3[][] }) {
  const sparks = useMemo(() => {
    return Array.from({ length: count }, () => {
      const path = paths[Math.floor(Math.random() * paths.length)];
      return {
        path,
        progress: Math.random(),
        speed: Math.random() * 0.002 + 0.001,
        position: new Vector3(),
      };
    });
  }, [count, paths]);

  const sparkRef = useRef<THREE.Points>(null!);

  useFrame(() => {
    if (!sparkRef.current) return;
    const positions = sparkRef.current.geometry.attributes.position.array as Float32Array;

    sparks.forEach((spark, i) => {
      spark.progress += spark.speed;
      if (spark.progress > 1) {
        spark.progress = 0;
        spark.path = paths[Math.floor(Math.random() * paths.length)];
      }
      
      const currentPointIndex = Math.floor(spark.progress * (spark.path.length - 1));
      const nextPointIndex = (currentPointIndex + 1) % spark.path.length;
      
      const p1 = spark.path[currentPointIndex];
      const p2 = spark.path[nextPointIndex];
      
      spark.position.lerpVectors(p1, p2, (spark.progress * (spark.path.length - 1)) % 1);

      positions[i * 3] = spark.position.x;
      positions[i * 3 + 1] = spark.position.y;
      positions[i * 3 + 2] = spark.position.z;
    });
    sparkRef.current.geometry.attributes.position.needsUpdate = true;
  });

  const initialPositions = useMemo(() => new Float32Array(count * 3), [count]);

  return (
    <Points ref={sparkRef} positions={initialPositions} raycast={() => {}}>
      <pointsMaterial color="white" size={0.05} blending={AdditiveBlending} transparent opacity={0.9} depthWrite={false} />
    </Points>
  );
}

// --- COMPONENT: INTERACTIVE NODE ---
const InteractiveNode = ({ id, position, label, type, isTarget, onClick, isVisible, url }: any) => {
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

    // Handle "Leaf" clicks (About or Sub-nodes) differently if needed
    const handleClick = (e: any) => {
        e.stopPropagation();
        onClick();
    }

    const textSizeClass = type === 'category' ? 'text-2xl' : 'text-lg';

    return (
        <group position={position}>
             <Float speed={2} rotationIntensity={0.2} floatIntensity={0.2}>
                {/* 1. HUGE INVISIBLE HITBOX (Radius 0.9 for easier clicking) */}
                {isVisible && (
                    <mesh 
                        onClick={handleClick}
                        onPointerOver={() => { setHover(true); document.body.style.cursor = 'pointer'; }}
                        onPointerOut={() => { setHover(false); document.body.style.cursor = 'auto'; }}
                    >
                        <sphereGeometry args={[0.4, 16, 16]} />
                        <meshBasicMaterial transparent opacity={0} side={THREE.DoubleSide} />
                    </mesh>
                )}

                {/* 2. Visible Node */}
                <mesh ref={meshRef}>
                    <sphereGeometry args={[0.15, 32, 32]} />
                    <meshBasicMaterial 
                        color={isTarget || hovered ? "white" : THEME_PRIMARY} 
                        toneMapped={false} 
                        transparent
                        opacity={isVisible ? 1 : 0} 
                    />
                </mesh>

                {/* 3. Glow */}
                {isVisible && (
                    <mesh scale={1.2}>
                        <sphereGeometry args={[0.3, 32, 32]} />
                        <meshBasicMaterial 
                            color={THEME_PRIMARY} 
                            transparent 
                            opacity={0.3} 
                            blending={AdditiveBlending} 
                            depthWrite={false} 
                        />
                    </mesh>
                )}

                {/* 4. Label - DYNAMIC SIZE */}
                {isVisible && (
                    <Html position={[0, 0.6, 0]} center distanceFactor={8} style={{ pointerEvents: 'none' }}>
                        <div className={`
                            font-mono ${textSizeClass} font-bold tracking-widest px-3 py-1
                            transition-all duration-300 whitespace-nowrap select-none
                            ${hovered || isTarget ? 'text-white scale-110 drop-shadow-[0_0_20px_rgba(0,240,255,0.8)]' : 'text-cyan-300 opacity-80'}
                        `}>
                            {label}
                        </div>
                    </Html>
                )}
            </Float>
        </group>
    );
};

// --- COMPONENT: THE NETWORK ---
function NeuralNetwork() {
  const groupRef = useRef<Group>(null!);
  const { isNavigating, targetNode, setTargetNode, setNavigating } = useNavigation();
  const router = useRouter();

  // 1. Generate Background Cloud
  const { particles, lines, paths } = useMemo(() => {
    const numLayers = 5;
    const pointsPerLayer = 150;
    const layerDepth = 2;
    const xySpread = 12; // Spread wider so camera doesn't clip when backing up
    
    const particles: Vector3[] = [];
    const connections: number[][] = Array.from({ length: numLayers * pointsPerLayer }, () => []);

    for (let i = 0; i < numLayers; i++) {
      for (let j = 0; j < pointsPerLayer; j++) {
        const x = (Math.random() - 0.5) * xySpread;
        const y = (Math.random() - 0.5) * xySpread;
        const z = i * layerDepth - ((numLayers - 1) * layerDepth) / 2;
        particles.push(new Vector3(x, y, z));
      }
    }

    const lines: Vector3[] = [];
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const p1 = particles[i];
        const p2 = particles[j];
        if (p1.distanceTo(p2) < 2) { 
          lines.push(p1, p2);
          connections[i].push(j);
          connections[j].push(i);
        }
      }
    }

    const paths: Vector3[][] = [];
    for (let i = 0; i < 25; i++) {
      const path: Vector3[] = [];
      let current = Math.floor(Math.random() * particles.length);
      for(let j=0; j < 30; j++) {
        path.push(particles[current]);
        const neighbors = connections[current];
        if (neighbors.length > 0) current = neighbors[Math.floor(Math.random() * neighbors.length)];
        else break;
      }
      if (path.length > 2) paths.push(path);
    }

    return { particles, lines, paths };
  }, []);

  // 2. Generate Connections
  const { mainLines, satelliteLines, satellitePoints } = useMemo(() => {
      const mLines: Vector3[] = [];
      const sLines: Vector3[] = [];
      const sPoints: Vector3[] = [];
      
      Object.values(SITE_MAP).forEach((node: any) => {
          const nodePos = new Vector3(...node.position);
          
          // A. Main Hub Connections (Distinct)
          if (node.connections) {
              node.connections.forEach((targetId: string) => {
                  const target = SITE_MAP[targetId];
                  if(target) {
                      mLines.push(nodePos);
                      mLines.push(new Vector3(...target.position));
                  }
              });
          }

          // B. Satellite Stems (Extended)
          // Generate 8 random satellites extending far out into the void
          for(let i=0; i<8; i++) {
              const satellite = nodePos.clone().add(new Vector3(
                  (Math.random() - 0.5) * 8.0, 
                  (Math.random() - 0.5) * 8.0,
                  (Math.random() - 0.5) * 6.0
              ));
              sLines.push(nodePos); 
              sLines.push(satellite);
              sPoints.push(satellite); 
          }
          
          // Connect to children for visual clustering
          if (node.children) {
              node.children.forEach((childId: string) => {
                  const child = SITE_MAP[childId];
                  if(child) {
                      const childPos = new Vector3(...child.position);
                      sLines.push(nodePos);
                      sLines.push(childPos);
                  }
              });
          }
      });
      return { mainLines: mLines, satelliteLines: sLines, satellitePoints: sPoints };
  }, []);

  // Rotation Logic
  useFrame((state, delta) => {
    if (groupRef.current) {
        if(isNavigating) {
             groupRef.current.rotation.y = MathUtils.lerp(groupRef.current.rotation.y, 0, delta * 3);
             groupRef.current.rotation.x = MathUtils.lerp(groupRef.current.rotation.x, 0, delta * 3);
        } else {
             groupRef.current.rotation.y += delta * 0.04;
             groupRef.current.rotation.x += delta * 0.01;
        }
    }
  });

  const handleNodeClick = (key: string) => {
      const node = SITE_MAP[key];
      setTargetNode(key); // Triggers camera fly-in

      // ONE-CLICK NAVIGATION Logic
      // Reduced delay to 800ms for snappier feel
      if ((node.type === 'leaf' || key === 'about') && node.url) {
          setTimeout(() => {
             router.push(node.url);
             setTimeout(() => { setNavigating(false); setTargetNode(null); }, 800);
          }, 800); 
      }
  };

  return (
    <group ref={groupRef}>
      {/* --- BACKGROUND --- */}
      <Points positions={particles as unknown as Float32Array} raycast={() => {}}>
        <pointsMaterial color={THEME_PRIMARY} size={0.06} blending={AdditiveBlending} transparent opacity={0.6} />
      </Points>
      <Line points={lines} color="white" lineWidth={0.2} transparent opacity={0.1} raycast={() => {}} />
      <Sparks count={50} paths={paths} />

      {/* --- INTERACTIVE LAYER --- */}
      
      {/* 1. Main Structural Connections */}
      <Line 
        points={mainLines} 
        color={THEME_PRIMARY} 
        lineWidth={1.5} 
        transparent 
        opacity={isNavigating ? 0.4 : 0} 
        raycast={() => {}}
      />

      {/* 2. Natural Extensions/Stems */}
      <Line 
        points={satelliteLines} 
        color="white" 
        lineWidth={0.5} 
        transparent 
        opacity={isNavigating ? 0.15 : 0} 
        raycast={() => {}}
      />

      {/* 3. Satellite End Points */}
      <Points positions={satellitePoints as unknown as Float32Array} raycast={() => {}}>
        <pointsMaterial 
            color={THEME_PRIMARY} 
            size={0.06} 
            blending={AdditiveBlending} 
            transparent 
            opacity={isNavigating ? 0.5 : 0} 
        />
      </Points>

      {/* 4. Nodes */}
      {Object.keys(SITE_MAP).map(key => {
        const node = SITE_MAP[key];
        let isVisible = false;

        if (isNavigating) {
            // Show Categories and About if no target is selected
            if (!targetNode && (node.type === 'category' || key === 'about')) isVisible = true;
            // Show Target + Siblings + Parent + Children if target is selected
            if (targetNode) {
                if (key === targetNode) isVisible = true;
                if (node.parent === targetNode) isVisible = true;
                if (SITE_MAP[targetNode].parent === node.parent) isVisible = true;
            }
        }

        return (
            <InteractiveNode 
                key={key}
                {...node}
                isTarget={targetNode === key}
                isVisible={isVisible}
                onClick={() => handleNodeClick(key)}
            />
        );
      })}
    </group>
  );
}

// --- SYSTEM: HYBRID CAMERA RIG ---
function CameraRig() {
    const { isNavigating, targetNode } = useNavigation();
    const { camera } = useThree();
    const controlsRef = useRef<any>(null);
    
    // Auto-pilot variables
    const isAutoPiloting = useRef(false);

    useFrame((state, delta) => {
        // 1. Determine Desired Position
        const desiredPos = new Vector3(0, 0, 5); // Default Idle
        const desiredLook = new Vector3(0, 0, 0);

        if (isNavigating) {
            if (!targetNode) {
                // Overview State: 
                // Pull back to Z=7 and Up slightly (Y=0.5) to see the full triangle
                // This ensures "About" (Top) and "Projects/Articles" (Bottom) are all in frame with 90 FOV
                desiredPos.set(0, 0.5, 7); 
            } else {
                // Focus State: Fly close to the node
                const node = SITE_MAP[targetNode];
                desiredPos.set(node.position[0], node.position[1], node.position[2] + 4);
                desiredLook.set(node.position[0], node.position[1], node.position[2]);
            }
        } else {
            // Idle State
            desiredPos.set(0, 0, 5);
        }

        // 2. Auto-Pilot Logic
        const dist = camera.position.distanceTo(desiredPos);
        
        if (dist > 0.5) {
             isAutoPiloting.current = true;
        } else if (dist < 0.1) {
             isAutoPiloting.current = false;
        }

        if (isAutoPiloting.current) {
            // Increased speed to 4.0 for smoother/faster snapping
            const speed = 4.0;
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
            enabled={isNavigating} 
            enableDamping
            dampingFactor={0.05}
            rotateSpeed={0.5}
            zoomSpeed={0.5}
            minDistance={2}
            maxDistance={20}
        />
    );
}

// --- MAIN EXPORT ---
const ParticleBackground = () => {
  const { isNavigating, targetNode, setTargetNode } = useNavigation();

  // 1. Add Escape Key Listener (Cleanest "Invisible" Interaction)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && targetNode) {
        setTargetNode(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [targetNode, setTargetNode]);

  return (
    <div className="fixed inset-0 z-[-1] bg-black">
      <Canvas 
        camera={{ position: [0, 0, 5], fov: 90 }} 
        dpr={[1, 2]}
      >
        <Suspense fallback={null}>
          <NeuralNetwork />
          <CameraRig />
        </Suspense>
        <EffectComposer>
          <Bloom luminanceThreshold={0.1} intensity={1.5} mipmapBlur radius={0.5} />
        </EffectComposer>
      </Canvas>

      {/* 2. Visual "Return" Button - Only visible when a target is selected */}
      {targetNode && (
        <div className="absolute top-24 left-8 z-50 animate-fade-in">
            <button 
                onClick={() => setTargetNode(null)}
                className="
                    font-mono text-xs font-bold tracking-widest text-cyan-400 
                    border border-cyan-500/30 bg-black/60 backdrop-blur-md
                    px-4 py-2 rounded-sm
                    transition-all duration-300
                    hover:bg-cyan-900/40 hover:border-cyan-400 hover:text-white hover:scale-105
                "
            >
                {'< RETURN TO NETWORK'}
            </button>
        </div>
      )}

      {/* Original Overlay */}
      <div className={`absolute inset-0 bg-background pointer-events-none transition-opacity duration-1000 ${
          isNavigating ? 'opacity-0' : 'opacity-80'
      }`} />
    </div>
  );
};

export default ParticleBackground;