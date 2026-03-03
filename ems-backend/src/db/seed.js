const crypto = require("crypto");
const { run, get } = require("./index");

function hashPassword(password, salt) {
  const hash = crypto.pbkdf2Sync(password, salt, 120000, 32, "sha256").toString("hex");
  return hash;
}

async function seedUsers() {
  const users = [
    { email: "admin@ems.local", password: "Admin123!", role: "admin" },
    { email: "manager@ems.local", password: "Manager123!", role: "manager" },
    { email: "viewer@ems.local", password: "Viewer123!", role: "viewer" }
  ];

  for (const u of users) {
    const exists = await get("SELECT id FROM users WHERE email = ?", [u.email]);
    if (exists) continue;

    const salt = crypto.randomBytes(16).toString("hex");
    const password_hash = hashPassword(u.password, salt);

    await run(
      `INSERT INTO users (email, password_hash, password_salt, role) VALUES (?, ?, ?, ?)`,
      [u.email, password_hash, salt, u.role]
    );
  }
}

function randFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function makeEmail(first, last, n) {
  const base = `${first}.${last}`.toLowerCase().replace(/[^a-z.]/g, "");
  return `${base}${n}@company.local`;
}

async function seedEmployees(count = 60) {
  const firstNames = ["Ana", "Luis", "Mabel", "Toti", "Sofia", "Diego", "Lucia", "Carlos", "Elena", "Mario"];
  const lastNames = ["Perez", "Lopez", "Quijano", "Ramirez", "Gomez", "Hernandez", "Cruz", "Santos", "Vega", "Nunez"];
  const departments = ["HR", "Engineering", "QA", "Finance", "Operations", "Support"];
  const statuses = ["active", "inactive"];

  // Seed at least 1 employee so manager_id can reference later if you want
  for (let i = 1; i <= count; i++) {
    const first = randFrom(firstNames);
    const last = randFrom(lastNames);
    const email = makeEmail(first, last, i);
    const phone = `+52 999 ${String(1000000 + i).slice(-7)}`;
    const department = randFrom(departments);
    const status = randFrom(statuses);
    const salary = 12000 + (i * 250) % 35000;

    // hire_date between ~2020-01-01 and now-ish (rough)
    const hireDate = new Date(Date.now() - (i * 9 * 24 * 60 * 60 * 1000));
    const hire_date = hireDate.toISOString().slice(0, 10);

    const notes = i % 7 === 0 ? "Needs onboarding documents." : "";

    // Insert if not exists
    const exists = await get("SELECT id FROM employees WHERE email = ?", [email]);
    if (exists) continue;

    await run(
      `INSERT INTO employees (first_name, last_name, email, phone, department, status, salary, hire_date, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [first, last, email, phone, department, status, salary, hire_date, notes]
    );
  }
}

async function seed() {
  await seedUsers();
  await seedEmployees();
}

module.exports = { seed };
