'use client';

import React, { useMemo, useState, useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ScriptableContext
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigation } from '@/app/NavigationContext'; // Ensure path is correct

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

// --- TYPES ---
interface Milestone {
  label: string;
  x: number; // Month index (0-48)
  y: number; // Value
  desc: string;
  isFuture?: boolean;
}

// --- CONFIGURATION ---
const MILESTONES: Milestone[] = [
  { label: 'G12: Tech Focus', x: 0, y: 10, desc: "Initial interest in Computer Science and Tech." },
  { label: 'Y1 -> Y2: The Pivot', x: 12, y: 25, desc: "Shifted focus to Math & Econ to target Quant Finance." },
  { label: 'Y2: CURRENT STATE', x: 24, y: 48, desc: "Building Finance & ML foundation through projects." },
  { label: 'Y3: Internship', x: 36, y: 88, desc: "Targeting Trading/Research roles. Skill acceleration.", isFuture: true },
  { label: 'Y4: Graduation', x: 48, y: 130, desc: "Deepened understanding of Math and Finance concepts through advanced courses", isFuture: true },
];

export default function CareerSimulation() {
  const [activePoint, setActivePoint] = useState<Milestone | null>(MILESTONES[2]);
  const [isLoaded, setIsLoaded] = useState(false);
  const chartRef = useRef<any>(null);
  
  // --- THEME INTEGRATION ---
  const { currentTheme } = useNavigation();

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Helper to make hex colors transparent
  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  // --- DATA GENERATION ---
  const chartData = useMemo(() => {
    const months = 52; 
    const labels = Array.from({ length: months }, (_, i) => {
        if (i === 0) return 'G12';
        if (i === 12) return 'Y1';
        if (i === 24) return 'Y2';
        if (i === 36) return 'Y3';
        if (i === 48) return 'Y4';
        return '';
    });

    // 1. Generate "Market" Paths (Background Noise)
    const simulations = [];
    for (let i = 0; i < 20; i++) {
      const path = [10];
      for (let t = 1; t < months; t++) {
        const prev = path[t - 1];
        path.push(prev + 1.2 + ((Math.random() - 0.5) * 5));
      }
      simulations.push(path);
    }

    // 2. Generate "Your Strategy" Path
    const myPath = new Array(months).fill(null);
    for (let i = 0; i < MILESTONES.length - 1; i++) {
        const curr = MILESTONES[i];
        const next = MILESTONES[i+1];
        if (curr.x >= 24) break; 

        const steps = next.x - curr.x;
        const yDiff = next.y - curr.y;
        
        for (let t = 0; t <= steps; t++) {
             if (curr.x + t > 24) break;
             const progress = t / steps;
             const curve = progress < 0.5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress;
             myPath[curr.x + t] = curr.y + (yDiff * curve);
        }
    }
    myPath[24] = MILESTONES[2].y; 

    // 3. Projections
    const upperProjection = new Array(months).fill(null);
    const lowerProjection = new Array(months).fill(null);
    const medianProjection = new Array(months).fill(null);
    
    const startX = 24;
    const startY = MILESTONES[2].y;

    upperProjection[startX] = startY;
    lowerProjection[startX] = startY;
    medianProjection[startX] = startY;

    for(let t = startX + 1; t < months; t++) {
        const dt = t - startX;
        upperProjection[t] = startY + (dt * 5.5); 
        lowerProjection[t] = startY + (dt * 2.0); 
        medianProjection[t] = startY + (dt * 3.8); 
    }

    return {
      labels,
      datasets: [
        // Noise
        ...simulations.map((data) => ({
          label: 'Peer_Avg',
          data: data,
          borderColor: '#1f2937', 
          borderWidth: 1,
          pointRadius: 0,
          tension: 0.1,
          fill: false,
        })),
        // Cone
        {
            label: 'Learning_Velocity',
            data: upperProjection,
            borderColor: 'transparent',
            backgroundColor: hexToRgba(currentTheme.primary, 0.1), // THEMED
            fill: '+1', 
            pointRadius: 0,
            tension: 0.2,
        },
        // Median
        {
            label: 'Projected',
            data: medianProjection,
            borderColor: currentTheme.primary, // THEMED (Solid)
            borderWidth: 2,
            borderDash: [4, 4],
            pointRadius: 0,
            tension: 0.2,
            fill: '+1', 
            backgroundColor: hexToRgba(currentTheme.primary, 0.05), // THEMED
        },
        {
            label: 'Lower',
            data: lowerProjection,
            borderColor: 'transparent',
            pointRadius: 0,
            fill: false,
        },
        // REALIZED PATH
        {
          label: 'Realized_Skill',
          data: myPath,
          borderColor: currentTheme.primary, // THEMED
          borderWidth: 2,
          pointBackgroundColor: '#000000',
          pointBorderColor: currentTheme.primary, // THEMED
          pointBorderWidth: 2,
          pointRadius: (ctx: ScriptableContext<'line'>) => {
             const index = ctx.dataIndex;
             return MILESTONES.some(m => m.x === index && !m.isFuture) || index === 24 ? 5 : 0;
          },
          pointHoverRadius: 8,
          tension: 0.1,
        },
      ],
    };
  }, [currentTheme]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 1500, easing: 'easeOutQuart' },
    interaction: { mode: 'index' as const, intersect: false },
    onHover: (event: any, elements: any) => {
        if (elements && elements.length > 0) {
            const dataIndex = elements[0].index;
            const milestone = MILESTONES.find(m => Math.abs(m.x - dataIndex) <= 2);
            if (milestone) setActivePoint(milestone);
        }
    },
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false }, 
    },
    scales: {
      x: {
        grid: { color: '#333333' },
        ticks: { color: '#94a3b8', font: { family: 'monospace' } },
      },
      y: {
        position: 'right',
        grid: { color: '#333333' },
        ticks: { color: '#64748b', font: { family: 'monospace' } },
        title: { display: true, text: 'CUMULATIVE SKILL (INDEX)', color: '#475569' }
      },
    },
  };

  return (
    <div className="relative w-full h-[450px] bg-black border border-slate-800 rounded-sm shadow-2xl overflow-hidden flex flex-col">
      
      {/* 1. Header & Status Bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800 bg-slate-900/50">
         <div className="flex items-center gap-3">
             <div className="h-3 w-3 rounded-full animate-pulse" style={{ backgroundColor: currentTheme.primary }} />
             <h3 className="font-bold font-mono text-sm tracking-widest" style={{ color: currentTheme.primary }}>
                CAREER_SIMULATION <span className="text-slate-500">// LIVE</span>
             </h3>
         </div>
         <div className="text-right">
             <p className="text-[10px] font-mono text-slate-500">TICKER: SKILL_CAP</p>
         </div>
      </div>

      <div className="relative flex-1 w-full">
         
         {/* 2. Fixed Data Panel */}
         <div className="absolute top-4 left-4 z-20 w-64">
            <AnimatePresence mode='wait'>
                {activePoint ? (
                    <motion.div 
                        key={activePoint.label}
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="bg-black/80 border-l-2 pl-4 py-2 backdrop-blur-sm"
                        style={{ borderColor: currentTheme.primary }}
                    >
                        <div className="flex items-baseline gap-2">
                             <h4 className="text-white font-mono font-bold text-lg">{activePoint.y.toFixed(2)}</h4>
                             <span className="text-xs font-mono" style={{ color: currentTheme.primary }}>{activePoint.isFuture ? 'PROJ' : 'ACTUAL'}</span>
                        </div>
                        <h5 className="text-slate-200 font-bold text-sm mt-1">{activePoint.label}</h5>
                        <p className="text-slate-400 text-xs mt-1 leading-snug font-mono">{activePoint.desc}</p>
                    </motion.div>
                ) : (
                    <div className="pl-4 py-2 opacity-50">
                        <p className="text-slate-600 font-mono text-xs">HOVER_TO_INSPECT_DATA...</p>
                    </div>
                )}
            </AnimatePresence>
         </div>

         {/* 3. The Chart */}
         <div className="absolute inset-0 pt-4 pl-2 pr-2 pb-2">
            {isLoaded && <Line ref={chartRef} data={chartData} options={options as any} />}
         </div>

      </div>

      {/* 4. Footer Legend */}
      <div className="flex justify-end gap-6 px-4 py-2 border-t border-slate-800 bg-black text-[10px] font-mono text-slate-500">
          <div className="flex items-center gap-1">
              <div className="w-3 h-0.5" style={{ backgroundColor: currentTheme.primary }}></div>
              <span>REALIZED</span>
          </div>
          <div className="flex items-center gap-1">
              <div className="w-3 h-0.5 border-dashed border-t border-b border-transparent" style={{ backgroundColor: currentTheme.primary }}></div>
              <span>PROJECTION</span>
          </div>
          <div className="flex items-center gap-1">
              <div className="w-3 h-3" style={{ backgroundColor: hexToRgba(currentTheme.primary, 0.3) }}></div>
              <span>VARIANCE</span>
          </div>
      </div>

    </div>
  );
}