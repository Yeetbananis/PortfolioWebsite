"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";

export default function GradientDescentHero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const weightsTextRef = useRef<HTMLSpanElement>(null); // Ref for updating text without re-renders
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    // --- 1. SCENE SETUP ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050505); // Deep black
    scene.fog = new THREE.FogExp2(0x050505, 0.015);

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);

    // --- 2. INTERACTIVE STATE ---
    const camState = {
      radius: 45,
      theta: Math.PI / 4,
      phi: Math.PI / 3,
    };

    const mouseState = {
      prevX: 0,
      prevY: 0,
      isDown: false,
    };

    // --- 3. COST FUNCTION MATH ---
    const costFunction = (x: number, y: number) => {
      const r = Math.sqrt(x * x + y * y);
      
      // Global Plateau (Inverted Gaussian)
      const plateauHeight = 12;
      const valleyWidth = 45;
      const globalShape = plateauHeight * (1 - Math.exp(-(r * r) / valleyWidth));

      // Landscape Features
      const hills = Math.sin(x * 0.6) * Math.cos(y * 0.6) * 0.8;
      const rocks = Math.sin(x * 2.5) * Math.cos(y * 2.5) * 0.2;
      
      return globalShape + hills + rocks;
    };

    // --- 4. MESH GENERATION ---
    const geometry = new THREE.BufferGeometry();
    const size = 50;
    const segments = 200;
    const halfSize = size / 2;
    const segmentSize = size / segments;

    const vertices = [];
    const colors = [];
    
    const colorLow = new THREE.Color(0x00ffff); // Cyan
    const colorMid = new THREE.Color(0x8a2be2); // Purple
    const colorHigh = new THREE.Color(0xff0080); // Magenta

    for (let i = 0; i <= segments; i++) {
      const y = (i * segmentSize) - halfSize;
      for (let j = 0; j <= segments; j++) {
        const x = (j * segmentSize) - halfSize;
        const z = costFunction(x, y);

        vertices.push(x, z, y);

        // Color Mapping
        const normalizedH = Math.min(1, Math.max(0, (z + 2) / 14));
        const color = new THREE.Color();
        if (normalizedH < 0.25) {
          color.lerpColors(colorLow, colorMid, normalizedH / 0.25);
        } else {
          color.lerpColors(colorMid, colorHigh, (normalizedH - 0.25) / 0.75);
        }
        colors.push(color.r, color.g, color.b);
      }
    }

    // Indices for Grid Mesh
    const indices = [];
    for (let i = 0; i < segments; i++) {
      for (let j = 0; j < segments; j++) {
        const a = i * (segments + 1) + j;
        const b = i * (segments + 1) + j + 1;
        const c = (i + 1) * (segments + 1) + j + 1;
        const d = (i + 1) * (segments + 1) + j;
        
        // Two triangles per square
        indices.push(a, b, d);
        indices.push(b, c, d);
      }
    }

    geometry.setIndex(indices);
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    geometry.computeVertexNormals();

    // Materials
    const wireframeMaterial = new THREE.MeshBasicMaterial({
      vertexColors: true,
      wireframe: true,
      transparent: true,
      opacity: 0.3,
    });

    const fillMaterial = new THREE.MeshBasicMaterial({
      color: 0x050505,
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1,
    });

    const mesh = new THREE.Mesh(geometry, wireframeMaterial);
    const meshFill = new THREE.Mesh(geometry, fillMaterial);
    scene.add(meshFill);
    scene.add(mesh);

    // --- 5. GRADIENT DESCENT PATH ---
    const pathPoints: THREE.Vector3[] = [];
    let cx = -7.5; // Start Weight 1
    let cy = -7.5; // Start Weight 2
    
    // ADJUSTED PARAMETERS FOR FASTER SETTLING
    let lr = 0.15;        // Higher learning rate = faster initial descent
    let momentumX = 0;
    let momentumY = 0;
    const friction = 0.80; // Lower friction (was 0.96) = stops "sliding" much sooner

    // Reduced max steps since it settles faster
    for (let i = 0; i < 400; i++) {
      const cz = costFunction(cx, cy);
      pathPoints.push(new THREE.Vector3(cx, cz + 0.2, cy));

      const eps = 0.01;
      const dzdx = (costFunction(cx + eps, cy) - cz) / eps;
      const dzdy = (costFunction(cx, cy + eps) - cz) / eps;

      // Apply momentum with higher decay (lower friction)
      momentumX = momentumX * friction - dzdx * lr;
      momentumY = momentumY * friction - dzdy * lr;

      cx += momentumX;
      cy += momentumY;

      // Stop loop early if movement is negligible
      if (Math.abs(momentumX) < 0.001 && Math.abs(momentumY) < 0.001 && i > 20) break;
    }

    const pathGeometry = new THREE.BufferGeometry().setFromPoints(pathPoints);
    const pathMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2 });
    const pathLine = new THREE.Line(pathGeometry, pathMaterial);
    scene.add(pathLine);

    // Ball (The Hiker)
    const ballGeo = new THREE.SphereGeometry(0.25, 16, 16);
    const ballMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const ball = new THREE.Mesh(ballGeo, ballMat);
    scene.add(ball);

    // --- 6. ANIMATION & INTERACTION ---
    let animationId: number;
    let animProgress = 0;
    let isPaused = false;
    let pauseStartTime = 0;

    const animate = () => {
      animationId = requestAnimationFrame(animate);

      // Camera Orbit
      camera.position.x = camState.radius * Math.sin(camState.phi) * Math.sin(camState.theta);
      camera.position.z = camState.radius * Math.sin(camState.phi) * Math.cos(camState.theta);
      camera.position.y = camState.radius * Math.cos(camState.phi);
      camera.lookAt(0, 0, 0);

      // Animation Logic
      const speed = 2.0;
      const totalPoints = pathPoints.length;

      if (!isPaused) {
        animProgress += 0.003 * 30 * speed; // Increment frames
        
        let index = Math.floor(animProgress);
        
        // Check if reached the end
        if (index >= totalPoints - 1) {
          index = totalPoints - 1;
          isPaused = true;
          pauseStartTime = performance.now();
        }

        const currentP = pathPoints[index];
        const nextP = pathPoints[Math.min(index + 1, totalPoints - 1)];
        const alpha = animProgress % 1;

        if (currentP && nextP) {
          // Move ball
          ball.position.lerpVectors(currentP, nextP, alpha);
          
          // --- UPDATE UI TEXT ---
          if (weightsTextRef.current) {
            // Mapping position to "Weight" values
            const w1 = ball.position.x.toFixed(4);
            const w2 = ball.position.z.toFixed(4);
            weightsTextRef.current.innerText = `w₁: ${w1}, w₂: ${w2}`;
          }

          // --- UPDATE LABEL POS ---
          if (labelRef.current && containerRef.current) {
            const tempV = ball.position.clone();
            tempV.y += 1.5; 
            tempV.project(camera);
            const x = (tempV.x * .5 + .5) * containerRef.current.clientWidth;
            const y = (tempV.y * -.5 + .5) * containerRef.current.clientHeight;
            labelRef.current.style.transform = `translate(${x}px, ${y}px)`;
            labelRef.current.style.opacity = tempV.z < 1 ? "1" : "0"; 
          }
        }
      } else {
        // Handle Pause Logic
        if (performance.now() - pauseStartTime > 3000) {
          isPaused = false;
          animProgress = 0; // Reset
        }
      }

      renderer.render(scene, camera);
    };
    animate();

    // --- EVENT LISTENERS ---
    const handleMouseDown = (e: MouseEvent) => {
      mouseState.isDown = true;
      mouseState.prevX = e.clientX;
      mouseState.prevY = e.clientY;
      setIsDragging(true);
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!mouseState.isDown) return;
      const deltaX = (e.clientX - mouseState.prevX) * 0.005;
      const deltaY = (e.clientY - mouseState.prevY) * 0.005;

      camState.theta -= deltaX;
      camState.phi -= deltaY;
      camState.phi = Math.max(0.1, Math.min(Math.PI / 2 - 0.1, camState.phi));

      mouseState.prevX = e.clientX;
      mouseState.prevY = e.clientY;
    };

    const handleMouseUp = () => {
      mouseState.isDown = false;
      setIsDragging(false);
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      camState.radius += e.deltaY * 0.05;
      camState.radius = Math.max(10, Math.min(100, camState.radius));
    };
    
    const handleResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const el = containerRef.current;
    el.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    el.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      el.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      el.removeEventListener("wheel", handleWheel);
      window.removeEventListener("resize", handleResize);
      if (el.contains(renderer.domElement)) {
        el.removeChild(renderer.domElement);
      }
      geometry.dispose();
    };
  }, []);

  return (
    <div className="relative w-full h-[500px] rounded-xl border border-white/10 overflow-hidden shadow-2xl bg-neutral-950">
      {/* 3D Canvas Container */}
      <div 
        ref={containerRef} 
        className={`w-full h-full ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      />

      {/* "Hiker" Label */}
      <div 
        ref={labelRef}
        className="absolute top-0 left-0 pointer-events-none will-change-transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
      >
        <div className="bg-white/10 backdrop-blur-sm text-white text-[10px] font-mono px-2 py-1 rounded border border-white/20 shadow-lg whitespace-nowrap">
          Hiker (Weights)
        </div>
      </div>

      {/* Static UI Overlay */}
      <div className="absolute bottom-8 left-8 pointer-events-none select-none text-shadow-sm">
        <h1 className="text-white font-bold text-2xl tracking-tight m-0">
          Gradient Landscape
        </h1>
        <p className="text-neutral-400 text-xs font-mono mt-1 tracking-wide">
          Minimizing loss function...
        </p>
        
        {/* Dynamic Weights Display */}
        <div className="mt-4 bg-black/40 backdrop-blur-md border border-white/10 p-3 rounded-lg w-fit">
            <p className="text-[10px] text-neutral-500 uppercase tracking-widest mb-1">Current Weights</p>
            <span ref={weightsTextRef} className="text-cyan-400 font-mono text-sm font-bold">
                w₁: -7.5000, w₂: -7.5000
            </span>
        </div>

        <p className="text-neutral-600 text-[10px] mt-4 uppercase tracking-widest">
          Drag to Rotate • Scroll to Zoom
        </p>
      </div>

      {/* Vignette Overlay */}
      <div className="absolute inset-0 bg-radial-gradient from-transparent to-black/60 pointer-events-none" />
    </div>
  );
}