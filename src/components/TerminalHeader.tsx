/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Terminal, Shield, Plus, Clock, Cpu, Award } from 'lucide-react';

interface TerminalHeaderProps {
  activeView: 'home' | 'hacks' | 'submit' | 'admin';
  onViewChange: (view: 'home' | 'hacks' | 'submit' | 'admin') => void;
  hacksCount: number;
  isAdmin: boolean;
  onLogoutAdmin: () => void;
}

export default function TerminalHeader({
  activeView,
  onViewChange,
  hacksCount,
  isAdmin,
  onLogoutAdmin,
}: TerminalHeaderProps) {
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('en-US', { hour12: false }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="border-b border-brand-border bg-brand-surface p-4 font-mono select-none" id="terminal-header">
      {/* Top micro-indicators */}
      <div className="flex flex-wrap items-center justify-between text-xs text-brand-muted mb-3 gap-2">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-brand-accent">
            <span className="h-2 w-2 rounded-full bg-brand-accent animate-pulse"></span>
            SYS_ONLINE
          </span>
          <span>•</span>
          <span>SYS_PORT: 3000</span>
          <span>•</span>
          <span>BUDGET: ₹0_CORE</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-brand-text">
            <Clock className="w-3 h-3" />
            <span>IST: {time || '00:00:00'}</span>
          </span>
          <span>•</span>
          <span className="bg-brand-border text-brand-text px-1.5 py-0.5 rounded text-[10px]">
            v1.4.2_LATEST
          </span>
        </div>
      </div>

      {/* Main ASCII logo logo block */}
      <div className="my-6 md:flex items-center justify-between">
        <div>
          <pre className="text-brand-accent text-[8px] sm:text-[10px] md:text-xs leading-none font-bold overflow-x-auto whitespace-pre">
{`   _                            _      _            
  | |_  _ _  ___  ___  ___  _ _| |  __| | ___ __ __ 
 _| || || | / _ |/ _ |/ _ || '_| | / _\` |/ _ \\\\ \ / 
\\\\__/ \\\\_,_| \\\\_, |\\\\_,_|\\\\_,_||_| |_| \\\\__,_|\\\\___/ \\\\_/  
             |__/                                   `}
          </pre>
          <p className="mt-2 text-xs text-brand-muted font-mono tracking-wide">
            &gt; Indian developer hacks, workarounds, and zero-budget engineering.
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex flex-col items-end text-right font-mono text-xs text-brand-text border border-brand-border p-3 rounded bg-brand-bg md:max-w-xs w-full">
          <div className="flex items-center gap-1.5 text-brand-accent mb-1 justify-between w-full">
            <span className="text-brand-muted">CON_STATS:</span>
            <span className="flex items-center gap-1">
              <Cpu className="w-3 h-3" /> STABLE
            </span>
          </div>
          <div className="flex justify-between w-full mb-1">
            <span className="text-brand-muted">TOTAL_HACKS:</span>
            <span>{hacksCount} active</span>
          </div>
          <div className="flex justify-between w-full">
            <span className="text-brand-muted">PROD_STAGE:</span>
            <span>"Ship first. Optimize never."</span>
          </div>
        </div>
      </div>

      {/* Horizontal divider */}
      <div className="text-brand-muted text-[10px] leading-none mb-4 truncate select-none">
        &gt;&gt;&gt;&gt;&gt;&gt;&gt;&gt;&gt;&gt;&gt;&gt;&gt;&gt;&gt;&gt;&gt;&gt;&gt;&gt;&gt;&gt;&gt;&gt;&gt;&gt;&gt;&gt;&gt;&gt;&gt;&gt;&gt;&gt;&gt;&gt;&gt;&gt;&gt;&gt;&gt;&gt;&gt;&gt;&gt;&gt;&gt;&gt;&gt;&gt;&gt;&gt;&gt;&gt;&gt;&gt;&gt;&gt;&gt;&gt;&gt;&gt;&gt;
      </div>

      {/* Terminal Command Navigation links */}
      <div className="flex flex-wrap gap-2 text-sm">
        <button
          onClick={() => onViewChange('home')}
          className={`px-3 py-1.5 border font-mono transition-all flex items-center gap-2 ${
            activeView === 'home'
              ? 'bg-brand-accent text-brand-bg border-brand-accent font-bold'
              : 'border-brand-border text-brand-text hover:border-brand-accent'
          }`}
          id="nav-home"
        >
          <span>[0]</span>
          <span>cat home.txt</span>
        </button>

        <button
          onClick={() => onViewChange('hacks')}
          className={`px-3 py-1.5 border font-mono transition-all flex items-center gap-2 ${
            activeView === 'hacks'
              ? 'bg-brand-accent text-brand-bg border-brand-accent font-bold'
              : 'border-brand-border text-brand-text hover:border-brand-accent'
          }`}
          id="nav-hacks"
        >
          <span>[1]</span>
          <span>ls hacks/</span>
        </button>

        <button
          onClick={() => onViewChange('submit')}
          className={`px-3 py-1.5 border font-mono transition-all flex items-center gap-2 ${
            activeView === 'submit'
              ? 'bg-brand-accent text-brand-bg border-brand-accent font-bold'
              : 'border-brand-border text-brand-text hover:border-brand-accent'
          }`}
          id="nav-submit"
        >
          <Plus className="w-4 h-4" />
          <span>[2]</span>
          <span>./submit_hack.sh</span>
        </button>

        {isAdmin ? (
          <button
            onClick={() => onViewChange('admin')}
            className={`px-3 py-1.5 border font-mono transition-all flex items-center gap-2 ${
              activeView === 'admin'
                ? 'bg-brand-red text-brand-text border-brand-red font-bold'
                : 'border-brand-border text-brand-red hover:border-brand-red'
            }`}
            id="nav-admin"
          >
            <Shield className="w-4 h-4" />
            <span>[3]</span>
            <span>sudo ./review_queue</span>
          </button>
        ) : (
          <button
            onClick={() => onViewChange('admin')}
            className={`px-3 py-1.5 border font-mono transition-all flex items-center gap-2 border-brand-border text-brand-muted hover:text-brand-accent hover:border-brand-accent ${
              activeView === 'admin' ? 'border-brand-accent text-brand-accent' : ''
            }`}
            id="nav-admin-login"
          >
            <Shield className="w-4 h-4" />
            <span>[3]</span>
            <span>sudo login</span>
          </button>
        )}
      </div>
    </header>
  );
}
