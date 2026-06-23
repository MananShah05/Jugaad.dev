/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import path from 'path';
import { Hack, Submission, Status, Difficulty } from './types';
import { SEED_HACKS } from './seedData';

// DB File path - inside src directory for persistent workspace access
const DB_PATH = path.join(process.cwd(), 'src', 'jugaad_db_file.json');

interface Schema {
  hacks: Hack[];
  submissions: Submission[];
  voterIPs: { [hackId: string]: string[] }; // Quick store to avoid double upvotes
}

function initDB(): Schema {
  try {
    if (fs.existsSync(DB_PATH)) {
      const content = fs.readFileSync(DB_PATH, 'utf-8');
      const data = JSON.parse(content) as Schema;
      // Safety checking to ensure both lists exist
      if (!data.hacks || !Array.isArray(data.hacks)) data.hacks = [...SEED_HACKS];
      if (!data.submissions || !Array.isArray(data.submissions)) data.submissions = [];
      if (!data.voterIPs) data.voterIPs = {};
      return data;
    }
  } catch (err) {
    console.error("DB Loading failed, falling back to seed", err);
  }

  // Double fallback
  const freshData: Schema = {
    hacks: [...SEED_HACKS],
    submissions: [],
    voterIPs: {}
  };
  saveDB(freshData);
  return freshData;
}

function saveDB(data: Schema) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error("Failed to persist database file", err);
  }
}

export const dbStore = {
  getHacks: (): Hack[] => {
    const db = initDB();
    return db.hacks;
  },

  getHackBySlug: (slug: string): Hack | undefined => {
    const db = initDB();
    return db.hacks.find(h => h.slug === slug);
  },

  upvoteHack: (id: string, voterId: string): { success: boolean; count: number; alreadyVoted: boolean } => {
    const db = initDB();
    const hack = db.hacks.find(h => h.id === id);
    if (!hack) {
      return { success: false, count: 0, alreadyVoted: false };
    }

    if (!db.voterIPs[id]) {
      db.voterIPs[id] = [];
    }

    const voterList = db.voterIPs[id];
    if (voterList.includes(voterId)) {
      return { success: true, count: hack.upvotes, alreadyVoted: true };
    }

    voterList.push(voterId);
    hack.upvotes = (hack.upvotes || 0) + 1;
    saveDB(db);

    return { success: true, count: hack.upvotes, alreadyVoted: false };
  },

  submitHack: (title: string, summary: string, body: string, category: string, tags: string[], submitter: string, difficulty: Difficulty, gotcha?: string, code?: string): Submission => {
    const db = initDB();
    const cleanTags = tags.map(t => t.trim().toLowerCase().replace('#', '')).filter(t => t.length > 0);
    
    const newSubmission: Submission = {
      id: "sub_" + Math.random().toString(36).substr(2, 9),
      title: title.trim(),
      summary: summary.trim(),
      body: body.trim(),
      category: category,
      tags: cleanTags,
      submitter: submitter.trim() || 'Anonymous Jugaadoo',
      difficulty: difficulty,
      gotcha: gotcha?.trim() || undefined,
      code: code?.trim() || undefined,
      createdAt: new Date().toISOString()
    };

    db.submissions.push(newSubmission);
    saveDB(db);
    return newSubmission;
  },

  getSubmissions: (): Submission[] => {
    const db = initDB();
    return db.submissions;
  },

  approveSubmission: (id: string): Hack | null => {
    const db = initDB();
    const subIndex = db.submissions.findIndex(s => s.id === id);
    if (subIndex === -1) return null;

    const sub = db.submissions[subIndex];
    // Remove from submissions
    db.submissions.splice(subIndex, 1);

    // Create custom slug
    const cleanTitle = sub.title.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-');
    const slug = `${cleanTitle}-${Math.random().toString(36).substr(2, 5)}`;

    const newHack: Hack = {
      id: "h_" + Math.random().toString(36).substr(2, 9),
      slug: slug,
      title: sub.title,
      summary: sub.summary,
      body: sub.body,
      category: sub.category,
      tags: sub.tags,
      difficulty: sub.difficulty,
      status: 'active',
      upvotes: 1, // Start with self vote
      author: sub.submitter,
      createdAt: new Date().toISOString(),
      gotcha: sub.gotcha,
      code: sub.code
    };

    db.hacks.push(newHack);
    saveDB(db);
    return newHack;
  },

  rejectSubmission: (id: string): boolean => {
    const db = initDB();
    const sizeB = db.submissions.length;
    db.submissions = db.submissions.filter(s => s.id !== id);
    saveDB(db);
    return db.submissions.length < sizeB;
  },

  updateHackStatus: (id: string, status: Status): Hack | null => {
    const db = initDB();
    const hack = db.hacks.find(h => h.id === id);
    if (!hack) return null;

    hack.status = status;
    saveDB(db);
    return hack;
  },

  deleteHack: (id: string): boolean => {
    const db = initDB();
    const originalLen = db.hacks.length;
    db.hacks = db.hacks.filter(h => h.id !== id);
    saveDB(db);
    return db.hacks.length < originalLen;
  },

  createManualHack: (hack: Omit<Hack, 'id' | 'createdAt' | 'upvotes'>): Hack => {
    const db = initDB();
    
    // Create random id
    const cleanTitle = hack.title.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-');
    const slug = `${cleanTitle}-${Math.random().toString(36).substr(2, 5)}`;

    const newHack: Hack = {
      ...hack,
      id: "h_" + Math.random().toString(36).substr(2, 9),
      slug: slug,
      upvotes: 1,
      createdAt: new Date().toISOString()
    };

    db.hacks.push(newHack);
    saveDB(db);
    return newHack;
  }
};
