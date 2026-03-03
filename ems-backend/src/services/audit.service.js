const { run } = require("../db");

async function writeAuditLog({
  actor_user_id = null,
  action,
  entity_type,
  entity_id = null,
  request_id = null,
  details = null
}) {
  const details_json = details ? JSON.stringify(details) : null;

  await run(
    `INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, request_id, details_json)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [actor_user_id, action, entity_type, entity_id, request_id, details_json]
  );
}

module.exports = { writeAuditLog };
