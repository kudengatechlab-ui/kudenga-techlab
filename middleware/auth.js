function requireAdmin(req, res, next) {
  if (req.session && req.session.role === 'admin') {
    return next();
  }
  return res.status(401).json({ error: 'Admin access required' });
}

function requireStudent(req, res, next) {
  if (req.session && req.session.studentId) {
    return next();
  }
  return res.status(401).json({ error: 'Student login required' });
}

module.exports = { requireAdmin, requireStudent };
