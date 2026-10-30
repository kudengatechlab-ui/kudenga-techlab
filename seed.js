require('dotenv').config();
const fs = require('fs');
const path = require('path');

// Ensure db folder exists
const dbDir = path.join(__dirname, 'db');
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

const db = require('./lib/db');

// ---- Locate the seed data file ----
const candidates = [
  path.join(__dirname, 'seed-data.json'),
  path.join(__dirname, 'kudenga-backup.json'),
  path.join(__dirname, 'db', 'seed-data.json')
];

let file = null;
for (const c of candidates) {
  if (fs.existsSync(c)) { file = c; break; }
}

if (!file) {
  console.error('❌ No seed file found. - seed.js:24');
  console.error('');
  console.error('Place your content backup at one of these paths: - seed.js:26');
  for (const c of candidates) console.error('     ' + c);
  console.error('');
  console.error('To get the backup: - seed.js:29');
  console.error('1. Open your old admin.html in a browser - seed.js:30');
  console.error('2. Go to 💾 Backup tab → Download JSON - seed.js:31');
  console.error('3. Save the file into the project root as seeddata.json - seed.js:32');
  process.exit(1);
}

console.log('📂 Seeding from: - seed.js:36', file);
console.log('');

// ---- Parse ----
let data;
try {
  data = JSON.parse(fs.readFileSync(file, 'utf8'));
} catch (e) {
  console.error('❌ Invalid JSON: - seed.js:44', e.message);
  process.exit(1);
}

// ---- Sanity check ----
if (!data || typeof data !== 'object') {
  console.error('❌ Seed file is not a JSON object. - seed.js:50');
  process.exit(1);
}

const hasComponents = Array.isArray(data.components);
const hasQuizzes    = data.quizzes && typeof data.quizzes === 'object';
const hasNotes      = Array.isArray(data.notes);
const hasProtos     = Array.isArray(data.prototypes);
const hasSettings   = data.settings && typeof data.settings === 'object';

if (!hasComponents && !hasQuizzes && !hasNotes && !hasProtos && !hasSettings) {
  console.error('❌ Nothing to seed  file has no components/quizzes/notes/prototypes/settings. - seed.js:61');
  process.exit(1);
}

// ---- Perform the seed in a single transaction ----
db.exec('BEGIN');

let counts = {
  components: 0,
  quizzes: 0,
  questions: 0,
  notes: 0,
  prototypes: 0,
  settings: 0
};

try {
  // ----- Components -----
  if (hasComponents) {
    db.exec('DELETE FROM components');
    for (const c of data.components) {
      db.prepare(
        'INSERT INTO components (name, symbol, category, func) VALUES (?, ?, ?, ?)'
      ).run(
        c.name,
        c.symbol || '',
        c.category || 'passive',
        c.func || c.function || ''
      );
      counts.components++;
    }
  }

  // ----- Quizzes (nested questions) -----
  if (hasQuizzes) {
    db.exec('DELETE FROM quiz_questions');
    db.exec('DELETE FROM quizzes');
    for (const [k, q] of Object.entries(data.quizzes)) {
      if (!q || typeof q !== 'object') continue;

      const info = db.prepare(
        'INSERT INTO quizzes (quiz_key, title, level) VALUES (?, ?, ?)'
      ).run(k, q.title || k, q.level || 'beginner');
      const qid = Number(info.lastInsertRowid);
      counts.quizzes++;

      const questions = Array.isArray(q.questions) ? q.questions : [];
      questions.forEach((question, i) => {
        // Some backups use `question.q` or `question.text` — handle both
        const qText = question.q || question.text || '';
        const opts  = Array.isArray(question.options) ? question.options
                    : Array.isArray(question.answers) ? question.answers
                    : [];
        const ans   = typeof question.answer === 'number'
                    ? question.answer
                    : (typeof question.correct === 'number' ? question.correct : 0);

        db.prepare(
          'INSERT INTO quiz_questions (quiz_id, q, options, answer, explanation, order_num) VALUES (?, ?, ?, ?, ?, ?)'
        ).run(
          qid,
          qText,
          JSON.stringify(opts),
          ans,
          question.explanation || '',
          i
        );
        counts.questions++;
      });
    }
  }

  // ----- Notes -----
  if (hasNotes) {
    db.exec('DELETE FROM notes');
    for (const n of data.notes) {
      if (!n || !n.id || !n.title) {
        console.warn('⚠️ Skipping note without id or title: - seed.js:138', n && (n.title || n.id));
        continue;
      }
      db.prepare(
        'INSERT OR IGNORE INTO notes (note_key, title, category, meta, summary, content, thumb) VALUES (?, ?, ?, ?, ?, ?, ?)'
      ).run(
        n.id,
        n.title,
        n.category || '',
        n.meta || '',
        n.summary || '',
        n.content || '',
        n.thumb || ''
      );
      counts.notes++;
    }
  }

  // ----- Prototypes -----
  if (hasProtos) {
    db.exec('DELETE FROM prototypes');
    for (const p of data.prototypes) {
      if (!p || !p.id || !p.title) {
        console.warn('⚠️ Skipping prototype without id or title: - seed.js:161', p && (p.title || p.id));
        continue;
      }
      db.prepare(
        'INSERT OR IGNORE INTO prototypes (proto_key, title, category, meta, summary, content, thumb) VALUES (?, ?, ?, ?, ?, ?, ?)'
      ).run(
        p.id,
        p.title,
        p.category || '',
        p.meta || '',
        p.summary || '',
        p.content || '',
        p.thumb || ''
      );
      counts.prototypes++;
    }
  }

  // ----- Settings -----
  if (hasSettings) {
    db.exec('DELETE FROM settings');
    for (const [k, v] of Object.entries(data.settings)) {
      db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run(k, String(v));
      counts.settings++;
    }
  }

  db.exec('COMMIT');

  // ---- Success report ----
  console.log('✅ Seed complete: - seed.js:191');
  console.log('');
  console.log('Components   : - seed.js:193' + counts.components);
  console.log('Quizzes      : - seed.js:194' + counts.quizzes);
  console.log('Questions    : - seed.js:195' + counts.questions);
  console.log('Notes        : - seed.js:196' + counts.notes);
  console.log('Prototypes   : - seed.js:197' + counts.prototypes);
  console.log('Settings     : - seed.js:198' + counts.settings);
  console.log('');
  console.log('Database     : - seed.js:200' + path.join(__dirname, 'db', 'kudenga.db'));
  console.log('');
  console.log('👉 Restart the server (Ctrl+C, then `node server.js`) to see the content. - seed.js:202');

} catch (e) {
  db.exec('ROLLBACK');
  console.error('');
  console.error('❌ Seed failed: - seed.js:207', e.message);
  console.error('Transaction rolled back  database unchanged. - seed.js:208');
  process.exit(1);
}