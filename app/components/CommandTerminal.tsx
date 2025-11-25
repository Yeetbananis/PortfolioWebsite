'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { projects, articles } from '@/data/content'; // Ensure this matches your data file path
import { FiTerminal, FiCornerDownLeft } from 'react-icons/fi';
import HedgingSimulator from './interactive/HedgingSimulator';
import { useNavigation } from '@/app/NavigationContext'; // Import Context

type CommandHistory = {
  type: 'input' | 'output' | 'error' | 'success';
  content: string;
};

// --- DATA PREPARATION ---
// We flatten projects and articles into a single searchable "registry"
const getSearchableItems = () => {
  const items = [
    { key: 'about', path: '/about', type: 'Page' },
    { key: 'projects', path: '/', type: 'Page' }, // Home is projects
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
  
  // --- NEW CONTEXT HOOK ---
  const { setNavigating } = useNavigation(); 

  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const searchableItems = useMemo(() => getSearchableItems(), []);

  // --- COMMAND LOGIC ---
  const commands = useMemo(() => ({
    help: "Available: visit, navigate, clear, social, whoami, date, ls, run",
    clear: "Clears the terminal history.",
    whoami: "root@quant-portfolio (Tim Generalov)",
    date: new Date().toString(),
    social: "Try: visit linkedin | visit github",
    ls: "Lists all accessible pages, projects, and articles.",
    run: "Executes interactive modules. Try: 'run hedging-game'",
    navigate: "Initiates Neural Navigation Mode (3D Site Map).", // Added
  }), []);

  // --- KEYBOARD LISTENERS ---
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Toggle on forward slash '/'
      if (e.key === '/' && !isOpen) {
        e.preventDefault();
        setIsOpen(true);
      }
      // Close on Escape
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isOpen]);

  // Auto-focus input when opened
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
    
    // 1. Check basic commands
    const matchingCommand = Object.keys(commands).find(cmd => cmd.startsWith(lowerInput));
    if (matchingCommand && matchingCommand !== lowerInput) {
      setSuggestion(matchingCommand.slice(lowerInput.length));
      return;
    }

    // 2. Check 'visit' command logic
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

    // 3. Check 'run' command logic
    if (lowerInput.startsWith('run ')) {
        const query = lowerInput.replace('run ', '');
        const apps = ['hedging-game']; // Registry of runnable apps
        
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

    // Add to history
    setHistory(prev => [...prev, { type: 'input', content: cmd }]);

    // 1. CLEAR
    if (action === 'clear') {
      setHistory([]);
      return;
    }

    // 2. NAVIGATE (New Logic)
    if (action === 'navigate' || action === 'nav') {
        setIsOpen(false); // Close terminal
        setNavigating(true); // Trigger 3D Mode
        setHistory(prev => [...prev, { type: 'success', content: 'Initiating Neural Link...' }]);
        return;
    }

    // 3. VISIT
    if (action === 'visit' || action === 'cd' || action === 'go') {
      if (!argString) {
        setHistory(prev => [...prev, { type: 'error', content: "Usage: visit [page/project/article]" }]);
        return;
      }

      const match = searchableItems.find(item => item.key.includes(argString));
      
      if (match) {
        setHistory(prev => [...prev, { type: 'success', content: `Navigating to ${match.type}: ${match.key}...` }]);
        setIsOpen(false);
        if (match.type === 'External') {
            window.open(match.path, '_blank');
        } else {
            router.push(match.path);
        }
      } else {
        setHistory(prev => [...prev, { type: 'error', content: `Error: path '${argString}' not found.` }]);
      }
      return;
    }

    // 4. LS (List)
    if (action === 'ls') {
       const output = searchableItems.map(i => `[${i.type}] ${i.key}`).join('\n');
       setHistory(prev => [...prev, { type: 'output', content: output }]);
       return;
    }

    // 5. RUN (Specific Apps)
    if (action === 'run') {
        if (args[0] === 'hedging-game') {
            setIsOpen(false);
            setShowHedgeSim(true);
            setHistory(prev => [...prev, { type: 'success', content: 'Launching Delta Neutral Simulator...' }]);
            return;
        }
    }

    // 6. STANDARD COMMANDS (Help, Date, Whoami, etc.)
    if (action in commands) {
      setHistory(prev => [...prev, { type: 'output', content: commands[action as keyof typeof commands] }]);
      return;
    }

    // 7. UNKNOWN
    setHistory(prev => [...prev, { type: 'error', content: `Command not found: ${action}. Type 'help'.` }]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      // If there is a suggestion and user pressed Enter, autocomplete first? 
      // Typically terminal executes what is typed. 
      // But if they hit Tab, we autocomplete.
      handleCommand(input + (suggestion ? '' : '')); // Just execute input
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
        {/* 1. Render the Simulator if active */}
        {showHedgeSim && <HedgingSimulator onClose={() => setShowHedgeSim(false)} />}
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />

          {/* Terminal Window */}
          <motion.div
            initial={{ y: '-100%' }}
            animate={{ y: '0%' }}
            exit={{ y: '-100%' }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed top-0 left-0 right-0 z-50 w-full bg-slate-900/95 shadow-2xl border-b border-white/10"
          >
            <div className="mx-auto max-w-3xl p-6 font-mono text-sm md:text-base">
              
              {/* Header */}
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

              {/* History Output */}
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

              {/* Input Area */}
              <div className="relative flex items-center group">
                <span className="mr-3 text-emerald-500 font-bold">➜</span>
                <span className="mr-3 text-blue-400 font-bold">~</span>
                
                <div className="relative flex-1">
                  {/* Ghost Text (Suggestion) */}
                  <div className="absolute inset-0 pointer-events-none flex whitespace-pre">
                    <span className="opacity-0">{input}</span>
                    <span className="text-slate-600">{suggestion}</span>
                  </div>

                  {/* Actual Input */}
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