const express = require("express");
const { all, get, run } = require("../db");
const { requireAuth, requireRole } = require("../middlewares/auth");
const { writeAuditLog } = require("../services/audit.service");

const router = express.Router();

router.use(requireAuth);

// GET /api/employees?search=&page=&limit=&status=&department=
router.get("/", async (req, res, next) => {
  try {
    const {
      search = "",
      status,
      department,
      page = "1",
      limit = "10",
    } = req.query;

    const p = Math.max(parseInt(page, 10) || 1, 1);
    const l = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);
    const offset = (p - 1) * l;

    const where = [];
    const params = [];

    if (search) {
      where.push("(first_name LIKE ? OR last_name LIKE ? OR email LIKE ?)");
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (status) {
      where.push("status = ?");
      params.push(status);
    }
    if (department) {
      where.push("department = ?");
      params.push(department);
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const rows = await all(
      `SELECT id, first_name, last_name, email, phone, department, status, salary, hire_date, manager_id, notes
       FROM employees
       ${whereSql}
       ORDER BY id DESC
       LIMIT ? OFFSET ?`,
      [...params, l, offset]
    );

    // total count
    const countRow = await get(
      `SELECT COUNT(*) as total FROM employees ${whereSql}`,
      params
    );

    res.json({
      page: p,
      limit: l,
      total: countRow.total,
      data: rows,
    });
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const row = await get(`SELECT * FROM employees WHERE id = ?`, [
      req.params.id,
    ]);
    if (!row) return res.status(404).json({ error: "Employee not found" });
    res.json(row);
  } catch (err) {
    next(err);
  }
});

// Create: only admin/manager
router.post("/", requireRole("admin", "manager"), async (req, res, next) => {
  try {
    const {
      first_name,
      last_name,
      email,
      phone = null,
      department,
      status = "active",
      salary = 0,
      hire_date,
      manager_id = null,
      notes = "",
      employment_type = "full_time",
      overtime_eligible = 0,
      workload_pct = 100,
    } = req.body || {};

    if (!first_name || !last_name || !email || !department || !hire_date) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const result = await run(
      `INSERT INTO employees (first_name, last_name, email, phone, department, status, salary, hire_date, manager_id, employment_type, overtime_eligible, workload_pct, notes, updated_at)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
      [
        first_name,
        last_name,
        email,
        phone,
        department,
        status,
        salary,
        hire_date,
        manager_id,
        employment_type,
        Number(overtime_eligible) ? 1 : 0,
        Math.min(Math.max(Number(workload_pct ?? 100), 0), 100),
        notes,
      ]
    );

    const created = await get("SELECT * FROM employees WHERE id = ?", [
      result.lastID,
    ]);
    // Create?
    await writeAuditLog({
      actor_user_id: req.user.id,
      action: "EMPLOYEE_CREATED",
      entity_type: "employee",
      entity_id: created.id,
      request_id: req.requestId,
      details: { email: created.email, department: created.department },
    });

    return res.status(201).json(created);
  } catch (err) {
    // common: unique email
    if (String(err.message || "").includes("UNIQUE")) {
      return res.status(409).json({ error: "Email already exists" });
    }
    next(err);
  }
});

// Update: only admin/manager
router.put("/:id", requireRole("admin", "manager"), async (req, res, next) => {
  try {
    const id = req.params.id;
    const existing = await get("SELECT id FROM employees WHERE id = ?", [id]);
    if (!existing) return res.status(404).json({ error: "Employee not found" });

    const fields = [
      "first_name",
      "last_name",
      "email",
      "phone",
      "department",
      "status",
      "salary",
      "hire_date",
      "manager_id",
      "notes",
      "employment_type",
      "overtime_eligible",
      "workload_pct",
    ];

    const updates = [];
    const params = [];

    if (Object.prototype.hasOwnProperty.call(req.body, "overtime_eligible")) {
      req.body.overtime_eligible = Number(req.body.overtime_eligible) ? 1 : 0;
    }
    if (Object.prototype.hasOwnProperty.call(req.body, "workload_pct")) {
      const w = Number(req.body.workload_pct);
      req.body.workload_pct = Math.min(
        Math.max(Number.isNaN(w) ? 100 : w, 0),
        100
      );
    }

    for (const f of fields) {
      if (Object.prototype.hasOwnProperty.call(req.body, f)) {
        updates.push(`${f} = ?`);
        params.push(req.body[f]);
      }
    }

    if (updates.length === 0)
      return res.status(400).json({ error: "No fields to update" });

    await run(
      `UPDATE employees SET ${updates.join(
        ", "
      )}, updated_at = datetime('now') WHERE id = ?`,
      [...params, id]
    );

    const updated = await get("SELECT * FROM employees WHERE id = ?", [id]);

    // Update?
    await writeAuditLog({
      actor_user_id: req.user.id,
      action: "EMPLOYEE_UPDATED",
      entity_type: "employee",
      entity_id: updated.id,
      request_id: req.requestId,
      details: { updated_fields: Object.keys(req.body || {}) },
    });

    return res.json(updated);
  } catch (err) {
    if (String(err.message || "").includes("UNIQUE")) {
      return res.status(409).json({ error: "Email already exists" });
    }
    next(err);
  }
});

// Delete: only admin
router.delete("/:id", requireRole("admin"), async (req, res, next) => {
  try {
    const id = req.params.id;
    const existing = await get("SELECT id FROM employees WHERE id = ?", [id]);
    if (!existing) return res.status(404).json({ error: "Employee not found" });

    await run("DELETE FROM employees WHERE id = ?", [id]);

    // Delete?
    await writeAuditLog({
      actor_user_id: req.user.id,
      action: "EMPLOYEE_DELETED",
      entity_type: "employee",
      entity_id: Number(id),
      request_id: req.requestId,
      details: {},
    });

    return res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
