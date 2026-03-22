import { Router } from 'express';
import { Syllabus, User, RoleTemplate } from '../lib/db.js';

const router = Router();

async function getOrCreateSyllabus(userId) {
  let doc = await Syllabus.findOne({ userId });
  if (!doc) {
    const user = await User.findById(userId);
    const roleKey = user?.role || 'upsc';
    const template = await RoleTemplate.findOne({ roleKey });
    
    // Use syllabus from template or empty
    const data = template?.syllabus || { papers: [] };
    
    doc = await Syllabus.create({
      userId,
      data
    });
  }
  return doc;
}

router.get('/config', async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const roleKey = user?.role || 'upsc';
    const template = await RoleTemplate.findOne({ roleKey });
    
    if (!template) {
      return res.status(404).json({ error: 'Role configuration not found' });
    }

    res.json({
      role: roleKey,
      labels: template.labels,
      // We don't send the full syllabus/routine here, just UI config
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/', async (req, res) => {
  const doc = await getOrCreateSyllabus(req.user.id);
  res.json(doc.data);
});

router.patch('/topics/:id', async (req, res) => {
  const doc = await getOrCreateSyllabus(req.user.id);
  const { completed } = req.body;

  let found = false;
  for (const paper of doc.data.papers || []) {
    for (const section of paper.sections || []) {
      for (const group of section.topicGroups || []) {
        const topic = (group.topics || []).find(t => t.id === req.params.id);
        if (topic) {
          topic.completed = !!completed;
          found = true;
          break;
        }
      }
      if (found) break;
    }
    if (found) break;
  }

  if (found) {
    doc.markModified('data');
    await doc.save();
    return res.json({ ok: true });
  }
  res.status(404).json({ error: 'Topic not found' });
});

router.get('/stats', async (req, res) => {
  const doc = await getOrCreateSyllabus(req.user.id);
  let total = 0;
  let completed = 0;
  for (const paper of doc.data.papers || []) {
    for (const section of paper.sections || []) {
      for (const group of section.topicGroups || []) {
        for (const t of group.topics || []) {
          total++;
          if (t.completed) completed++;
        }
      }
    }
  }
  res.json({
    total,
    completed,
    left: total - completed,
    percent: total ? Math.round((completed / total) * 100) : 0,
  });
});

export default router;
