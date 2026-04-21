jest.mock("../../../src/db");

const { get } = require("../../../src/db");
const { requireAuth, requireRole } = require("../../../src/middlewares/auth");

const mockRes = () => {
  const json = jest.fn();
  const res = { status: jest.fn().mockReturnValue({ json }), _json: json };
  return res;
};

const validSession = (overrides = {}) => ({
  token: "tok",
  expires_at: new Date(Date.now() + 3_600_000).toISOString(),
  user_id: 1,
  email: "admin@ems.local",
  role: "admin",
  is_locked: 0,
  ...overrides,
});

describe("requireAuth", () => {
  let req, res, next;

  beforeEach(() => {
    req = { headers: {} };
    res = mockRes();
    next = jest.fn();
    jest.clearAllMocks();
  });

  it("returns 401 when Authorization header is absent", async () => {
    await requireAuth(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res._json).toHaveBeenCalledWith({ error: "Missing token" });
  });

  it("returns 401 when Authorization is not Bearer format", async () => {
    req.headers.authorization = "Basic dXNlcjpwYXNz";
    await requireAuth(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res._json).toHaveBeenCalledWith({ error: "Missing token" });
  });

  it("returns 401 when session is not found in DB", async () => {
    req.headers.authorization = "Bearer ghost";
    get.mockResolvedValue(null);
    await requireAuth(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res._json).toHaveBeenCalledWith({ error: "Invalid token" });
  });

  it("returns 403 when user account is locked", async () => {
    req.headers.authorization = "Bearer tok";
    get.mockResolvedValue(validSession({ is_locked: 1 }));
    await requireAuth(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res._json).toHaveBeenCalledWith({ error: "User locked" });
  });

  it("returns 401 when token is expired", async () => {
    req.headers.authorization = "Bearer tok";
    get.mockResolvedValue(validSession({ expires_at: new Date(Date.now() - 1000).toISOString() }));
    await requireAuth(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res._json).toHaveBeenCalledWith({ error: "Token expired" });
  });

  it("sets req.user and calls next() for a valid session", async () => {
    req.headers.authorization = "Bearer tok";
    get.mockResolvedValue(validSession({ user_id: 7, email: "mgr@ems.local", role: "manager" }));
    await requireAuth(req, res, next);
    expect(req.user).toEqual({ id: 7, email: "mgr@ems.local", role: "manager" });
    expect(next).toHaveBeenCalledWith();
  });

  it("forwards DB errors to next(err)", async () => {
    req.headers.authorization = "Bearer tok";
    const err = new Error("DB down");
    get.mockRejectedValue(err);
    await requireAuth(req, res, next);
    expect(next).toHaveBeenCalledWith(err);
  });
});

describe("requireRole", () => {
  let res, next;

  beforeEach(() => {
    res = mockRes();
    next = jest.fn();
  });

  it("returns 401 when req.user is not set", () => {
    requireRole("admin")({}, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res._json).toHaveBeenCalledWith({ error: "Not authenticated" });
  });

  it("returns 403 when user role is not in the allowed list", () => {
    requireRole("admin")({ user: { role: "viewer" } }, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res._json).toHaveBeenCalledWith({ error: "Forbidden" });
  });

  it("calls next() when role matches", () => {
    requireRole("admin", "manager")({ user: { role: "manager" } }, res, next);
    expect(next).toHaveBeenCalledWith();
  });

  it("calls next() for every role in the allow-list", () => {
    ["admin", "manager", "viewer"].forEach((role) => {
      const n = jest.fn();
      requireRole("admin", "manager", "viewer")({ user: { role } }, res, n);
      expect(n).toHaveBeenCalledWith();
    });
  });
});
