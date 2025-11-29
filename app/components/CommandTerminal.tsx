'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, usePathname } from 'next/navigation'; // Added usePathname
import { projects, articles } from '@/data/content'; 
import { FiTerminal, FiCornerDownLeft } from 'react-icons/fi';
import HedgingSimulator from './interactive/HedgingSimulator';
import { useNavigation } from '@/app/NavigationContext'; 

type CommandHistory = {
  type: 'input' | 'output' | 'error' | 'success';
  content: string | React.ReactNode; // Allow JSX
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
  
  const { isNavigating, setNavigating, isChaosMode, setChaosMode, isTesseractMode, setTesseractMode, isPendulumMode, setPendulumMode, isGalaxyMode, setGalaxyMode, isBlackHoleMode, setBlackHoleMode, setTargetNode } = useNavigation();

  const inputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const searchableItems = useMemo(() => getSearchableItems(), []);
  const [ghostText, setGhostText] = useState("");


  const pathname = usePathname(); // Get current URL

  // LOGIC: Show ONLY if:
  // 1. On Home Page ('/')
  // 2. Terminal is Closed (!isOpen)
  // 3. Not Navigating/Backdrop (!isNavigating)
  // 4. No Simulations Active
  const shouldShowGhost = 
    pathname === '/' && 
    !isOpen && 
    !isNavigating && 
    !isChaosMode && 
    !isTesseractMode && 
    !isPendulumMode && 
    !isGalaxyMode;

  // --- COMMAND LOGIC ---
  const commands = useMemo(() => ({
    help: 
`Available Commands:

  [NAVIGATION]
  visit <target>   : Navigate to a page or external link (e.g., 'visit about', 'visit quant').
  navigate         : Enter the 3D Neural Site Map mode.
  backdrop         : Open the Theme & Wallpaper Configurator.
  ls               : List all valid targets for the 'visit' command.
  resume           : Open PDF Resume in a new tab.

  [SIMULATION]
  chaos            : Toggle Lorenz Attractor (Entropy).
  tesseract        : Toggle 4D Hypercube Projection.
  pendulum         : Toggle Double Pendulum Physics.
  galaxy           : Toggle Galactic Singularity.
  horizon          : Toggle Black Hole Event Horizon.

  [INTERACTIVE]
  run hedging-game : Start the Delta Neutral Simulator.

  [SYSTEM]
  social           : Display social links (GitHub/LinkedIn).
  whoami           : Display current session user.
  date             : Display server time.
  clear            : Clear terminal output.
`,
    clear: "Clears the terminal history.",
    whoami: "root@quant-portfolio (Tim Generalov)",
    date: new Date().toString(),
    social: "Links:\n- LinkedIn: https://www.linkedin.com/in/tim-generalov/\n- GitHub: https://github.com/Yeetbananis",
    // Note: 'ls', 'visit', 'run', 'navigate', etc. are handled by custom logic in handleCommand
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

  // --- ROBUST AUTOCOMPLETE ENGINE ---
  useEffect(() => {

    // 1. Define ALL valid root commands explicitly
    const MASTER_COMMAND_LIST = [
      // Navigation
      'help', 'clear', 'ls', 'visit', 'navigate', 'backdrop', 'resume', 
      // Simulations
      'chaos', 'tesseract', 'pendulum', 'galaxy', 'horizon', // Added 'horizon'
      // System
      'social', 'whoami', 'date',
      // Interactive
      'run'
    ];

    if (!input) {
      setSuggestion('');
      return;
    }

    const lowerInput = input.toLowerCase();
    const args = lowerInput.split(' ');
    const rootCommand = args[0];
    const isTypingArg = args.length > 1 || (args.length === 1 && input.endsWith(' '));

    // A. Root Command Autocomplete (e.g. "nav" -> "navigate")
    if (!isTypingArg) {
      const match = MASTER_COMMAND_LIST.find(cmd => cmd.startsWith(lowerInput));
      if (match) {
        setSuggestion(match.slice(lowerInput.length));
      } else {
        setSuggestion('');
      }
      return;
    }

    // B. Argument Autocomplete (e.g. "visit abo" -> "about")
    const currentArg = input.slice(input.indexOf(' ') + 1).toLowerCase();

    // 1. Visit Logic
    if (rootCommand === 'visit' || rootCommand === 'go' || rootCommand === 'cd') {
      if (!currentArg) return; // Don't suggest until they type a letter
      
      const match = searchableItems.find(item => item.key.startsWith(currentArg));
      if (match) {
        setSuggestion(match.key.slice(currentArg.length));
        return;
      }
    }

    // 2. Run Logic
    if (rootCommand === 'run') {
      const availableApps = ['hedging-game'];
      const match = availableApps.find(app => app.startsWith(currentArg));
      if (match) {
        setSuggestion(match.slice(currentArg.length));
        return;
      }
    }

    // No match found
    setSuggestion('');
  }, [input, searchableItems]);

  // --- UTILITY: FUZZY MATCHING (Levenshtein Distance) ---
const getEditDistance = (a: string, b: string) => {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix = [];

  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          Math.min(
            matrix[i][j - 1] + 1, // insertion
            matrix[i - 1][j] + 1 // deletion
          )
        );
      }
    }
  }
  return matrix[b.length][a.length];
};

  // --- AUTO-SCROLL TO BOTTOM ---
  useEffect(() => {
    if (isOpen) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [history, isOpen]);

 // --- SMART IDLE MONITOR (Active Detection) ---
  useEffect(() => {
    // If terminal is open, do nothing & clear text
    if (isOpen) {
      setGhostText("");
      return;
    }

    // If not allowed to show (wrong page, open terminal, active simulation), clear and exit.
    if (!shouldShowGhost) {
      setGhostText("");
      return;
    }

    const IDLE_TIMEOUT = 3000; // Time to wait before showing text (3s)
    const phrases = [
      "System_Idle...",
      "Awaiting_Input...",
      "Type 'help' to initialize...",
      "Press '/' to begin_"
    ];

    let idleTimer: NodeJS.Timeout;
    let typeTimer: NodeJS.Timeout;
    
    let phraseIndex = 0;
    let charIndex = 0;
    let isDeleting = false;

    // --- TYPING ENGINE ---
    const typeLoop = () => {
      const currentPhrase = phrases[phraseIndex];
      const speed = isDeleting ? 30 : 100;

      if (!isDeleting && charIndex <= currentPhrase.length) {
        setGhostText(currentPhrase.substring(0, charIndex));
        charIndex++;
      } else if (isDeleting && charIndex >= 0) {
        setGhostText(currentPhrase.substring(0, charIndex));
        charIndex--;
      }

      if (charIndex === currentPhrase.length + 1) {
        isDeleting = true;
        typeTimer = setTimeout(typeLoop, 2000); 
        return;
      }

      if (charIndex === -1) {
        isDeleting = false;
        phraseIndex = (phraseIndex + 1) % phrases.length;
        typeTimer = setTimeout(typeLoop, 500); 
        return;
      }

      typeTimer = setTimeout(typeLoop, speed);
    };

    // --- ACTIVITY HANDLER ---
    const handleUserActivity = () => {
      // 1. CLEAR EVERYTHING IMMEDIATELY
      if (charIndex > 0) setGhostText(""); 
      clearTimeout(typeTimer);
      clearTimeout(idleTimer);

      // 2. RESET STATE
      charIndex = 0;
      isDeleting = false;

      // 3. START IDLE TIMER
      idleTimer = setTimeout(() => {
        typeLoop(); 
      }, IDLE_TIMEOUT);
    };

    // Attach Listeners (REMOVED 'mousemove' and 'click')
    // Now it only hides if you actually DO something (Type, Scroll, Touch)
    window.addEventListener('keydown', handleUserActivity);
    window.addEventListener('scroll', handleUserActivity);
    window.addEventListener('touchstart', handleUserActivity);

    // Initial Start
    handleUserActivity();

    return () => {
      clearTimeout(idleTimer);
      clearTimeout(typeTimer);
      window.removeEventListener('keydown', handleUserActivity);
      window.removeEventListener('scroll', handleUserActivity);
      window.removeEventListener('touchstart', handleUserActivity);
    };
  }, [isOpen, shouldShowGhost]);

  // --- EXECUTION HANDLER ---
  const handleCommand = (cmd: string) => {
    const cleanCmd = cmd.trim();
    if (!cleanCmd) return;

    const [rawAction, ...args] = cleanCmd.split(' ');
    let action = rawAction.toLowerCase(); // Strip case immediately
    const argString = args.join(' ').toLowerCase();

   // 1. DEFINE ALL VALID COMMANDS
    const VALID_COMMANDS = [
      'help', 'clear', 'visit', 'navigate', 'backdrop', 'resume', 
      'chaos', 'tesseract', 'pendulum', 'galaxy', 'horizon', // Added 'horizon'
      'social', 'whoami', 'date', 'run', 'ls'
    ];

    // 2. FUZZY MATCHING LOGIC
    // If the action isn't perfect, look for a close match
    if (!VALID_COMMANDS.includes(action)) {
        // Find best match
        const bestMatch = VALID_COMMANDS.find(valid => {
            const distance = getEditDistance(action, valid);
            // Tolerance: 1 typo for short words, 2 for long words
            const threshold = valid.length > 4 ? 2 : 1; 
            return distance <= threshold;
        });

        if (bestMatch) {
            // Auto-correct!
            setHistory(prev => [...prev, { type: 'input', content: cmd }]);
            setHistory(prev => [...prev, { type: 'output', content: `➜ Auto-correcting '${action}' to '${bestMatch}'...` }]);
            action = bestMatch; // Swap the invalid action for the valid one
        } else {
            // No close match found -> Let it fall through to error handling at bottom
            setHistory(prev => [...prev, { type: 'input', content: cmd }]);
        }
    } else {
        // Exact match
        setHistory(prev => [...prev, { type: 'input', content: cmd }]);
    }

    if (action === 'clear') { setHistory([]); return; }

// --- NAVIGATE ---
    if (action === 'navigate' || action === 'nav') {
        setIsOpen(false); 
        // FIX: Added setBlackHoleMode(false) to ensure we exit the singularity
        setChaosMode(false); setTesseractMode(false); setPendulumMode(false); setGalaxyMode(false); setBlackHoleMode(false);
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

    // --- BLACK HOLE MODE ---
    if (action === 'horizon' || action === 'blackhole' || action === 'singular') {
        if (isBlackHoleMode) {
            setBlackHoleMode(false);
            setHistory(prev => [...prev, { type: 'success', content: 'Exiting Event Horizon...' }]);
        } else {
            // Reset others
            setChaosMode(false); setTesseractMode(false); setPendulumMode(false); setGalaxyMode(false);
            
            // Galaxy/Blackhole fix: Stop navigating so camera works
            setNavigating(false);
            setTargetNode(null);

            setBlackHoleMode(true);
            setHistory(prev => [...prev, { type: 'success', content: 'Approaching Gargantua. Gravity critical.' }]);
        }
        setIsOpen(false);
        return;
    }

    // --- SOCIAL LINKS (CLICKABLE) ---
    if (action === 'social') {
        setHistory(prev => [...prev, { 
            type: 'success', 
            content: (
                <div className="flex flex-col gap-1 mt-1">
                    <span className="text-slate-400">Connect via:</span>
                    <div className="pl-4 flex flex-col gap-1">
                        <a 
                            href="https://www.linkedin.com/in/tim-generalov/" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300 hover:underline w-fit flex items-center gap-2 transition-colors"
                        >
                            <span className="text-slate-500">[LINK]</span> LinkedIn Profile ↗
                        </a>
                        <a 
                            href="https://github.com/Yeetbananis" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-emerald-400 hover:text-emerald-300 hover:underline w-fit flex items-center gap-2 transition-colors"
                        >
                            <span className="text-slate-500">[CODE]</span> GitHub Profile ↗
                        </a>
                    </div>
                </div>
            ) 
        }]);
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

   // Add this if you don't have the tailwind-scrollbar plugin
      const scrollbarStyles = {
        scrollbarWidth: 'thin',
        scrollbarColor: '#3f3f46 transparent', // Zinc-700 and Transparent
      } as React.CSSProperties;

  return (
    <>
      {/* --- GHOST TEXT OVERLAY (Top-Left System Monitor Style) --- */}
      {/* Only render if logic permits and text exists */}
      {shouldShowGhost && ghostText && (
        <div 
            className="fixed top-16 left-6 z-40 pointer-events-auto cursor-pointer group"
            onClick={() => setIsOpen(true)}
        >
            <div className="flex flex-col items-start gap-1">
                {/* Status Indicator */}
                <div className="flex items-center gap-2 mb-1">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                    <span className="font-mono text-[10px] text-emerald-500/60 tracking-[0.2em] uppercase">
                        System_Idle
                    </span>
                </div>

                {/* The Typing Text - Clean & Minimal */}
                <div className="font-mono text-sm text-slate-400/80 group-hover:text-white transition-colors duration-300">
                    <span className="text-slate-600 mr-2 opacity-50">$</span>
                    {ghostText}
                    <span className="animate-pulse text-emerald-500 font-bold ml-[1px]">_</span>
                </div>
                
                {/* Sub-hint (Only visible on hover) */}
                <div className="h-4 overflow-hidden">
                    <span className="font-mono text-[9px] text-slate-600 mt-1 block opacity-0 -translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                        [ Click or Press / to Initialize ]
                    </span>
                </div>
            </div>
        </div>
      )}

   

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
                  <div 
                  style={scrollbarStyles} 
                  className="max-h-[300px] overflow-y-auto mb-4 space-y-1"
                >
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
                {/* The Invisible Anchor */}
                <div ref={bottomRef} /> 
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
    </>
  );
}
