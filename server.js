require('dotenv').config();
const express = require('express');
const session = require('express-session');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const bcrypt = require('bcryptjs');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;
const isProd = process.env.NODE_ENV === 'production';

// Ensure db folder exists before requiring lib/db
const dbDir = path.join(__dirname, 'db');
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

const db = require('./lib/db');

// ================================================================
// SCHEMA — created once, safe to re-run
// ================================================================
db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'admin',
  created_at INTEGER DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS students (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  registered_by TEXT DEFAULT 'self',
  created_at INTEGER DEFAULT (unixepoch()),
  approved_at INTEGER,
  rejected_at INTEGER
);

CREATE TABLE IF NOT EXISTS components (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  symbol TEXT DEFAULT '',
  category TEXT DEFAULT 'passive',
  func TEXT DEFAULT '',
  order_num INTEGER DEFAULT 0,
  created_at INTEGER DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS quizzes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  quiz_key TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  level TEXT DEFAULT 'beginner',
  order_num INTEGER DEFAULT 0,
  created_at INTEGER DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS quiz_questions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  quiz_id INTEGER NOT NULL,
  q TEXT NOT NULL,
  options TEXT NOT NULL,
  answer INTEGER NOT NULL,
  explanation TEXT DEFAULT '',
  order_num INTEGER DEFAULT 0,
  FOREIGN KEY(quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  note_key TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  category TEXT DEFAULT '',
  meta TEXT DEFAULT '',
  summary TEXT DEFAULT '',
  content TEXT DEFAULT '',
  thumb TEXT DEFAULT '',
  hidden INTEGER DEFAULT 0,
  order_num INTEGER DEFAULT 0,
  created_at INTEGER DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS prototypes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  proto_key TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  category TEXT DEFAULT '',
  meta TEXT DEFAULT '',
  summary TEXT DEFAULT '',
  content TEXT DEFAULT '',
  thumb TEXT DEFAULT '',
  hidden INTEGER DEFAULT 0,
  order_num INTEGER DEFAULT 0,
  created_at INTEGER DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS quiz_attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id TEXT NOT NULL,
  quiz_key TEXT NOT NULL,
  score INTEGER NOT NULL,
  total INTEGER NOT NULL,
  details TEXT DEFAULT '[]',
  attempted_at INTEGER DEFAULT (unixepoch()),
  FOREIGN KEY(student_id) REFERENCES students(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS progress (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id TEXT NOT NULL,
  track_id TEXT NOT NULL,
  completed TEXT DEFAULT '[]',
  last_step TEXT DEFAULT '',
  updated_at INTEGER DEFAULT (unixepoch()),
  UNIQUE(student_id, track_id),
  FOREIGN KEY(student_id) REFERENCES students(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS bookmarks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id TEXT NOT NULL,
  item_key TEXT NOT NULL,
  created_at INTEGER DEFAULT (unixepoch()),
  UNIQUE(student_id, item_key),
  FOREIGN KEY(student_id) REFERENCES students(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS badges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id TEXT NOT NULL,
  badge_key TEXT NOT NULL,
  unlocked_at INTEGER DEFAULT (unixepoch()),
  UNIQUE(student_id, badge_key),
  FOREIGN KEY(student_id) REFERENCES students(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS activity (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id TEXT NOT NULL,
  activity_date TEXT NOT NULL,
  count INTEGER DEFAULT 0,
  UNIQUE(student_id, activity_date),
  FOREIGN KEY(student_id) REFERENCES students(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS recent_views (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id TEXT NOT NULL,
  item_key TEXT NOT NULL,
  label TEXT NOT NULL,
  type TEXT NOT NULL,
  viewed_at INTEGER DEFAULT (unixepoch()),
  FOREIGN KEY(student_id) REFERENCES students(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_attempts_student ON quiz_attempts(student_id);
CREATE INDEX IF NOT EXISTS idx_progress_student ON progress(student_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_student ON bookmarks(student_id);
CREATE INDEX IF NOT EXISTS idx_badges_student ON badges(student_id);
CREATE INDEX IF NOT EXISTS idx_activity_student ON activity(student_id);
CREATE INDEX IF NOT EXISTS idx_recent_student ON recent_views(student_id);
CREATE INDEX IF NOT EXISTS idx_questions_quiz ON quiz_questions(quiz_id);
`);

// ================================================================
// SEED ADMIN (idempotent — only runs once)
// ================================================================
if (process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD) {
  const exists = db.prepare('SELECT id FROM users WHERE username = ?')
    .get(process.env.ADMIN_USERNAME);
  if (!exists) {
    const hash = bcrypt.hashSync(process.env.ADMIN_PASSWORD, 12);
    db.prepare('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)')
      .run(process.env.ADMIN_USERNAME, hash, 'admin');
    console.log(`✅ Admin "${process.env.ADMIN_USERNAME}" seeded - server.js:185`);
  }
}

// ================================================================
// MIDDLEWARE
// ================================================================
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      scriptSrcAttr: ["'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", "data:"]
    }
  },
  crossOriginEmbedderPolicy: false
}));

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: false, limit: '5mb' }));

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { error: 'Too many attempts. Try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});

app.use(session({
  secret: process.env.SESSION_SECRET || 'change-this-in-env',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProd,
    maxAge: 1000 * 60 * 60 * 24 * 7
  }
}));

// Attach db to every request
app.use((req, res, next) => { req.db = db; next(); });

// ================================================================
// ROUTES
// ================================================================
app.use('/api/auth/login', loginLimiter);
app.use('/api/auth',        require('./routes/auth')(db));
app.use('/api/students',    require('./routes/students')(db));
app.use('/api/content',     require('./routes/content')(db));
app.use('/api/me',          require('./routes/user-data')(db));
app.use('/api/export',      require('./routes/export')(db));

// ================================================================
// CONFIG (branding for the frontend)
// ================================================================
app.get('/api/config', (req, res) => {
  res.json({
    name:     process.env.SITE_NAME     || 'KudengaTechLab',
    email:    process.env.SITE_EMAIL    || '',
    location: process.env.SITE_LOCATION || ''
  });
});

// ================================================================
// STATIC FILES
// ================================================================
app.use(express.static(path.join(__dirname, 'public')));

// Root redirect
app.get('/', (req, res) => res.redirect('/index.html'));


// ================================================================
// CONTACT FORM
// ================================================================
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many messages sent, please try again later.'
});

app.post('/api/contact', contactLimiter, (req, res) => {
  const { name, email, service, message } = req.body || {};
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email, and message are required.' });
  }
  try {
    db.prepare('INSERT INTO messages (name, email, service, message) VALUES (?, ?, ?, ?)')
      .run(name, email, service || 'General', message);
    console.log('[CONTACT] New message from ' + name + ' (' + email + ')');
    res.json({ success: true, message: 'Message received!' });
  } catch (err) {
    console.error('[CONTACT] Error:', err);
    res.status(500).json({ error: 'Failed to save message. Please try again.' });
  }
});
// 404 fallback
app.use((req, res) => res.status(404).json({ error: 'Not found' }));

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Server error' });
});

// ================================================================
// START
// ================================================================
app.listen(PORT, () => {
  console.log(`🔬 KudengaTechLab running: http://localhost:${PORT} - server.js:275`);
});