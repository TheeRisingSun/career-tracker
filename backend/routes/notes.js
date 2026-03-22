import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { uploadToS3, downloadFromS3 } from '../lib/s3Storage.js';
import { Note } from '../lib/db.js';

const router = Router();
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

function sanitizeFolderName(str, maxLen = 80) {
  if (str == null || String(str).trim() === '') return 'unnamed';
  const s = String(str)
    .replace(/[\/\\:*?"<>|]/g, '_')
    .replace(/\s+/g, ' ')
    .trim();
  return (s.length > maxLen ? s.slice(0, maxLen) : s) || 'unnamed';
}

function safeFileName(original) {
  const base = path.basename(original || 'file');
  const safe = base.replace(/[\/\\:*?"<>|]/g, '_').trim() || 'file';
  const ext = path.extname(safe);
  const name = path.basename(safe, ext) || 'file';
  return `${name}_${Date.now()}${ext}`;
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
});

router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const gsPaper = sanitizeFolderName(req.body?.gsPaper) || 'General';
    const subject = sanitizeFolderName(req.body?.subject);
    const chapter = sanitizeFolderName(req.body?.chapter);
    const topic = sanitizeFolderName(req.body?.topic);

    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const filename = safeFileName(req.file.originalname);
    const s3Key = `uploads/${req.user.id}/notes/${gsPaper}/${subject}/${chapter}/${topic}/${filename}`;
    
    // 1. Upload to S3 (The physical storage)
    await uploadToS3(s3Key, req.file.buffer, req.file.mimetype);

    // 2. Save to DB (The configurable metadata)
    const note = await Note.create({
      userId: req.user.id,
      gsPaper,
      subject,
      chapter,
      topic,
      filename,
      s3Key,
      contentType: req.file.mimetype,
      size: req.file.size
    });

    res.status(201).json({
      ok: true,
      message: 'Note saved and indexed',
      id: note._id,
      path: `${gsPaper}/${subject}/${chapter}/${topic}/${filename}`,
      filename,
      gsPaper,
      subject,
      chapter,
      topic,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/structure', async (req, res) => {
  try {
    // Build tree from DB records (Much faster than S3 scan)
    const notes = await Note.find({ userId: req.user.id });
    
    const tree = {};
    notes.forEach(note => {
      const { gsPaper, subject, chapter, topic, filename } = note;
      
      tree[gsPaper] ??= {};
      tree[gsPaper][subject] ??= {};
      tree[gsPaper][subject][chapter] ??= {};
      tree[gsPaper][subject][chapter][topic] ??= { _files: [] };
      tree[gsPaper][subject][chapter][topic]._files.push(filename);
    });

    res.json(tree);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/content', async (req, res) => {
  try {
    const relativePath = req.query.path;
    if (!relativePath) return res.status(400).json({ error: 'Missing path' });
    
    // Fetch S3 key from DB
    const parts = relativePath.split('/');
    const filename = parts.pop();
    const note = await Note.findOne({ userId: req.user.id, filename });
    
    if (!note) return res.status(404).json({ error: 'Note not found in index' });

    const stream = await downloadFromS3(note.s3Key);
    
    const chunks = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.from(chunk));
    }
    const content = Buffer.concat(chunks).toString('utf-8');
    
    res.json({ content });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/content', async (req, res) => {
  try {
    const { path: relativePath, content } = req.body;
    if (!relativePath) return res.status(400).json({ error: 'Missing path' });
    
    const parts = relativePath.split('/');
    const filename = parts.pop();
    const note = await Note.findOne({ userId: req.user.id, filename });
    
    if (!note) return res.status(404).json({ error: 'Note not found in index' });

    const buffer = Buffer.from(content, 'utf-8');
    await uploadToS3(note.s3Key, buffer, 'text/plain');
    
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/download', async (req, res) => {
  try {
    const relativePath = req.query.path;
    if (!relativePath) return res.status(400).json({ error: 'Missing path' });
    
    const parts = relativePath.split('/');
    const filename = parts.pop();
    const note = await Note.findOne({ userId: req.user.id, filename });
    
    if (!note) return res.status(404).json({ error: 'Note not found in index' });

    const stream = await downloadFromS3(note.s3Key);
    res.setHeader('Content-Disposition', `attachment; filename="${note.filename}"`);
    stream.pipe(res);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
