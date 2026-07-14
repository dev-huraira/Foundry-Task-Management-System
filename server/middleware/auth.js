const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Team = require('../models/Team');

const JWT_SECRET = process.env.JWT_SECRET || 'foundry_secret_key_2026_spec';

// General auth check
const auth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication credentials required.' });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({ error: 'User account not found.' });
    }

    req.user = user;

    // Optional workspace/team context resolution
    const teamId = req.header('X-Team-ID');
    if (teamId) {
      const team = await Team.findById(teamId);
      if (team) {
        const memberRelation = team.members.find(
          (m) => m.user.toString() === user._id.toString()
        );
        if (memberRelation) {
          req.teamId = team._id;
          req.userRole = memberRelation.role; // 'Admin' or 'Member'
        }
      }
    }

    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired security token.' });
  }
};

// Check if current user is Admin in active team context
const requireAdmin = (req, res, next) => {
  if (!req.teamId) {
    return res.status(400).json({ error: 'Active team context (X-Team-ID header) is required.' });
  }
  if (req.userRole !== 'Admin') {
    return res.status(403).json({ error: 'Access denied: Requires Admin privileges.' });
  }
  next();
};

module.exports = { auth, requireAdmin };
