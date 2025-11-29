'use client';

import { Suspense, useMemo, useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree, extend } from '@react-three/fiber';
import { Line, Points, Html, Float, OrbitControls, shaderMaterial } from '@react-three/drei';
import { AdditiveBlending, Group, Vector3, MathUtils, BufferAttribute } from 'three';
import { EffectComposer, Bloom, ChromaticAberration } from '@react-three/postprocessing';
import * as THREE from 'three';
import { useRouter } from 'next/navigation';
import { useNavigation } from '../NavigationContext';

// --- LORENZ CONSTANTS ---
const LORENZ_SIGMA = 10;
const LORENZ_RHO = 28;
const LORENZ_BETA = 8 / 3;
const LORENZ_DT = 0.01; 
const LORENZ_MAX_POINTS = 3000;
const LORENZ_SPEED = 8; 
const LORENZ_SCALE = 0.5;

// --- REUSABLE SCRATCH OBJECTS (PREVENTS GC TRASH) ---
const _scratchVec3 = new THREE.Vector3();
const _scratchColor = new THREE.Color();

// --- OPTIMIZED GALAXY SHADER (FIXED) ---
const GalaxyShaderMaterial = {
  uniforms: {
    uTime: { value: 0 },
    uExpansion: { value: 0 },
    uColorCore: { value: new THREE.Color(0xffffff) },
    uColorEdge: { value: new THREE.Color(0x0000ff) },
  },
  vertexShader: `
    uniform float uTime;
    uniform float uExpansion;
    attribute float aSize;
    attribute float aRandom;
    attribute vec3 aOrbit; 
    varying float vRadius;
    varying float vRandom;
    void main() {
      float radius = aOrbit.y * uExpansion;
      float speed = aOrbit.z;
      float angle = aOrbit.x;
      vRadius = radius;
      vRandom = aRandom;
      float timeOffset = uTime * speed * 0.15; 
      float spiralOffset = radius * 2.0;
      float vortex = 1.0 / (radius + 0.5);
      float finalAngle = angle + spiralOffset + timeOffset + (vortex * 2.0);
      float x = cos(finalAngle) * radius;
      float z = sin(finalAngle) * radius;
      float dustOffset = sin(finalAngle * 4.0 + radius * 3.0);
      float y = (aRandom - 0.5) * exp(-radius * 0.8) * (1.5 + dustOffset * 0.5);
      vec4 mv = modelViewMatrix * vec4(x, y, z, 1.0);
      gl_Position = projectionMatrix * mv;
      gl_PointSize = aSize * (120.0 / -mv.z) * uExpansion; 
    }
  `,
  fragmentShader: `
    uniform vec3 uColorCore;
    uniform vec3 uColorEdge;
    uniform float uExpansion;
    varying float vRadius;
    varying float vRandom;
    void main() {
      float d = distance(gl_PointCoord, vec2(0.5));
      if (d > 0.5) discard;
      float alpha = pow(1.0 - (d * 2.0), 3.0);
      float dustPattern = sin(vRadius * 4.0 + vRandom * 3.0);
      float dust = smoothstep(0.4, 0.7, dustPattern); 
      float mixStrength = smoothstep(1.0, 10.0, vRadius);
      vec3 color = mix(uColorCore, uColorEdge, mixStrength);
      color *= mix(1.0, 0.2, dust); 
      color += vec3(0.2) * (1.0 - mixStrength);
      float flicker = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898,78.233))) * 43758.5453);
      color += flicker * 0.1;
      float densityControl = smoothstep(0.0, 0.3, uExpansion);
      gl_FragColor = vec4(color, alpha * densityControl);
    }
  `
};

// --- MAP DATA (Unchanged) ---
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

