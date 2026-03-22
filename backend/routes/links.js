import { Router } from 'express';
import { Link } from '../lib/db.js';
import { requireBodyFields, sanitizeString } from '../middleware/validate.js';

const router = Router();

function normalizeLinkPayload(body) {
  const gsPaper = sanitizeString(body.gsPaper || 'General', 128);
  const subject = sanitizeString(body.subject, 120);
  const chapter = sanitizeString(body.chapter, 120);
  const topic = sanitizeString(body.topic, 120);
  const url = sanitizeString(body.url, 2048);
  const title = sanitizeString(body.title || url, 256);

  let safeUrl = url;
  if (!/^https?:\/\//i.test(safeUrl)) {
    safeUrl = `https://${safeUrl}`;
  }

  return { gsPaper, subject, chapter, topic, url: safeUrl, title };
}

router.get('/', async (req, res) => {
  const links = await Link.find({ userId: req.user.id }).sort({ createdAt: -1 });
  res.json(links.map(l => ({
    id: l._id,
    title: l.title,
    url: l.url,
    gsPaper: l.category, // Backend uses 'category' field for the paper/category key
    ...l.data,
    createdAt: l.createdAt
  })));
});

router.post('/', requireBodyFields(['subject', 'chapter', 'topic', 'url']), async (req, res) => {
  const payload = normalizeLinkPayload(req.body);

  const link = await Link.create({
    userId: req.user.id,
    title: payload.title,
    url: payload.url,
    category: payload.gsPaper,
    data: {
      subject: payload.subject,
      chapter: payload.chapter,
      topic: payload.topic,
    }
  });

  res.status(201).json({
    id: link._id,
    title: link.title,
    url: link.url,
    gsPaper: link.category,
    ...link.data,
    createdAt: link.createdAt
  });
});

router.delete('/:id', async (req, res) => {
  const result = await Link.deleteOne({ _id: req.params.id, userId: req.user.id });
  if (result.deletedCount === 0) return res.status(404).json({ error: 'Link not found' });
  res.status(204).end();
});

router.get('/gs-papers', (req, res) => {
  // Return empty as it's now dynamic from the roadmap
  res.json([]);
});

export default router;
