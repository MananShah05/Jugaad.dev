/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Hack, CATEGORIES } from './types';
import TerminalHeader from './components/TerminalHeader';
import HackCard from './components/HackCard';
import SubmitForm from './components/SubmitForm';
import AdminPanel from './components/AdminPanel';
import HackDetailModal from './components/HackDetailModal';
import { Search, Flame, LayoutGrid, Terminal, SlidersHorizontal, Info, Shield, HelpCircle, ChevronRight, X } from 'lucide-react';

export default function App() {
  const [hacks, setHacks] = useState<Hack[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Routing and Modal state
  const [activeView, setActiveView] = useState<'home' | 'hacks' | 'submit' | 'admin'>('home');
  const [activeSlug, setActiveSlug] = useState<string | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Admin access token
  const [adminToken, setAdminToken] = useState<string>(() => localStorage.getItem('jugaad_admin_token') || '');

  // Local Vote tracker
  const [votedHacks, setVotedHacks] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('jugaad_voted_hacks') || '[]');
    } catch {
      return [];
    }
  });

  // Fetch all hacks from backend
  const fetchHacks = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/hacks');
      if (!response.ok) {
        throw new Error('Terminal failed to retrieve data directories');
      }
      const data = await response.json();
      // Sort: Newest created first
      setHacks(data.sort((a: Hack, b: Hack) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (err: any) {
      setError(err.message || 'System connectivity lost.');
    } finally {
      setLoading(false);
    }
  };

  // On Mount: Load hacks & handle Client Deep-linking
  useEffect(() => {
    fetchHacks();

    // Check pathname URL mapping for deep linking e.g. /hacks/slug
    const path = window.location.pathname;
    if (path.includes('/hacks/')) {
      const slug = path.split('/hacks/')[1];
      if (slug) {
        setActiveSlug(slug);
        setActiveView('hacks');
      }
    }

    // Set up popstate event listener for browser history travel
    const handlePopState = () => {
      const currPath = window.location.pathname;
      if (currPath.includes('/hacks/')) {
        const slug = currPath.split('/hacks/')[1];
        setActiveSlug(slug);
      } else {
        setActiveSlug(null);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Update browser address bar during details navigation
  const navigateToHackDetails = (slug: string) => {
    setActiveSlug(slug);
    window.history.pushState(null, '', `/hacks/${slug}`);
  };

  const closeHackDetails = () => {
    setActiveSlug(null);
    window.history.pushState(null, '', '/');
  };

  // Upvote process
  const handleVote = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (votedHacks.includes(id)) return;

    // Optimistic frontend updates
    setHacks(prev =>
      prev.map(h => (h.id === id ? { ...h, upvotes: h.upvotes + 1 } : h))
    );

    // Save to localstate
    const newVotes = [...votedHacks, id];
    setVotedHacks(newVotes);
    localStorage.setItem('jugaad_voted_hacks', JSON.stringify(newVotes));

    try {
      const res = await fetch(`/api/hacks/${id}/vote`, { method: 'POST' });
      if (!res.ok) throw new Error('Syncing failed');
      const data = await res.json();
      
      // Update with authoritative counts
      setHacks(prev =>
        prev.map(h => (h.id === id ? { ...h, upvotes: data.count } : h))
      );
    } catch (err) {
      console.warn("Vote synchronization retry queue triggered in background", err);
    }
  };

  const handleAdminLogin = (token: string) => {
    setAdminToken(token);
    localStorage.setItem('jugaad_admin_token', token);
  };

  const handleAdminLogout = () => {
    setAdminToken('');
    localStorage.removeItem('jugaad_admin_token');
    setActiveView('home');
  };

  // Client-side Filter & search engine (Fuse.js lightweight equivalent)
  const filteredHacks = hacks.filter(hack => {
    // 1. Category check
    if (selectedCategory !== 'ALL' && hack.category !== selectedCategory) return false;

    // 2. Difficulty check
    if (selectedDifficulty !== 'ALL' && hack.difficulty !== selectedDifficulty.toLowerCase()) return false;

    // 3. Status check
    if (selectedStatus !== 'ALL' && hack.status !== selectedStatus.toLowerCase()) return false;

    // 4. Query text search
    if (searchQuery.trim().length > 0) {
      const query = searchQuery.toLowerCase().trim();
      const matchTitle = hack.title.toLowerCase().includes(query);
      const matchSummary = hack.summary.toLowerCase().includes(query);
      const matchBody = hack.body.toLowerCase().includes(query);
      const matchTags = hack.tags.some(t => t.toLowerCase().includes(query));
      const matchCategory = hack.category.toLowerCase().includes(query);
      
      if (!matchTitle && !matchSummary && !matchBody && !matchTags && !matchCategory) {
        return false;
      }
    }

    return true;
  });

  // Featured hacks (top 6 highest upvotes)
  const featuredHacks = [...hacks]
    .filter(h => h.status === 'active')
    .sort((a, b) => b.upvotes - a.upvotes)
    .slice(0, 6);

  // Recent hacks (newest 12 hacks)
  const recentHacks = [...hacks]
    .filter(h => h.status === 'active')
    .slice(0, 12);

  // Find active hack details
  const currentHack = hacks.find(h => h.slug === activeSlug);
  const relatedHacks = currentHack
    ? hacks.filter(h => h.category === currentHack.category && h.id !== currentHack.id)
    : [];

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text flex flex-col font-sans selection:bg-brand-accent selection:text-brand-bg">
      {/* Top Console Bar */}
      <TerminalHeader
        activeView={activeView}
        onViewChange={view => {
          setActiveView(view);
          // Auto scroll to top on nav updates
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        hacksCount={hacks.length}
        isAdmin={!!adminToken}
        onLogoutAdmin={handleAdminLogout}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 md:p-8" id="jugaad-main-stage">
        {error && (
          <div className="border border-brand-red bg-brand-red/5 p-4 rounded text-xs text-brand-red mb-6 flex items-start gap-2 max-w-xl font-mono select-none">
            <X className="w-4 h-4 shrink-0 mt-0.5 cursor-pointer hover:border rounded hover:border-brand-red" onClick={() => setError('')} />
            <div>
              <span className="font-bold uppercase tracking-wider block mb-1">FATAL_CONNECTION_LOST</span>
              <span>{error} Please check if dev servers are running or reload.</span>
            </div>
          </div>
        )}

        {/* LOADING INDICATOR SKELETONS */}
        {loading && hacks.length === 0 ? (
          <div className="space-y-6 font-mono select-none py-12" id="db-load-screen">
            <div className="flex items-center gap-1.5 text-brand-accent justify-center mb-2 animate-pulse text-sm">
              <span className="animate-spin text-brand-accent">⎈</span>
              <span>READING_SYSTEM_DATA_BLOCKS_PLES_WAIT...</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(s => (
                <div key={s} className="border border-brand-border bg-brand-surface p-5 rounded space-y-4 animate-pulse">
                  <div className="h-4 bg-brand-border rounded w-1/3"></div>
                  <div className="h-5 bg-brand-border rounded w-3/4"></div>
                  <div className="h-12 bg-brand-border rounded"></div>
                  <div className="h-8 bg-brand-border rounded w-1/2 mt-4"></div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* VIEW 0: HOME PORTAL */}
            {activeView === 'home' && (
              <div className="space-y-8" id="view-home">
                {/* Bento Grid layout */}
                <div className="grid grid-cols-12 gap-6" id="bento-base-grid">
                  
                  {/* Hero Card Box (col-span-8) */}
                  <section className="col-span-12 lg:col-span-8 border border-brand-border bg-brand-surface p-6 sm:p-8 rounded relative overflow-hidden shadow-[4px_4px_0px_0px_rgba(74,222,128,0.05)] select-none flex flex-col justify-between">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 font-mono text-xs text-brand-accent">
                        <span>$ curl -s https://jugaad.dev/manifest.bin</span>
                        <span className="cursor-blink font-bold text-base leading-none">|</span>
                      </div>
                      
                      <h1 className="text-2xl sm:text-3xl md:text-4xl font-display font-medium tracking-tight text-brand-text">
                        Curated knowledge base of <span className="text-brand-accent font-semibold filter drop-shadow-[0_0_12px_rgba(74,222,128,0.15)]">Indian Developer hacks</span>, workarounds, and zero-budget resource tricks.
                      </h1>

                      <p className="text-sm font-sans text-brand-text/80 leading-relaxed max-w-2xl">
                        Deploying a site at 1am? Payment gateways asking for business KYC you do not have? Low-end mobile devices choking on React bundles? Standard solutions are costly. Find clever, offline-first, ₹0 alternative workarounds built by developers hacking direct solutions.
                      </p>
                    </div>

                    <div className="flex items-center gap-3 pt-6">
                      <button
                        onClick={() => setActiveView('hacks')}
                        className="px-4 py-2.5 bg-brand-accent text-brand-bg font-extrabold font-mono hover:opacity-90 transition-opacity rounded text-xs flex items-center gap-1.5 cursor-pointer select-none"
                      >
                        <SlidersHorizontal className="w-4 h-4" />
                        <span>EXPLORE_CHANNELS()</span>
                      </button>
                      
                      <button
                        onClick={() => setActiveView('submit')}
                        className="px-4 py-2.5 border border-brand-border text-brand-text font-mono hover:border-brand-accent hover:text-brand-accent transition-all rounded text-xs select-none cursor-pointer"
                      >
                        <span>./submit_hack.sh</span>
                      </button>
                    </div>
                  </section>

                  {/* Metric: Current Meta Stats (col-span-4) */}
                  <div className="col-span-12 md:col-span-6 lg:col-span-4 bg-[#151815] border border-brand-border p-6 rounded flex flex-col justify-center items-center text-center shadow-[4px_4px_0px_0px_rgba(74,222,128,0.02)] select-none">
                    <span className="font-mono text-[10px] opacity-40 uppercase mb-2 italic">Current System Meta</span>
                    <div className="text-6xl font-black text-brand-accent mb-1 font-display tracking-tight">
                      {hacks.filter(h => h.status === 'active').length}
                    </div>
                    <div className="font-mono text-xs opacity-70 uppercase tracking-tight">Active Hacks</div>
                    <div className="w-full h-[1px] bg-brand-border my-5"></div>
                    <div className="text-3xl font-bold font-mono text-brand-amber text-shadow-sm">₹0.00</div>
                    <div className="font-mono text-[10px] opacity-70 uppercase mt-1">Core Dev Cost / Mo</div>
                  </div>

                  {/* Channels Sidebar List (col-span-4) */}
                  <div className="col-span-12 md:col-span-6 lg:col-span-4 bg-[#151815] border border-brand-border p-6 rounded flex flex-col justify-between shadow-[4px_4px_0px_0px_rgba(74,222,128,0.02)] select-none">
                    <div>
                      <h4 className="font-mono text-xs opacity-60 uppercase mb-4 tracking-[0.2em] underline underline-offset-4">Directories_</h4>
                      <ul className="space-y-2.5 font-mono text-xs">
                        {CATEGORIES.slice(0, 5).map((cat, idx) => {
                          const count = hacks.filter(h => h.category === cat && h.status === 'active').length;
                          return (
                            <li
                              key={cat}
                              onClick={() => {
                                setSelectedCategory(cat);
                                setActiveView('hacks');
                              }}
                              className="flex justify-between items-center group cursor-pointer hover:text-brand-accent text-brand-text/90 transition-colors py-1 border-b border-brand-border/25 last:border-0"
                            >
                              <span>0{idx + 1}. {cat.toUpperCase()}</span>
                              <span className="text-[10px] opacity-40 group-hover:opacity-100 group-hover:text-brand-accent transition-all">[{count}]</span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                    <div className="mt-6 p-3 border border-dashed border-brand-border flex flex-col gap-1 rounded bg-brand-bg/40">
                      <div className="text-[10px] opacity-40 uppercase font-mono">Channel Activity</div>
                      <div className="text-xs font-bold leading-tight">Contribution Sync Active</div>
                      <div className="h-1 bg-brand-border w-full mt-1.5 rounded-full overflow-hidden">
                        <div className="h-1 bg-brand-accent w-[65%]" style={{ transition: 'width 1s ease-in-out' }}></div>
                      </div>
                    </div>
                  </div>

                  {/* Wide Grid: Submit Hack Workarounds Prompt (col-span-8) */}
                  <div className="col-span-12 lg:col-span-8 bg-[#151815] border border-brand-border p-6 rounded flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-[4px_4px_0px_0px_rgba(74,222,128,0.02)]">
                    <div className="flex-1 space-y-2 select-none">
                      <div className="flex gap-2 font-mono text-[10px]">
                        <span className="px-2 py-0.5 bg-brand-accent/10 text-brand-accent border border-brand-accent/20 rounded">₹0_INFRA</span>
                        <span className="px-2 py-0.5 border border-brand-accent/20 text-brand-amber rounded font-bold">API_HACKS</span>
                      </div>
                      <h2 className="text-xl font-bold font-display tracking-tight text-brand-accent">CORS Anywhere & Zero-Cost Database Workarounds</h2>
                      <p className="text-xs opacity-80 leading-relaxed font-sans">
                        Don't pay for enterprise proxies. Use the server router as a passthrough, scale Neon DB servers past arbitrary inactivity pauses with wake-up crons, and bypass gate-key KYC instantly.
                      </p>
                    </div>
                    <div className="flex flex-col gap-1 w-full md:w-auto shrink-0 font-mono text-center">
                      <button
                        onClick={() => setActiveView('submit')}
                        className="px-5 py-3.5 bg-brand-accent text-brand-bg hover:opacity-90 font-extrabold text-xs transition-opacity rounded cursor-pointer uppercase tracking-wider"
                      >
                        + Submit Jugaad
                      </button>
                    </div>
                  </div>

                </div>

                {/* Featured Section */}
                <section className="space-y-6 select-none" id="featured-grid">
                  <div className="flex items-center justify-between border-b border-brand-border/60 pb-3">
                    <div className="flex items-center gap-2 font-mono text-xs text-brand-accent uppercase font-bold tracking-wider">
                      <Flame className="w-4 h-4 fill-current text-brand-accent" />
                      <span>Trending Hacks [TOP_6_UPVOTED]</span>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedCategory('ALL');
                        setActiveView('hacks');
                      }}
                      className="text-xs font-mono text-brand-muted hover:text-brand-accent flex items-center gap-1 transition-colors select-none cursor-pointer"
                    >
                      <span>all_directories</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {featuredHacks.map(hk => (
                      <HackCard
                        key={hk.id}
                        hack={hk}
                        onViewDetails={navigateToHackDetails}
                        onVote={handleVote}
                        hasVoted={votedHacks.includes(hk.id)}
                      />
                    ))}
                  </div>
                </section>

                {/* Recent Hacks stream */}
                <section className="space-y-6 select-none" id="recent-stream">
                  <div className="flex items-center justify-between border-b border-brand-border/60 pb-3">
                    <div className="flex items-center gap-2 font-mono text-xs text-brand-muted uppercase font-bold tracking-wider">
                      <Terminal className="w-4 h-4 text-brand-accent" />
                      <span>Recently Cached Transactions [NEWEST_COMMUTERS]</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {recentHacks.map(hk => (
                      <HackCard
                        key={hk.id}
                        hack={hk}
                        onViewDetails={navigateToHackDetails}
                        onVote={handleVote}
                        hasVoted={votedHacks.includes(hk.id)}
                      />
                    ))}
                  </div>
                </section>
              </div>
            )}

            {/* VIEW 1: DIRECTORIES SEARCH / EXPLORER PAGE */}
            {activeView === 'hacks' && (
              <div className="space-y-8" id="view-explorer">
                {/* Search controller panel */}
                <section className="border border-brand-border bg-brand-surface p-4 rounded space-y-4 select-none">
                  <div className="flex flex-col md:flex-row gap-3 items-center justify-between font-mono">
                    {/* Free text search */}
                    <div className="relative w-full md:max-w-md">
                      <Search className="absolute left-3 top-2.5 w-4 h-4 text-brand-muted" />
                      <input
                        type="text"
                        placeholder="Search tags, categories, descriptions... [FUSE.js]"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full bg-brand-bg border border-brand-border rounded py-2 pl-9 pr-4 text-xs text-brand-text focus:outline-none focus:border-brand-accent"
                      />
                    </div>

                    {/* Filter states selectors */}
                    <div className="flex flex-wrap items-center gap-2 w-full md:w-auto text-xs">
                      {/* Difficulty filter selection */}
                      <select
                        value={selectedDifficulty}
                        onChange={e => setSelectedDifficulty(e.target.value)}
                        className="bg-brand-bg border border-brand-border p-2 pr-6 rounded text-xs text-brand-text hover:border-brand-accent focus:outline-none cursor-pointer"
                      >
                        <option value="ALL">ANY DIFFICULTY</option>
                        <option value="EASY">EASY DIFFICULTY</option>
                        <option value="MEDIUM">MEDIUM DIFFICULTY</option>
                        <option value="CURSED">CURSED DIFFICULTY</option>
                      </select>

                      {/* Status filter selection */}
                      {adminToken && (
                        <select
                          value={selectedStatus}
                          onChange={e => setSelectedStatus(e.target.value)}
                          className="bg-brand-bg border border-brand-border p-2 pr-6 rounded text-xs text-brand-text focus:outline-none cursor-pointer"
                        >
                          <option value="ALL">ANY HEALTH</option>
                          <option value="ACTIVE">ACTIVE ONLY</option>
                          <option value="DEPRECATED">DEPRECATED ONLY</option>
                          <option value="BROKEN">BROKEN ONLY</option>
                        </select>
                      )}

                      {/* Reset button if filter is present */}
                      {(selectedCategory !== 'ALL' || selectedDifficulty !== 'ALL' || searchQuery.trim().length > 0 || selectedStatus !== 'ALL') && (
                        <button
                          onClick={() => {
                            setSelectedCategory('ALL');
                            setSelectedDifficulty('ALL');
                            setSelectedStatus('ALL');
                            setSearchQuery('');
                          }}
                          className="p-2 border border-brand-red text-brand-red hover:bg-brand-red/15 hover:border-brand-red font-mono rounded text-xs w-full sm:w-auto transition-transform cursor-pointer"
                        >
                          RESET_FILTERS()
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Horizontal Categories slider list */}
                  <div className="border-t border-brand-border/40 pt-3 select-none">
                    <div className="flex items-center gap-1.5 overflow-x-auto whitespace-nowrap pb-2 scrollbar-none">
                      <button
                        onClick={() => setSelectedCategory('ALL')}
                        className={`px-3 py-1.5 border font-mono text-xs cursor-pointer rounded transition-all mr-2 ${
                          selectedCategory === 'ALL'
                            ? 'bg-brand-accent text-brand-bg border-brand-accent font-bold shadow-[0_0_8px_rgba(120,240,120,0.15)]'
                            : 'border-brand-border text-brand-text hover:border-brand-accent'
                        }`}
                      >
                        ALL CHANNELS
                      </button>

                      {CATEGORIES.map(cat => (
                        <button
                          key={cat}
                          onClick={() => setSelectedCategory(cat)}
                          className={`px-3 py-1.5 border font-mono text-xs cursor-pointer rounded transition-all mr-2 ${
                            selectedCategory === cat
                              ? 'bg-brand-accent text-brand-bg border-brand-accent font-bold shadow-[0_0_8px_rgba(120,240,120,0.15)]'
                              : 'border-brand-border text-brand-text hover:border-brand-accent'
                          }`}
                        >
                          {cat.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>
                </section>

                {/* GRID DISPLAY FLOW */}
                {filteredHacks.length === 0 ? (
                  <div className="text-center py-16 border border-dashed border-brand-border bg-brand-surface rounded font-mono select-none">
                    <HelpCircle className="w-12 h-12 text-brand-muted mx-auto mb-4" />
                    <p className="text-brand-text text-sm font-bold mb-1">
                      $ search_results: Empty
                    </p>
                    <p className="text-brand-muted text-xs max-w-md mx-auto leading-relaxed px-4">
                      No matching hack cards verified for search term "{searchQuery}". Try filtering with another channel category or level difficulty.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredHacks.map(hk => (
                      <HackCard
                        key={hk.id}
                        hack={hk}
                        onViewDetails={navigateToHackDetails}
                        onVote={handleVote}
                        hasVoted={votedHacks.includes(hk.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* VIEW 2: SUBMIT FLOW FORM */}
            {activeView === 'submit' && (
              <SubmitForm
                onSuccess={() => {
                  fetchHacks();
                  setActiveView('home');
                }}
                onCancel={() => setActiveView('home')}
              />
            )}

            {/* VIEW 3: ADMIN MODERATION PANEL */}
            {activeView === 'admin' && (
              <AdminPanel
                hacks={hacks}
                onRefresh={fetchHacks}
                adminToken={adminToken}
                onLoginSuccess={handleAdminLogin}
              />
            )}
          </>
        )}
      </main>

      {/* DETAIL DIALOG DRAWER */}
      {activeSlug && currentHack && (
        <HackDetailModal
          hack={currentHack}
          relatedHacks={relatedHacks}
          onClose={closeHackDetails}
          onVote={handleVote}
          hasVoted={votedHacks.includes(currentHack.id)}
          onNavigateToHack={navigateToHackDetails}
        />
      )}

      {/* FOOTER */}
      <footer className="border-t border-brand-border bg-brand-surface py-8 px-4 font-mono select-none mt-12 text-center text-xs text-brand-muted">
        <div className="max-w-7xl mx-auto space-y-3">
          <p className="tracking-wider">
            &gt; Created with pride by community hackathon lovers.
          </p>
          <div className="flex justify-center gap-4 text-[11px]">
            <span>LICENSE: APACHE-2.0</span>
            <span>•</span>
            <span>BUDGET: ₹0_CORE</span>
            <span>•</span>
            <span>WITH LOVE BY MANAN SHAH</span>
            <span>•</span>
            <button
              onClick={() => {
                if (adminToken) {
                  handleAdminLogout();
                } else {
                  setActiveView('admin');
                }
              }}
              className="text-brand-accent hover:underline flex items-center gap-1 cursor-pointer select-none"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>{adminToken ? 'SUDO_LOGOUT' : 'SUDO_LOGIN'}</span>
            </button>
          </div>
          <p className="text-[10px] text-brand-muted/60 lowercase">
            sys.log :: "Ship first. Optimize never."
          </p>
        </div>
      </footer>
    </div>
  );
}
