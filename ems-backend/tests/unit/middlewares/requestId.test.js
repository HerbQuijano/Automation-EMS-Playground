const { requestId } = require("../../../src/middlewares/requestId");

describe("requestId middleware", () => {
  let req, res, next;

  beforeEach(() => {
    req = {};
    res = { setHeader: jest.fn() };
    next = jest.fn();
  });

  it("sets a 16-character hex requestId on req", () => {
    requestId(req, res, next);
    expect(req.requestId).toMatch(/^[0-9a-f]{16}$/);
  });

  it("sets X-Request-Id response header matching req.requestId", () => {
    requestId(req, res, next);
    expect(res.setHeader).toHaveBeenCalledWith("X-Request-Id", req.requestId);
  });

  it("calls next()", () => {
    requestId(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith();
  });

  it("generates a unique ID per request", () => {
    const req2 = {};
    requestId(req, res, next);
    requestId(req2, res, next);
    expect(req.requestId).not.toBe(req2.requestId);
  });
});
