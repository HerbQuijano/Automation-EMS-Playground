const express = require("express");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const yaml = require("js-yaml");
const fs = require("fs");
const path = require("path");

const { initSchema } = require("./db/schema");
const { errorHandler, notFound } = require("./middlewares/error");

const healthRoutes = require("./routes/health.routes");
const authRoutes = require("./routes/auth.routes");
const employeesRoutes = require("./routes/employees.routes");
const { requestId } = require("./middlewares/requestId");
const qaRoutes = require("./routes/qa.routes");
const auditRoutes = require("./routes/audit.routes");

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(requestId);
app.use("/api", qaRoutes);
app.use("/api/audit", auditRoutes);

// DB schema init on boot (simple dev-friendly)
initSchema().catch((err) => {
  console.error("DB init failed:", err);
  process.exit(1);
});

// Routes
app.use("/api", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/employees", employeesRoutes);

// Swagger
const openApiPath = path.join(__dirname, "swagger", "openapi.yaml");
const spec = yaml.load(fs.readFileSync(openApiPath, "utf8"));
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(spec));

// Errors
app.use(notFound);
app.use(errorHandler);

module.exports = app;
