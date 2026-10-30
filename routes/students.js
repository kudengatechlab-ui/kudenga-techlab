const express = require('express');
const bcrypt = require('bcryptjs');
const { requireAdmin } = require('../middleware/auth');

module.exports = (db) => {
  const router = express.Router();

  // ---------- List all students (admin) ----------
  router.get('/', requireAdmin, (req, res) => {
    const rows = db.prepare(
      `SELECT s.id, s.name, s.email, s.status, s.registered_by,
              s.created_at, s.approved_at, s.rejected_at,
              COUNT(qa.id) AS attempt_count
       FROM students s
       LEFT JOIN quiz_attempts qa ON qa.student_id = s.id
       GROUP BY s.id
       ORDER BY s.created_at DESC`
    ).all();
    res.json(rows);
  });

  // ---------- All quiz attempts across all students (admin) ----------
  router.get('/attempts/all', requireAdmin, (req, res) => {
    const rows = db.prepare(`
      SELECT qa.id, qa.student_id, qa.quiz_key, qa.score, qa.total,
             qa.details, qa.attempted_at,
             s.name AS student_name, s.email AS student_email
      FROM quiz_attempts qa
      JOIN students s ON s.id = qa.student_id
      ORDER BY qa.attempted_at DESC
    `).all();
    res.json(rows.map(r => ({
      id: r.id,
      studentId: r.student_id,
      studentName: r.student_name,
      studentEmail: r.student_email,
      quizId: r.quiz_key,
      score: r.score,
      total: r.total,
      details: JSON.parse(r.details || '[]'),
      date: new Date(r.attempted_at * 1000).toISOString()
    })));
  });

  // ---------- Get one student with quiz results (admin) ----------
  router.get('/:id', requireAdmin, (req, res) => {
    const s = db.prepare(
      'SELECT id, name, email, status, registered_by, created_at FROM students WHERE id = ?'
    ).get(req.params.id);
    if (!s) return res.status(404).json({ error: 'Not found' });

    const attempts = db.prepare(
      'SELECT id, quiz_key, score, total, attempted_at FROM quiz_attempts WHERE student_id = ? ORDER BY attempted_at DESC'
    ).all(req.params.id);

    res.json({ ...s, quizResults: attempts });
  });

  // ---------- Add a student manually (admin) ----------
  router.post('/', requireAdmin, (req, res) => {
    const { name, email, password } = req.body || {};
    if (!name || !email || !password || password.length < 6)
      return res.status(400).json({ error: 'Name, email, 6+ char password required' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return res.status(400).json({ error: 'Invalid email' });

    const normEmail = email.toLowerCase().trim();
    if (db.prepare('SELECT id FROM students WHERE email = ?').get(normEmail))
      return res.status(400).json({ error: 'Email already registered' });

    const id = 's' + Date.now() + Math.random().toString(36).slice(2, 8);
    db.prepare(
      `INSERT INTO students (id, name, email, password_hash, status, registered_by, approved_at)
       VALUES (?, ?, ?, ?, ?, ?, unixepoch())`
    ).run(id, name.trim(), normEmail, bcrypt.hashSync(password, 10), 'approved', 'admin');

    res.json({ ok: true, id });
  });

  // ---------- Approve a student ----------
  router.post('/:id/approve', requireAdmin, (req, res) => {
    const s = db.prepare('SELECT id FROM students WHERE id = ?').get(req.params.id);
    if (!s) return res.status(404).json({ error: 'Not found' });
    db.prepare("UPDATE students SET status='approved', approved_at=unixepoch() WHERE id=?")
      .run(req.params.id);
    res.json({ ok: true });
  });

  // ---------- Reject / revoke access ----------
  router.post('/:id/reject', requireAdmin, (req, res) => {
    const s = db.prepare('SELECT id FROM students WHERE id = ?').get(req.params.id);
    if (!s) return res.status(404).json({ error: 'Not found' });
    db.prepare("UPDATE students SET status='rejected', rejected_at=unixepoch() WHERE id=?")
      .run(req.params.id);
    res.json({ ok: true });
  });

  // ---------- Delete a student (cascades) ----------
  router.delete('/:id', requireAdmin, (req, res) => {
    const s = db.prepare('SELECT id FROM students WHERE id = ?').get(req.params.id);
    if (!s) return res.status(404).json({ error: 'Not found' });
    db.prepare('DELETE FROM students WHERE id = ?').run(req.params.id);
    res.json({ ok: true });
  });

  return router;
};