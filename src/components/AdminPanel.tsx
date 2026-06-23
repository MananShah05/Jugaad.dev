/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Submission, Hack, Difficulty, Status, CATEGORIES } from '../types';
import { ShieldAlert, Trash2, CheckCircle2, XCircle, AlertTriangle, Key, Terminal, RefreshCw } from 'lucide-react';

interface AdminPanelProps {
  hacks: Hack[];
  onRefresh: () => void;
  adminToken: string;
  onLoginSuccess: (token: string) => void;
}

export default function AdminPanel({
  hacks,
  onRefresh,
  adminToken,
  onLoginSuccess,
}: AdminPanelProps) {
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loadingSubs, setLoadingSubs] = useState(false);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  // Manual hack creation form fields
  const [manTitle, setManTitle] = useState('');
  const [manSummary, setManSummary] = useState('');
  const [manBody, setManBody] = useState('');
  const [manCategory, setManCategory] = useState<string>(CATEGORIES[0]);
  const [manDifficulty, setManDifficulty] = useState<Difficulty>('easy');
  const [manGotcha, setManGotcha] = useState('');
  const [manCode, setManCode] = useState('');
  const [manTags, setManTags] = useState('');
  const [manAuthor, setManAuthor] = useState('');
  const [creatingHack, setCreatingHack] = useState(false);

  useEffect(() => {
    if (adminToken) {
      loadSubmissions();
    }
  }, [adminToken]);

  const loadSubmissions = async () => {
    setLoadingSubs(true);
    setActionError('');
    try {
      const res = await fetch('/api/admin/submissions', {
        headers: { 'Authorization': `Bearer ${adminToken}` },
      });
      if (!res.ok) {
        throw new Error('Failed to retrieve submissions queue');
      }
      const data = await res.json();
      setSubmissions(data);
    } catch (err: any) {
      setActionError(err.message || 'Error occurred while loading submissions.');
    } finally {
      setLoadingSubs(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    try {
      const res = await fetch('/api/admin/verify', {
        headers: { 'Authorization': `Bearer ${password}` }
      });
      if (res.ok) {
        onLoginSuccess(password);
      } else {
        const data = await res.json();
        setLoginError(data.error || 'ACCESS_DENIED: SHA256 verification failed.');
      }
    } catch (err) {
      setLoginError('ERR: Authentication node unreachable.');
    }
  };

  const approveSubmission = async (id: string) => {
    setActionError('');
    setActionSuccess('');
    try {
      const res = await fetch(`/api/admin/submissions/${id}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
      });
      if (!res.ok) throw new Error('Failed to approve submission');
      
      setActionSuccess('Submission approved! Promoted to active card.');
      loadSubmissions();
      onRefresh();
    } catch (err: any) {
      setActionError(err.message || 'Approve pipeline failed');
    }
  };

  const rejectSubmission = async (id: string) => {
    setActionError('');
    setActionSuccess('');
    try {
      const res = await fetch(`/api/admin/submissions/${id}/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
      });
      if (!res.ok) throw new Error('Failed to reject submission');
      
      setActionSuccess('Submission deleted from pending queue.');
      loadSubmissions();
    } catch (err: any) {
      setActionError(err.message || 'Reject pipeline failed');
    }
  };

  const handleStatusChange = async (id: string, newStatus: Status) => {
    setActionError('');
    setActionSuccess('');
    try {
      const res = await fetch(`/api/admin/hacks/${id}/status`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Failed to update status');
      
      setActionSuccess('Status parameter altered live.');
      onRefresh();
    } catch (err: any) {
      setActionError(err.message || 'Status update failed.');
    }
  };

  const handleDeleteHack = async (id: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this hack card?")) return;
    setActionError('');
    setActionSuccess('');
    try {
      const res = await fetch(`/api/admin/hacks/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${adminToken}` },
      });
      if (!res.ok) throw new Error('Failed to delete hack card');
      
      setActionSuccess('Hack deleted permanently.');
      onRefresh();
    } catch (err: any) {
      setActionError(err.message || 'Deletion failed.');
    }
  };

  const handleCreateHackDirectly = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manTitle || !manSummary || !manBody || !manCategory || !manDifficulty) {
      setActionError('Title, Summary, Body, Category and Difficulty are required.');
      return;
    }

    setCreatingHack(true);
    setActionError('');
    setActionSuccess('');

    try {
      const cleanTags = manTags
        .split(',')
        .map(t => t.trim().toLowerCase().replace('#', ''))
        .filter(t => t.length > 0);

      const res = await fetch('/api/admin/hacks', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: manTitle,
          summary: manSummary,
          body: manBody,
          category: manCategory,
          difficulty: manDifficulty,
          gotcha: manGotcha || undefined,
          code: manCode || undefined,
          tags: cleanTags,
          author: manAuthor || 'jugaad_staff',
          status: 'active',
        }),
      });

      if (!res.ok) throw new Error('Direct creation failing.');

      setActionSuccess('Direct hack card spawned successfully!');
      
      // Reset form
      setManTitle('');
      setManSummary('');
      setManBody('');
      setManGotcha('');
      setManCode('');
      setManTags('');
      setManAuthor('');

      onRefresh();
    } catch (err: any) {
      setActionError(err.message || 'Direct spawn crashed.');
    } finally {
      setCreatingHack(false);
    }
  };


  // --- PASSWORD LOCK GATE ---
  if (!adminToken) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 border border-brand-border bg-brand-surface rounded font-mono select-none" id="admin-pass-gate font-sans">
        <div className="flex items-center gap-2 text-brand-red mb-4 justify-center">
          <ShieldAlert className="w-6 h-6" />
          <h2 className="text-md font-display font-bold">ROOT_SUDO_ACCESS</h2>
        </div>
        <p className="text-xs text-brand-muted text-center mb-6 leading-relaxed">
          This operation is restricted to system administrators. Input password to access review queues and card statuses.
        </p>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-[10px] uppercase text-brand-muted mb-1 font-bold">
              ADMINISTRATIVE PASSWORD
            </label>
            <div className="relative">
              <Key className="absolute left-3 top-2.5 w-4 h-4 text-brand-muted" />
              <input
                type="password"
                placeholder="••••••••"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-brand-bg border border-brand-border rounded py-2 pl-9 pr-3 text-xs text-brand-text focus:outline-none focus:border-brand-red"
              />
            </div>
          </div>

          {loginError && (
            <p className="text-[10px] text-brand-red font-bold text-center mt-1">
              ERR: {loginError}
            </p>
          )}

          <button
            type="submit"
            className="w-full bg-brand-red text-brand-text border border-brand-red py-2 hover:opacity-85 rounded text-xs font-extrabold cursor-pointer"
          >
            EXECUTE_ROOT_AUTH()
          </button>
        </form>
      </div>
    );
  }

  // --- LOGGED IN CONTROLS ---
  return (
    <div className="space-y-8 font-mono select-none" id="admin-dashboard-panel">
      {/* Feedback Banner */}
      {(actionError || actionSuccess) && (
        <div className="sticky top-4 z-40 space-y-2">
          {actionError && (
            <div className="border border-brand-red bg-brand-red/10 p-3 rounded text-xs text-brand-red flex items-center justify-between">
              <span>ERR: {actionError}</span>
              <button onClick={() => setActionError('')} className="p-1 hover:text-brand-text">×</button>
            </div>
          )}
          {actionSuccess && (
            <div className="border border-brand-accent bg-brand-accent/10 p-3 rounded text-xs text-brand-accent flex items-center justify-between">
              <span>OK_STATUS: {actionSuccess}</span>
              <button onClick={() => setActionSuccess('')} className="p-1 hover:text-brand-text">×</button>
            </div>
          )}
        </div>
      )}

      {/* Grid layouts for Review and Direct Creation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Pending Submission Queue */}
        <div className="lg:col-span-7 space-y-6">
          <div className="border border-brand-border p-5 rounded bg-brand-surface">
            <div className="flex items-center justify-between border-b border-brand-border pb-3 mb-4">
              <h3 className="text-sm font-bold font-display uppercase tracking-wider text-brand-amber flex items-center gap-2">
                <Terminal className="w-4 h-4 text-brand-amber" />
                Moderation Queue ({submissions.length})
              </h3>
              <button
                onClick={loadSubmissions}
                className="p-1 hover:text-brand-accent text-brand-muted transition-all"
                title="Refresh queue"
                disabled={loadingSubs}
              >
                <RefreshCw className={`w-4 h-4 ${loadingSubs ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {loadingSubs ? (
              <div className="text-center py-6 text-xs text-brand-muted animate-pulse">
                QUERYING_DATABASE_PLES_WAIT...
              </div>
            ) : submissions.length === 0 ? (
              <div className="text-center py-8 border border-dashed border-brand-border text-brand-muted rounded text-xs">
                No currently pending community submissions. Queue verified clean.
              </div>
            ) : (
              <div className="space-y-4">
                {submissions.map(sub => (
                  <div key={sub.id} className="border border-brand-border p-4 rounded bg-brand-bg space-y-2">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h4 className="text-xs font-bold text-brand-text underline">{sub.title}</h4>
                        <span className="text-[10px] text-brand-muted block">
                          by @{sub.submitter} • {sub.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => approveSubmission(sub.id)}
                          className="p-1 text-emerald-400 border border-emerald-500/20 bg-emerald-950/20 rounded hover:border-emerald-500 transition-all cursor-pointer"
                          title="Approve & Publish"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => rejectSubmission(sub.id)}
                          className="p-1 text-red-400 border border-red-500/20 bg-red-950/20 rounded hover:border-red-500 transition-all cursor-pointer"
                          title="Reject / Trash"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <p className="text-[11px] text-brand-text/85 italic bg-brand-surface p-2 border border-brand-border rounded">
                      "{sub.summary}"
                    </p>
                    <div className="text-[10px] text-brand-muted max-h-24 overflow-y-auto font-sans p-1">
                      {sub.body}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Direct Creater Console */}
        <div className="lg:col-span-5 space-y-6">
          <div className="border border-brand-border p-5 rounded bg-brand-surface">
            <h3 className="text-sm font-bold font-display uppercase tracking-wider text-brand-accent border-b border-brand-border pb-3 mb-4">
              Direct Spawn Generator
            </h3>

            <form onSubmit={handleCreateHackDirectly} className="space-y-3">
              <div>
                <label className="block text-[10px] text-brand-muted uppercase font-bold">Hack Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Free dynamic database sync"
                  value={manTitle}
                  onChange={e => setManTitle(e.target.value)}
                  className="w-full bg-brand-bg border border-brand-border rounded p-2 text-xs text-brand-text focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-brand-muted uppercase font-bold">Category *</label>
                  <select
                    value={manCategory}
                    onChange={e => setManCategory(e.target.value)}
                    className="w-full bg-brand-bg border border-brand-border rounded p-2 text-xs text-brand-text focus:outline-none"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-brand-muted uppercase font-bold">Difficulty *</label>
                  <select
                    value={manDifficulty}
                    onChange={e => setManDifficulty(e.target.value as Difficulty)}
                    className="w-full bg-brand-bg border border-brand-border rounded p-2 text-xs text-brand-text focus:outline-none font-mono"
                  >
                    <option value="easy">EASY</option>
                    <option value="medium">MEDIUM</option>
                    <option value="cursed">CURSED</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-brand-muted uppercase font-bold">Summary / TL;DR *</label>
                <input
                  type="text"
                  required
                  placeholder="1-sentence summarizing the hack."
                  maxLength={120}
                  value={manSummary}
                  onChange={e => setManSummary(e.target.value)}
                  className="w-full bg-brand-bg border border-brand-border rounded p-2 text-xs text-brand-text focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] text-brand-muted uppercase font-bold">Markdown Body *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Installation steps in md..."
                  value={manBody}
                  onChange={e => setManBody(e.target.value)}
                  className="w-full bg-brand-bg border border-brand-border rounded p-2 text-xs text-brand-text focus:outline-none font-sans"
                />
              </div>

              <div>
                <label className="block text-[10px] text-brand-muted uppercase font-bold">Code snippet</label>
                <textarea
                  rows={2}
                  placeholder="Snippet..."
                  value={manCode}
                  onChange={e => setManCode(e.target.value)}
                  className="w-full bg-brand-bg border border-brand-border rounded p-2 text-xs text-brand-text focus:outline-none font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-brand-muted uppercase font-bold">Tags (CSV)</label>
                  <input
                    type="text"
                    placeholder="tag1, tag2"
                    value={manTags}
                    onChange={e => setManTags(e.target.value)}
                    className="w-full bg-brand-bg border border-brand-border rounded p-2 text-xs text-brand-text focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-brand-muted uppercase font-bold font-mono">Author</label>
                  <input
                    type="text"
                    placeholder="jugaad_staff"
                    value={manAuthor}
                    onChange={e => setManAuthor(e.target.value)}
                    className="w-full bg-brand-bg border border-brand-border rounded p-2 text-xs text-brand-text focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={creatingHack}
                className="w-full bg-brand-accent text-brand-bg font-extrabold py-2 border border-brand-accent hover:opacity-85 rounded text-xs select-none mt-2 cursor-pointer"
              >
                {creatingHack ? 'SPAWNING_INSTANCE...' : 'SPAWN_CARD_LIVE()'}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Row 2: Live Hack Status Editor Table */}
      <div className="border border-brand-border p-5 rounded bg-brand-surface">
        <h3 className="text-sm font-bold font-display uppercase tracking-wider text-brand-text border-b border-brand-border pb-3 mb-4">
          Interactive Card Controller Panel
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-brand-border/60 text-brand-muted">
                <th className="py-2.5">TITLE & CATEGORY</th>
                <th className="py-2.5">DIFFICULTY</th>
                <th className="py-2.5">HEALTH STATUS</th>
                <th className="py-2.5">UPVOTES</th>
                <th className="py-2.5 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border/40">
              {hacks.map(hk => (
                <tr key={hk.id} className="hover:bg-brand-bg/60">
                  <td className="py-3 pr-4">
                    <span className="font-bold text-brand-text block">{hk.title}</span>
                    <span className="text-[10px] text-brand-muted">{hk.category}</span>
                  </td>
                  <td className="py-3 uppercase font-bold pr-4">
                    <span className={
                      hk.difficulty === 'easy' ? 'text-emerald-400' :
                      hk.difficulty === 'medium' ? 'text-amber-400' : 'text-red-400'
                    }>
                      {hk.difficulty}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    <select
                      value={hk.status}
                      onChange={e => handleStatusChange(hk.id, e.target.value as Status)}
                      className="bg-brand-bg border border-brand-border rounded p-1 text-[11px] text-brand-text focus:outline-none uppercase font-bold"
                    >
                      <option value="active">Active</option>
                      <option value="deprecated">Deprecated</option>
                      <option value="broken">Broken</option>
                    </select>
                  </td>
                  <td className="py-3 font-bold pr-4">▲ {hk.upvotes}</td>
                  <td className="py-3 text-right">
                    <button
                      onClick={() => handleDeleteHack(hk.id)}
                      className="p-1 px-2 border border-brand-red/30 hover:border-brand-red text-brand-red font-bold rounded hover:bg-brand-red/10 transition-all cursor-pointer"
                      title="Delete card permanently"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
