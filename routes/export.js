const express = require('express');
const { requireAdmin } = require('../middleware/auth');

module.exports = (db) => {
  const router = express.Router();

  // =================================================================
  // BACKUP — download a full content JSON
  // =================================================================
  router.get('/backup', requireAdmin, (req, res) => {
    const bundle = {
      components: db.prepare('SELECT * FROM components').all(),
      quizzes: {},
      notes: db.prepare('SELECT * FROM notes').all(),
      prototypes: db.prepare('SELECT * FROM prototypes').all(),
      settings: Object.fromEntries(
        db.prepare('SELECT * FROM settings').all().map(s => [s.key, s.value])
      ),
      exportedAt: new Date().toISOString()
    };

    // Expand quizzes with their questions
    for (const q of db.prepare('SELECT * FROM quizzes').all()) {
      const qs = db.prepare(
        'SELECT q, options, answer, explanation FROM quiz_questions WHERE quiz_id=? ORDER BY order_num, id'
      ).all(q.id);
      bundle.quizzes[q.quiz_key] = {
        title: q.title,
        level: q.level,
        questions: qs.map(x => ({
          q: x.q,
          options: JSON.parse(x.options),
          answer: x.answer,
          explanation: x.explanation
        }))
      };
    }

    const filename = 'kudenga-backup-' + new Date().toISOString().slice(0, 10) + '.json';
    res.setHeader('Content-Disposition', 'attachment; filename="' + filename + '"');
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(bundle, null, 2));
  });

  // =================================================================
  // RESTORE — replace ALL content from a backup JSON
  // =================================================================
  router.post('/restore', requireAdmin, (req, res) => {
    const body = req.body || {};
    if (!body.components || !body.quizzes)
      return res.status(400).json({ error: 'Not a Kudenga backup file' });

    try {
      db.exec('BEGIN');

      db.exec('DELETE FROM components');
      db.exec('DELETE FROM quiz_questions');
      db.exec('DELETE FROM quizzes');
      db.exec('DELETE FROM notes');
      db.exec('DELETE FROM prototypes');
      db.exec('DELETE FROM settings');

      // ----- Components -----
      for (const c of body.components) {
        db.prepare(
          'INSERT INTO components (name, symbol, category, func) VALUES (?, ?, ?, ?)'
        ).run(c.name, c.symbol || '', c.category || 'passive', c.func || '');
      }

      // ----- Quizzes (with nested questions) -----
      for (const [k, q] of Object.entries(body.quizzes)) {
        const info = db.prepare(
          'INSERT INTO quizzes (quiz_key, title, level) VALUES (?, ?, ?)'
        ).run(k, q.title || k, q.level || 'beginner');
        const qid = Number(info.lastInsertRowid);

        (q.questions || []).forEach((question, i) => {
          db.prepare(
            'INSERT INTO quiz_questions (quiz_id, q, options, answer, explanation, order_num) VALUES (?, ?, ?, ?, ?, ?)'
          ).run(
            qid,
            question.q,
            JSON.stringify(question.options),
            question.answer,
            question.explanation || '',
            i
          );
        });
      }

      // ----- Notes -----
      for (const n of (body.notes || [])) {
        db.prepare(
          'INSERT INTO notes (note_key, title, category, meta, summary, content, thumb) VALUES (?, ?, ?, ?, ?, ?, ?)'
        ).run(
          n.id, n.title, n.category || '', n.meta || '',
          n.summary || '', n.content || '', n.thumb || ''
        );
      }

      // ----- Prototypes -----
      for (const p of (body.prototypes || [])) {
        db.prepare(
          'INSERT INTO prototypes (proto_key, title, category, meta, summary, content, thumb) VALUES (?, ?, ?, ?, ?, ?, ?)'
        ).run(
          p.id, p.title, p.category || '', p.meta || '',
          p.summary || '', p.content || '', p.thumb || ''
        );
      }

      // ----- Settings -----
      for (const [k, v] of Object.entries(body.settings || {})) {
        db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run(k, String(v));
      }

      db.exec('COMMIT');
      res.json({ ok: true });
    } catch (e) {
      db.exec('ROLLBACK');
      console.error(e);
      res.status(500).json({ error: 'Restore failed: ' + e.message });
    }
  });

  // =================================================================
  // CSV EXPORT — students table
  // =================================================================
  router.get('/students.csv', requireAdmin, (req, res) => {
    const rows = db.prepare(
      'SELECT id, name, email, status, registered_by, created_at, approved_at FROM students ORDER BY created_at DESC'
    ).all();

    const esc = (v) => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
    let csv = 'ID,Name,Email,Status,RegisteredBy,CreatedAt,ApprovedAt\n';
    for (const r of rows) {
      csv += [
        esc(r.id),
        esc(r.name),
        esc(r.email),
        esc(r.status),
        esc(r.registered_by),
        esc(r.created_at),
        esc(r.approved_at || '')
      ].join(',') + '\n';
    }

    const filename = 'kudenga-students-' + new Date().toISOString().slice(0, 10) + '.csv';
    res.setHeader('Content-Disposition', 'attachment; filename="' + filename + '"');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.send(csv);
  });

  // =================================================================
  // CSV EXPORT — all quiz attempts
  // =================================================================
  router.get('/attempts.csv', requireAdmin, (req, res) => {
    const rows = db.prepare(
      `SELECT a.id, s.name AS student_name, s.email AS student_email,
              a.quiz_key, a.score, a.total, a.attempted_at
       FROM quiz_attempts a
       JOIN students s ON s.id = a.student_id
       ORDER BY a.attempted_at DESC`
    ).all();

    const esc = (v) => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
    let csv = 'ID,Student,Email,Quiz,Score,Total,Percent,Date\n';
    for (const r of rows) {
      const pct = r.total > 0 ? Math.round((r.score / r.total) * 100) : 0;
      csv += [
        r.id,
        esc(r.student_name),
        esc(r.student_email),
        esc(r.quiz_key),
        r.score,
        r.total,
        pct,
        esc(new Date(r.attempted_at * 1000).toISOString())
      ].join(',') + '\n';
    }

    const filename = 'kudenga-attempts-' + new Date().toISOString().slice(0, 10) + '.csv';
    res.setHeader('Content-Disposition', 'attachment; filename="' + filename + '"');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.send(csv);
  });

  return router;
};