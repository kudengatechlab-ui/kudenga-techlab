const express = require('express');
const bcrypt = require('bcryptjs');

module.exports = (db) => {
  const router = express.Router();

  // ---------- Student sign-up ----------
  router.post('/register', (req, res) => {
    const { name, email, password } = req.body || {};
    if (!name || !email || !password || password.length < 6)
      return res.status(400).json({ error: 'Name, email, and 6+ char password required' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return res.status(400).json({ error: 'Invalid email' });

    const normEmail = email.toLowerCase().trim();
    const exists = db.prepare('SELECT id FROM students WHERE email = ?').get(normEmail);
    if (exists) return res.status(400).json({ error: 'Email already registered' });

    const id = 's' + Date.now() + Math.random().toString(36).slice(2, 8);
    const hash = bcrypt.hashSync(password, 10);

    db.prepare(
      'INSERT INTO students (id, name, email, password_hash, status) VALUES (?, ?, ?, ?, ?)'
    ).run(id, name.trim(), normEmail, hash, 'approved');

    req.session.studentId = id;
    res.json({ ok: true, student: { id, name: name.trim(), email: normEmail } });
  });

  // ---------- Student login ----------
  router.post('/login-student', (req, res) => {
    const { email, password } = req.body || {};
    if (!email || !password)
      return res.status(400).json({ error: 'Email and password required' });

    const student = db.prepare('SELECT * FROM students WHERE email = ?')
      .get(email.toLowerCase().trim());
    if (!student) return res.status(401).json({ error: 'Wrong email or password' });
    if (!bcrypt.compareSync(password, student.password_hash))
      return res.status(401).json({ error: 'Wrong email or password' });
    if (student.status === 'rejected')
      return res.status(403).json({ error: 'Account access revoked' });

    req.session.studentId = student.id;
    req.session.adminId = null;
    res.json({
      ok: true,
      student: { id: student.id, name: student.name, email: student.email }
    });
  });

  // ---------- Admin login ----------
  router.post('/login-admin', (req, res) => {
    const { password } = req.body || {};
    if (!password) return res.status(400).json({ error: 'Password required' });

    const admin = db.prepare('SELECT * FROM users WHERE role = ? ORDER BY id LIMIT 1').get('admin');
    if (!admin || !bcrypt.compareSync(password, admin.password_hash))
      return res.status(401).json({ error: 'Wrong password' });

    req.session.adminId = admin.id;
    req.session.studentId = null;
    res.json({ ok: true, admin: { id: admin.id, username: admin.username } });
  });

  // ---------- Logout ----------
  router.post('/logout', (req, res) => {
    req.session.destroy(() => res.json({ ok: true }));
  });

  // ---------- Who am I? ----------
  router.get('/me', (req, res) => {
    const out = { student: null, admin: null };
    if (req.session.studentId) {
      const s = db.prepare('SELECT id, name, email, status FROM students WHERE id = ?')
        .get(req.session.studentId);
      if (s) out.student = s;
    }
    if (req.session.adminId) {
      const a = db.prepare('SELECT id, username, role FROM users WHERE id = ?')
        .get(req.session.adminId);
      if (a) out.admin = a;
    }
    res.json(out);
  });

  return router;
};