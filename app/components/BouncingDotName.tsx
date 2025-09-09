'use client';

import React, { useEffect, useRef, useState, useCallback, useLayoutEffect } from 'react';
import * as Matter from 'matter-js';

// --- Configuration Constants ---
const DOT_RADIUS = 12;
const RESET_SPEED_THRESHOLD = 0.2;
const AIR_FRICTION = 0.02;
const MAX_VELOCITY = 35;

// ====================================================================================
// 1. The Physics Component (The Transparent Overlay)
// ====================================================================================
interface PhysicsOverlayProps {
  initialPosition: { x: number; y: number };
  initialPointerEvent: React.PointerEvent;
  onDeactivate: () => void;
}

function PhysicsOverlay({ initialPosition, initialPointerEvent, onDeactivate }: PhysicsOverlayProps) {
  const engineRef = useRef<Matter.Engine>();
  const dotBodyRef = useRef<Matter.Body>();
  const [renderDotPos, setRenderDotPos] = useState(initialPosition);
  const isDraggingRef = useRef(true); // Start in dragging mode immediately

  // --- Main Physics Setup Effect ---
  useEffect(() => {
    const engine = Matter.Engine.create({ gravity: { y: 0 } });
    const runner = Matter.Runner.create();
    engineRef.current = engine;

    const dot = Matter.Bodies.circle(initialPosition.x, initialPosition.y, DOT_RADIUS, {
      isStatic: true,
      restitution: 0.92, 
      frictionAir: 0.005, 
    });
    dotBodyRef.current = dot;
    
    Matter.World.add(engine.world, [dot]);
    Matter.Runner.run(runner, engine);

    const circleElement = document.getElementById('physics-dot');
    circleElement?.setPointerCapture(initialPointerEvent.pointerId);

    let rafId: number;
    const animate = () => {
      const body = dotBodyRef.current;
      if (body) {
        if (!isDraggingRef.current) {
          
          const pos = body.position;
          const vel = body.velocity;
          const restitution = body.restitution || 0.92;
          let positionChanged = false;

          if (pos.x < DOT_RADIUS) {
            pos.x = DOT_RADIUS;
            vel.x = -vel.x * restitution;
            positionChanged = true;
          }
          if (pos.x > window.innerWidth - DOT_RADIUS) {
            pos.x = window.innerWidth - DOT_RADIUS;
            vel.x = -vel.x * restitution;
            positionChanged = true;
          }
          if (pos.y < DOT_RADIUS) {
            pos.y = DOT_RADIUS;
            vel.y = -vel.y * restitution;
            positionChanged = true;
          }
          if (pos.y > window.innerHeight - DOT_RADIUS) {
            pos.y = window.innerHeight - DOT_RADIUS;
            vel.y = -vel.y * restitution;
            positionChanged = true;
          }

          if (positionChanged) {
            Matter.Body.setPosition(body, pos);
            Matter.Body.setVelocity(body, vel);
          }

          setRenderDotPos({ x: body.position.x, y: body.position.y });
          const speed = Matter.Vector.magnitude(body.velocity);
          if (speed < RESET_SPEED_THRESHOLD) {
            onDeactivate();
          }
        }
      }
      rafId = requestAnimationFrame(animate);
    };
    rafId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafId);
      Matter.Runner.stop(runner);
      Matter.Engine.clear(engine);
    };
  }, [initialPosition, onDeactivate, initialPointerEvent.pointerId]);


  useEffect(() => {
    const pointerHistory: {x: number, y: number, t: number}[] = [];

    const handlePointerMove = (e: PointerEvent) => {
      if (!isDraggingRef.current) return;
      const newPos = { x: e.clientX, y: e.clientY };
      setRenderDotPos(newPos);
      if (dotBodyRef.current) Matter.Body.setPosition(dotBodyRef.current, newPos);
      pointerHistory.push({ x: e.clientX, y: e.clientY, t: Date.now() });
      if (pointerHistory.length > 10) pointerHistory.shift();
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
      const body = dotBodyRef.current;
      if (!body || pointerHistory.length < 2) {
        onDeactivate();
        return;
      }

      // --- NEW: Smoother & More Accurate Velocity Calculation ---
      // Use a slice of the last few movements to better capture the "flick"
      const recentHistory = pointerHistory.slice(-4);
      const first = recentHistory[0];
      const last = recentHistory[recentHistory.length - 1];
      const dtMs = last.t - first.t;

      if (dtMs > 10) {
        const velocityMultiplier = 0.22; // Increased for more energy
        const vx = ((last.x - first.x) / dtMs) * 16.67 * velocityMultiplier;
        const vy = ((last.y - first.y) / dtMs) * 16.67 * velocityMultiplier;
        
        Matter.Body.setStatic(body, false);
        Matter.Body.setVelocity(body, {
          x: Math.max(-MAX_VELOCITY, Math.min(MAX_VELOCITY, vx)),
          y: Math.max(-MAX_VELOCITY, Math.min(MAX_VELOCITY, vy)),
        });
      } else {
        onDeactivate();
      }
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
    
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [onDeactivate]);
  
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999 }}>
      <svg width="100%" height="100%">
        <circle
          id="physics-dot"
          cx={renderDotPos.x}
          cy={renderDotPos.y}
          r={DOT_RADIUS}
          fill="currentColor"
          style={{ cursor: 'grabbing' }}
        />
      </svg>
    </div>
  );
}

