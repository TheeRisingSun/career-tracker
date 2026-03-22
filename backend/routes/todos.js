import { Router } from 'express';
import { Todo } from '../lib/db.js';
import { sanitizeString } from '../middleware/validate.js';

const router = Router();

router.get('/', async (req, res) => {
  const todos = await Todo.find({ userId: req.user.id }).sort({ createdAt: -1 });
  res.json(todos.map(t => ({
    id: t._id,
    text: t.text,
    done: t.done,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt
  })));
});

router.post('/', async (req, res) => {
  const text = sanitizeString(req.body?.text, 2000) || 'New task';
  const item = await Todo.create({
    userId: req.user.id,
    text,
    done: false,
  });
  res.status(201).json({
    id: item._id,
    text: item.text,
    done: item.done,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt
  });
});

router.patch('/:id', async (req, res) => {
  const { text, done } = req.body || {};
  const updates = {};
  if (text !== undefined) updates.text = text;
  if (done !== undefined) updates.done = done;

  const todo = await Todo.findOneAndUpdate(
    { _id: req.params.id, userId: req.user.id },
    updates,
    { new: true }
  );

  if (!todo) return res.status(404).json({ error: 'Not found' });
  res.json({
    id: todo._id,
    text: todo.text,
    done: todo.done,
    createdAt: todo.createdAt,
    updatedAt: todo.updatedAt
  });
});

router.delete('/:id', async (req, res) => {
  const result = await Todo.deleteOne({ _id: req.params.id, userId: req.user.id });
  if (result.deletedCount === 0) return res.status(404).json({ error: 'Not found' });
  res.status(204).send();
});

export default router;
