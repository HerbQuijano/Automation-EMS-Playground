const { get } = require("../db");

async function requireAuth(req, res, next) {
  try {
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;

    if (!token) return res.status(401).json({ error: "Missing token" });

    const session = await get(
      `SELECT s.token, s.expires_at, u.id as user_id, u.email, u.role, u.is_locked
       FROM sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.token = ?`,
      [token]
    );

    if (!session) return res.status(401).json({ error: "Invalid token" });

    if (session.is_locked) return res.status(403).json({ error: "User locked" });

    const now = new Date();
    const exp = new Date(session.expires_at);
    if (now > exp) return res.status(401).json({ error: "Token expired" });

    req.user = { id: session.user_id, email: session.email, role: session.role };
    next();
  } catch (err) {
    next(err);
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: "Not authenticated" });
    if (!roles.includes(req.user.role)) return res.status(403).json({ error: "Forbidden" });
    next();
  };
}

module.exports = { requireAuth, requireRole };