const BlackHoleShaderMaterial = shaderMaterial(
  {
    uTime: 0,
    uResolution: new THREE.Vector2(100, 100),
    uColor: new THREE.Color('#ff6600'),
    uExpansion: 0,
    uCamPos: new THREE.Vector3(0, 0, 5),
  },
  // Vertex Shader
  `
    precision highp float;
    varying vec2 vUv;
    varying vec3 vWorldPos;
    void main() {
      vUv = uv;
      vec4 worldPosition = modelMatrix * vec4(position, 1.0);
      vWorldPos = worldPosition.xyz;
      gl_Position = projectionMatrix * viewMatrix * worldPosition;
    }
  `,
  // Fragment Shader
  `
    precision highp float;
    uniform float uTime;
    uniform vec2 uResolution;
    uniform vec3 uColor;
    uniform float uExpansion;
    uniform vec3 uCamPos;
    varying vec2 vUv;
    varying vec3 vWorldPos;

    #define MAX_STEPS 120 
    #define MAX_DIST 50.0
    #define BH_RADIUS 1.0
    #define ACCRETION_INNER 1.4
    #define ACCRETION_OUTER 7.0
    
    float hash(vec3 p) {
        p  = fract( p * 0.3183099 + .1 );
        p *= 17.0;
        return fract( p.x * p.y * p.z * (p.x + p.y + p.z) );
    }

    float noise(vec3 x) {
        vec3 i = floor(x);
        vec3 f = fract(x);
        f = f * f * (3.0 - 2.0 * f);
        return mix(mix(mix(hash(i + vec3(0,0,0)), hash(i + vec3(1,0,0)), f.x),
                       mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
                   mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
                       mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
    }

    float fbm(vec3 p) {
        float f = 0.0;
        float amp = 0.5;
        for(int i=0; i<4; i++){
            f += amp * noise(p);
            p *= 2.0; 
            amp *= 0.5;
        }
        return f;
    }

    float hitSphere(vec3 ro, vec3 rd, float r) {
        float b = dot(ro, rd);
        float c = dot(ro, ro) - r * r;
        float h = b * b - c;
        if(h < 0.0) return -1.0;
        return -b - sqrt(h);
    }

    void main() {
        vec3 ro = uCamPos; 
        vec3 rd = normalize(vWorldPos - ro); 
        vec3 col = vec3(0.0);
        float accumDensity = 0.0;
        
        float t = hitSphere(ro, rd, ACCRETION_OUTER + 1.0);
        vec3 p = ro;
        
        if(t > 0.0) {
             p += rd * t;
        } else if (length(p) > ACCRETION_OUTER + 2.0) {
             gl_FragColor = vec4(0.0);
             return;
        }

        for(int i = 0; i < MAX_STEPS; i++) {
            float r = length(p);
            float stepSize = 0.05 + r * 0.02; 
            
            float gravity = (0.05 * BH_RADIUS) / (r*r + 0.05); 
            vec3 gravityVec = -normalize(p);
            rd = normalize(rd + gravityVec * gravity);

            if(r < BH_RADIUS) {
                accumDensity = 1.0; 
                col = vec3(0.0); 
                break; 
            }

            float distToPlane = abs(p.y);
            if(distToPlane < 0.6 && r > ACCRETION_INNER && r < ACCRETION_OUTER) {
                float rotationSpeed = uTime * (3.0 / (r + 0.1));
                float s = sin(rotationSpeed);
                float c = cos(rotationSpeed);
                vec3 rotatedP = vec3(p.x * c - p.z * s, p.y, p.x * s + p.z * c);
                float gas = fbm(vec3(rotatedP.x * 2.0, rotatedP.y * 4.0, rotatedP.z * 2.0));

                float fadeRadius = smoothstep(ACCRETION_OUTER, ACCRETION_OUTER - 2.0, r) * smoothstep(ACCRETION_INNER, ACCRETION_INNER + 0.3, r);
                float fadeVertical = smoothstep(0.5, 0.0, distToPlane);

                vec3 diskVel = normalize(vec3(-p.z, 0.0, p.x));
                float doppler = dot(diskVel, -rd); 
                float beam = 1.0 + doppler * 0.6; 

                float density = gas * fadeRadius * fadeVertical * 0.15;

                if(density > 0.005) {
                    vec3 hot = mix(vec3(1.0), uColor, 0.2); 
                    vec3 mid = uColor;
                    vec3 cold = uColor * vec3(0.4, 0.2, 0.1); 
                    
                    float temp = density * 4.0 * beam;
                    vec3 particleCol = mix(cold, mid, smoothstep(0.0, 0.5, temp));
                    particleCol = mix(particleCol, hot, smoothstep(0.5, 1.0, temp));
                    
                    col += particleCol * density * (1.0 - accumDensity) * beam;
                    accumDensity += density;
                }
            }
            
            float ringDist = abs(r - BH_RADIUS * 1.45);
            if(ringDist < 0.04) {
                float ringGlow = 1.0 - ringDist / 0.04;
                col += uColor * ringGlow * 0.2 * (1.0 - accumDensity);
                accumDensity += 0.05 * ringGlow;
            }

            if(accumDensity > 0.98) break;
            if(r > ACCRETION_OUTER && dot(p, rd) > 0.0) break;

            p += rd * stepSize;
        }

        col *= 1.5;
        col = col / (col + vec3(1.0));
        col = pow(col, vec3(0.4545));
        
        gl_FragColor = vec4(col, accumDensity * uExpansion);
    }
  `
);

extend({ BlackHoleShaderMaterial });  

// --- COMPONENT: BLACK HOLE WIDGET ---
function BlackHoleWidget({ isActive, theme }: { isActive: boolean, theme: any }) {
  const materialRef = useRef<any>(null!);
  const meshRef = useRef<THREE.Mesh>(null!);
  const { camera } = useThree();
  const expansion = useRef(0);

  useFrame((state, delta) => {
    if (!materialRef.current) return;

    const target = isActive ? 1 : 0;
    expansion.current = MathUtils.lerp(expansion.current, target, delta * 1.0);
    
    materialRef.current.uExpansion = expansion.current;
    materialRef.current.uTime = state.clock.getElapsedTime();
    materialRef.current.uCamPos = camera.position; 
    
    if(theme && theme.primary) {
        materialRef.current.uColor.set(theme.primary);
    }

    if(meshRef.current) {
        meshRef.current.visible = expansion.current > 0.01;
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 0, 0]} frustumCulled={false}>
       <boxGeometry args={[60, 60, 60]} /> 
       {/* @ts-ignore */}
       <blackHoleShaderMaterial 
         ref={materialRef} 
         side={THREE.BackSide}
         transparent 
         depthWrite={false}
         blending={THREE.NormalBlending} 
       />
    </mesh>
  );
}

