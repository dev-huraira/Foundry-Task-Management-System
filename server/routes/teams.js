const express = require('express');
const router = express.Router();
const Team = require('../models/Team');
const { auth } = require('../middleware/auth');

// @route   POST /api/teams/create
// @desc    Create a new team/workspace
router.post('/create', auth, async (req, res) => {
  const { name } = req.body;
  if (!name || name.trim() === '') {
    return res.status(400).json({ error: 'Workspace name is required.' });
  }

  try {
    let inviteCode = Team.generateInviteCode();
    // Ensure uniqueness
    let existingTeam = await Team.findOne({ inviteCode });
    while (existingTeam) {
      inviteCode = Team.generateInviteCode();
      existingTeam = await Team.findOne({ inviteCode });
    }

    const newTeam = new Team({
      name: name.trim(),
      inviteCode,
      members: [
        {
          user: req.user._id,
          role: 'Admin',
        },
      ],
    });

    await newTeam.save();
    
    // Populate user details for returning
    const populatedTeam = await Team.findById(newTeam._id)
      .populate('members.user', 'name email');

    res.status(201).json(populatedTeam);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create workspace. Please try again.' });
  }
});

// @route   GET /api/teams
// @desc    Get all teams for the logged-in user
router.get('/', auth, async (req, res) => {
  try {
    const teams = await Team.find({
      'members.user': req.user._id,
    }).populate('members.user', 'name email');

    res.json(teams);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch teams list.' });
  }
});

// @route   POST /api/teams/join
// @desc    Join an existing team via invite code
router.post('/join', auth, async (req, res) => {
  const { inviteCode } = req.body;
  if (!inviteCode) {
    return res.status(400).json({ error: 'Invite code is required.' });
  }

  try {
    const team = await Team.findOne({ inviteCode: inviteCode.trim().toUpperCase() });
    if (!team) {
      return res.status(404).json({ error: 'Workspace not found. Check the code and try again.' });
    }

    // Check if already a member
    const alreadyMember = team.members.some(
      (m) => m.user.toString() === req.user._id.toString()
    );
    if (alreadyMember) {
      return res.status(400).json({ error: 'You are already a member of this workspace.' });
    }

    // Add user as Member
    team.members.push({
      user: req.user._id,
      role: 'Member',
    });

    await team.save();

    const populatedTeam = await Team.findById(team._id)
      .populate('members.user', 'name email');

    res.json(populatedTeam);
  } catch (error) {
    res.status(500).json({ error: 'Failed to join workspace. Please try again.' });
  }
});

// @route   POST /api/teams/:teamId/invite-code
// @desc    Regenerate a team's invite code (Admin only)
router.post('/:teamId/invite-code', auth, async (req, res) => {
  const { teamId } = req.params;

  try {
    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ error: 'Workspace not found.' });
    }

    // Check user role in this team
    const requesterRelation = team.members.find(
      (m) => m.user.toString() === req.user._id.toString()
    );
    if (!requesterRelation || requesterRelation.role !== 'Admin') {
      return res.status(403).json({ error: 'Only administrators can update the invite code.' });
    }

    let newCode = Team.generateInviteCode();
    let existingTeam = await Team.findOne({ inviteCode: newCode });
    while (existingTeam) {
      newCode = Team.generateInviteCode();
      existingTeam = await Team.findOne({ inviteCode: newCode });
    }

    team.inviteCode = newCode;
    await team.save();

    res.json({ inviteCode: team.inviteCode });
  } catch (error) {
    res.status(500).json({ error: 'Failed to regenerate invite code.' });
  }
});

// @route   PUT /api/teams/:teamId/role
// @desc    Update a member's role (Admin only)
router.put('/:teamId/role', auth, async (req, res) => {
  const { teamId } = req.params;
  const { targetUserId, newRole } = req.body;

  if (!targetUserId || !newRole || !['Admin', 'Member'].includes(newRole)) {
    return res.status(400).json({ error: 'Valid targetUserId and newRole are required.' });
  }

  try {
    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ error: 'Workspace not found.' });
    }

    // Check requester role
    const requesterRelation = team.members.find(
      (m) => m.user.toString() === req.user._id.toString()
    );
    if (!requesterRelation || requesterRelation.role !== 'Admin') {
      return res.status(403).json({ error: 'Only administrators can change roles.' });
    }

    // Check target user
    const targetRelation = team.members.find(
      (m) => m.user.toString() === targetUserId
    );
    if (!targetRelation) {
      return res.status(404).json({ error: 'User is not a member of this workspace.' });
    }

    // Ensure we don't leave the team with 0 admins if the user changes their own role
    if (targetUserId === req.user._id.toString() && newRole === 'Member') {
      const otherAdmins = team.members.filter(
        (m) => m.role === 'Admin' && m.user.toString() !== req.user._id.toString()
      );
      if (otherAdmins.length === 0) {
        return res.status(400).json({ error: 'Cannot demote the sole administrator of a workspace.' });
      }
    }

    targetRelation.role = newRole;
    await team.save();

    const populatedTeam = await Team.findById(team._id)
      .populate('members.user', 'name email');

    res.json(populatedTeam);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update member role.' });
  }
});

// @route   DELETE /api/teams/:teamId/members/:userId
// @desc    Remove a member from the team (Admin only, or user self-leaving)
router.delete('/:teamId/members/:userId', auth, async (req, res) => {
  const { teamId, userId } = req.params;

  try {
    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ error: 'Workspace not found.' });
    }

    // Check requester role
    const requesterRelation = team.members.find(
      (m) => m.user.toString() === req.user._id.toString()
    );
    if (!requesterRelation) {
      return res.status(403).json({ error: 'You are not a member of this workspace.' });
    }

    const targetUserRelation = team.members.find(
      (m) => m.user.toString() === userId
    );
    if (!targetUserRelation) {
      return res.status(404).json({ error: 'Target user is not a member of this workspace.' });
    }

    // User is leaving voluntarily, OR is an Admin removing another member
    const isSelfLeaving = req.user._id.toString() === userId;
    const isAdmin = requesterRelation.role === 'Admin';

    if (!isSelfLeaving && !isAdmin) {
      return res.status(403).json({ error: 'Access denied: Only administrators can remove members.' });
    }

    // Prevent leaving if they are the sole admin and there are other members
    if (isSelfLeaving && targetUserRelation.role === 'Admin' && team.members.length > 1) {
      const otherAdmins = team.members.filter(
        (m) => m.role === 'Admin' && m.user.toString() !== userId
      );
      if (otherAdmins.length === 0) {
        return res.status(400).json({ error: 'Please transfer workspace ownership (Admin role) to another member before leaving.' });
      }
    }

    // Remove user
    team.members = team.members.filter((m) => m.user.toString() !== userId);
    await team.save();

    const populatedTeam = await Team.findById(team._id)
      .populate('members.user', 'name email');

    res.json(populatedTeam);
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove member from workspace.' });
  }
});

module.exports = router;
