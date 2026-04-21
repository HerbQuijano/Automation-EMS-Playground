jest.mock("../../../src/db");

const { run } = require("../../../src/db");
const { writeAuditLog } = require("../../../src/services/audit.service");

describe("writeAuditLog", () => {
  beforeEach(() => {
    run.mockResolvedValue({ lastID: 1, changes: 1 });
  });

  afterEach(() => jest.clearAllMocks());

  it("inserts a row with all provided fields", async () => {
    await writeAuditLog({
      actor_user_id: 1,
      action: "EMPLOYEE_CREATED",
      entity_type: "employee",
      entity_id: 42,
      request_id: "abc123",
      details: { department: "QA" },
    });

    expect(run).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO audit_logs"),
      [1, "EMPLOYEE_CREATED", "employee", 42, "abc123", JSON.stringify({ department: "QA" })]
    );
  });

  it("passes null for every omitted optional field", async () => {
    await writeAuditLog({ action: "EMPLOYEE_DELETED", entity_type: "employee" });

    expect(run).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO audit_logs"),
      [null, "EMPLOYEE_DELETED", "employee", null, null, null]
    );
  });

  it("JSON-stringifies the details object", async () => {
    const details = { updated_fields: ["email", "status"], count: 2 };
    await writeAuditLog({ action: "EMPLOYEE_UPDATED", entity_type: "employee", details });

    const params = run.mock.calls[0][1];
    expect(params[5]).toBe(JSON.stringify(details));
  });

  it("passes null for details when not provided", async () => {
    await writeAuditLog({ action: "QA_SLOW_CALLED", entity_type: "qa" });

    const params = run.mock.calls[0][1];
    expect(params[5]).toBeNull();
  });
});
