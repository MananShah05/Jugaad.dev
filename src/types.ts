/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Difficulty = 'easy' | 'medium' | 'cursed';
export type Status = 'active' | 'deprecated' | 'broken';

export interface Hack {
  id: string;
  slug: string;
  title: string;
  summary: string;
  body: string; // Markdown body
  category: string;
  tags: string[];
  difficulty: Difficulty;
  status: Status;
  upvotes: number;
  author: string;
  createdAt: string;
  gotcha?: string;
  code?: string;
}

export interface Submission {
  id: string;
  title: string;
  summary: string;
  body: string;
  category: string;
  tags: string[];
  submitter: string;
  difficulty: Difficulty;
  gotcha?: string;
  code?: string;
  createdAt: string;
}

export const CATEGORIES = [
  '₹0 Infrastructure',
  'API Workarounds',
  'Payment Gateway Jugaad',
  'Mobile / Performance',
  'Interview / Placement',
  'AI / LLM Free Tiers'
] as const;
