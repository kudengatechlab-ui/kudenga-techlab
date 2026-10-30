function requireAuth(req, res, next) {
  if (!req.session.studentId && !req.session.adminId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

function requireStudent(req, res, next) {
  if (!req.session.studentId) {
    return res.status(401).json({ error: 'Student login required' });
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.session.adminId) {
    return res.status(403).json({ error: 'Admin login required' });
  }
  next();
}

module.exports = { requireAuth, requireStudent, requireAdmin };