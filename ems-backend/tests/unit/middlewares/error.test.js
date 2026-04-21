const { notFound, errorHandler } = require("../../../src/middlewares/error");

const mockRes = () => {
  const json = jest.fn();
  const res = { status: jest.fn().mockReturnValue({ json }), _json: json };
  return res;
};

describe("notFound", () => {
  it("responds with 404 and error body", () => {
    const res = mockRes();
    notFound({}, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res._json).toHaveBeenCalledWith({ error: "Not found" });
  });
});

describe("errorHandler", () => {
  beforeEach(() => jest.spyOn(console, "error").mockImplementation(() => {}));
  afterEach(() => console.error.mockRestore());

  it("responds with 500 and error body", () => {
    const res = mockRes();
    errorHandler(new Error("boom"), {}, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res._json).toHaveBeenCalledWith({ error: "Internal server error" });
  });

  it("logs the error", () => {
    const err = new Error("logged");
    errorHandler(err, {}, mockRes(), jest.fn());
    expect(console.error).toHaveBeenCalledWith(err);
  });
});