// --- COMPONENT: 4D TESSERACT ENGINE ---
function TesseractWidget({ isActive, theme }: { isActive: boolean, theme: any }) {
    const groupRef = useRef<Group>(null!);
    const geometryRef = useRef<THREE.BufferGeometry>(null!);
    const [angle, setAngle] = useState(0);

    const points4D = useMemo(() => {
        const p = [];
        for (let i = 0; i < 16; i++) {
            p.push([(i & 1) ? 1 : -1, (i & 2) ? 1 : -1, (i & 4) ? 1 : -1, (i & 8) ? 1 : -1]);
        }
        return p;
    }, []);

    const edges = useMemo(() => {
        const e = [];
        for (let i = 0; i < 16; i++) {
            for (let j = i + 1; j < 16; j++) {
                const diff = i ^ j;
                if ((diff & (diff - 1)) === 0) e.push([i, j]);
            }
        }
        return e;
    }, []);
    
    // Pre-allocated buffer for transformed points to avoid GC
    const currentPositions = useMemo(() => new Float32Array(16 * 3), []);

    useFrame((state, delta) => {
        if (!geometryRef.current) return;
        const targetScale = isActive ? 2 : 0;
        
        _scratchVec3.set(targetScale, targetScale, targetScale);
        groupRef.current.scale.lerp(_scratchVec3, delta * 2);
        groupRef.current.visible = groupRef.current.scale.x > 0.01;

        if (!isActive && groupRef.current.scale.x < 0.01) return;

        setAngle(a => a + delta * 0.4);
        const ang = angle;
        const cos = Math.cos(ang);
        const sin = Math.sin(ang);

        // Optimized 4D rotation without Vector3 creation
        for (let i = 0; i < 16; i++) {
            let [x, y, z, w] = points4D[i];
            const x1 = x * cos - w * sin; const w1 = x * sin + w * cos; x = x1; w = w1;
            const z2 = z * cos - w * sin; const w2 = z * sin + w * cos; z = z2; w = w2;
            const x3 = x * Math.cos(ang * 0.5) - y * Math.sin(ang * 0.5); const y3 = x * Math.sin(ang * 0.5) + y * Math.cos(ang * 0.5); x = x3; y = y3;
            const distance = 2.5; const wFactor = 1 / (distance - w); 
            // Write directly to buffer
            currentPositions[i * 3] = x * wFactor * 3; 
            currentPositions[i * 3 + 1] = y * wFactor * 3; 
            currentPositions[i * 3 + 2] = z * wFactor * 3;
        }

        const finalPoints: number[] = [];
        const finalColors: number[] = [];
        const colorObj = new THREE.Color(theme.primary);

        edges.forEach(([start, end]) => {
            // Read from pre-allocated buffer
            const x1 = currentPositions[start * 3];
            const y1 = currentPositions[start * 3 + 1];
            const z1 = currentPositions[start * 3 + 2];
            
            const x2 = currentPositions[end * 3];
            const y2 = currentPositions[end * 3 + 1];
            const z2 = currentPositions[end * 3 + 2];

            finalPoints.push(x1, y1, z1, x2, y2, z2);
            finalColors.push(colorObj.r, colorObj.g, colorObj.b, colorObj.r * 0.5, colorObj.g * 0.5, colorObj.b * 0.5);
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
            <mesh> <sphereGeometry args={[0.2, 16, 16]} /> <meshBasicMaterial color={theme.primary} transparent opacity={0.5} blending={AdditiveBlending} /> </mesh>
        </group>
    );
}

// --- OPTIMIZED GALAXY WIDGET ---
function GalaxyWidget({ isActive, theme }: { isActive: boolean, theme: any }) {
  const materialRef = useRef<THREE.ShaderMaterial>(null!);
  const groupRef = useRef<Group>(null!);

  const uniforms = useMemo(() => {
    const u = THREE.UniformsUtils.clone(GalaxyShaderMaterial.uniforms);
    u.uColorCore.value.set(theme.galaxyColors.core);
    u.uColorEdge.value.set(theme.galaxyColors.edge);
    return u;
  }, []); 

  const themeRef = useRef(theme);
  useEffect(() => { themeRef.current = theme; }, [theme]);

  const coreColor = useRef(new THREE.Color(theme.galaxyColors.core));
  const edgeColor = useRef(new THREE.Color(theme.galaxyColors.edge));
  const tempColor = useMemo(() => new THREE.Color(), []);

  const PARTICLE_COUNT = 60000;
  const GALAXY_RADIUS = 12;
  const ARMS = 5;

  const { positions, randoms, sizes, orbits } = useMemo(() => {
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const randoms = new Float32Array(PARTICLE_COUNT);
    const sizes = new Float32Array(PARTICLE_COUNT);
    const orbits = new Float32Array(PARTICLE_COUNT * 3);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      positions[i * 3] = 0; positions[i * 3 + 1] = 0; positions[i * 3 + 2] = 0;
      randoms[i] = Math.random();
      sizes[i] = Math.pow(Math.random(), 3) * 2.0 + 0.5;
      const radius = Math.pow(Math.random(), 1.5) * GALAXY_RADIUS;
      let angle;
      const layer = Math.random();
      if (layer < 0.2) { angle = Math.random() * Math.PI * 2; } else if (layer < 0.85) { const armIndex = i % ARMS; const armAngle = (armIndex / ARMS) * Math.PI * 2; const spread = (Math.random() - 0.5) * (1.5 / (radius + 0.5)); angle = armAngle + spread; } else { angle = Math.random() * Math.PI * 2; }
      const speed = 1.0 / (radius + 1.0);
      orbits[i * 3] = angle; orbits[i * 3 + 1] = radius; orbits[i * 3 + 2] = speed;
    }
    return { positions, randoms, sizes, orbits };
  }, []);

  useFrame((state, delta) => {
    if (!materialRef.current || !groupRef.current) return;
    const currentTheme = themeRef.current;
    
    tempColor.set(currentTheme.galaxyColors.core);
    coreColor.current.lerp(tempColor, delta * 2.0);
    materialRef.current.uniforms.uColorCore.value.copy(coreColor.current);
    
    tempColor.set(currentTheme.galaxyColors.edge);
    edgeColor.current.lerp(tempColor, delta * 2.0);
    materialRef.current.uniforms.uColorEdge.value.copy(edgeColor.current);

    materialRef.current.uniforms.uExpansion.value = MathUtils.lerp(materialRef.current.uniforms.uExpansion.value, isActive ? 1 : 0, delta * 1.0);
    materialRef.current.uniforms.uTime.value = state.clock.getElapsedTime();
    groupRef.current.rotation.y += delta * 0.05;
    groupRef.current.rotation.z = Math.sin(state.clock.getElapsedTime() * 0.15) * 0.1;
    groupRef.current.visible = materialRef.current.uniforms.uExpansion.value > 0.01;
  });

  return (
    <group ref={groupRef} rotation={[0.6, 0, 0]}>
      <points frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={PARTICLE_COUNT} array={positions} itemSize={3} />
          <bufferAttribute attach="attributes-aRandom" count={PARTICLE_COUNT} array={randoms} itemSize={1} />
          <bufferAttribute attach="attributes-aSize" count={PARTICLE_COUNT} array={sizes} itemSize={1} />
          <bufferAttribute attach="attributes-aOrbit" count={PARTICLE_COUNT} array={orbits} itemSize={3} />
        </bufferGeometry>
        <shaderMaterial ref={materialRef} vertexShader={GalaxyShaderMaterial.vertexShader} fragmentShader={GalaxyShaderMaterial.fragmentShader} uniforms={uniforms} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
      </points>
    </group>
  );
}

// --- COMPONENT: INTERACTIVE NODE ---
const InteractiveNode = ({ id, position, label, type, isTarget, onClick, isVisible, url, themeColor }: any) => {
    const meshRef = useRef<THREE.Mesh>(null!);
    const [hovered, setHover] = useState(false);
    // Reuse vector to avoid GC
    const targetScaleVec = useRef(new Vector3());

    useFrame((state) => {
        if (!meshRef.current) return;
        const time = state.clock.getElapsedTime();
        const pulse = Math.sin(time * 3) * 0.1 + 1;
        const baseScale = hovered || isTarget ? 1.6 : 1.0;
        const targetScale = isVisible ? baseScale * pulse : 0;
        
        targetScaleVec.current.set(targetScale, targetScale, targetScale);
        meshRef.current.scale.lerp(targetScaleVec.current, 0.1);
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

// --- COMPONENT: LORENZ ATTRACTOR ---
function LorenzAttractor({ isActive, theme }: { isActive: boolean, theme: any }) {
  const lineRef = useRef<any | null>(null);
  const geometryRef = useRef<THREE.BufferGeometry | null>(null);
  const headMeshRef = useRef<THREE.Mesh>(null!); 
  const groupRef = useRef<Group>(null!);
  const head = useRef({ x: 0.1, y: 0, z: 0 });
  const points = useRef<Float32Array>(new Float32Array(LORENZ_MAX_POINTS * 3));
  const colors = useRef<Float32Array>(new Float32Array(LORENZ_MAX_POINTS * 3));
  const count = useRef(0);

  useEffect(() => { if (isActive && count.current === 0) head.current = { x: 0.1, y: 0, z: 0 }; }, [isActive]);

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
            if (count.current >= LORENZ_MAX_POINTS) { positions.set(positions.subarray(3), 0); cols.set(cols.subarray(3), 0); count.current = LORENZ_MAX_POINTS - 1; }
            const idx = count.current; 
            positions[idx * 3] = x; positions[idx * 3 + 1] = y; positions[idx * 3 + 2] = z;
     
            if (theme.name === 'Simple White') {
                 _scratchColor.set(theme.primary);
                 cols[idx * 3] = _scratchColor.r; cols[idx * 3 + 1] = _scratchColor.g; cols[idx * 3 + 2] = _scratchColor.b;
            } else {
                 const hue = theme.hueBase + (z / 50) * theme.hueRange; 
                 // Use scratch color to avoid GC
                 _scratchColor.setHSL(hue, 1.0, 0.6);
                 cols[idx * 3] = _scratchColor.r; cols[idx * 3 + 1] = _scratchColor.g; cols[idx * 3 + 2] = _scratchColor.b;
            }
            count.current++;
        }
        head.current = { x, y, z };
        if (headMeshRef.current) { headMeshRef.current.position.set(x, y, z); headMeshRef.current.visible = true; }
    } else {
        if (count.current > 0) {
            count.current = Math.max(0, count.current - 25);
            if (headMeshRef.current) { const idx = Math.floor(count.current); headMeshRef.current.position.set(positions[idx * 3], positions[idx * 3 + 1], positions[idx * 3 + 2]); headMeshRef.current.visible = true; }
        } else { if (headMeshRef.current) headMeshRef.current.visible = false; }
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
         <meshBasicMaterial color={theme.primary} toneMapped={false} />
      </mesh>
    </group>
  );
}

// --- COMPONENT: DOUBLE PENDULUM ---
function DoublePendulumWidget({ isActive, theme }: { isActive: boolean, theme: any }) {
    const groupRef = useRef<Group>(null!);
    const trailRef = useRef<any>(null!);
    const rodsRef = useRef<any>(null!);
    const TRAIL_LENGTH = 1000; 
    const trailPoints = useRef(new Float32Array(TRAIL_LENGTH * 3));
    const state = useRef({ t1: Math.PI / 2, t2: Math.PI / 2, v1: 0, v2: 0, planeAngle: 0, planeSpeed: 0.005 });
    const m1 = 10; const m2 = 10; const l1 = 4.0; const l2 = 4.0; const g = 9.81;

    useEffect(() => {
        if (isActive) { state.current = { t1: Math.PI + 0.1, t2: Math.PI + 0.1, v1: 0, v2: 0, planeAngle: 0, planeSpeed: 0.005 }; trailPoints.current.fill(0); }
    }, [isActive]);

    const calculateAccelerations = (t1: number, t2: number, v1: number, v2: number) => {
        const num1 = -g * (2 * m1 + m2) * Math.sin(t1);
        const num2 = -m2 * g * Math.sin(t1 - 2 * t2);
        const num3 = -2 * Math.sin(t1 - t2) * m2;
        const num4 = v2 * v2 * l2 + v1 * v1 * l1 * Math.cos(t1 - t2);
        const den1 = l1 * (2 * m1 + m2 - m2 * Math.cos(2 * t1 - 2 * t2));
        const a1 = (num1 + num2 + num3 * num4) / den1;
        const num5 = 2 * Math.sin(t1 - t2);
        const num6 = (v1 * v1 * l1 * (m1 + m2));
        const num7 = g * (m1 + m2) * Math.cos(t1);
        const num8 = v2 * v2 * l2 * m2 * Math.cos(t1 - t2);
        const den2 = l2 * (2 * m1 + m2 - m2 * Math.cos(2 * t1 - 2 * t2));
        const a2 = (num5 * (num6 + num7 + num8)) / den2;
        return { a1, a2 };
    };

    useFrame((_, delta) => {
        if (!groupRef.current) return;
        const targetScale = isActive ? 1 : 0;
        
        _scratchVec3.set(targetScale, targetScale, targetScale);
        groupRef.current.scale.lerp(_scratchVec3, delta * 2.5);
        
        groupRef.current.visible = groupRef.current.scale.x > 0.01;
        groupRef.current.rotation.y += delta * 0.1; 
        if (!isActive && groupRef.current.scale.x < 0.01) return;

        const subSteps = 15; const dt = Math.min(delta, 0.05) / subSteps * 2.5; 
        let { t1, t2, v1, v2, planeAngle, planeSpeed } = state.current;
        for (let i = 0; i < subSteps; i++) {
            const { a1, a2 } = calculateAccelerations(t1, t2, v1, v2);
            v1 += a1 * dt; v2 += a2 * dt; t1 += v1 * dt; t2 += v2 * dt;
        }
        planeSpeed = 0.005 + Math.sin(Date.now() * 0.001) * 0.004; planeAngle += planeSpeed;
        state.current = { t1, t2, v1, v2, planeAngle, planeSpeed };

        const rawX1 = l1 * Math.sin(t1); const rawY1 = -l1 * Math.cos(t1);
        const rawX2 = rawX1 + l2 * Math.sin(t2); const rawY2 = rawY1 - l2 * Math.cos(t2);
        const x1 = rawX1 * Math.cos(planeAngle); const z1 = rawX1 * Math.sin(planeAngle); const y1 = rawY1;
        const x2 = rawX2 * Math.cos(planeAngle); const z2 = rawX2 * Math.sin(planeAngle); const y2 = rawY2;

        if (rodsRef.current) {
            const positions = rodsRef.current.geometry.attributes.position.array;
            positions[0] = 0; positions[1] = 0; positions[2] = 0; positions[3] = x1; positions[4] = y1; positions[5] = z1;
            positions[6] = x1; positions[7] = y1; positions[8] = z1; positions[9] = x2; positions[10] = y2; positions[11] = z2;
            rodsRef.current.geometry.attributes.position.needsUpdate = true;
        }
        const trail = trailPoints.current;
        
        // OPTIMIZATION: Use copyWithin instead of loop for memory shift (much faster)
        trail.copyWithin(3, 0, (TRAIL_LENGTH - 1) * 3);
        
        trail[0] = x2; trail[1] = y2; trail[2] = z2;
        if (trailRef.current) trailRef.current.geometry.attributes.position.needsUpdate = true;
        const joint1 = groupRef.current.children[1]; const joint2 = groupRef.current.children[2];
        if(joint1) joint1.position.set(x1, y1, z1); if(joint2) joint2.position.set(x2, y2, z2);
    });

    return (
        <group ref={groupRef} scale={[0,0,0]}>
            <mesh position={[0,0,0]}> <sphereGeometry args={[0.2, 16, 16]} /> <meshBasicMaterial color="white" /> </mesh>
            <mesh> <sphereGeometry args={[0.25, 16, 16]} /> <meshBasicMaterial color={theme.primary} toneMapped={false} /> </mesh>
            <mesh> <sphereGeometry args={[0.25, 16, 16]} /> <meshBasicMaterial color="white" toneMapped={false} /> </mesh>
            <lineSegments ref={rodsRef}> <bufferGeometry> <bufferAttribute attach="attributes-position" count={4} array={new Float32Array(12)} itemSize={3} /> </bufferGeometry> <lineBasicMaterial color={theme.primary} linewidth={4} toneMapped={false} /> </lineSegments>
            <line ref={trailRef}> <bufferGeometry> <bufferAttribute attach="attributes-position" count={TRAIL_LENGTH} array={trailPoints.current} itemSize={3} /> </bufferGeometry> <lineBasicMaterial color={theme.primary} transparent opacity={0.6} blending={AdditiveBlending} linewidth={2} depthWrite={false} /> </line>
        </group>
    );
}

// --- OPTIMIZED NEURAL NETWORK ---
function NeuralNetwork({ theme, isBackdropMode, isPendulumMode, isGalaxyMode }: { theme: any, isBackdropMode: boolean, isPendulumMode: boolean, isGalaxyMode: boolean }) {
  const standardGroupRef = useRef<Group>(null!);
  const { isNavigating, targetNode, setTargetNode, setNavigating, isChaosMode, isTesseractMode, isBlackHoleMode } = useNavigation();
  const router = useRouter();

  const [activeChaos, setActiveChaos] = useState(isChaosMode);
  const [activeTesseract, setActiveTesseract] = useState(isTesseractMode);
  const [activePendulum, setActivePendulum] = useState(isPendulumMode);
  const [activeGalaxy, setActiveGalaxy] = useState(isGalaxyMode);
  const [activeBlackHole, setActiveBlackHole] = useState(isBlackHoleMode);
  
  useEffect(() => {
    let t: NodeJS.Timeout;
    const syncMode = (target: boolean, setter: any) => {
        if (target) {
            if(setter !== setActiveChaos) setActiveChaos(false);
            if(setter !== setActiveTesseract) setActiveTesseract(false);
            if(setter !== setActivePendulum) setActivePendulum(false);
            if(setter !== setActiveGalaxy) setActiveGalaxy(false);
            if(setter !== setActiveBlackHole) setActiveBlackHole(false);
            t = setTimeout(() => setter(true), 500); 
        } else {
            setter(false);
        }
    };

    if(isChaosMode) syncMode(true, setActiveChaos);
    else if(isTesseractMode) syncMode(true, setActiveTesseract);
    else if(isPendulumMode) syncMode(true, setActivePendulum);
    else if(isGalaxyMode) syncMode(true, setActiveGalaxy);
    else if(isBlackHoleMode) syncMode(true, setActiveBlackHole);
    else {
        setActiveChaos(false); setActiveTesseract(false); setActivePendulum(false); setActiveGalaxy(false); setActiveBlackHole(false);
    }
    return () => clearTimeout(t);
  }, [isChaosMode, isTesseractMode, isPendulumMode, isGalaxyMode, isBlackHoleMode]);

  const shouldSquish = !targetNode && (isChaosMode || isTesseractMode || isPendulumMode || isGalaxyMode || isBlackHoleMode);

  const { particles, lines, paths, mainLines, satelliteLines, satellitePoints } = useMemo(() => {
    const numLayers = 5; const pointsPerLayer = 150; const layerDepth = 2; const xySpread = 20; 
    const particles: Vector3[] = []; 
    const connections: number[][] = Array.from({ length: numLayers * pointsPerLayer }, () => []);
    for (let i = 0; i < numLayers; i++) { for (let j = 0; j < pointsPerLayer; j++) { particles.push(new Vector3((Math.random() - 0.5) * xySpread, (Math.random() - 0.5) * xySpread, i * layerDepth - ((numLayers - 1) * layerDepth) / 2)); } }
    const lines: Vector3[] = []; 
    for (let i = 0; i < particles.length; i++) { for (let j = i + 1; j < particles.length; j++) { if (particles[i].distanceTo(particles[j]) < 2) { lines.push(particles[i], particles[j]); connections[i].push(j); connections[j].push(i); } } }
    const paths: Vector3[][] = []; 
    for (let i = 0; i < 25; i++) { const path: Vector3[] = []; let current = Math.floor(Math.random() * particles.length); for(let j=0; j < 30; j++) { path.push(particles[current]); const neighbors = connections[current]; if (neighbors.length > 0) current = neighbors[Math.floor(Math.random() * neighbors.length)]; else break; } if (path.length > 2) paths.push(path); }
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
        if (isNavigating) { standardGroupRef.current.rotation.y = MathUtils.lerp(standardGroupRef.current.rotation.y, 0, delta * 3); standardGroupRef.current.rotation.x = MathUtils.lerp(standardGroupRef.current.rotation.x, 0, delta * 3); } else { standardGroupRef.current.rotation.y += delta * 0.04; standardGroupRef.current.rotation.x += delta * 0.01; }
        const targetScale = shouldSquish ? 0 : 1; 
        const transitionSpeed = shouldSquish ? delta * 4.0 : delta * 2.0;
        const nextScale = MathUtils.lerp(standardGroupRef.current.scale.x, targetScale, transitionSpeed); 
        standardGroupRef.current.scale.setScalar(nextScale);
        standardGroupRef.current.visible = nextScale > 0.001;
    }
  });

  const handleNodeClick = (key: string) => {
      if (isBackdropMode) return;
      const node = SITE_MAP[key]; setTargetNode(key);
      if ((node.type === 'leaf' || key === 'about') && node.url) { setTimeout(() => { router.push(node.url); setTimeout(() => { setNavigating(false); setTargetNode(null); }, 800); }, 800); }
  };

  return (
    <>
        <group ref={standardGroupRef}>
            <Points positions={particles as unknown as Float32Array} raycast={() => {}}> <pointsMaterial color={theme.primary} size={0.06} blending={AdditiveBlending} transparent opacity={0.3} /> </Points>
            <Line points={lines} color={theme.primary} lineWidth={0.2} transparent opacity={0.05} raycast={() => {}} />
            <Sparks count={50} paths={paths} themeColor={theme.primary} />
            <Line points={mainLines} color={theme.primary} lineWidth={0.5} transparent opacity={isNavigating ? 0.05 : 0} raycast={() => {}} />
            <Line points={satelliteLines} color={theme.primary} lineWidth={0.5} transparent opacity={isNavigating ? 0.05 : 0} raycast={() => {}} />
            <Points positions={satellitePoints as unknown as Float32Array} raycast={() => {}}> <pointsMaterial color={theme.primary} size={0.06} blending={AdditiveBlending} transparent opacity={isNavigating ? 0.5 : 0} /> </Points>
            {Object.keys(SITE_MAP).map(key => {
                const node = SITE_MAP[key];
                let isVisible = false;
                if (isNavigating) { if (!targetNode && (node.type === 'category' || key === 'about')) isVisible = true; if (targetNode) { if (key === targetNode) isVisible = true; if (node.parent === targetNode) isVisible = true; if (SITE_MAP[targetNode].parent === node.parent) isVisible = true; } }
                const showNode = isVisible && !shouldSquish && !isBackdropMode;
                return <InteractiveNode key={key} {...node} isTarget={targetNode === key} isVisible={showNode} onClick={() => handleNodeClick(key)} themeColor={theme.primary} />;
            })}
        </group>
        
        <LorenzAttractor isActive={activeChaos} theme={theme} />
        <TesseractWidget isActive={activeTesseract} theme={theme} />
        <DoublePendulumWidget isActive={activePendulum} theme={theme} />
        <GalaxyWidget isActive={activeGalaxy} theme={theme} />
        <BlackHoleWidget isActive={activeBlackHole} theme={theme} />
    </>
  );
}



// --- SYSTEM: SPARKS ---
function Sparks({ count, paths, themeColor }: { count: number, paths: Vector3[][], themeColor: string }) {
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
  return <Points ref={sparkRef} positions={new Float32Array(count * 3)} raycast={() => {}}> <pointsMaterial color={themeColor} size={0.05} blending={AdditiveBlending} transparent opacity={0.9} depthWrite={false} /> </Points>;
}
// --- FREEDOM CAMERA RIG (FIXED: SAVES ANGLES) ---
function CameraRig({ isBackdropMode }: { isBackdropMode: boolean }) {
    const { isNavigating, targetNode, isChaosMode, isTesseractMode, isPendulumMode, isGalaxyMode, isBlackHoleMode } = useNavigation();
    const { camera, size } = useThree(); 
    const controlsRef = useRef<any>(null);
    const isAutoPiloting = useRef(false);
    const hasUserInteracted = useRef(false);
    
    // Persistent vectors to avoid garbage collection
    const desiredPos = useRef(new Vector3());
    const desiredLook = useRef(new Vector3());
    
    // FIX: Store the user's chosen angle when they confirm the wallpaper
    const savedPose = useRef<{pos: Vector3, target: Vector3} | null>(null);

    const isMobile = size.width < 768; 

    // Reset saved pose when we re-enter configuration mode (Backdrop ON)
    useEffect(() => {
        if (isBackdropMode) savedPose.current = null;
    }, [isBackdropMode]);

    useEffect(() => {
        hasUserInteracted.current = false;
        isAutoPiloting.current = true;
    }, [targetNode, isChaosMode, isTesseractMode, isPendulumMode, isGalaxyMode, isBlackHoleMode, isBackdropMode]); 

    useFrame((state, delta) => {
        // FIX: Check targetNode FIRST. If navigating, override everything else.
        if (targetNode) {
            const node = SITE_MAP[targetNode];
            const focusZoom = isMobile ? 1.5 : 1; 
            desiredPos.current.set(node.position[0], node.position[1], node.position[2] + 4 * focusZoom);
            desiredLook.current.set(node.position[0], node.position[1], node.position[2]);
        } 
        else if (isBackdropMode) {
            // Configuration Mode: Default preset angles
            if (isBlackHoleMode) {
                desiredPos.current.set(0, 3.0, 8.0); 
                desiredLook.current.set(0, 0, 0);
            } else {
                desiredPos.current.set(0, 0, 14);
            }
        } 
        else if (isBlackHoleMode) {
             // LOCKED WALLPAPER MODE
             if (!savedPose.current) {
                 // First frame of lock: Capture the user's current camera angle!
                 savedPose.current = {
                     pos: camera.position.clone(),
                     target: controlsRef.current ? controlsRef.current.target.clone() : new Vector3(0,0,0)
                 };
             }
             // Maintain the captured angle
             desiredPos.current.copy(savedPose.current.pos);
             desiredLook.current.copy(savedPose.current.target);
        }
        else if (isChaosMode || isTesseractMode || isPendulumMode) {
            desiredPos.current.set(0, 0, 15 * (isMobile ? 1.5 : 1));
            desiredLook.current.set(0, 0, 0);
        } else if (isGalaxyMode) {
            desiredPos.current.set(0, 3, 12);
            desiredLook.current.set(0, 0, 0);
        } else {
            // Default Neural Network View
            desiredPos.current.set(0, 0, isMobile ? 9 : 5);
            desiredLook.current.set(0, 0, 0);
            if (hasUserInteracted.current) { isAutoPiloting.current = false; }
        }

        if ((isGalaxyMode || isBlackHoleMode) && hasUserInteracted.current && !isBackdropMode) {
            // Allow user to rotate manually if they want, even after locking
            isAutoPiloting.current = false;
        }

        if (isAutoPiloting.current) {
            const speed = (isBlackHoleMode) ? 1.5 : (targetNode ? 4.0 : 2.0); 
            state.camera.position.lerp(desiredPos.current, delta * speed);
            if (controlsRef.current) {
                controlsRef.current.target.lerp(desiredLook.current, delta * speed);
                controlsRef.current.update();
            }
        }
    });

    return (
        <OrbitControls 
            ref={controlsRef}
            enabled={true} 
            enableDamping 
            dampingFactor={0.05} 
            rotateSpeed={0.5} 
            minDistance={isGalaxyMode ? 7.5 : (isBlackHoleMode ? 4 : 2)} 
            maxDistance={50}
            onStart={() => { 
                isAutoPiloting.current = false;
                hasUserInteracted.current = true;
            }} 
        />
    );
}

// --- MAIN EXPORT ---

const ParticleBackground = () => {
  const { isNavigating, targetNode, setTargetNode, setNavigating, 
          isChaosMode, setChaosMode, 
          isTesseractMode, setTesseractMode, 
          isPendulumMode, setPendulumMode,
          isGalaxyMode, setGalaxyMode,
          isBlackHoleMode, setBlackHoleMode,
          currentTheme, toggleTheme
        } = useNavigation();

  const theme = currentTheme; 

  const [isBackdropMode, setIsBackdropMode] = useState(false);

  useEffect(() => {
    const handleBackdropOn = () => setIsBackdropMode(true);
    const handleBackdropOff = () => setIsBackdropMode(false);
    window.addEventListener('PHANTOM_BACKDROP_ON', handleBackdropOn);
    window.addEventListener('PHANTOM_BACKDROP_OFF', handleBackdropOff);
    return () => {
        window.removeEventListener('PHANTOM_BACKDROP_ON', handleBackdropOn);
        window.removeEventListener('PHANTOM_BACKDROP_OFF', handleBackdropOff);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape' && targetNode) setTargetNode(null); };
    window.addEventListener('keydown', handleKeyDown); return () => window.removeEventListener('keydown', handleKeyDown);
  }, [targetNode, setTargetNode]);

  const handleConfirmBackdrop = () => {
      setIsBackdropMode(false);
      setNavigating(false); 
  };

  const resetModes = () => {
      setChaosMode(false); setTesseractMode(false); setPendulumMode(false); setGalaxyMode(false); setBlackHoleMode(false);
  };

  useEffect(() => {
    if (isGalaxyMode) { setChaosMode(false); setTesseractMode(false); setPendulumMode(false); setBlackHoleMode(false);}
  }, [isGalaxyMode]);

  useEffect(() => {
    if (isBlackHoleMode) { setChaosMode(false); setTesseractMode(false); setPendulumMode(false); setGalaxyMode(false);}
  }, [isBlackHoleMode]);

  useEffect(() => {
    if (isChaosMode || isTesseractMode || isPendulumMode) { setGalaxyMode(false); setBlackHoleMode(false); }
  }, [isChaosMode, isTesseractMode, isPendulumMode]);

  return (
    <div className="fixed inset-0 z-[-1] bg-black">
      <Canvas 
            camera={{ position: [0, 0, 5], fov: 90 }} 
            dpr={[1, 1.5]} // OPTIMIZATION: Cap DPR at 1.5 to save mobile batteries
            gl={{ 
                toneMapping: THREE.ReinhardToneMapping, 
                toneMappingExposure: 1.5,
                antialias: false, // OPTIMIZATION: Disable AA for gas/particle looks
                powerPreference: "high-performance",
                stencil: false,
                depth: true,
                alpha: false
            }}
        > 
          <Suspense fallback={null}>
            <NeuralNetwork theme={theme} isBackdropMode={isBackdropMode} isPendulumMode={isPendulumMode} isGalaxyMode={isGalaxyMode} />
            <CameraRig isBackdropMode={isBackdropMode} /> 
          </Suspense>
        <EffectComposer enableNormalPass={false}> 
          <Bloom luminanceThreshold={0.2} intensity={0.4} mipmapBlur radius={0.5} />
          <ChromaticAberration offset={new THREE.Vector2(0.002, 0.002)} radialModulation={true} modulationOffset={0} />
        </EffectComposer>
      </Canvas>

      {isBackdropMode && (
         <div className="absolute top-8 left-8 z-50 flex flex-col gap-4 font-mono animate-fade-in">
             <div className="text-white/50 text-xs tracking-[0.2em] uppercase mb-2">Wallpaper Configurator</div>
             <div className="flex gap-4 flex-wrap max-w-lg">
                 <button onClick={resetModes} className={`text-sm font-bold px-4 py-2 border transition-all ${!isChaosMode && !isTesseractMode && !isPendulumMode && !isGalaxyMode && !isBlackHoleMode ? 'text-white border-white bg-white/10' : 'text-white/40 border-white/20 hover:text-white hover:border-white/60'}`}>NEURAL</button>
                 <button onClick={() => { resetModes(); setChaosMode(true); }} className={`text-sm font-bold px-4 py-2 border transition-all ${isChaosMode ? 'text-cyan-400 border-cyan-400 bg-cyan-900/20' : 'text-white/40 border-white/20 hover:text-cyan-200 hover:border-cyan-500/50'}`}>CHAOS</button>
                 <button onClick={() => { resetModes(); setTesseractMode(true); }} className={`text-sm font-bold px-4 py-2 border transition-all ${isTesseractMode ? 'text-purple-400 border-purple-400 bg-purple-900/20' : 'text-white/40 border-white/20 hover:text-purple-200 hover:border-purple-500/50'}`}>TESSERACT</button>
                 <button onClick={() => { resetModes(); setPendulumMode(true); }} className={`text-sm font-bold px-4 py-2 border transition-all ${isPendulumMode ? 'text-emerald-400 border-emerald-400 bg-emerald-900/20' : 'text-white/40 border-white/20 hover:text-emerald-200 hover:border-emerald-500/50'}`}>PENDULUM</button>
                 <button onClick={() => { resetModes(); setGalaxyMode(true); }} className={`text-sm font-bold px-4 py-2 border transition-all ${isGalaxyMode ? 'text-pink-400 border-pink-400 bg-pink-900/20' : 'text-white/40 border-white/20 hover:text-pink-200 hover:border-pink-500/50'}`}>GALAXY</button>
                 <button onClick={() => { resetModes(); setBlackHoleMode(true); }} className={`text-sm font-bold px-4 py-2 border transition-all ${isBlackHoleMode ? 'text-orange-400 border-orange-400 bg-orange-900/20' : 'text-white/40 border-white/20 hover:text-orange-200 hover:border-orange-500/50'}`}>EVENT HORIZON</button>
             </div>
             
             <button onClick={handleConfirmBackdrop} className="mt-4 w-full border border-emerald-500/50 text-emerald-400 font-bold tracking-widest text-xs py-3 hover:bg-emerald-900/20 hover:scale-[1.02] transition-all">CONFIRM & LOCK</button>
         </div>
      )}

      {targetNode && !isBackdropMode && (
        <div className="absolute top-24 left-8 z-50 animate-fade-in">
            <button onClick={() => setTargetNode(null)} className="font-mono text-xs font-bold tracking-widest border bg-black/60 backdrop-blur-md px-4 py-2 rounded-sm transition-all duration-300 hover:text-white hover:scale-105" style={{ color: theme.primary, borderColor: `${theme.primary}4D` }}>{'< RETURN TO NETWORK'}</button>
        </div>
      )}

      <div className={`absolute bottom-8 right-8 z-50 flex items-center gap-3 transition-all duration-500 group ${(isNavigating || isBackdropMode) ? 'opacity-40 hover:opacity-100 cursor-pointer translate-y-0' : 'opacity-0 pointer-events-none translate-y-4'}`} onClick={toggleTheme} title={`Switch Theme: ${theme.name}`}>
         <span className="font-mono text-[10px] font-bold tracking-[0.2em] uppercase transition-all group-hover:tracking-[0.3em]" style={{ color: theme.primary, textShadow: `0 0 10px ${theme.primary}40` }}>Theme Select</span>
         <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-b-[8px] transform group-hover:-translate-y-1 transition-transform duration-300" style={{ borderBottomColor: theme.primary, filter: `drop-shadow(0 0 5px ${theme.primary})` }} />
      </div>
      
      <div className={`absolute inset-0 bg-background pointer-events-none transition-opacity duration-1000 ${isNavigating ? 'opacity-0' : 'opacity-30'}`} />
    </div>
  );
};

export default ParticleBackground;