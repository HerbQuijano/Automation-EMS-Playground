/*const app = require("./src/app");

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`EMS API running on http://localhost:${PORT}`);
  console.log(`Swagger UI:      http://localhost:${PORT}/api/docs`);
});*/

const app = require("./src/app");

const PORT = process.env.PORT || 3000;
const HOST = "0.0.0.0"; // listen on LAN + Tailscale + everything

app.listen(PORT, HOST, () => {
  console.log(`EMS API running on http://${HOST}:${PORT}`);
  console.log(`Swagger UI:      http://${HOST}:${PORT}/api/docs`);
});
