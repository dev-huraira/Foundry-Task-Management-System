const express = require('express');
const router = express.Router();
const Comment = require('../models/Comment');
const Task = require('../models/Task');
const { auth } = require('../middleware/auth');

// @route   POST /api/comments/:taskId
// @desc    Add a comment to a task
router.post('/:taskId', auth, async (req, res) => {
  if (!req.teamId) {
    return res.status(400).json({ error: 'Active team context (X-Team-ID header) is required.' });
  }

  const { content } = req.body;
  if (!content || content.trim() === '') {
    return res.status(400).json({ error: 'Comment body cannot be empty.' });
  }

  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    if (task.team.toString() !== req.teamId.toString()) {
      return res.status(403).json({ error: 'Task does not belong to active team context.' });
    }

    const comment = new Comment({
      task: task._id,
      author: req.user._id,
      content: content.trim(),
    });

    await comment.save();

    const populatedComment = await Comment.findById(comment._id)
      .populate('author', 'name email');

    // Also update activity on task
    task.activity.push({
      action: `Added comment: "${content.trim().substring(0, 30)}${content.trim().length > 30 ? '...' : ''}"`,
      user: req.user._id,
    });
    await task.save();

    res.status(201).json(populatedComment);
  } catch (error) {
    res.status(500).json({ error: 'Failed to post comment.' });
  }
});

// @route   GET /api/comments/:taskId
// @desc    Get comments for a specific task
router.get('/:taskId', auth, async (req, res) => {
  if (!req.teamId) {
    return res.status(400).json({ error: 'Active team context (X-Team-ID header) is required.' });
  }

  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    if (task.team.toString() !== req.teamId.toString()) {
      return res.status(403).json({ error: 'Task does not belong to active team context.' });
    }

    const comments = await Comment.find({ task: req.params.taskId })
      .populate('author', 'name email')
      .sort({ createdAt: 1 }); // Ascending order (oldest to newest)

    res.json(comments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch task comments.' });
  }
});

module.exports = router;
