const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const Team = require('../models/Team');
const { auth } = require('../middleware/auth');

// Helper to determine if user has permission to modify task
const canModifyTask = (task, userId, role) => {
  if (role === 'Admin') return true;
  
  // Member can modify if they are creator or current assignee
  const isCreator = task.creator.toString() === userId.toString();
  const isAssignee = task.assignee && task.assignee.toString() === userId.toString();
  
  return isCreator || isAssignee;
};

// @route   GET /api/tasks
// @desc    Get all tasks for the active team/workspace
router.get('/', auth, async (req, res) => {
  if (!req.teamId) {
    return res.status(400).json({ error: 'Active team context (X-Team-ID header) is required.' });
  }

  try {
    const tasks = await Task.find({ team: req.teamId })
      .populate('assignee', 'name email')
      .populate('creator', 'name email')
      .populate('activity.user', 'name email')
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tasks for active team.' });
  }
});

// @route   POST /api/tasks
// @desc    Create a new task
router.post('/', auth, async (req, res) => {
  if (!req.teamId) {
    return res.status(400).json({ error: 'Active team context (X-Team-ID header) is required.' });
  }

  const { title, description, status, priority, dueDate, assignee } = req.body;

  if (!title || title.trim() === '') {
    return res.status(400).json({ error: 'Task title is required.' });
  }

  try {
    // Check if assignee is member of the team
    let assigneeId = null;
    if (assignee) {
      const team = await Team.findById(req.teamId);
      const isMember = team.members.some((m) => m.user.toString() === assignee);
      if (!isMember) {
        return res.status(400).json({ error: 'Assignee must be a member of the workspace.' });
      }
      assigneeId = assignee;
    }

    const task = new Task({
      title: title.trim(),
      description: description ? description.trim() : '',
      status: status || 'To Do',
      priority: priority || 'Medium',
      dueDate: dueDate || null,
      assignee: assigneeId,
      team: req.teamId,
      creator: req.user._id,
      activity: [
        {
          action: 'Task created',
          user: req.user._id,
        },
      ],
    });

    await task.save();

    const populatedTask = await Task.findById(task._id)
      .populate('assignee', 'name email')
      .populate('creator', 'name email')
      .populate('activity.user', 'name email');

    res.status(201).json(populatedTask);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create task.' });
  }
});

// @route   PUT /api/tasks/:id
// @desc    Update an existing task
router.put('/:id', auth, async (req, res) => {
  if (!req.teamId) {
    return res.status(400).json({ error: 'Active team context (X-Team-ID header) is required.' });
  }

  const { title, description, status, priority, dueDate, assignee } = req.body;

  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    // Verify task belongs to active team context
    if (task.team.toString() !== req.teamId.toString()) {
      return res.status(403).json({ error: 'Task does not belong to active team context.' });
    }

    // Permissions check
    if (!canModifyTask(task, req.user._id, req.userRole)) {
      return res.status(403).json({ error: 'Access denied: You can only modify tasks you created or are assigned to.' });
    }

    // Track activity changes
    const changes = [];

    if (title && title.trim() !== task.title) {
      changes.push(`Title changed from "${task.title}" to "${title.trim()}"`);
      task.title = title.trim();
    }

    if (description !== undefined && description !== task.description) {
      changes.push('Description updated');
      task.description = description;
    }

    if (status && status !== task.status) {
      changes.push(`Status changed to "${status}"`);
      task.status = status;
    }

    if (priority && priority !== task.priority) {
      changes.push(`Priority changed to "${priority}"`);
      task.priority = priority;
    }

    // Date compare (handle dates / nulls)
    const oldDateStr = task.dueDate ? new Date(task.dueDate).toDateString() : 'None';
    const newDateStr = dueDate ? new Date(dueDate).toDateString() : 'None';
    if (oldDateStr !== newDateStr) {
      changes.push(`Due date updated to ${newDateStr}`);
      task.dueDate = dueDate || null;
    }

    // Assignee check
    const oldAssigneeStr = task.assignee ? task.assignee.toString() : null;
    const newAssigneeStr = assignee || null;
    if (oldAssigneeStr !== newAssigneeStr) {
      if (newAssigneeStr) {
        // Ensure new assignee is team member
        const team = await Team.findById(req.teamId);
        const isMember = team.members.some((m) => m.user.toString() === newAssigneeStr);
        if (!isMember) {
          return res.status(400).json({ error: 'New assignee must be a member of the workspace.' });
        }
        task.assignee = newAssigneeStr;
        changes.push('Assignee updated');
      } else {
        task.assignee = null;
        changes.push('Assignee removed');
      }
    }

    // Append activities
    if (changes.length > 0) {
      changes.forEach((actionText) => {
        task.activity.push({
          action: actionText,
          user: req.user._id,
        });
      });
      await task.save();
    }

    const populatedTask = await Task.findById(task._id)
      .populate('assignee', 'name email')
      .populate('creator', 'name email')
      .populate('activity.user', 'name email');

    res.json(populatedTask);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update task.' });
  }
});

// @route   DELETE /api/tasks/:id
// @desc    Delete a task
router.delete('/:id', auth, async (req, res) => {
  if (!req.teamId) {
    return res.status(400).json({ error: 'Active team context (X-Team-ID header) is required.' });
  }

  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    // Verify task belongs to active team context
    if (task.team.toString() !== req.teamId.toString()) {
      return res.status(403).json({ error: 'Task does not belong to active team context.' });
    }

    // Permissions check (Admins, or creator of task)
    const isAdmin = req.userRole === 'Admin';
    const isCreator = task.creator.toString() === req.user._id.toString();

    if (!isAdmin && !isCreator) {
      return res.status(403).json({ error: 'Access denied: Only administrators or the creator can delete this task.' });
    }

    await Task.findByIdAndDelete(req.params.id);
    res.json({ success: true, taskId: req.params.id });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete task.' });
  }
});

module.exports = router;
