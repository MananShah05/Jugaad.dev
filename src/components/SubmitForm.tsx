/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { CATEGORIES, Difficulty } from '../types';
import { Shield, Plus, Terminal, RefreshCw, AlertTriangle, Send } from 'lucide-react';

interface SubmitFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function SubmitForm({ onSuccess, onCancel }: SubmitFormProps) {
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [tags, setTags] = useState('');
  const [submitter, setSubmitter] = useState('');
  const [gotcha, setGotcha] = useState('');
  const [code, setCode] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !summary || !body || !category || !difficulty) {
      setError('Please fill in check parameters: Title, Summary, Body, Category, and Difficulty.');
      return;
    }

    setLoading(true);
    setError('');

    // Parse comma-separated tags
    const parsedTags = tags
      .split(',')
      .map(t => t.trim().toLowerCase().replace('#', ''))
      .filter(t => t.length > 0);

    try {
      const response = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          summary,
          body,
          category,
          tags: parsedTags,
          submitter: submitter || 'Anonymous Hacker',
          difficulty,
          gotcha: gotcha || undefined,
          code: code || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit hack');
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Error occurred during submission.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="bg-brand-surface border border-brand-border p-6 rounded font-mono select-none" id="submit-form">
      <div className="flex items-center gap-2 border-b border-brand-border pb-4 mb-6">
        <Terminal className="text-brand-accent w-5 h-5" />
        <h2 className="text-lg font-display font-medium text-brand-text">
          ~/submit_hack.sh
        </h2>
      </div>

      {success ? (
        <div className="border border-brand-accent/30 bg-brand-accent/5 p-8 text-center rounded">
          <p className="text-brand-accent text-xl font-bold mb-2 font-display">SUBMISSION_REGISTERED_201</p>
          <p className="text-sm text-brand-text/80 max-w-md mx-auto mb-4">
            Thank you! Your hack has been pushed to the review pipeline with status: <span className="text-brand-amber font-bold">PENDING</span>.
          </p>
          <div className="flex justify-center gap-2 text-xs text-brand-muted">
            <span className="animate-spin text-brand-accent mr-1">↻</span>
            <span>Returning to main directory...</span>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="border border-brand-red bg-brand-red/5 p-3 rounded text-xs text-brand-red flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Title & Submitter */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-brand-muted mb-1 font-bold">
                Hack Title * <span className="text-[10px] text-brand-muted lowercase">(max 60 chars)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Host Next.js free Vercel + Neon"
                maxLength={60}
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full bg-brand-bg border border-brand-border text-brand-text rounded px-3 py-2 text-xs focus:border-brand-accent focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-brand-muted mb-1 font-bold">
                Your Submitter Nickname <span className="text-[10px] text-brand-muted lowercase">(will be displayed)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. jugaad_god"
                maxLength={30}
                value={submitter}
                onChange={e => setSubmitter(e.target.value)}
                className="w-full bg-brand-bg border border-brand-border text-brand-text rounded px-3 py-2 text-xs focus:border-brand-accent focus:outline-none"
              />
            </div>
          </div>

          {/* Category & Difficulty */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-brand-muted mb-1 font-bold">
                Category *
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full bg-brand-bg border border-brand-border text-brand-text rounded px-3 py-2 text-xs focus:border-brand-accent focus:outline-none"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-brand-muted mb-1 font-bold">
                Difficulty Level *
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['easy', 'medium', 'cursed'] as Difficulty[]).map(lvl => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setDifficulty(lvl)}
                    className={`py-2 text-xs border uppercase rounded transition-all cursor-pointer ${
                      difficulty === lvl
                        ? lvl === 'easy'
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 font-bold'
                          : lvl === 'medium'
                          ? 'border-amber-500 bg-amber-500/10 text-amber-400 font-bold'
                          : 'border-red-500 bg-red-500/10 text-red-400 font-bold'
                        : 'border-brand-border text-brand-muted hover:border-brand-accent hover:text-brand-text'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Summary */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-brand-muted mb-1 font-bold">
              One-Line Summary / TL;DR * <span className="text-[10px] text-brand-muted lowercase">(max 120 chars)</span>
            </label>
            <input
              type="text"
              placeholder="A continuous 1-sentence tagline describing what this trick saves or replaces."
              maxLength={120}
              required
              value={summary}
              onChange={e => setSummary(e.target.value)}
              className="w-full bg-brand-bg border border-brand-border text-brand-text rounded px-3 py-2 text-xs focus:border-brand-accent focus:outline-none"
            />
          </div>

          {/* Markdown Description */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-brand-muted mb-1 font-bold">
              How it Works / Installation Steps * <span className="text-[10px] text-brand-muted lowercase">(standard markdown format)</span>
            </label>
            <textarea
              placeholder="Provide a thorough, step-by-step description of the hack. Explain how to set it up, how to test it, and what tools are required."
              rows={6}
              required
              value={body}
              onChange={e => setBody(e.target.value)}
              className="w-full bg-brand-bg border border-brand-border text-brand-text rounded px-3 py-2 text-xs focus:border-brand-accent focus:outline-none font-sans"
            />
          </div>

          {/* Code Snippet - Optional */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-brand-muted mb-1 font-bold">
              Code Snippet <span className="text-[10px] text-brand-muted lowercase">(Optional, copyable field code block)</span>
            </label>
            <textarea
              placeholder="// Type your quick code bypass snippet here..."
              rows={4}
              value={code}
              onChange={e => setCode(e.target.value)}
              className="w-full bg-brand-bg border border-brand-border text-brand-text rounded px-3 py-2 text-xs focus:border-brand-accent focus:outline-none font-mono"
            />
          </div>

          {/* Gotcha Callouts - Optional */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-brand-muted mb-1 font-bold">
              Gotchas / Warning Notes <span className="text-[10px] text-brand-muted lowercase">(Optional, critical limits warning block)</span>
            </label>
            <textarea
              placeholder="e.g. Free tier database automatically pauses after 7 days of inactivity."
              rows={2}
              value={gotcha}
              onChange={e => setGotcha(e.target.value)}
              className="w-full bg-brand-bg border border-brand-amber/30 text-brand-text rounded px-3 py-2 text-xs focus:border-brand-amber focus:outline-none font-sans"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-brand-muted mb-1 font-bold">
              Tags <span className="text-[10px] text-brand-muted lowercase">(comma-separated; e.g. vercel, free-tier, nextjs)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. vercel, neon, free-tier"
              value={tags}
              onChange={e => setTags(e.target.value)}
              className="w-full bg-brand-bg border border-brand-border text-brand-text rounded px-3 py-2 text-xs focus:border-brand-accent focus:outline-none"
            />
          </div>

          {/* Action Triggers */}
          <div className="flex justify-end gap-3 pt-4 border-t border-brand-border">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-brand-border text-brand-muted hover:text-brand-text hover:border-brand-text rounded text-xs select-none cursor-pointer"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-brand-accent text-brand-bg border border-brand-accent hover:opacity-85 font-extrabold rounded text-xs flex items-center gap-1.5 cursor-pointer"
              disabled={loading}
            >
              {loading ? (
                <>
                  <RefreshCw className="animate-spin w-4 h-4" />
                  <span>TRANSMITTING...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>SHIP_HACK()</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
