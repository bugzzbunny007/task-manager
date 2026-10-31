const express = require('express');
const Task = require('../models/Task');
const router = express.Router();

// Only these fields can be written by clients (prevents mass-assignment of _id, timestamps, etc.)
const pick = (body) => {
  const out = {};
  for (const k of ['title', 'description', 'status', 'priority', 'dueDate']) {
    if (body[k] !== undefined) out[k] = body[k];
  }
  return out;
};

// GET /api/tasks?status=todo&q=report
router.get('/', async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.q) filter.title = { $regex: String(req.query.q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
    res.json(await Task.find(filter).sort({ createdAt: -1 }));
  } catch (e) { next(e); }
});

router.post('/', async (req, res, next) => {
  try { res.status(201).json(await Task.create(pick(req.body))); } catch (e) { next(e); }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const task = await Task.findByIdAndUpdate(req.params.id, pick(req.body), { new: true, runValidators: true });
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json(task);
  } catch (e) { next(e); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.status(204).end();
  } catch (e) { next(e); }
});

// POST /api/tasks/:id/comments  — add a comment
router.post('/:id/comments', async (req, res, next) => {
  try {
    const { body, author } = req.body;
    if (!body || !String(body).trim()) return res.status(400).json({ error: 'Comment body is required' });
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { $push: { comments: { body: String(body).trim(), author: author ? String(author).trim() : 'You' } } },
      { new: true, runValidators: true }
    );
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.status(201).json(task.comments[task.comments.length - 1]);
  } catch (e) { next(e); }
});

// DELETE /api/tasks/:id/comments/:commentId  — delete a comment
router.delete('/:id/comments/:commentId', async (req, res, next) => {
  try {
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { $pull: { comments: { _id: req.params.commentId } } },
      { new: true }
    );
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.status(204).end();
  } catch (e) { next(e); }
});

module.exports = router;

