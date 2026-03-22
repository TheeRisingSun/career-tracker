import { Router } from 'express';
import { Record } from '../lib/db.js';
import { sanitizeString, isValidDateStr } from '../middleware/validate.js';

const router = Router();

router.get('/', async (req, res) => {
  const data = await Record.find({ userId: req.user.id }).sort({ 'content.date': -1, createdAt: -1 });
  // Map back for frontend compatibility if needed, or just return as is
  // The frontend might expect the fields to be top-level. 
  // Let's return them flattened for compatibility.
  res.json(data.map(r => ({
    id: r._id,
    type: r.type,
    ...r.content,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt
  })));
});

router.post('/', async (req, res) => {
  const body = req.body || {};
  const dateStr = body.date || new Date().toISOString().slice(0, 10);
  if (!isValidDateStr(dateStr)) {
    return res.status(400).json({ error: 'Invalid date; use YYYY-MM-DD' });
  }

  const type = body.type === 'mistake' ? 'mistake' : 'test';
  const content = {
    title: sanitizeString(body.title, 500),
    description: sanitizeString(body.description, 5000),
    marks: body.marks != null ? Number(body.marks) : null,
    maxMarks: body.maxMarks != null ? Number(body.maxMarks) : null,
    subject: sanitizeString(body.subject, 200),
    date: dateStr,
  };

  const record = await Record.create({
    userId: req.user.id,
    type,
    content,
  });

  res.status(201).json({
    id: record._id,
    type: record.type,
    ...record.content,
    createdAt: record.createdAt
  });
});

router.patch('/:id', async (req, res) => {
  const record = await Record.findOne({ _id: req.params.id, userId: req.user.id });
  if (!record) return res.status(404).json({ error: 'Not found' });

  const body = req.body || {};
  if (body.date !== undefined && !isValidDateStr(body.date)) {
    return res.status(400).json({ error: 'Invalid date; use YYYY-MM-DD' });
  }

  if (body.type !== undefined) {
    record.type = body.type === 'mistake' ? 'mistake' : 'test';
  }

  const contentUpdates = {
    title: body.title !== undefined ? sanitizeString(body.title, 500) : record.content.title,
    description: body.description !== undefined ? sanitizeString(body.description, 5000) : record.content.description,
    marks: body.marks !== undefined ? (body.marks == null ? null : Number(body.marks)) : record.content.marks,
    maxMarks: body.maxMarks !== undefined ? (body.maxMarks == null ? null : Number(body.maxMarks)) : record.content.maxMarks,
    subject: body.subject !== undefined ? sanitizeString(body.subject, 200) : record.content.subject,
    date: body.date !== undefined ? body.date : record.content.date,
  };

  record.content = contentUpdates;
  await record.save();

  res.json({
    id: record._id,
    type: record.type,
    ...record.content,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt
  });
});

router.delete('/:id', async (req, res) => {
  const result = await Record.deleteOne({ _id: req.params.id, userId: req.user.id });
  if (result.deletedCount === 0) return res.status(404).json({ error: 'Not found' });
  res.status(204).send();
});

export default router;
