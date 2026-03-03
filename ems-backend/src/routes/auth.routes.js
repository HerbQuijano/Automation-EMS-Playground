const express = require("express");
const crypto = require("crypto");
const { get, run } = require("../db");

const router = express.Router();

function hashPassword(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 120000, 32, "sha256").toString("hex");
}

function makeToken() {
  return crypto.randomBytes(24).toString("hex");
}

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: "email and password required" });

    const user = await get(
      `SELECT id, email, password_hash, password_salt, role, is_locked
       FROM users WHERE email = ?`,
      [email]
    );

    if (!user) return res.status(401).json({ error: "Invalid credentials" });
    if (user.is_locked) return res.status(403).json({ error: "User locked" });

    const calc = hashPassword(password, user.password_salt);
    if (calc !== user.password_hash) return res.status(401).json({ error: "Invalid credentials" });

    const token = makeToken();
    const expires = new Date(Date.now() + 1000 * 60 * 60 * 8); // 8h
    const expires_at = expires.toISOString();

    await run(`INSERT INTO sessions (user_id, token, expires_at) VALUES (?, ?, ?)`, [
      user.id,
      token,
      expires_at
    ]);

    await run(`UPDATE users SET last_login = datetime('now') WHERE id = ?`, [user.id]);

    res.json({
      token,
      expires_at,
      user: { id: user.id, email: user.email, role: user.role }
    });
  } catch (err) {
    next(err);
  }
});

const { requireAuth } = require("../middlewares/auth");

router.get("/me", requireAuth, async (req, res) => {
  res.json({ user: req.user });
});

router.post("/logout", requireAuth, async (req, res, next) => {
  try {
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
    if (token) await run("DELETE FROM sessions WHERE token = ?", [token]);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
