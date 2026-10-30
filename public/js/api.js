/**
 * KudengaTechLab — client API helper
 * Replaces all localStorage calls with fetch() to the server.
 * Load this script BEFORE any other <script> that uses the API.
 */
(function () {
  'use strict';

  async function call(url, opts) {
    opts = opts || {};
    const res = await fetch(url, {
      method: opts.method || 'GET',
      headers: Object.assign({ 'Content-Type': 'application/json' }, opts.headers || {}),
      credentials: 'same-origin',
      body: opts.body ? JSON.stringify(opts.body) : undefined
    });

    // Redirect on 401 (except for /auth/me which is polled on every page)
    if (res.status === 401 && url.indexOf('/api/auth/me') === -1) {
      window.dispatchEvent(new CustomEvent('ktl:unauthorized'));
      throw new Error('Unauthorized');
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Request failed (' + res.status + ')');
    }
    return res.json();
  }

  window.API = {
    // ================= AUTH =================
    me:            ()                    => call('/api/auth/me'),
    loginStudent:  (email, password)     => call('/api/auth/login-student', { method: 'POST', body: { email, password } }),
    loginAdmin:    (password)            => call('/api/auth/login-admin',   { method: 'POST', body: { password } }),
    register:      (name, email, password) => call('/api/auth/register',    { method: 'POST', body: { name, email, password } }),
    logout:        ()                    => call('/api/auth/logout',         { method: 'POST' }),

    // ================= CONTENT (bundled — mirrors old localStorage object) =================
    loadContent:   ()                    => call('/api/content/all'),

    // ================= COMPONENTS (admin) =================
    addComponent:    (data) => call('/api/content/components',     { method: 'POST', body: data }),
    updateComponent: (id, data) => call('/api/content/components/' + id, { method: 'PUT', body: data }),
    deleteComponent: (id) => call('/api/content/components/' + id, { method: 'DELETE' }),

    // ================= QUIZZES (admin) =================
    addQuiz:    (data) => call('/api/content/quizzes',       { method: 'POST', body: data }),
    updateQuiz: (key, data) => call('/api/content/quizzes/' + key, { method: 'PUT', body: data }),
    deleteQuiz: (key) => call('/api/content/quizzes/' + key, { method: 'DELETE' }),

    // ================= NOTES (admin) =================
    addNote:    (data) => call('/api/content/notes',       { method: 'POST', body: data }),
    updateNote: (key, data) => call('/api/content/notes/' + key, { method: 'PUT', body: data }),
    deleteNote: (key) => call('/api/content/notes/' + key, { method: 'DELETE' }),

    // ================= PROTOTYPES (admin) =================
    addProto:    (data) => call('/api/content/prototypes',       { method: 'POST', body: data }),
    updateProto: (key, data) => call('/api/content/prototypes/' + key, { method: 'PUT', body: data }),
    deleteProto: (key) => call('/api/content/prototypes/' + key, { method: 'DELETE' }),

    // ================= SETTINGS (admin) =================
    saveSettings: (data) => call('/api/content/settings', { method: 'PUT', body: data }),

    // ================= STUDENTS (admin) =================
    listStudents:    ()     => call('/api/students'),
   getStudent:      (id)   => call('/api/students/' + id),
listAllAttempts: ()     => call('/api/students/attempts/all'),
    addStudent:      (data) => call('/api/students',         { method: 'POST', body: data }),
    approveStudent:  (id)   => call('/api/students/' + id + '/approve', { method: 'POST' }),
    rejectStudent:   (id)   => call('/api/students/' + id + '/reject',  { method: 'POST' }),
    deleteStudent:   (id)   => call('/api/students/' + id,   { method: 'DELETE' }),

    // ================= QUIZ ATTEMPTS (student) =================
    getQuizAttempts:  ()     => call('/api/me/quiz-attempts'),
    saveQuizAttempt:  (data) => call('/api/me/quiz-attempts', { method: 'POST', body: data }),

    // ================= PROGRESS (student) =================
    getProgress:   ()                    => call('/api/me/progress'),
    completeStep:  (trackId, stepKey)    => call('/api/me/progress/complete-step', { method: 'POST', body: { trackId, stepKey } }),

    // ================= BOOKMARKS (student) =================
    getBookmarks:   ()    => call('/api/me/bookmarks'),
    addBookmark:    (key) => call('/api/me/bookmarks/' + encodeURIComponent(key), { method: 'POST' }),
    removeBookmark: (key) => call('/api/me/bookmarks/' + encodeURIComponent(key), { method: 'DELETE' }),

    // ================= BADGES (student) =================
    getBadges:    ()    => call('/api/me/badges'),
    unlockBadge:  (key) => call('/api/me/badges/' + encodeURIComponent(key), { method: 'POST' }),

    // ================= ACTIVITY (student) =================
    getActivity:  ()     => call('/api/me/activity'),
    pingActivity: ()     => call('/api/me/activity/ping', { method: 'POST' }),

    // ================= RECENT (student) =================
    getRecent:   ()     => call('/api/me/recent'),
    saveRecent:  (data) => call('/api/me/recent', { method: 'POST', body: data }),

    // ================= BACKUP / EXPORT (admin) =================
    // Returns a Blob — feed to URL.createObjectURL() for download
    backup: () => fetch('/api/export/backup', { credentials: 'same-origin' })
      .then(r => {
        if (!r.ok) throw new Error('Backup failed');
        return r.blob();
      }),

    restore: (data) => call('/api/export/restore', { method: 'POST', body: data }),

    // Convenience: trigger download of a server-generated CSV
    downloadCSV: (kind) => {
      // kind = 'students' | 'attempts'
      const url = '/api/export/' + kind + '.csv';
      const a = document.createElement('a');
      a.href = url;
      a.download = '';  // let server set filename
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    },

    // ================= CONFIG =================
    config: () => call('/api/config')
  };

  // Auto-dispatch a global event when session expires, so pages can
  // react (e.g. show login again) without each fetch handling it.
  window.addEventListener('ktl:unauthorized', function () {
    console.warn('[api] Session expired  user must reauthenticate - api.js:128');
  });
})();