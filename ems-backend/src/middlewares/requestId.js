const crypto = require("crypto");

function requestId(req, res, next) {
  const id = crypto.randomBytes(8).toString("hex");
  req.requestId = id;
  res.setHeader("X-Request-Id", id);
  next();
}

module.exports = { requestId };
