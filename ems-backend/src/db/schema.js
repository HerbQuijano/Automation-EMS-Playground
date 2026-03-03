const { run } = require("./index");

async function initSchema() {
  // foreign keys on
  await run("PRAGMA foreign_keys = ON;");

  await run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      password_salt TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'viewer',
      is_locked INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      last_login TEXT
    );
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token TEXT UNIQUE NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      expires_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS employees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      department TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      salary INTEGER NOT NULL DEFAULT 0,
      hire_date TEXT NOT NULL,
      manager_id INTEGER,
      employment_type TEXT NOT NULL DEFAULT 'full_time',
      overtime_eligible INTEGER NOT NULL DEFAULT 0,
      workload_pct INTEGER NOT NULL DEFAULT 100,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT,
      FOREIGN KEY(manager_id) REFERENCES employees(id) ON DELETE SET NULL
    );
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      actor_user_id INTEGER,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id INTEGER,
      request_id TEXT,
      details_json TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY(actor_user_id) REFERENCES users(id) ON DELETE SET NULL
    );
  `);

  await run(
    `CREATE INDEX IF NOT EXISTS idx_audit_created_at ON audit_logs(created_at);`
  );
  await run(
    `CREATE INDEX IF NOT EXISTS idx_audit_actor ON audit_logs(actor_user_id);`
  );
  await run(
    `CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_logs(entity_type, entity_id);`
  );
}

async function resetSchema() {
  await run("PRAGMA foreign_keys = OFF;");
  await run("DROP TABLE IF EXISTS sessions;");
  await run("DROP TABLE IF EXISTS employees;");
  await run("DROP TABLE IF EXISTS users;");
  await run("PRAGMA foreign_keys = ON;");
  await initSchema();
}

module.exports = { initSchema, resetSchema };
