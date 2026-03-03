const express = require("express");
const { all } = require("../db");
const { requireAuth, requireRole } = require("../middlewares/auth");

const router = express.Router();

// Solo admin para no regalar auditoría al mundo 😅
router.get("/", requireAuth, requireRole("admin"), async (req, res, next) => {
  try {
    const limitRaw = Number(req.query.limit ?? 50);
    const limit = Math.min(Math.max(limitRaw, 1), 200);

    const entity_type = req.query.entity_type ?? null;
    const entity_id = req.query.entity_id ? Number(req.query.entity_id) : null;
    const action = req.query.action ?? null;
    const request_id = req.query.request_id ?? null;

    const where = [];
    const params = [];

    if (entity_type) { where.push("entity_type = ?"); params.push(entity_type); }
    if (entity_id != null && !Number.isNaN(entity_id)) { where.push("entity_id = ?"); params.push(entity_id); }
    if (action) { where.push("action = ?"); params.push(action); }
    if (request_id) { where.push("request_id = ?"); params.push(request_id); }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const rows = await all(
      `SELECT id, actor_user_id, action, entity_type, entity_id, request_id, details_json, created_at
       FROM audit_logs
       ${whereSql}
       ORDER BY id DESC
       LIMIT ?`,
      [...params, limit]
    );

    res.json({ data: rows });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
