import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import { loadConfig } from './config/index.js';
import { connectDB, RoleTemplate } from './lib/db.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { authMiddleware } from './middleware/auth.js';
import { downloadFromS3 } from './lib/s3Storage.js';

import authRouter from './routes/auth.js';
import todosRouter from './routes/todos.js';
import dailyRouter from './routes/daily.js';
import syllabusRouter from './routes/syllabus.js';
import recordsRouter from './routes/records.js';
import dashboardRouter from './routes/dashboard.js';
import notesRouter from './routes/notes.js';
import linksRouter from './routes/links.js';
import boardsRouter from './routes/boards.js';
import routineRouter from './routes/routine.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function startServer() {
  const config = await loadConfig();
  const app = express();

  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cors());
  app.use(express.json());

  // Log requests in dev
  if (config.isDev) {
    app.use((req, res, next) => {
      console.log(`${req.method} ${req.url}`);
      next();
    });
  }

  // Health
  app.get('/api/health', (req, res) => {
    res.json({ ok: true, env: config.env, dataDir: path.join(__dirname, 'data') });
  });

  // Routes
  app.use('/api/auth', authRouter);

  // Protect all other api routes
  app.use('/api/todos', authMiddleware, todosRouter);
  app.use('/api/daily', authMiddleware, dailyRouter);
  app.use('/api/syllabus', authMiddleware, syllabusRouter);
  app.use('/api/records', authMiddleware, recordsRouter);
  app.use('/api/dashboard', authMiddleware, dashboardRouter);
  app.use('/api/notes', authMiddleware, notesRouter);
  app.use('/api/links', authMiddleware, linksRouter);
  app.use('/api/boards', authMiddleware, boardsRouter);
  app.use('/api/routine', authMiddleware, routineRouter);

  // Documentation / Assets (Configurable via DB)
  app.get('/api/docs/roadmap', authMiddleware, async (req, res) => {
    try {
      // Find the roadmap S3 key for this specific user role
      const template = await RoleTemplate.findOne({ roleKey: req.user.role || 'upsc' });
      const s3Key = template?.labels?.roadmapS3Key || 'public/product-manager.pdf';
      
      const stream = await downloadFromS3(s3Key);
      res.setHeader('Content-Type', 'application/pdf');
      stream.pipe(res);
    } catch (err) {
      console.error("Cloud Roadmap Load Error:", err.message);
      res.status(404).json({ error: 'Roadmap reference not found in cloud storage' });
    }
  });

  app.use(notFound);
  app.use(errorHandler);

  await connectDB(config.mongoUri);
  
  app.listen(config.port, () => {
    console.log(`UPSC Tracker API: http://localhost:${config.port} (${config.env})`);
    console.log(`Data: ${path.join(__dirname, 'data')}`);
  });
}

startServer().catch(err => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
