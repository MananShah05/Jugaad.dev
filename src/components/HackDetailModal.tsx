/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Hack } from '../types';
import { parseMarkdownToHtml } from '../lib/markdown';
import { X, Triangle, Copy, Check, AlertTriangle, Share2, ArrowLeft } from 'lucide-react';

interface HackDetailModalProps {
  hack: Hack;
  relatedHacks: Hack[];
  onClose: () => void;
  onVote: (id: string) => void;
  hasVoted: boolean;
  onNavigateToHack: (slug: string) => void;
}

export default function HackDetailModal({
  hack,
  relatedHacks,
  onClose,
  onVote,
  hasVoted,
  onNavigateToHack,
}: HackDetailModalProps) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopyCode = () => {
    if (!hack.code) return;
    navigator.clipboard.writeText(hack.code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleShareLink = () => {
    const shareUrl = `${window.location.origin}/hacks/${hack.slug}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const bodyHtml = parseMarkdownToHtml(hack.body);

  // Difficulty badge colors
  const difficultyStyles = {
    easy: 'border-emerald-500/30 text-emerald-400 bg-emerald-950/20',
    medium: 'border-amber-500/30 text-amber-400 bg-amber-950/20',
    cursed: 'border-red-500/30 text-red-400 bg-red-950/20',
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-brand-bg/95 backdrop-blur-sm flex items-center justify-center p-4 md:p-6 overflow-y-auto select-none"
      id="hack-detail-dialog"
    >
      <div className="bg-brand-surface border border-brand-border rounded max-w-3xl w-full max-h-[90vh] flex flex-col font-mono shadow-[8px_8px_0px_0px_rgba(120,240,120,0.1)]">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-brand-border p-4 bg-brand-surface">
          <button
            onClick={onClose}
            className="flex items-center gap-1 text-xs text-brand-muted hover:text-brand-accent cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>cd ..</span>
          </button>
          <span className="text-xs text-brand-muted font-bold truncate">~/hacks/{hack.slug}.md</span>
          <button
            onClick={onClose}
            className="p-1 hover:text-brand-accent text-brand-muted transition-all cursor-pointer rounded border border-transparent hover:border-brand-border"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content Scroll Area */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Metadata Grid */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-[10px] sm:text-xs">
              <span className="text-brand-accent border border-brand-accent/20 px-2 py-0.5 rounded bg-brand-accent/5">
                {hack.category.toUpperCase()}
              </span>
              <span className={`border px-2 py-0.5 rounded ${difficultyStyles[hack.difficulty]}`}>
                {hack.difficulty.toUpperCase()}
              </span>
              <span className="text-brand-muted">by @{hack.author}</span>
              <span className="text-brand-muted">•</span>
              <span className="text-brand-muted">{new Date(hack.createdAt).toLocaleDateString()}</span>
            </div>

            <h1 className="text-xl sm:text-2xl font-display font-medium text-brand-text tracking-tight border-b border-brand-border/40 pb-3">
              {hack.title}
            </h1>
          </div>

          {/* Intro Summary Line */}
          <p className="text-sm text-brand-text/80 italic leading-relaxed pl-3 border-l-2 border-brand-accent bg-brand-bg/40 p-3 rounded">
            "{hack.summary}"
          </p>

          {/* Compiled Markdown Body Content */}
          <div className="markdown-body text-xs leading-relaxed space-y-4 font-sans select-text">
            <div dangerouslySetInnerHTML={{ __html: bodyHtml }} />
          </div>

          {/* Embedded Code Snippet Section */}
          {hack.code && (
            <div className="space-y-2 mt-4">
              <div className="flex items-center justify-between text-xs text-brand-muted">
                <span>[source_code.sh]</span>
                <button
                  onClick={handleCopyCode}
                  className="flex items-center gap-1 text-[11px] px-2 py-1 border border-brand-border hover:border-brand-accent text-brand-text hover:text-brand-accent rounded transition-all cursor-pointer"
                >
                  {copiedCode ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-brand-accent" />
                      <span>COPIED</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>COPY CODE</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-4 bg-brand-bg border border-brand-border rounded text-[11px] font-mono text-brand-text/95 overflow-x-auto select-text whitespace-pre">
                <code>{hack.code}</code>
              </pre>
            </div>
          )}

          {/* Embedded Gotcha warning field */}
          {hack.gotcha && (
            <div className="border border-brand-amber/30 bg-brand-amber/5 p-4 rounded text-xs text-brand-amber/95 leading-relaxed">
              <div className="flex items-center gap-2 mb-1.5 text-brand-amber font-display font-bold text-xs uppercase tracking-wider">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Critical Gotcha Limit Alert</span>
              </div>
              <p className="font-sans pl-6">{hack.gotcha}</p>
            </div>
          )}

          {/* Sharing and Voting controllers */}
          <div className="border-t border-brand-border/40 pt-4 flex flex-wrap items-center justify-between gap-4">
            <button
              onClick={() => { if (!hasVoted) onVote(hack.id); }}
              className={`flex items-center gap-2 px-4 py-2 border rounded text-xs select-none ${
                hasVoted
                  ? 'bg-brand-accent/20 border-brand-accent text-brand-accent font-bold cursor-default'
                  : 'border-brand-border hover:border-brand-accent hover:text-brand-accent cursor-pointer'
              }`}
              disabled={hasVoted}
            >
              <Triangle className={`w-3.5 h-3.5 fill-current ${hasVoted ? 'text-brand-accent' : 'text-brand-muted hover:text-brand-accent'}`} />
              <span>UPVOTE HACK</span>
              <span className="font-bold">•</span>
              <span>{hack.upvotes}</span>
            </button>

            <button
              onClick={handleShareLink}
              className="flex items-center gap-1.5 px-3 py-2 border border-brand-border hover:border-brand-accent text-brand-muted hover:text-brand-accent rounded text-xs select-none cursor-pointer"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-brand-accent" />
                  <span className="text-brand-accent font-bold uppercase text-[10px]">Copied to Clipboard!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5" />
                  <span>SHARE INDEX LINK</span>
                </>
              )}
            </button>
          </div>

          {/* Related Category Hacks carousel list */}
          {relatedHacks.length > 0 && (
            <div className="border-t border-brand-border/40 pt-5 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-brand-muted">
                System recommendations from "{hack.category}"
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {relatedHacks.slice(0, 2).map(r => (
                  <div
                    key={r.id}
                    onClick={() => onNavigateToHack(r.slug)}
                    className="border border-brand-border p-3 rounded bg-brand-bg hover:border-brand-accent cursor-pointer transition-colors"
                  >
                    <span className="text-[9px] text-brand-accent uppercase font-bold tracking-wider">{r.category}</span>
                    <h5 className="text-[11px] font-bold text-brand-text truncate mb-1">{r.title}</h5>
                    <p className="text-[10px] text-brand-muted line-clamp-1">{r.summary}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
