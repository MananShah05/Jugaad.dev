/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Hack } from '../types';
import { Triangle, Copy, Check, MessageSquare, AlertTriangle, Share2 } from 'lucide-react';

interface HackCardProps {
  key?: any;
  hack: Hack;
  onViewDetails: (slug: string) => void;
  onVote: (id: string, e?: any) => any;
  hasVoted: boolean;
}

export default function HackCard({
  hack,
  onViewDetails,
  onVote,
  hasVoted,
}: HackCardProps) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isVoting, setIsVoting] = useState(false);

  const handleCopyCode = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!hack.code) return;
    navigator.clipboard.writeText(hack.code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleShareLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/hacks/${hack.slug}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleVoteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasVoted || isVoting) return;
    setIsVoting(true);
    onVote(hack.id, e);
    setTimeout(() => setIsVoting(false), 1000);
  };

  // Difficulty badge colors
  const difficultyStyles = {
    easy: 'border-emerald-500/30 text-emerald-400 bg-emerald-950/20',
    medium: 'border-amber-500/30 text-amber-400 bg-amber-950/20',
    cursed: 'border-red-500/30 text-red-400 bg-red-950/20',
  };

  // Status badges
  const statusStyles = {
    active: 'text-brand-accent border-brand-accent/20 bg-brand-accent/5',
    deprecated: 'text-amber-500/70 border-amber-500/20 bg-amber-500/5',
    broken: 'text-red-500/70 border-red-500/20 bg-red-500/5',
  };

  return (
    <article
      onClick={() => onViewDetails(hack.slug)}
      className="group relative border border-brand-border bg-brand-surface p-5 font-mono flex flex-col justify-between transition-all hover:border-brand-accent hover:shadow-[4px_4px_0px_0px_rgba(120,240,120,0.15)] cursor-pointer rounded select-none"
      id={`hack-card-${hack.id}`}
    >
      <div>
        {/* Card Header metadata */}
        <div className="flex items-center justify-between gap-2 text-xs mb-3 text-brand-muted">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-brand-accent border border-brand-accent/20 px-1.5 py-0.5 rounded bg-brand-accent/5 text-[10px]">
              {hack.category.toUpperCase()}
            </span>
            <span className={`border px-1.5 py-0.5 rounded text-[10px] ${difficultyStyles[hack.difficulty]}`}>
              {hack.difficulty.toUpperCase()}
            </span>
            {hack.status !== 'active' && (
              <span className={`border px-1.5 py-0.5 rounded text-[10px] ${statusStyles[hack.status]}`}>
                {hack.status.toUpperCase()}
              </span>
            )}
          </div>
          <span className="text-[10px]">by @{hack.author}</span>
        </div>

        {/* Title */}
        <h3 className="text-base font-display font-medium text-brand-text mb-2 tracking-tight group-hover:text-brand-accent transition-colors line-clamp-2">
          {hack.title}
        </h3>

        {/* Summary */}
        <p className="text-xs text-brand-muted mb-4 line-clamp-3 leading-relaxed">
          {hack.summary}
        </p>

        {/* Code Snippet - Optional */}
        {hack.code && (
          <div className="relative mb-4 bg-brand-bg border border-brand-border/60 p-3 rounded text-[11px] font-mono text-brand-text/90 group/code">
            <div className="absolute right-2 top-2 z-10 flex gap-1opacity-100 opacity-60 md:opacity-0 group-hover/code:opacity-100 transition-opacity">
              <button
                onClick={handleCopyCode}
                className="p-1 rounded bg-brand-surface border border-brand-border hover:border-brand-accent text-brand-muted hover:text-brand-accent transition-all"
                title="Copy snippet"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-brand-accent" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <pre className="overflow-x-auto max-w-full pr-8 py-1 whitespace-pre">
              <code>{hack.code}</code>
            </pre>
          </div>
        )}

        {/* Gotcha Callouts - Optional */}
        {hack.gotcha && (
          <div className="mb-4 flex items-start gap-2 border border-brand-amber/20 bg-brand-amber/5 p-3 rounded text-[11px] text-brand-amber/90">
            <AlertTriangle className="w-4 h-4 shrink-0 text-brand-amber mt-0.5" />
            <div className="leading-normal">
              <span className="font-bold uppercase tracking-wider text-[9px] mr-1">Gotcha:</span>
              <span>{hack.gotcha}</span>
            </div>
          </div>
        )}
      </div>

      {/* Card Footer controls */}
      <div className="mt-2 border-t border-brand-border/40 pt-3 flex items-center justify-between gap-3 text-xs">
        {/* Vote trigger */}
        <button
          onClick={handleVoteClick}
          className={`flex items-center gap-1.5 px-3 py-1 rounded transition-all border ${
            hasVoted
              ? 'bg-brand-accent/20 border-brand-accent text-brand-accent font-bold cursor-default'
              : 'border-brand-border bg-brand-surface hover:border-brand-accent hover:text-brand-accent'
          }`}
          disabled={hasVoted || isVoting}
          title={hasVoted ? "You have voted" : "Upvote hack"}
        >
          <Triangle className={`w-3.5 h-3.5 fill-current ${hasVoted ? 'text-brand-accent' : 'text-brand-muted hover:text-brand-accent'}`} />
          <span>▲</span>
          <span className="font-bold font-mono">{hack.upvotes || 0}</span>
        </button>

        {/* Action icons */}
        <div className="flex items-center gap-2">
          {/* Tag labels */}
          <div className="hidden sm:flex items-center gap-1 overflow-hidden truncate max-w-[150px] mr-1 text-[10px] text-brand-muted">
            {hack.tags.slice(0, 2).map(t => (
              <span key={t}>#{t}</span>
            ))}
          </div>

          <button
            onClick={handleShareLink}
            className="p-1 px-2 border border-brand-border hover:border-brand-accent text-brand-muted hover:text-brand-accent transition-all rounded flex items-center gap-1 text-[11px]"
            title="Copy share link"
          >
            {copiedLink ? (
              <>
                <Check className="w-3 h-3 text-brand-accent animate-pulse" />
                <span className="text-[9px] text-brand-accent">LINKED</span>
              </>
            ) : (
              <>
                <Share2 className="w-3 h-3" />
                <span className="text-[9px]">SHARE</span>
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  );
}
