'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { projects, articles } from '@/data/content'; 
import { FiTerminal, FiCornerDownLeft } from 'react-icons/fi';
import HedgingSimulator from './interactive/HedgingSimulator';
import { useNavigation } from '@/app/NavigationContext'; 

type CommandHistory = {
  type: 'input' | 'output' | 'error' | 'success';
  content: string;
};

// --- DATA PREPARATION ---
const getSearchableItems = () => {
  const items = [
    { key: 'about', path: '/about', type: 'Page' },
    { key: 'projects', path: '/', type: 'Page' }, 
    { key: 'articles', path: '/articles', type: 'Page' },
    { key: 'linkedin', path: 'https://www.linkedin.com/in/tim-generalov/', type: 'External' },
    { key: 'github', path: 'https://github.com/Yeetbananis', type: 'External' },
  ];

  projects.forEach(p => items.push({ key: p.title.toLowerCase(), path: p.link, type: 'Project' }));
  articles.forEach(a => items.push({ key: a.title.toLowerCase(), path: a.link, type: 'Article' }));

  return items;
};

export default function CommandTerminal() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<CommandHistory[]>([]);
  const [suggestion, setSuggestion] = useState('');
  const [showHedgeSim, setShowHedgeSim] = useState(false);
  
  const { setNavigating, isChaosMode, setChaosMode, isTesseractMode, setTesseractMode, isPendulumMode, setPendulumMode, isGalaxyMode, setGalaxyMode, setTargetNode } = useNavigation();

  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const searchableItems = useMemo(() => getSearchableItems(), []);

  // --- COMMAND LOGIC ---
  const commands = useMemo(() => ({
    help: "Available: visit, navigate, backdrop, chaos, tesseract, clear, social, run",
    clear: "Clears the terminal history.",
    whoami: "root@quant-portfolio (Tim Generalov)",
    date: new Date().toString(),
    social: "Try: visit linkedin | visit github",
    ls: "Lists all accessible pages, projects, and articles.",
    run: "Executes interactive modules. Try: 'run hedging-game'",
    navigate: "Initiates Neural Navigation Mode (3D Site Map).",
    backdrop: "Enters Wallpaper Configurator Mode.", 
    chaos: "Toggle Entropy (Lorenz Attractor).",
    tesseract: "Toggle 4D Hypercube Geometry.",
    pendulum: "Toggle Pendulum Simulation.",
    galaxy: "Initialize Galactic Singularity Simulation."
  }), []);

  // --- KEYBOARD LISTENERS ---
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && !isOpen) {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isOpen]);

  // --- ROBUST LONG PRESS LISTENER (MOBILE) ---
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    const holdDuration = 1000; // 1 second for easier access, adjusting from 3s

    const clearTimer = () => {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 1) {
          clearTimer();
          return;
      }
      
      clearTimer();

      timer = setTimeout(() => {
        setIsOpen(true);
        if (navigator.vibrate) navigator.vibrate(50); 
      }, holdDuration);
    };

    const handleTouchEnd = () => clearTimer();
    const handleTouchMove = () => clearTimer();
    const handleTouchCancel = () => clearTimer();
    
    const handleContextMenu = (e: Event) => {
        if (!isOpen) e.preventDefault();
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchcancel', handleTouchCancel);
    window.addEventListener('contextmenu', handleContextMenu, { passive: false });

    document.body.style.userSelect = 'none';
    document.body.style.webkitUserSelect = 'none';

    return () => {
      clearTimer();
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchcancel', handleTouchCancel);
      window.removeEventListener('contextmenu', handleContextMenu);

      document.body.style.userSelect = '';
      document.body.style.webkitUserSelect = '';
    };
  }, [isOpen]); 

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // --- AUTOCOMPLETE ENGINE ---
  useEffect(() => {
    if (!input) {
      setSuggestion('');
      return;
    }
    const lowerInput = input.toLowerCase();
    
    const matchingCommand = Object.keys(commands).find(cmd => cmd.startsWith(lowerInput));
    if (matchingCommand && matchingCommand !== lowerInput) {
      setSuggestion(matchingCommand.slice(lowerInput.length));
      return;
    }

    if (lowerInput.startsWith('visit ')) {
      const query = lowerInput.replace('visit ', '');
      if (!query) return;
      const match = searchableItems.find(item => item.key.includes(query));
      if (match) {
        const fullKey = match.key;
        const matchIndex = fullKey.indexOf(query);
        if (matchIndex !== -1) {
           const remaining = fullKey.slice(matchIndex + query.length);
           setSuggestion(remaining);
           return;
        }
      }
    }

    if (lowerInput.startsWith('run ')) {
        const query = lowerInput.replace('run ', '');
        const apps = ['hedging-game']; 
        const match = apps.find(app => app.startsWith(query));
        if (match) {
            setSuggestion(match.slice(query.length));
            return;
        }
    }
    setSuggestion('');
  }, [input, commands, searchableItems]);

  // --- EXECUTION HANDLER ---
  const handleCommand = (cmd: string) => {
    const cleanCmd = cmd.trim();
    const [action, ...args] = cleanCmd.split(' ');
    const argString = args.join(' ').toLowerCase();

    setHistory(prev => [...prev, { type: 'input', content: cmd }]);

    if (action === 'clear') { setHistory([]); return; }

    // --- NAVIGATE ---
    if (action === 'navigate' || action === 'nav') {
        setIsOpen(false); 
        setChaosMode(false); setTesseractMode(false); setPendulumMode(false); setGalaxyMode(false);
        window.dispatchEvent(new CustomEvent('PHANTOM_BACKDROP_OFF'));
        setNavigating(true); 
        setHistory(prev => [...prev, { type: 'success', content: 'Initiating Neural Link...' }]);
        return;
    }

    // --- BACKDROP ---
    if (action === 'backdrop' || action === 'bg') {
        setIsOpen(false);
        setNavigating(true);
        window.dispatchEvent(new CustomEvent('PHANTOM_BACKDROP_ON'));
        setHistory(prev => [...prev, { type: 'success', content: 'Entering Wallpaper Configurator...' }]);
        return;
    }

    // --- CHAOS MODE ---
    if (action === 'chaos') {
        if (isChaosMode) {
            setChaosMode(false);
            setHistory(prev => [...prev, { type: 'success', content: 'Restoring Entropy...' }]);
        } else {
            setTesseractMode(false); setPendulumMode(false); setGalaxyMode(false);
            setChaosMode(true);
            setHistory(prev => [...prev, { type: 'success', content: 'Lorenz Attractor Initialized...' }]);
        }
        setIsOpen(false); return;
    }

    // --- TESSERACT MODE ---
    if (action === 'tesseract' || action === 'hypercube' || action === '4d') {
        if (isTesseractMode) {
            setTesseractMode(false);
            setHistory(prev => [...prev, { type: 'success', content: 'Collapsing 4D Geometry...' }]);
        } else {
            setChaosMode(false); setPendulumMode(false); setGalaxyMode(false);
            setTesseractMode(true);
            setHistory(prev => [...prev, { type: 'success', content: 'Projecting 4D Hypercube Shadow...' }]);
        }
        setIsOpen(false); return;
    }

    // --- PENDULUM MODE ---
    if (action === 'pendulum' || action === 'double' || action === 'physics') {
        if (isPendulumMode) {
            setPendulumMode(false);
            setHistory(prev => [...prev, { type: 'success', content: 'Stopping Physics Simulation...' }]);
        } else {
            setChaosMode(false); setTesseractMode(false); setGalaxyMode(false);
            setPendulumMode(true);
            setHistory(prev => [...prev, { type: 'success', content: 'Initializing Double Pendulum...' }]);
        }
        setIsOpen(false); return;
    }

    // --- GALAXY MODE ---
    if (action === 'galaxy' || action === 'universe' || action === 'space') {
        if (isGalaxyMode) {
            setGalaxyMode(false);
            setHistory(prev => [...prev, { type: 'success', content: 'Collapsing Universe.' }]);
        } else {
            setChaosMode(false);
            setTesseractMode(false);
            setPendulumMode(false);

            // Galaxy mode fix
            setNavigating(false);
            setTargetNode(null);

            setGalaxyMode(true);
            setHistory(prev => [...prev, { type: 'success', content: 'Triggering Big Bang.' }]);
        }
        setIsOpen(false);
        return;
    }

    // --- STANDARD COMMANDS ---
    if (action === 'resume' || action === 'cv') {
        setHistory(prev => [...prev, { type: 'success', content: "Opening Resume (PDF)..." }]);
        window.open('/images/Tim_Generalov_Resume.pdf', '_blank'); 
        setIsOpen(false); return;
    }

    if (action === 'visit' || action === 'cd' || action === 'go') {
      if (!argString) { setHistory(prev => [...prev, { type: 'error', content: "Usage: visit [page/project/article]" }]); return; }
      const match = searchableItems.find(item => item.key.includes(argString));
      if (match) {
        setHistory(prev => [...prev, { type: 'success', content: `Navigating to ${match.type}: ${match.key}...` }]);
        setIsOpen(false);
        setNavigating(false); 
        if (match.type === 'External') window.open(match.path, '_blank'); else router.push(match.path);
      } else setHistory(prev => [...prev, { type: 'error', content: `Error: path '${argString}' not found.` }]);
      return;
    }

    if (action === 'ls') {
       const output = searchableItems.map(i => `[${i.type}] ${i.key}`).join('\n');
       setHistory(prev => [...prev, { type: 'output', content: output }]);
       return;
    }

    if (action === 'run') {
        if (args[0] === 'hedging-game') {
            setIsOpen(false); setShowHedgeSim(true);
            setHistory(prev => [...prev, { type: 'success', content: 'Launching Delta Neutral Simulator...' }]);
            return;
        }
    }

    if (action in commands) { setHistory(prev => [...prev, { type: 'output', content: commands[action as keyof typeof commands] }]); return; }

    setHistory(prev => [...prev, { type: 'error', content: `Command not found: ${action}. Type 'help'.` }]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCommand(input + (suggestion ? '' : '')); 
      setInput('');
      setSuggestion('');
    }
    if (e.key === 'Tab') {
      e.preventDefault();
      if (suggestion) {
        setInput(input + suggestion);
        setSuggestion('');
      }
    }
  };

  return (
    <AnimatePresence>
        {showHedgeSim && <HedgingSimulator onClose={() => setShowHedgeSim(false)} />}
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ y: '-100%' }}
            animate={{ y: '0%' }}
            exit={{ y: '-100%' }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed top-0 left-0 right-0 z-50 w-full bg-black-800 shadow-2xl border-b border-white/10"
          >
            <div className="mx-auto max-w-3xl p-6 font-mono text-sm md:text-base">
              <div className="mb-4 flex items-center justify-between text-slate-500 text-xs uppercase tracking-widest border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <FiTerminal className="text-emerald-500" />
                  <span>Developer Console</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1"><kbd className="bg-slate-800 px-1 rounded">TAB</kbd> Complete</span>
                  <span className="flex items-center gap-1"><kbd className="bg-slate-800 px-1 rounded">ESC</kbd> Close</span>
                </div>
              </div>
              <div className="max-h-[300px] overflow-y-auto mb-4 space-y-1 scrollbar-thin scrollbar-thumb-slate-700">
                {history.map((entry, i) => (
                  <div key={i} className={`${
                    entry.type === 'error' ? 'text-red-400' : 
                    entry.type === 'success' ? 'text-emerald-400' : 
                    entry.type === 'input' ? 'text-slate-400 mt-2' : 'text-slate-300 whitespace-pre-wrap'
                  }`}>
                    {entry.type === 'input' && <span className="mr-2 text-blue-500">➜ ~</span>}
                    {entry.content}
                  </div>
                ))}
              </div>
              <div className="relative flex items-center group">
                <span className="mr-3 text-emerald-500 font-bold">➜</span>
                <span className="mr-3 text-blue-400 font-bold">~</span>
                <div className="relative flex-1">
                  <div className="absolute inset-0 pointer-events-none flex whitespace-pre">
                    <span className="opacity-0">{input}</span>
                    <span className="text-slate-600">{suggestion}</span>
                  </div>
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="w-full bg-transparent text-slate-100 placeholder-slate-700 focus:outline-none caret-emerald-500"
                    placeholder="Type 'help' for commands..."
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck="false"
                  />
                </div>
                <FiCornerDownLeft className="text-slate-600 animate-pulse ml-2" />
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
