// app/components/ParticleBackground.tsx
'use client';

import { Suspense, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Line, Points } from '@react-three/drei';
import { AdditiveBlending, Group, Points as PointsType, Vector3 } from 'three';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import siteConfig from '@/site.config.js';

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

  const sparkRef = useRef<PointsType>(null!);

  useFrame(() => {
    if (!sparkRef.current) return;

    sparks.forEach(spark => {
      spark.progress += spark.speed;
      if (spark.progress > 1) {
        spark.progress = 0;
        spark.path = paths[Math.floor(Math.random() * paths.length)];
      }
      
      const currentPointIndex = Math.floor(spark.progress * (spark.path.length - 1));
      const nextPointIndex = (currentPointIndex + 1) % spark.path.length;
      
      const p1 = spark.path[currentPointIndex];
      const p2 = spark.path[nextPointIndex];
      
      const segmentProgress = (spark.progress * (spark.path.length - 1)) % 1;
      
      spark.position.lerpVectors(p1, p2, segmentProgress);
    });

    const positions = sparkRef.current.geometry.attributes.position.array as Float32Array;
    sparks.forEach((spark, i) => {
      positions[i * 3] = spark.position.x;
      positions[i * 3 + 1] = spark.position.y;
      positions[i * 3 + 2] = spark.position.z;
    });
    sparkRef.current.geometry.attributes.position.needsUpdate = true;
  });

  const initialPositions = useMemo(() => new Float32Array(count * 3), [count]);

  return (
    <Points ref={sparkRef} positions={initialPositions}>
      <pointsMaterial color="white" size={0.04} blending={AdditiveBlending} transparent opacity={0.75} depthWrite={false} />
    </Points>
  );
}


function NeuralNetwork() {
  const groupRef = useRef<Group>(null!);

  const { particles, lines, paths } = useMemo(() => {
    const numLayers = 5;
    const pointsPerLayer = 250;
    const layerDepth = 2;
    const xySpread = 7;
    
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
        const dist = p1.distanceTo(p2);
        if (dist < 1.3) {
          lines.push(p1, p2);
          connections[i].push(j);
          connections[j].push(i);
        }
      }
    }

    const paths: Vector3[][] = [];
    for (let i = 0; i < 10; i++) {
      const path: Vector3[] = [];
      let current = Math.floor(Math.random() * particles.length);
      for(let j=0; j < 50; j++) {
        path.push(particles[current]);
        const neighbors = connections[current];
        if (neighbors.length > 0) {
          current = neighbors[Math.floor(Math.random() * neighbors.length)];
        } else {
          break;
        }
      }
      paths.push(path);
    }

    return { particles, lines, paths };
  }, []);

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.05;
      groupRef.current.rotation.x += delta * 0.02;
    }
  });

  return (
    <group ref={groupRef}>
      <Points positions={particles as unknown as Float32Array}>
        <pointsMaterial color={siteConfig.theme.primary} size={0.07} blending={AdditiveBlending} transparent />
      </Points>
      <Line points={lines} color="white" lineWidth={0.2} transparent opacity={0.1} />
      <Sparks count={50} paths={paths} />
    </group>
  );
}

const ParticleBackground = () => {
  return (
    <div className="fixed inset-0 z-[-1]">
      <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>
        <Suspense fallback={null}>
          <NeuralNetwork />
        </Suspense>
        <EffectComposer>
          <Bloom luminanceThreshold={0.1} intensity={0.8} mipmapBlur />
        </EffectComposer>
      </Canvas>
      <div className="absolute inset-0 bg-background opacity-80" />
    </div>
  );
};

export default ParticleBackground;