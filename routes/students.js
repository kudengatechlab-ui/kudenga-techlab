const express = require('express');
const { requireAdmin } = require('../middleware/auth');

module.exports = (db) => {
  const router = express.Router();

  router.get('/', requireAdmin, (req, res) => {
    const students = db.prepare('SELECT id, name, email, status, created_at FROM students ORDER BY created_at DESC').all();
    res.json(students);
  });

  router.get('/:id', requireAdmin, (req, res) => {
    const student = db.prepare('SELECT id, name, email, status, created_at FROM students WHERE id=?').get(req.params.id);
    if (!student) return res.status(404).json({ error: 'Not found' });
    res.json(student);
  });

  router.get('/attempts/all', requireAdmin, (req, res) => {
    const attempts = db.prepare(
      'SELECT qa.*, s.name as student_name, s.email as student_email FROM quiz_attempts qa JOIN students s ON qa.student_id = s.id ORDER BY qa.created_at DESC LIMIT 100'
    ).all();
    res.json(attempts);
  });

  router.post('/', requireAdmin, (req, res) => {
    const { name, email, password } = req.body || {};
    if (!name || !email || !password) return res.status(400).json({ error: 'All fields required' });
    const bcrypt = require('bcryptjs');
    const crypto = require('crypto');
    const hash = bcrypt.hashSync(password, 10);
    const id = crypto.randomUUID();
    try {
      db.prepare('INSERT INTO students (id, name, email, password_hash, status, registered_by) VALUES (?, ?, ?, ?, ?, ?)')
        .run(id, name, email.toLowerCase(), hash, 'approved', 'admin');
      res.json({ ok: true, id });
    } catch (e) {
      res.status(400).json({ error: 'Email already exists' });
    }
  });

  router.post('/:id/approve', requireAdmin, (req, res) => {
    db.prepare('UPDATE students SET status=?, approved_at=unixepoch() WHERE id=?').run('approved', req.params.id);
    res.json({ ok: true });
  });

  router.post('/:id/reject', requireAdmin, (req, res) => {
    db.prepare('UPDATE students SET status=?, rejected_at=unixepoch() WHERE id=?').run('rejected', req.params.id);
    res.json({ ok: true });
  });

  router.delete('/:id', requireAdmin, (req, res) => {
    db.prepare('DELETE FROM students WHERE id=?').run(req.params.id);
    res.json({ ok: true });
  });

  return router;
};
