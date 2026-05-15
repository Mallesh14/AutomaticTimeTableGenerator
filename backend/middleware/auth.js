const jwt = require('jsonwebtoken');
const secret = process.env.JWT_SECRET || 'YOUR_SECRET_KEY'; // use .env in production

// Middleware to verify token and attach decoded user to req.user
function authenticate(req, res, next) {
  const authHeader = req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access token missing or malformed' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, secret);
    req.user = decoded; // { userId, role, email, ... }
    next();
  } catch (err) {
    console.error('❌ Invalid token:', err.message);
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}

// Middleware to allow only specific roles
function authorize(roles = []) {
  // Allow single role string (e.g., 'admin') or array of roles
  if (typeof roles === 'string') {
    roles = [roles];
  }

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
}

module.exports = { authenticate, authorize };
