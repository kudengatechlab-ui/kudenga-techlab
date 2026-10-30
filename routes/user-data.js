const express = require('express');

module.exports = (db) => {
  const router = express.Router();

  function requireStudent(req, res, next) {
    if (req.session && req.session.studentId) return next();
    res.status(401).json({ error: 'Login required' });
  }

  // ----- QUIZ ATTEMPTS -----
  router.get('/quiz-attempts', requireStudent, (req, res) => {
    const rows = db.prepare(
      'SELECT * FROM quiz_attempts WHERE student_id=? ORDER BY created_at DESC'
    ).all(req.session.studentId);
    res.json(rows);
  });

  router.post('/quiz-attempts', requireStudent, (req, res) => {
    const { quizKey, title, score, total } = req.body || {};
    if (quizKey == null || score == null || total == null) {
      return res.status(400).json({ error: 'quizKey, score, and total required' });
    }
    db.prepare(
      'INSERT INTO quiz_attempts (student_id, quiz_key, title, score, total) VALUES (?, ?, ?, ?, ?)'
    ).run(req.session.studentId, quizKey, title || quizKey, score, total);
    res.json({ ok: true });
  });

  // ----- PROGRESS -----
  router.get('/progress', requireStudent, (req, res) => {
    const rows = db.prepare('SELECT * FROM progress WHERE student_id=?').all(req.session.studentId);
    const out = {};
    rows.forEach(r => {
      out[r.track_id] = {
        completed: JSON.parse(r.completed || '[]'),
        lastStep: r.last_step,
        updatedAt: r.updated_at
      };
    });
    res.json(out);
  });

  router.post('/progress/complete-step', requireStudent, (req, res) => {
    const { trackId, stepKey } = req.body || {};
    if (!trackId || !stepKey) return res.status(400).json({ error: 'trackId and stepKey required' });
    const existing = db.prepare('SELECT * FROM progress WHERE student_id=? AND track_id=?')
      .get(req.session.studentId, trackId);
    if (existing) {
      const completed = JSON.parse(existing.completed || '[]');
      if (!completed.includes(stepKey)) completed.push(stepKey);
      db.prepare('UPDATE progress SET completed=?, last_step=?, updated_at=? WHERE id=?')
        .run(JSON.stringify(completed), stepKey, Date.now(), existing.id);
    } else {
      db.prepare('INSERT INTO progress (student_id, track_id, completed, last_step, updated_at) VALUES (?, ?, ?, ?, ?)')
        .run(req.session.studentId, trackId, JSON.stringify([stepKey]), stepKey, Date.now());
    }
    res.json({ ok: true });
  });

  // ----- BOOKMARKS -----
  router.get('/bookmarks', requireStudent, (req, res) => {
    const rows = db.prepare('SELECT item_key FROM bookmarks WHERE student_id=?').all(req.session.studentId);
    res.json(rows.map(r => r.item_key));
  });

  router.post('/bookmarks/:key', requireStudent, (req, res) => {
    try {
      db.prepare('INSERT OR IGNORE INTO bookmarks (student_id, item_key) VALUES (?, ?)')
        .run(req.session.studentId, req.params.key);
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: 'Failed to add bookmark' });
    }
  });

  router.delete('/bookmarks/:key', requireStudent, (req, res) => {
    db.prepare('DELETE FROM bookmarks WHERE student_id=? AND item_key=?')
      .run(req.session.studentId, req.params.key);
    res.json({ ok: true });
  });

  // ----- BADGES -----
  router.get('/badges', requireStudent, (req, res) => {
    const rows = db.prepare('SELECT badge_key FROM badges WHERE student_id=?').all(req.session.studentId);
    res.json(rows.map(r => r.badge_key));
  });

  router.post('/badges/:key', requireStudent, (req, res) => {
    try {
      db.prepare('INSERT OR IGNORE INTO badges (student_id, badge_key) VALUES (?, ?)')
        .run(req.session.studentId, req.params.key);
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: 'Failed to unlock badge' });
    }
  });

  // ----- ACTIVITY -----
  router.get('/activity', requireStudent, (req, res) => {
    const rows = db.prepare('SELECT day, count FROM activity WHERE student_id=?').all(req.session.studentId);
    const out = {};
    rows.forEach(r => { out[r.day] = r.count; });
    res.json(out);
  });

  router.post('/activity/ping', requireStudent, (req, res) => {
    const today = new Date().toISOString().slice(0, 10);
    const existing = db.prepare('SELECT * FROM activity WHERE student_id=? AND day=?')
      .get(req.session.studentId, today);
    if (existing) {
      db.prepare('UPDATE activity SET count=count+1 WHERE id=?').run(existing.id);
    } else {
      db.prepare('INSERT INTO activity (student_id, day, count) VALUES (?, ?, 1)')
        .run(req.session.studentId, today);
    }
    res.json({ ok: true });
  });

  // ----- RECENT -----
  router.get('/recent', requireStudent, (req, res) => {
    const rows = db.prepare(
      'SELECT item_key, label, type, ts FROM recent_views WHERE student_id=? ORDER BY ts DESC LIMIT 5'
    ).all(req.session.studentId);
    res.json(rows.map(r => ({ key: r.item_key, label: r.label, type: r.type, ts: r.ts })));
  });

  router.post('/recent', requireStudent, (req, res) => {
    const { itemKey, label, type } = req.body || {};
    if (!itemKey || !label) return res.status(400).json({ error: 'itemKey and label required' });
    db.prepare('DELETE FROM recent_views WHERE student_id=? AND item_key=?')
      .run(req.session.studentId, itemKey);
    db.prepare('INSERT INTO recent_views (student_id, item_key, label, type, ts) VALUES (?, ?, ?, ?, ?)')
      .run(req.session.studentId, itemKey, label, type || 'note', Date.now());
    res.json({ ok: true });
  });

  return router;
};
