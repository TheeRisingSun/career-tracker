import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
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

const app = express();
let isConfigured = false;

async function configureApp() {
  if (isConfigured) return app;

  const config = await loadConfig();

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
  isConfigured = true;
  return app;
}

// For Local Development
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  configureApp().then(() => {
    const port = process.env.PORT || 4000;
    app.listen(port, () => {
      console.log(`UPSC Tracker API: http://localhost:${port}`);
    });
  });
}

// Export for Vercel
export default async (req, res) => {
  const handler = await configureApp();
  return handler(req, res);
};
