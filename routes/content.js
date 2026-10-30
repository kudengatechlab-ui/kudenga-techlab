const express = require('express');
const { requireAdmin } = require('../middleware/auth');

module.exports = (db) => {
  const router = express.Router();

  // =================================================================
  // BUNDLED READ (used by index.html + admin.html to replace localStorage)
  // =================================================================
  router.get('/all', (req, res) => {
    const components = db.prepare('SELECT * FROM components ORDER BY order_num, id').all();
    const quizzes = db.prepare('SELECT * FROM quizzes ORDER BY order_num, id').all();
    const quizMap = {};
    for (const q of quizzes) {
      const questions = db.prepare(
        'SELECT * FROM quiz_questions WHERE quiz_id=? ORDER BY order_num, id'
      ).all(q.id);
      quizMap[q.quiz_key] = {
        title: q.title,
        level: q.level,
        questions: questions.map(x => ({
          q: x.q,
          options: JSON.parse(x.options),
          answer: x.answer,
          explanation: x.explanation
        }))
      };
    }
    const notes = db.prepare('SELECT * FROM notes ORDER BY order_num, id').all()
      .map(n => ({
        id: n.note_key, title: n.title, category: n.category, meta: n.meta,
        summary: n.summary, content: n.content, thumb: n.thumb, hidden: !!n.hidden
      }));
    const prototypes = db.prepare('SELECT * FROM prototypes ORDER BY order_num, id').all()
      .map(p => ({
        id: p.proto_key, title: p.title, category: p.category, meta: p.meta,
        summary: p.summary, content: p.content, thumb: p.thumb, hidden: !!p.hidden
      }));
    const settings = {};
    for (const s of db.prepare('SELECT * FROM settings').all()) settings[s.key] = s.value;
    res.json({ components, quizzes: quizMap, notes, prototypes, settings });
  });

  // =================================================================
  // COMPONENTS
  // =================================================================
  router.get('/components', (req, res) => {
    res.json(db.prepare('SELECT * FROM components ORDER BY order_num, id').all());
  });

  router.post('/components', requireAdmin, (req, res) => {
    const { name, symbol, category, func } = req.body || {};
    if (!name) return res.status(400).json({ error: 'Name required' });
    const info = db.prepare(
      'INSERT INTO components (name, symbol, category, func) VALUES (?, ?, ?, ?)'
    ).run(name, symbol || '', category || 'passive', func || '');
    res.json({ ok: true, id: info.lastInsertRowid });
  });

  router.put('/components/:id', requireAdmin, (req, res) => {
    const { name, symbol, category, func } = req.body || {};
    db.prepare('UPDATE components SET name=?, symbol=?, category=?, func=? WHERE id=?')
      .run(name, symbol || '', category || 'passive', func || '', req.params.id);
    res.json({ ok: true });
  });

  router.delete('/components/:id', requireAdmin, (req, res) => {
    db.prepare('DELETE FROM components WHERE id=?').run(req.params.id);
    res.json({ ok: true });
  });

  // =================================================================
  // QUIZZES
  // =================================================================
  router.get('/quizzes', (req, res) => {
    const quizzes = db.prepare('SELECT * FROM quizzes ORDER BY order_num, id').all();
    const out = {};
    for (const q of quizzes) {
      const questions = db.prepare(
        'SELECT * FROM quiz_questions WHERE quiz_id=? ORDER BY order_num, id'
      ).all(q.id);
      out[q.quiz_key] = {
        title: q.title,
        level: q.level,
        questions: questions.map(x => ({
          q: x.q,
          options: JSON.parse(x.options),
          answer: x.answer,
          explanation: x.explanation
        }))
      };
    }
    res.json(out);
  });

  router.post('/quizzes', requireAdmin, (req, res) => {
    const { key, title, level, questions } = req.body || {};
    if (!key || !title) return res.status(400).json({ error: 'Key and title required' });
    if (db.prepare('SELECT id FROM quizzes WHERE quiz_key=?').get(key))
      return res.status(400).json({ error: 'Quiz key already exists' });

    const info = db.prepare('INSERT INTO quizzes (quiz_key, title, level) VALUES (?, ?, ?)')
      .run(key, title, level || 'beginner');
    const qid = Number(info.lastInsertRowid);

    for (let i = 0; i < (questions || []).length; i++) {
      const q = questions[i];
      db.prepare(
        'INSERT INTO quiz_questions (quiz_id, q, options, answer, explanation, order_num) VALUES (?, ?, ?, ?, ?, ?)'
      ).run(qid, q.q, JSON.stringify(q.options), q.answer, q.explanation || '', i);
    }
    res.json({ ok: true });
  });

  router.put('/quizzes/:key', requireAdmin, (req, res) => {
    const { title, level, questions } = req.body || {};
    const quiz = db.prepare('SELECT id FROM quizzes WHERE quiz_key=?').get(req.params.key);
    if (!quiz) return res.status(404).json({ error: 'Not found' });

    if (title)
      db.prepare('UPDATE quizzes SET title=?, level=? WHERE id=?')
        .run(title, level || 'beginner', quiz.id);

    if (Array.isArray(questions)) {
      db.prepare('DELETE FROM quiz_questions WHERE quiz_id=?').run(quiz.id);
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        db.prepare(
          'INSERT INTO quiz_questions (quiz_id, q, options, answer, explanation, order_num) VALUES (?, ?, ?, ?, ?, ?)'
        ).run(quiz.id, q.q, JSON.stringify(q.options), q.answer, q.explanation || '', i);
      }
    }
    res.json({ ok: true });
  });

  router.delete('/quizzes/:key', requireAdmin, (req, res) => {
    db.prepare('DELETE FROM quizzes WHERE quiz_key=?').run(req.params.key);
    res.json({ ok: true });
  });

  // =================================================================
  // NOTES
  // =================================================================
  router.get('/notes', (req, res) => {
    res.json(db.prepare('SELECT * FROM notes ORDER BY order_num, id').all());
  });

  router.post('/notes', requireAdmin, (req, res) => {
    const { id, title, category, meta, summary, content, thumb } = req.body || {};
    if (!id || !title) return res.status(400).json({ error: 'id and title required' });
    if (db.prepare('SELECT id FROM notes WHERE note_key=?').get(id))
      return res.status(400).json({ error: 'Note key already exists' });

    db.prepare(
      'INSERT INTO notes (note_key, title, category, meta, summary, content, thumb) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(id, title, category || '', meta || '', summary || '', content || '', thumb || '');
    res.json({ ok: true });
  });

  router.put('/notes/:key', requireAdmin, (req, res) => {
    const { title, category, meta, summary, content, thumb } = req.body || {};
    db.prepare(
      `UPDATE notes SET
         title=COALESCE(?,title), category=COALESCE(?,category),
         meta=COALESCE(?,meta), summary=COALESCE(?,summary),
         content=COALESCE(?,content), thumb=COALESCE(?,thumb)
       WHERE note_key=?`
    ).run(title, category, meta, summary, content, thumb, req.params.key);
    res.json({ ok: true });
  });

  router.delete('/notes/:key', requireAdmin, (req, res) => {
    db.prepare('DELETE FROM notes WHERE note_key=?').run(req.params.key);
    res.json({ ok: true });
  });

  // =================================================================
  // PROTOTYPES
  // =================================================================
  router.get('/prototypes', (req, res) => {
    res.json(db.prepare('SELECT * FROM prototypes ORDER BY order_num, id').all());
  });

  router.post('/prototypes', requireAdmin, (req, res) => {
    const { id, title, category, meta, summary, content, thumb } = req.body || {};
    if (!id || !title) return res.status(400).json({ error: 'id and title required' });
    if (db.prepare('SELECT id FROM prototypes WHERE proto_key=?').get(id))
      return res.status(400).json({ error: 'Prototype key already exists' });

    db.prepare(
      'INSERT INTO prototypes (proto_key, title, category, meta, summary, content, thumb) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(id, title, category || '', meta || '', summary || '', content || '', thumb || '');
    res.json({ ok: true });
  });

  router.put('/prototypes/:key', requireAdmin, (req, res) => {
    const { title, category, meta, summary, content, thumb } = req.body || {};
    db.prepare(
      `UPDATE prototypes SET
         title=COALESCE(?,title), category=COALESCE(?,category),
         meta=COALESCE(?,meta), summary=COALESCE(?,summary),
         content=COALESCE(?,content), thumb=COALESCE(?,thumb)
       WHERE proto_key=?`
    ).run(title, category, meta, summary, content, thumb, req.params.key);
    res.json({ ok: true });
  });

  router.delete('/prototypes/:key', requireAdmin, (req, res) => {
    db.prepare('DELETE FROM prototypes WHERE proto_key=?').run(req.params.key);
    res.json({ ok: true });
  });

  // =================================================================
  // SETTINGS
  // =================================================================
  router.get('/settings', (req, res) => {
    const out = {};
    for (const s of db.prepare('SELECT * FROM settings').all()) out[s.key] = s.value;
    res.json(out);
  });

  router.put('/settings', requireAdmin, (req, res) => {
    const body = req.body || {};
    for (const [k, v] of Object.entries(body)) {
      db.prepare(
        'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value'
      ).run(k, String(v));
    }
    res.json({ ok: true });
  });

  return router;
};