import { Router } from 'express';
import { Routine, User, RoleTemplate } from '../lib/db.js';

const router = Router();

async function getOrCreateRoutine(userId) {
  let doc = await Routine.findOne({ userId });
  if (!doc) {
    const user = await User.findById(userId);
    const roleKey = user?.role || 'upsc';
    const template = await RoleTemplate.findOne({ roleKey });
    
    // Use routine from template
    const data = template?.routine || {};
    
    doc = await Routine.create({ userId, data });
  }
  return doc;
}

router.get('/', async (req, res) => {
  const doc = await getOrCreateRoutine(req.user.id);
  res.json(doc.data);
});

router.put('/', async (req, res) => {
  const doc = await Routine.findOneAndUpdate(
    { userId: req.user.id },
    { data: req.body },
    { upsert: true, new: true }
  );
  res.json(doc.data);
});

export default router;
