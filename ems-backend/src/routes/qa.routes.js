const express = require("express");
const { writeAuditLog } = require("../services/audit.service");
const { requireAuth } = require("../middlewares/auth");

const router = express.Router();

// GET /api/slow?ms=1500
router.get("/slow", requireAuth, async (req, res, next) => {
  try {
    const msRaw = Number(req.query.ms ?? 1500);
    const ms = Math.min(Math.max(msRaw, 0), 15000);

    await writeAuditLog({
      actor_user_id: req.user.id,
      action: "QA_SLOW_CALLED",
      entity_type: "qa",
      entity_id: null,
      request_id: req.requestId,
      details: { ms }
    });

    setTimeout(() => {
      res.json({ ok: true, delayed_ms: ms, request_id: req.requestId });
    }, ms);
  } catch (err) {
    next(err);
  }
});

// GET /api/flaky?failRate=0.3
// failRate: 0.0 - 1.0 (probabilidad de fallar)
router.get("/flaky", requireAuth, async (req, res, next) => {
  try {
    const frRaw = Number(req.query.failRate ?? 0.3);
    const failRate = Math.min(Math.max(frRaw, 0), 1);

    const roll = Math.random();
    const shouldFail = roll < failRate;

    await writeAuditLog({
      actor_user_id: req.user.id,
      action: "QA_FLAKY_CALLED",
      entity_type: "qa",
      entity_id: null,
      request_id: req.requestId,
      details: { failRate, roll, shouldFail }
    });

    if (shouldFail) {
      // falla "realista"
      return res.status(503).json({
        error: "Service temporarily unavailable (flaky)",
        request_id: req.requestId
      });
    }

    res.json({ ok: true, roll, failRate, request_id: req.requestId });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