// ====================================================================================
// 2. The Main Component (The Static Name)
// This component manages which view is active and renders the text.
// ====================================================================================
export default function BouncingDotName(): JSX.Element {
  const [isPhysicsActive, setPhysicsActive] = useState(false);
  const [initialPhysicsState, setInitialPhysicsState] = useState<{
    pos: { x: number; y: number },
    evt: React.PointerEvent,
  } | null>(null);

  const iTspanRef = useRef<SVGTSpanElement>(null);
  const triggerRef = useRef<SVGRectElement>(null);

  // Use a layout effect to perfectly position the invisible trigger over the 'i'
  useLayoutEffect(() => {
    if (iTspanRef.current && triggerRef.current) {
      const rect = iTspanRef.current.getBBox();
      triggerRef.current.setAttribute('x', String(rect.x));
      triggerRef.current.setAttribute('y', String(rect.y));
      triggerRef.current.setAttribute('width', String(rect.width));
      triggerRef.current.setAttribute('height', String(rect.height));
    }
  }, [isPhysicsActive]); // Rerun if we switch back from physics mode

  const handlePointerDown = (e: React.PointerEvent<SVGRectElement>) => {
    if (!iTspanRef.current) return;
    const rect = iTspanRef.current.getBoundingClientRect();
    const initialPosition = {
      x: rect.left + rect.width / 2,
      y: rect.top - DOT_RADIUS * 1.2, // Match visual position of where a dot would be
    };
    
    setInitialPhysicsState({ pos: initialPosition, evt: e });
    setPhysicsActive(true);
  };

  return (
    <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
      <svg width={800} height={150} viewBox="0 0 800 150" aria-hidden="true">
        <text
          x="50%" y="110" fontFamily="sans-serif" fontSize="100" fontWeight="700"
          fill="currentColor" textAnchor="middle" style={{ userSelect: 'none' }}
        >
          <tspan>T</tspan>
          {/* Conditionally render a normal 'i' or a dotless 'ı' */}
          <tspan ref={iTspanRef}>{isPhysicsActive ? '\u0131' : 'i'}</tspan>
          <tspan>m Generalov</tspan>
        </text>

        {/* The invisible trigger area, only active when showing the static 'i' */}
        {!isPhysicsActive && (
          <rect
            ref={triggerRef}
            fill="transparent"
            style={{ cursor: 'grab' }}
            onPointerDown={handlePointerDown}
          />
        )}
      </svg>
      
      {/* Conditionally render the entire physics simulation overlay */}
      {isPhysicsActive && initialPhysicsState && (
        <PhysicsOverlay
          initialPosition={initialPhysicsState.pos}
          initialPointerEvent={initialPhysicsState.evt}
          onDeactivate={() => setPhysicsActive(false)}
        />
      )}
    </div>
  );
}