'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

// --- MATH ENGINE ---
// Error function for Normal Distribution
const erf = (x: number) => {
  const sign = (x >= 0) ? 1 : -1;
  x = Math.abs(x);
  const a1 =  0.254829592;
  const a2 = -0.284496736;
  const a3 =  1.421413741;
  const a4 = -1.453152027;
  const a5 =  1.061405429;
  const p  =  0.3275911;
  const t = 1.0 / (1.0 + p*x);
  const y = 1.0 - (((((a5*t + a4)*t) + a3)*t + a2)*t + a1)*t*Math.exp(-x*x);
  return sign*y;
}

const cdf = (x: number) => (1.0 + erf(x / Math.sqrt(2.0))) / 2.0;

// d1 calculation
const getD1 = (S: number, K: number, T: number, r: number, sigma: number) => {
    if (T <= 0) return 0;
    return (Math.log(S / K) + (r + (sigma * sigma) / 2) * T) / (sigma * Math.sqrt(T));
}

// Delta Calculations
const getDelta = (type: 'call' | 'put', S: number, K: number, T: number, r: number, sigma: number) => {
    if (T <= 0) {
        if (type === 'call') return S > K ? 1 : 0;
        return S < K ? -1 : 0;
    }
    const d1 = getD1(S, K, T, r, sigma);
    if (type === 'call') return cdf(d1);      // N(d1)
    if (type === 'put') return cdf(d1) - 1.0; // N(d1) - 1
    return 0;
}

// Option Pricing
const getPrice = (type: 'call' | 'put', S: number, K: number, T: number, r: number, sigma: number) => {
    if (T <= 0) {
        if (type === 'call') return Math.max(0, S - K);
        return Math.max(0, K - S);
    }
    const d1 = getD1(S, K, T, r, sigma);
    const d2 = d1 - sigma * Math.sqrt(T);
    
    if (type === 'call') {
        return S * cdf(d1) - K * Math.exp(-r * T) * cdf(d2);
    } else {
        return K * Math.exp(-r * T) * cdf(-d2) - S * cdf(-d1);
    }
}

// --- SCENARIO DEFINITIONS ---
type ScenarioType = 'straddle' | 'strangle' | 'naked_call';

interface Scenario {
    id: ScenarioType;
    name: string;
    description: string;
    legs: { type: 'call' | 'put'; strikeOffset: number; quantity: number }[]; // quantity negative for short
    difficulty: string;
}

const SCENARIOS: Scenario[] = [
    {
        id: 'straddle',
        name: "THE WIDOWMAKER (Short Straddle)",
        description: "You sold both ATM Calls and Puts. You are Short Volatility. If the price moves in ANY direction, you bleed.",
        difficulty: "HARD",
        legs: [
            { type: 'call', strikeOffset: 0, quantity: -10 },
            { type: 'put', strikeOffset: 0, quantity: -10 }
        ]
    },
    {
        id: 'strangle',
        name: "THE STRANGLE (Short Strangle)",
        description: "You sold OTM Calls ($110) and OTM Puts ($90). You have a wider safety net, but Gamma spikes harder if boundaries are breached.",
        difficulty: "MEDIUM",
        legs: [
            { type: 'call', strikeOffset: 10, quantity: -10 },
            { type: 'put', strikeOffset: -10, quantity: -10 }
        ]
    },
    {
        id: 'naked_call',
        name: "NAKED CALL (Short Call)",
        description: "You sold unhedged Calls. If the market rips higher, your losses are theoretically infinite. Don't let it rip.",
        difficulty: "NORMAL",
        legs: [
            { type: 'call', strikeOffset: 0, quantity: -10 }
        ]
    }
];

