import { Router } from 'express';
import { Topic } from '../lib/db.js';

const router = Router();

const defaultSyllabus = [
  { topicId: 'pre', name: 'Prelims - GS Paper 1', total: 100, covered: 0 },
  { topicId: 'pre-csat', name: 'Prelims - CSAT', total: 80, covered: 0 },
  { topicId: 'mains-gs1', name: 'Mains GS 1', total: 250, covered: 0 },
  { topicId: 'mains-gs2', name: 'Mains GS 2', total: 250, covered: 0 },
  { topicId: 'mains-gs3', name: 'Mains GS 3', total: 250, covered: 0 },
  { topicId: 'mains-gs4', name: 'Mains GS 4', total: 250, covered: 0 },
  { topicId: 'essay', name: 'Essay', total: 125, covered: 0 },
  { topicId: 'optional', name: 'Optional Paper', total: 500, covered: 0 },
];

router.get('/', async (req, res) => {
  let topics = await Topic.find({ userId: req.user.id });
  
  if (topics.length === 0) {
    // Initialize for user
    topics = await Promise.all(defaultSyllabus.map(t => Topic.create({
      userId: req.user.id,
      name: t.name,
      status: 'pending',
      data: { topicId: t.topicId, total: t.total, covered: t.covered }
    })));
  }
  
  res.json(topics.map(t => ({
    id: t.data.topicId,
    name: t.name,
    total: t.data.total,
    covered: t.data.covered
  })));
});

router.put('/', async (req, res) => {
  const list = req.body;
  if (!Array.isArray(list)) return res.status(400).json({ error: 'Array required' });
  
  // Replace all topics for user
  await Topic.deleteMany({ userId: req.user.id });
  const topics = await Promise.all(list.map(t => Topic.create({
    userId: req.user.id,
    name: t.name,
    status: 'pending',
    data: { topicId: t.id, total: t.total, covered: t.covered }
  })));
  
  res.json(topics.map(t => ({
    id: t.data.topicId,
    name: t.name,
    total: t.data.total,
    covered: t.data.covered
  })));
});

router.patch('/:id', async (req, res) => {
  const topic = await Topic.findOne({ userId: req.user.id, 'data.topicId': req.params.id });
  if (!topic) return res.status(404).json({ error: 'Not found' });
  
  const { name, total, covered } = req.body || {};
  if (name !== undefined) topic.name = name;
  if (total !== undefined) topic.data.total = Math.max(0, Number(total));
  if (covered !== undefined) topic.data.covered = Math.max(0, Math.min(Number(covered), topic.data.total));
  
  topic.markModified('data');
  await topic.save();
  
  res.json({
    id: topic.data.topicId,
    name: topic.name,
    total: topic.data.total,
    covered: topic.data.covered
  });
});

export default router;
