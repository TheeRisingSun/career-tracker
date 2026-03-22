import { Router } from 'express';
import { Board } from '../lib/db.js';
import { requireBodyFields, sanitizeString } from '../middleware/validate.js';

const router = Router();

function normalizeBoardPayload(body) {
  const name = sanitizeString(body.name || 'Untitled board', 200);
  const description = sanitizeString(body.description || '', 1000);
  const gsPaper = sanitizeString(body.gsPaper || 'Prelims-GS', 100);
  const subject = sanitizeString(body.subject || 'General', 200);
  const chapter = sanitizeString(body.chapter || 'Misc', 200);
  const topic = sanitizeString(body.topic || 'General', 200);
  const data = body.data && typeof body.data === 'object' ? body.data : null;
  return { name, description, gsPaper, subject, chapter, topic, canvasData: data };
}

router.get('/', async (req, res) => {
  const boards = await Board.find({ userId: req.user.id }).select('-data.canvasData');
  res.json(boards.map(b => ({
    id: b._id,
    name: b.name,
    ...b.data,
    createdAt: b.createdAt,
    updatedAt: b.updatedAt
  })));
});

router.get('/:id', async (req, res) => {
  const board = await Board.findOne({ _id: req.params.id, userId: req.user.id });
  if (!board) {
    return res.status(404).json({ error: 'Board not found' });
  }
  res.json({
    id: board._id,
    name: board.name,
    ...board.data,
    data: board.data.canvasData, // Return canvas data as 'data' field for frontend
    createdAt: board.createdAt,
    updatedAt: board.updatedAt
  });
});

router.post('/', requireBodyFields(['name', 'data']), async (req, res) => {
  const payload = normalizeBoardPayload(req.body);
  
  const board = await Board.create({
    userId: req.user.id,
    name: payload.name,
    data: {
      description: payload.description,
      gsPaper: payload.gsPaper,
      subject: payload.subject,
      chapter: payload.chapter,
      topic: payload.topic,
      canvasData: payload.canvasData
    }
  });

  res.status(201).json({
    id: board._id,
    name: board.name,
    ...board.data,
    data: board.data.canvasData,
    createdAt: board.createdAt,
    updatedAt: board.updatedAt
  });
});

router.patch('/:id', async (req, res) => {
  const board = await Board.findOne({ _id: req.params.id, userId: req.user.id });
  if (!board) {
    return res.status(404).json({ error: 'Board not found' });
  }

  const payload = normalizeBoardPayload({
    ...board.name,
    ...board.data,
    data: board.data.canvasData,
    ...req.body,
  });

  board.name = payload.name;
  board.data = {
    description: payload.description,
    gsPaper: payload.gsPaper,
    subject: payload.subject,
    chapter: payload.chapter,
    topic: payload.topic,
    canvasData: payload.canvasData
  };

  await board.save();

  res.json({
    id: board._id,
    name: board.name,
    ...board.data,
    data: board.data.canvasData,
    createdAt: board.createdAt,
    updatedAt: board.updatedAt
  });
});

router.delete('/:id', async (req, res) => {
  const result = await Board.deleteOne({ _id: req.params.id, userId: req.user.id });
  if (result.deletedCount === 0) {
    return res.status(404).json({ error: 'Board not found' });
  }
  res.status(204).end();
});

export default router;