export default function HedgingSimulator({ onClose }: { onClose: () => void }) {
    // --- INIT SCENARIO ---
    const [scenario, setScenario] = useState<Scenario>(SCENARIOS[0]);
    const [highScore, setHighScore] = useState(0);

    // Initialize only on mount
    useEffect(() => {
        const randomScenario = SCENARIOS[Math.floor(Math.random() * SCENARIOS.length)];
        setScenario(randomScenario);
        
        const saved = localStorage.getItem('quant_high_score');
        if (saved) setHighScore(parseFloat(saved));
    }, []);

    // --- APP STATE ---
    const [phase, setPhase] = useState<'intro' | 'active' | 'gameover'>('intro');
    const [step, setStep] = useState(0);

    // --- MARKET STATE ---
    const [pricePath, setPricePath] = useState<number[]>([100]);
    const [timeElapsed, setTimeElapsed] = useState(0);
    const [isMarketOpen, setIsMarketOpen] = useState(false);
    
    // --- PORTFOLIO STATE ---
    const [sharesHeld, setSharesHeld] = useState(0);
    const [cash, setCash] = useState(0);
    const [pnlHistory, setPnlHistory] = useState<number[]>([0]);

    // --- CONSTANTS ---
    const START_PRICE = 100;
    const TOTAL_DAYS = 60;
    const R = 0.05;
    const SIGMA = 0.3; // 30% Vol

    const currentPrice = pricePath[pricePath.length - 1];
    const timeToExpiryYears = Math.max(0, (TOTAL_DAYS - timeElapsed) / 365);

    // --- GREEKS ENGINE (Must be defined BEFORE Effects) ---
    const positionStats = useMemo(() => {
        let totalDelta = 0;
        let totalLiability = 0;

        scenario.legs.forEach(leg => {
            const legStrike = START_PRICE + leg.strikeOffset;
            const unitDelta = getDelta(leg.type, currentPrice, legStrike, timeToExpiryYears, R, SIGMA);
            const unitPrice = getPrice(leg.type, currentPrice, legStrike, timeToExpiryYears, R, SIGMA);
            
            // 1 contract = 100 shares
            totalDelta += unitDelta * 100 * leg.quantity;
            totalLiability += unitPrice * 100 * leg.quantity; // Negative value for short
        });

        // Net Delta = Shares (1.0) + Option Position Delta
        const netDelta = sharesHeld + totalDelta;
        
        // Liquidation Value = Cash + (Shares * Price) + Option Liability (which is negative)
        const liquidationValue = cash + (sharesHeld * currentPrice) + totalLiability;

        return { netDelta, liquidationValue, totalDelta };
    }, [currentPrice, timeToExpiryYears, sharesHeld, cash, scenario]);

    // --- REFS (Used for Loop) ---
    const netDeltaRef = useRef(0);
    
    // Sync the ref whenever the calculated delta changes
    useEffect(() => {
        netDeltaRef.current = positionStats.netDelta;
    }, [positionStats.netDelta]);

    // --- GAME LOOP ---
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isMarketOpen && timeToExpiryYears > 0) {
            // Acceleration Logic: Starts at 1000ms, caps at 500ms (Manageable Speed)
            const progress = timeElapsed / TOTAL_DAYS;
            const tickSpeed = Math.max(500, 1000 - (progress * 500)); 

            interval = setInterval(() => {
                setPricePath(prev => {
                    const S = prev[prev.length - 1];
                    const dt = 1/365;
                    const Z = (Math.random() + Math.random() + Math.random() + Math.random() - 2);
                    const drift = (R - 0.5 * SIGMA * SIGMA) * dt;
                    const diffusion = SIGMA * Math.sqrt(dt) * Z;
                    const newPrice = S * Math.exp(drift + diffusion);
                    return [...prev.slice(-59), newPrice]; 
                });

                setTimeElapsed(t => t + 1);

                // --- THETA/HEDGE REWARD LOGIC ---
                setCash(prevCash => {
                    const currentDelta = Math.abs(netDeltaRef.current);
                    let hedgeBonus = 0;

                    if (currentDelta < 50) {
                        hedgeBonus = 150; // Perfect Hedge
                    } else if (currentDelta < 150) {
                        hedgeBonus = 50;  // Okay Hedge
                    } else {
                        hedgeBonus = -50; // Bad Hedge (Bleeding)
                    }
                    return prevCash + hedgeBonus;
                });

            }, tickSpeed);
        } else if (timeToExpiryYears <= 0 && isMarketOpen) {
            // Game Over Logic
            setIsMarketOpen(false);
            setPhase('gameover');
            const finalPnL = positionStats.liquidationValue;
            if (finalPnL > highScore) {
                setHighScore(finalPnL);
                localStorage.setItem('quant_high_score', finalPnL.toString());
            }
        }
        return () => clearInterval(interval);
    }, [isMarketOpen, timeToExpiryYears, timeElapsed, highScore, positionStats.liquidationValue]);

    // --- PNL RECORDER ---
    useEffect(() => {
        setPnlHistory(prev => [...prev.slice(-59), positionStats.liquidationValue]);
    }, [positionStats.liquidationValue]);

    // --- TRADING ---
    const trade = (amount: number) => {
        setSharesHeld(prev => prev + amount);
        setCash(prev => prev - (amount * currentPrice));
    };

    // --- INTRO CONTENT ---
    const introSteps = [
        {
            title: "/// SYSTEM_INIT",
            content: (
                <div className="space-y-4 font-mono">
                    <p className="text-slate-400">&gt;&gt; AUTHENTICATED: MARKET MAKER</p>
                    <p className="text-slate-400">&gt;&gt; ALLOCATING RISK PROFILE...</p>
                    <div className="p-4 bg-slate-900 border border-emerald-500/30 rounded relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-1 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">LIVE SCENARIO</div>
                        <p className="text-xl font-bold text-white mb-2">{scenario.name}</p>
                        <p className="text-sm text-slate-300">{scenario.description}</p>
                    </div>
                </div>
            )
        },
        {
            title: "/// OBJECTIVE: DELTA_NEUTRAL",
            content: (
                <div className="space-y-4 font-mono">
                    <p className="text-slate-400">&gt;&gt; Your portfolio has intrinsic <strong className="text-red-400">DIRECTIONAL RISK</strong>.</p>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                        <div className="bg-slate-900 p-3 border-l-2 border-red-500">
                            <span className="block text-red-400 font-bold mb-1">DELTA POSITIVE (+)</span>
                            You are Long. Price Drop = LOSS.
                            <br/><span className="text-white mt-2 block">Action: SELL SHARES</span>
                        </div>
                        <div className="bg-slate-900 p-3 border-l-2 border-blue-500">
                            <span className="block text-blue-400 font-bold mb-1">DELTA NEGATIVE (-)</span>
                            You are Short. Price Rise = LOSS.
                            <br/><span className="text-white mt-2 block">Action: BUY SHARES</span>
                        </div>
                    </div>
                    <p className="text-slate-400 mt-2">&gt;&gt; KEEP NET DELTA AT <strong className="text-emerald-400">ZERO</strong>.</p>
                </div>
            )
        },
        {
            title: "/// WARNING: GAMMA_RISK",
            content: (
                <div className="space-y-4 font-mono">
                    <p className="text-slate-400">&gt;&gt; Time is your enemy.</p>
                    <p className="text-slate-400">&gt;&gt; As expiration approaches (T -&gt; 0), <strong className="text-purple-400">GAMMA</strong> increases.</p>
                    <p className="text-slate-400">&gt;&gt; This means your Delta will swing violently. You must hedge faster.</p>
                    <div className="w-full bg-slate-800 h-1 mt-4">
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: "100%" }}
                            transition={{ duration: 2 }}
                            className="h-full bg-gradient-to-r from-emerald-500 to-red-500"
                        />
                    </div>
                    <p className="text-[10px] text-center text-slate-500 mt-1">VOLATILITY SIMULATION LOADING...</p>
                </div>
            )
        }
    ];

    const isSafe = Math.abs(positionStats.netDelta) < 150;

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-2 sm:p-6 font-mono text-slate-200"
        >
            <div className="w-full max-w-7xl bg-[#09090b] border border-slate-800 rounded-sm shadow-2xl flex flex-col h-[90vh] overflow-hidden relative">
                
                {/* CRT SCANLINE EFFECT */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] z-50 pointer-events-none bg-[length:100%_2px,3px_100%] opacity-20"></div>

                {/* TERMINAL HEADER */}
                <div className="bg-[#121214] p-3 border-b border-slate-800 flex justify-between items-center shrink-0 z-10">
                    <div className="flex items-center gap-4">
                        <div className={`h-2 w-2 rounded-full ${isMarketOpen ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]' : 'bg-red-500'}`}></div>
                        <h2 className="text-sm font-bold text-slate-100 tracking-widest uppercase">
                            QUANT_OS <span className="text-slate-600">v.4.0.2</span> // {scenario.name}
                        </h2>
                    </div>
                    <div className="flex items-center gap-6 text-xs">
                        <div className="hidden sm:block text-slate-500">SESSION_ID: {Math.random().toString(36).substr(2, 6).toUpperCase()}</div>
                        <button onClick={onClose} className="text-slate-400 hover:text-white hover:bg-slate-800 px-3 py-1 rounded transition-colors">
                            [ESC] TERMINATE
                        </button>
                    </div>
                </div>

                {/* MAIN VIEWPORT */}
                <div className="flex-1 overflow-y-auto relative z-10 bg-[#09090b]">
                    <AnimatePresence mode="wait">
                        {phase === 'intro' ? (
                            <motion.div 
                                key="intro"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0, scale: 0.98 }}
                                className="h-full flex flex-col items-center justify-center p-8 max-w-2xl mx-auto"
                            >
                                <div className="w-full border border-slate-800 bg-slate-900/50 p-8 rounded-sm shadow-2xl backdrop-blur-sm">
                                    <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-2">
                                        <h3 className="text-xl font-bold text-emerald-500 tracking-wider">{introSteps[step].title}</h3>
                                        <span className="text-xs text-slate-600">STEP {step + 1}/{introSteps.length}</span>
                                    </div>
                                    
                                    <div className="min-h-[160px]">
                                        {introSteps[step].content}
                                    </div>

                                    <div className="flex justify-between items-center mt-8 pt-4">
                                        <div className="flex gap-1">
                                            {introSteps.map((_, i) => (
                                                <div key={i} className={`h-1 w-6 ${i === step ? 'bg-emerald-500' : 'bg-slate-800'}`} />
                                            ))}
                                        </div>
                                        <button 
                                            onClick={() => {
                                                if (step < introSteps.length - 1) setStep(step + 1);
                                                else setPhase('active');
                                            }}
                                            className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-black font-bold text-sm tracking-widest transition-all"
                                        >
                                            {step < introSteps.length - 1 ? 'NEXT >>' : 'EXECUTE >>'}
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ) : phase === 'gameover' ? (
                            <motion.div className="h-full flex flex-col items-center justify-center p-8">
                                <div className="border border-slate-700 bg-slate-900/80 p-10 rounded-sm text-center max-w-md w-full shadow-2xl">
                                    <h2 className="text-3xl font-bold text-white mb-2 tracking-widest">MARKET CLOSED</h2>
                                    <p className="text-slate-500 text-xs uppercase mb-8 tracking-widest">Settlement Complete</p>
                                    
                                    <div className="grid grid-cols-2 gap-4 mb-8">
                                        <div className="bg-black/40 p-4 border border-slate-800">
                                            <p className="text-[10px] text-slate-500 uppercase">Final PnL</p>
                                            <p className={`text-2xl font-bold font-mono ${pnlHistory[pnlHistory.length-1] >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                ${pnlHistory[pnlHistory.length-1].toFixed(0)}
                                            </p>
                                        </div>
                                        <div className="bg-black/40 p-4 border border-slate-800">
                                            <p className="text-[10px] text-slate-500 uppercase">High Score</p>
                                            <p className="text-2xl font-bold text-yellow-500 font-mono">${highScore.toFixed(0)}</p>
                                        </div>
                                    </div>

                                    <button onClick={onClose} className="w-full py-3 border border-slate-600 hover:bg-slate-800 text-slate-300 text-xs tracking-widest uppercase transition-all">
                                        Return to Terminal
                                    </button>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div 
                                key="active"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="grid grid-cols-1 lg:grid-cols-12 gap-1 p-1 h-full bg-[#050505]"
                            >
                                {/* --- LEFT: CONTROL PANEL (4 Cols) --- */}
                                <div className="lg:col-span-4 flex flex-col gap-1">
                                    
                                    {/* 1. STATUS MODULE */}
                                    <div className="bg-[#0e0e10] border border-slate-800 p-4 flex flex-col gap-4">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="text-[10px] text-slate-500 uppercase tracking-widest">Underlying Asset</p>
                                                <p className="text-4xl font-mono text-white mt-1">${currentPrice.toFixed(2)}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] text-slate-500 uppercase tracking-widest">Expiry Countdown</p>
                                                <div className="text-2xl font-mono text-white mt-1 flex justify-end items-baseline gap-1">
                                                    <span>{TOTAL_DAYS - timeElapsed}</span>
                                                    <span className="text-xs text-slate-600">DAYS</span>
                                                </div>
                                            </div>
                                        </div>

                                        {!isMarketOpen ? (
                                            <button 
                                                onClick={() => setIsMarketOpen(true)}
                                                className="w-full py-3 bg-emerald-600/10 border border-emerald-500/50 hover:bg-emerald-600 hover:text-black text-emerald-400 font-bold transition-all uppercase tracking-widest text-xs"
                                            >
                                                &gt;&gt; Initiate Algorithm
                                            </button>
                                        ) : (
                                            <div className="w-full bg-slate-800 h-1 mt-2">
                                                <motion.div 
                                                    className="h-full bg-emerald-500 shadow-[0_0_10px_#10b981]"
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${(timeElapsed / TOTAL_DAYS) * 100}%` }}
                                                />
                                            </div>
                                        )}
                                    </div>

                                    {/* 2. HEDGING MODULE (Delta Gauge) */}
                                    <div className={`flex-1 p-6 border flex flex-col justify-center items-center relative transition-colors duration-300 ${
                                        isSafe ? 'border-slate-800 bg-[#0e0e10]' : 'border-red-500/30 bg-red-950/10'
                                    }`}>
                                        <div className="w-full text-center mb-8">
                                            <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">NET DELTA EXPOSURE</p>
                                            <div className={`text-6xl font-mono font-bold tracking-tighter transition-colors duration-200 ${
                                                isSafe ? 'text-white' : 'text-red-500 text-shadow-red'
                                            }`}>
                                                {positionStats.netDelta > 0 ? '+' : ''}{positionStats.netDelta.toFixed(0)}
                                            </div>
                                            <div className={`mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold border ${
                                                isSafe ? 'border-emerald-500/30 text-emerald-400 bg-emerald-900/10' : 'border-red-500/30 text-red-400 bg-red-900/10 animate-pulse'
                                            }`}>
                                                <div className={`w-1.5 h-1.5 rounded-full ${isSafe ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                                {isSafe ? 'HEDGE OPTIMAL' : 'RISK CRITICAL'}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 w-full">
                                            <button 
                                                onClick={() => trade(-50)}
                                                disabled={!isMarketOpen}
                                                className="group relative p-4 bg-black border border-red-900/50 hover:border-red-500 text-red-500 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                            >
                                                <span className="block text-[9px] text-slate-600 mb-1 tracking-widest group-hover:text-red-400">DELTA POSITIVE?</span>
                                                <span className="font-bold text-lg tracking-wider">SHORT -50</span>
                                            </button>
                                            <button 
                                                onClick={() => trade(50)}
                                                disabled={!isMarketOpen}
                                                className="group relative p-4 bg-black border border-blue-900/50 hover:border-blue-500 text-blue-500 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                            >
                                                <span className="block text-[9px] text-slate-600 mb-1 tracking-widest group-hover:text-blue-400">DELTA NEGATIVE?</span>
                                                <span className="font-bold text-lg tracking-wider">LONG +50</span>
                                            </button>
                                        </div>
                                        
                                        <div className="mt-8 w-full border-t border-slate-800 pt-4 flex justify-between text-[10px] text-slate-500 uppercase font-mono">
                                            <span>Inventory</span>
                                            <span className="text-white">{sharesHeld} SHARES</span>
                                        </div>
                                    </div>
                                </div>

                                {/* --- RIGHT: DATA VISUALIZATION (8 Cols) --- */}
                                <div className="lg:col-span-8 flex flex-col gap-1">
                                    
                                    {/* CHART MODULE */}
                                    <div className="flex-1 bg-[#0e0e10] border border-slate-800 p-4 relative flex flex-col min-h-[300px]">
                                        <div className="absolute top-4 left-4 z-10 flex gap-4">
                                            <div>
                                                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mr-2">TICKER</span>
                                                <span className="text-xs text-emerald-400 font-mono">GBM-SIM</span>
                                            </div>
                                            <div>
                                                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mr-2">IV</span>
                                                <span className="text-xs text-purple-400 font-mono">30.0%</span>
                                            </div>
                                        </div>

                                        <div className="flex-1 relative mt-6">
                                            <Line 
                                                data={{
                                                    labels: pricePath.map((_, i) => i),
                                                    datasets: [{
                                                        data: pricePath,
                                                        borderColor: '#10b981',
                                                        borderWidth: 1.5,
                                                        pointRadius: 0,
                                                        tension: 0,
                                                        fill: true,
                                                        backgroundColor: (context) => {
                                                            const ctx = context.chart.ctx;
                                                            const gradient = ctx.createLinearGradient(0, 0, 0, 400);
                                                            gradient.addColorStop(0, "rgba(16, 185, 129, 0.1)");
                                                            gradient.addColorStop(1, "rgba(16, 185, 129, 0)");
                                                            return gradient;
                                                        }
                                                    }]
                                                }}
                                                options={{
                                                    responsive: true,
                                                    maintainAspectRatio: false,
                                                    animation: { duration: 0 },
                                                    plugins: { legend: { display: false } },
                                                    scales: { 
                                                        y: { 
                                                            grid: { color: '#1e293b' }, 
                                                            ticks: { color: '#475569', font: { family: 'monospace', size: 10 } },
                                                            position: 'right'
                                                        }, 
                                                        x: { display: false } 
                                                    }
                                                }}
                                            />
                                        </div>
                                    </div>

                                    {/* TELEMETRY BAR */}
                                    <div className="h-32 grid grid-cols-3 gap-1 font-mono">
                                         <div className="bg-[#0e0e10] border border-slate-800 p-4 flex flex-col justify-center relative overflow-hidden group">
                                            <div className="absolute inset-0 bg-red-900/5 group-hover:bg-red-900/10 transition-colors"></div>
                                            <p className="text-[9px] text-slate-500 uppercase tracking-widest relative z-10">Short Option Delta</p>
                                            <p className="text-xl text-red-400 mt-1 relative z-10">{positionStats.totalDelta.toFixed(0)}</p>
                                         </div>
                                         <div className="bg-[#0e0e10] border border-slate-800 p-4 flex flex-col justify-center relative group">
                                             <div className="absolute inset-0 bg-blue-900/5 group-hover:bg-blue-900/10 transition-colors"></div>
                                            <p className="text-[9px] text-slate-500 uppercase tracking-widest relative z-10">Current PnL</p>
                                            <p className={`text-xl mt-1 relative z-10 ${positionStats.liquidationValue >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                ${positionStats.liquidationValue.toFixed(0)}
                                            </p>
                                         </div>
                                         <div className="bg-[#0e0e10] border border-slate-800 p-4 flex flex-col justify-center relative group">
                                             <div className="absolute inset-0 bg-yellow-900/5 group-hover:bg-yellow-900/10 transition-colors"></div>
                                            <p className="text-[9px] text-slate-500 uppercase tracking-widest relative z-10">Session Best</p>
                                            <p className="text-xl text-yellow-500 mt-1 relative z-10">
                                                ${Math.max(highScore, positionStats.liquidationValue).toFixed(0)}
                                            </p>
                                         </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </motion.div>
    );
}