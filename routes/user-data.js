const express = require('express');
const { requireStudent } = require('../middleware/auth');

module.exports = (db) => {
  const router = express.Router();

  // =================================================================
  // QUIZ ATTEMPTS
  // =================================================================
  router.post('/quiz-attempts', requireStudent, (req, res) => {
    const { quizKey, score, total, details } = req.body || {};
    if (!quizKey || typeof score !== 'number' || typeof total !== 'number')
      return res.status(400).json({ error: 'quizKey, score, total required' });

    db.prepare(
      'INSERT INTO quiz_attempts (student_id, quiz_key, score, total, details) VALUES (?, ?, ?, ?, ?)'
    ).run(req.session.studentId, quizKey, score, total, JSON.stringify(details || []));
    res.json({ ok: true });
  });

  router.get('/quiz-attempts', requireStudent, (req, res) => {
    const rows = db.prepare(
      'SELECT id, quiz_key, score, total, details, attempted_at AS date FROM quiz_attempts WHERE student_id=? ORDER BY attempted_at DESC'
    ).all(req.session.studentId);
    res.json(rows.map(r => ({
      quizId: r.quiz_key,
      score: r.score,
      total: r.total,
      details: JSON.parse(r.details || '[]'),
      date: new Date(r.date * 1000).toISOString()
    })));
  });

  // =================================================================
  // TRACK PROGRESS
  // =================================================================
  router.get('/progress', requireStudent, (req, res) => {
    const rows = db.prepare(
      'SELECT track_id, completed, last_step, updated_at FROM progress WHERE student_id=?'
    ).all(req.session.studentId);
    const out = {};
    for (const r of rows) {
      out[r.track_id] = {
        completed: JSON.parse(r.completed || '[]'),
        lastStep: r.last_step,
        updatedAt: r.updated_at * 1000
      };
    }
    res.json(out);
  });

  router.post('/progress/complete-step', requireStudent, (req, res) => {
    const { trackId, stepKey } = req.body || {};
    if (!trackId || !stepKey)
      return res.status(400).json({ error: 'trackId and stepKey required' });

    const row = db.prepare(
      'SELECT id, completed FROM progress WHERE student_id=? AND track_id=?'
    ).get(req.session.studentId, trackId);

    if (row) {
      const completed = JSON.parse(row.completed || '[]');
      if (!completed.includes(stepKey)) completed.push(stepKey);
      db.prepare(
        'UPDATE progress SET completed=?, last_step=?, updated_at=unixepoch() WHERE id=?'
      ).run(JSON.stringify(completed), stepKey, row.id);
    } else {
      db.prepare(
        'INSERT INTO progress (student_id, track_id, completed, last_step) VALUES (?, ?, ?, ?)'
      ).run(req.session.studentId, trackId, JSON.stringify([stepKey]), stepKey);
    }
    res.json({ ok: true });
  });

  // =================================================================
  // BOOKMARKS
  // =================================================================
  router.get('/bookmarks', requireStudent, (req, res) => {
    const rows = db.prepare(
      'SELECT item_key FROM bookmarks WHERE student_id=? ORDER BY created_at DESC'
    ).all(req.session.studentId);
    res.json(rows.map(r => r.item_key));
  });

  router.post('/bookmarks/:key', requireStudent, (req, res) => {
    db.prepare('INSERT OR IGNORE INTO bookmarks (student_id, item_key) VALUES (?, ?)')
      .run(req.session.studentId, req.params.key);
    res.json({ ok: true });
  });

  router.delete('/bookmarks/:key', requireStudent, (req, res) => {
    db.prepare('DELETE FROM bookmarks WHERE student_id=? AND item_key=?')
      .run(req.session.studentId, req.params.key);
    res.json({ ok: true });
  });

  // =================================================================
  // BADGES
  // =================================================================
  router.get('/badges', requireStudent, (req, res) => {
    const rows = db.prepare(
      'SELECT badge_key FROM badges WHERE student_id=?'
    ).all(req.session.studentId);
    res.json(rows.map(r => r.badge_key));
  });

  router.post('/badges/:key', requireStudent, (req, res) => {
    db.prepare('INSERT OR IGNORE INTO badges (student_id, badge_key) VALUES (?, ?)')
      .run(req.session.studentId, req.params.key);
    res.json({ ok: true });
  });

  // =================================================================
  // ACTIVITY (daily "I was here today" counter, for streak + heatmap)
  // =================================================================
  router.get('/activity', requireStudent, (req, res) => {
    const rows = db.prepare(
      'SELECT activity_date, count FROM activity WHERE student_id=? ORDER BY activity_date DESC LIMIT 365'
    ).all(req.session.studentId);
    const out = {};
    for (const r of rows) out[r.activity_date] = r.count;
    res.json(out);
  });

  router.post('/activity/ping', requireStudent, (req, res) => {
    const today = new Date().toISOString().slice(0, 10);
    const existing = db.prepare(
      'SELECT id, count FROM activity WHERE student_id=? AND activity_date=?'
    ).get(req.session.studentId, today);

    if (existing) {
      db.prepare('UPDATE activity SET count=? WHERE id=?').run(existing.count + 1, existing.id);
    } else {
      db.prepare('INSERT INTO activity (student_id, activity_date, count) VALUES (?, ?, 1)')
        .run(req.session.studentId, today);
    }
    res.json({ ok: true });
  });

  // =================================================================
  // RECENTLY VIEWED
  // =================================================================
  router.get('/recent', requireStudent, (req, res) => {
    const rows = db.prepare(
      'SELECT item_key, label, type, viewed_at FROM recent_views WHERE student_id=? ORDER BY viewed_at DESC LIMIT 5'
    ).all(req.session.studentId);
    res.json(rows.map(r => ({
      key: r.item_key,
      label: r.label,
      type: r.type,
      ts: r.viewed_at * 1000
    })));
  });

  router.post('/recent', requireStudent, (req, res) => {
    const { itemKey, label, type } = req.body || {};
    if (!itemKey || !label || !type)
      return res.status(400).json({ error: 'itemKey, label, type required' });

    // Upsert: delete old entry for this key, then insert (bumps it to "top")
    db.prepare('DELETE FROM recent_views WHERE student_id=? AND item_key=?')
      .run(req.session.studentId, itemKey);
    db.prepare('INSERT INTO recent_views (student_id, item_key, label, type) VALUES (?, ?, ?, ?)')
      .run(req.session.studentId, itemKey, label, type);
    res.json({ ok: true });
  });

  return router;
};