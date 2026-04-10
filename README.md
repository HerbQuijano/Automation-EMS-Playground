# HQ Automation Playground

A full-stack Employee Management System (EMS) built for testing and automation practice. This project includes both frontend and backend components designed to provide realistic scenarios for quality assurance testing, API testing, and UI automation.

## 📋 Table of Contents

- [About](#about)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Running the Application](#running-the-application)
- [UI Playground](#ui-playground)
- [API Testing](#api-testing)
- [API Documentation](#api-documentation)

## 🎯 About

This Employee Management System is designed as a testing playground for QA automation engineers. It includes various endpoints with different behaviors (slow responses, flaky endpoints, audit trails) to simulate real-world scenarios for testing purposes.

## ✨ Features

- **Employee Management**: CRUD operations for employee records
- **Authentication & Authorization**: Token-based authentication with protected routes
- **Audit Trail**: Track all actions performed in the system
- **Health Check Endpoints**: Monitor system status
- **QA Test Endpoints**: Special endpoints for testing scenarios:
  - Slow responses (configurable delay)
  - Flaky endpoints (configurable failure rate)
- **Swagger UI**: Interactive API documentation
- **Responsive Frontend**: React-based UI with routing

## 🛠️ Tech Stack

### Backend

- **Node.js** - Runtime environment
- **Express 5.x** - Web framework
- **SQLite3** - Database
- **Swagger UI** - API documentation
- **CORS** - Cross-origin resource sharing
- **Nodemon** - Development auto-reload

### Frontend

- **React 19.x** - UI library
- **React Router DOM** - Client-side routing
- **Vite** - Build tool and dev server
- **ESLint** - Code linting

## 📁 Project Structure

```
hq-automation-playground/
├── ems-backend/          # Backend API server
│   ├── server.js         # Server entry point
│   ├── src/
│   │   ├── app.js        # Express app configuration
│   │   ├── db/           # Database schema and seed data
│   │   ├── middlewares/  # Auth, error handling, request ID
│   │   ├── routes/       # API route handlers
│   │   ├── services/     # Business logic
│   │   └── swagger/      # OpenAPI specification
│   └── package.json
│
└── ems-frontend/         # Frontend React application
    ├── src/
    │   ├── App.jsx       # Main app component
    │   ├── api/          # API client
    │   ├── auth/         # Auth state management
    │   ├── components/   # React components
    │   └── pages/        # Page components
    └── package.json
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd hq-automation-playground
   ```

2. **Install all dependencies (root workspace)**

```bash
npm install
```

3. **Initialize Database**

```bash
npm run db:reset
```

4. **Start full stack from root (recommended)**

```bash
npm run dev
```

This starts backend and frontend together using npm workspaces.

### Alternative: Install and run each app separately

If you prefer independent setup, use the per-folder workflow below.

1. **Install Backend Dependencies**

   ```bash
   cd ems-backend
   npm install
   ```

2. **Initialize Database**

   ```bash
   npm run db:reset
   ```

3. **Install Frontend Dependencies**
   ```bash
   cd ../ems-frontend
   npm install
   ```

## 🏃 Running the Application

### From Root (recommended)

```bash
npm run dev
```

### Backend Only from Root

```bash
npm run dev:api
```

### Frontend Only from Root

```bash
npm run dev:web
```

### Build Frontend from Root

```bash
npm run build
```

### Lint from Root

```bash
npm run lint
```

### Backend

```bash
cd ems-backend
npm start
```

The backend API will be available at:

- API: `http://0.0.0.0:3000`
- Swagger UI: `http://0.0.0.0:3000/api/docs`

**Development mode with auto-reload:**

```bash
npm run dev
```

### Frontend

```bash
cd ems-frontend
npm run dev -- --host
```

The frontend will be available at `http://localhost:5173` (or the port shown in terminal)

## 🧩 UI Playground

The app includes a dedicated UI automation training page at:

- `http://localhost:5173/ui-playground`

This page is designed to practice resilient Playwright locator strategies, waiting patterns, and UI event assertions.

### New Sections Added

- **Hard + complex locators**
  - Duplicate names and repeated action labels (`Open`) to force scoped locators.
  - Dynamic filtering and order shuffling to avoid brittle positional selectors.
  - Unstable DOM id samples to reinforce test strategies based on role, accessible name, and stable test ids.
  - Result state exposed via `pg-hard-last-action`.

- **Event handling techniques**
  - Propagation lab with capture/bubble behavior and optional `stopPropagation()`.
  - Keyboard shortcut handling via `Ctrl+K`.
  - `blur`-based note save behavior.
  - Custom window event flow (`pg:sync`) with dispatch/listen validation.
  - Live event log table (`pg-evt-log-table`) for deterministic assertions.

### Quick Automation Targets

- Locator filters/shuffle: `pg-hard-filter-all`, `pg-hard-filter-active`, `pg-hard-filter-leave`, `pg-hard-shuffle`
- Locator cards/actions: `pg-hard-grid`, `pg-hard-card-*`, `pg-hard-open-profile-*`, `pg-hard-open-audit-*`
- Event propagation controls: `pg-evt-shell`, `pg-evt-middle`, `pg-evt-inner-btn`, `pg-evt-stop-bubble`
- Keyboard/input/custom events: `pg-evt-hotkey-input`, `pg-evt-note`, `pg-evt-custom-trigger`, `pg-evt-custom-count`

### Recommended Playwright Patterns

- Prefer `getByRole(...)` + accessible names for repeated button text.
- Scope interactions with `locator(...).filter(...)` when duplicate names exist.
- Assert event order from the log table instead of relying on timing.
- Use explicit waits for UI state transitions (loading/result text) rather than fixed timeouts.

## 🧪 API Testing

### Default Credentials

Admin
- **Email**: `admin@ems.local`
- **Password**: `Admin123!`

Manager
- **Email**: `manager!@ems.local`
- **Password**: `Manager123!`

Viewer
- **Email**: `viewer!@ems.local`
- **Password**: `Viewer123!`


### Example API Calls

**Login and Get Token:**

```bash
TOKEN=$(curl -s -X POST "http://localhost:3000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ems.local","password":"Admin123!"}' | sed -n 's/.*"token":"\([^"]*\)".*/\1/p')
echo $TOKEN
```

**Get Employees:**

```bash
curl http://localhost:3000/api/employees \
  -H "Authorization: Bearer $TOKEN"
```

**Test Slow Endpoint (1200ms delay):**

```bash
curl -i "http://localhost:3000/api/slow?ms=1200" \
  -H "Authorization: Bearer $TOKEN"
```

**Test Flaky Endpoint (40% failure rate):**

```bash
curl -i "http://localhost:3000/api/flaky?failRate=0.4" \
  -H "Authorization: Bearer $TOKEN"
```

**Get Audit Logs:**

```bash
curl -s "http://localhost:3000/api/audit?limit=10" \
  -H "Authorization: Bearer $TOKEN"
```

## 📚 API Documentation

Once the backend is running, visit the Swagger UI at:

```
http://localhost:3000/api/docs
```

This provides interactive documentation for all available endpoints.

## 🛠️ Database Commands

- **Initialize schema**: `npm run db:init`
- **Seed data**: `npm run db:seed`
- **Reset database**: `npm run db:reset` (drops, recreates, and seeds)

## 📝 Notes

- The backend listens on `0.0.0.0` to be accessible from LAN and VPN connections (e.g., Tailscale)
- The database is SQLite-based and stored locally
- All API requests (except login) require a valid JWT token in the Authorization header

## Reports

- To open html report use: `npx playwright show-report reports/html`
- To generate allure report use: `allure generate reports/allure-results --clean -o reports/allure-report`
- To open allure report use: `allure open reports/allure-report`
- To select reporter use : `npx playwright test --reporter=<reporter>`
