/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { dbStore } from './src/dbStore';
import { Difficulty } from './src/types';

// Load environment variables
dotenv.config();

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'jugaad42';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware to support JSON parsing
  app.use(express.json());

  // Log incoming requests in terminal format
  app.use((req, res, next) => {
    console.log(`[\x1b[32mJugaadRouter\x1b[0m] ${req.method} ${req.url}`);
    next();
  });

  // --- API ROUTES ---

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: "TERMINAL_ACTIVE_OK", timestamp: new Date().toISOString() });
  });

  // Get all active/deprecated/broken hacks
  app.get('/api/hacks', (req, res) => {
    try {
      const hacks = dbStore.getHacks();
      res.json(hacks);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch hacks" });
    }
  });

  // Get single hack details
  app.get('/api/hacks/:slug', (req, res) => {
    try {
      const hack = dbStore.getHackBySlug(req.params.slug);
      if (!hack) {
        return res.status(404).json({ error: "Hack not found in database" });
      }
      res.json(hack);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch hack details" });
    }
  });

  // Optimistic upvote trigger
  app.post('/api/hacks/:id/vote', (req, res) => {
    try {
      const hackId = req.params.id;
      // Capture a finger-print to prevent mass voting. 
      // We combine x-forwarded-for or connection remote address, along with user-agent
      const forwardHeader = req.headers['x-forwarded-for'];
      const rawIp = typeof forwardHeader === 'string' ? forwardHeader.split(',')[0] : req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'] || 'anonymous_agent';
      const voterId = `${rawIp || 'unknown_ip'}:${userAgent}`;

      const voteStatus = dbStore.upvoteHack(hackId, voterId);
      res.json(voteStatus);
    } catch (err) {
      res.status(500).json({ error: "Failed to process upvote" });
    }
  });

  // Submit a community hack
  app.post('/api/submissions', (req, res) => {
    try {
      const { title, summary, body, category, tags, submitter, difficulty, gotcha, code } = req.body;
      
      if (!title || !summary || !body || !category || !difficulty) {
        return res.status(400).json({ error: "Required fields are missing" });
      }

      const submission = dbStore.submitHack(
        title,
        summary,
        body,
        category,
        tags || [],
        submitter || 'Anonymous Hacker',
        difficulty as Difficulty,
        gotcha,
        code
      );

      res.status(201).json({ success: true, submission });
    } catch (err) {
      res.status(500).json({ error: "Failed to register submission" });
    }
  });

  // --- ADMIN RESTRICTED API ENPOINTS ---
  // Simple password gating to prevent general vandalism.
  app.use('/api/admin/*', (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (authHeader === `Bearer ${ADMIN_PASSWORD}`) {
      next();
    } else {
      res.status(401).json({ error: "Unauthorized access: Terminal password required." });
    }
  });

  // Verify administrative credentials
  app.get('/api/admin/verify', (req, res) => {
    res.json({ success: true });
  });

  // Get pending community submissions List
  app.get('/api/admin/submissions', (req, res) => {
    try {
      const subs = dbStore.getSubmissions();
      res.json(subs);
    } catch (err) {
      res.status(500).json({ error: "Failed to load submissions" });
    }
  });

  // Approve a pending submission (Promote to live card)
  app.post('/api/admin/submissions/:id/approve', (req, res) => {
    try {
      const approvedHack = dbStore.approveSubmission(req.params.id);
      if (!approvedHack) {
        return res.status(404).json({ error: "Submission ID not found" });
      }
      res.json({ success: true, hack: approvedHack });
    } catch (err) {
      res.status(500).json({ error: "Approval pipeline failed" });
    }
  });

  // Reject/Delete a pending submission
  app.post('/api/admin/submissions/:id/reject', (req, res) => {
    try {
      const success = dbStore.rejectSubmission(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Submission ID not found" });
      }
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Rejection failed" });
    }
  });

  // Create a hack manually/instantly in live cards list
  app.post('/api/admin/hacks', (req, res) => {
    try {
      const newHack = dbStore.createManualHack(req.body);
      res.status(201).json({ success: true, hack: newHack });
    } catch (err) {
      res.status(500).json({ error: "Direct hack creation failed" });
    }
  });

  // Change health status of any hack (active | deprecated | broken)
  app.post('/api/admin/hacks/:id/status', (req, res) => {
    try {
      const { status } = req.body;
      const updated = dbStore.updateHackStatus(req.params.id, status);
      if (!updated) {
        return res.status(404).json({ error: "Hack ID not found" });
      }
      res.json({ success: true, hack: updated });
    } catch (err) {
      res.status(500).json({ error: "Status update failed" });
    }
  });

  // Delete an existing hack permanently
  app.delete('/api/admin/hacks/:id', (req, res) => {
    try {
      const success = dbStore.deleteHack(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Hack ID not found" });
      }
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Deletion failed" });
    }
  });


  // --- VITE MIDDLEWARE SETUP ---

  if (process.env.NODE_ENV !== 'production') {
    // Development server with HMR configurations disabled or customized
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    // Production serving static bundles from /dist builds
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Bind server on host 0.0.0.0 and Port 3000 as strictly mandatory
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`===============================================`);
    console.log(`  🚀 JUGAAD.DEV SERVER ONLINE ON PORT ${PORT}  `);
    console.log(`  Env: ${process.env.NODE_ENV || 'development'} `);
    console.log(`===============================================`);
  });
}

startServer().catch(err => {
  console.error("Critical server bootstrap crash:", err);
});
