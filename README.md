# HQ Automation Playground

A full-stack Employee Management System (EMS) built for testing and automation practice. This project includes both frontend and backend components designed to provide realistic scenarios for quality assurance testing, API testing, and UI automation.

## 📋 Table of Contents

- [About](#about)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Running the Application](#running-the-application)
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

2. **Install Backend Dependencies**
   ```bash
   cd ems-backend
   npm install
   ```

3. **Initialize Database**
   ```bash
   npm run db:reset
   ```

4. **Install Frontend Dependencies**
   ```bash
   cd ../ems-frontend
   npm install
   ```

## 🏃 Running the Application

### Backend

```bash
cd ems-backend
npm start -- --host
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

## 🧪 API Testing

### Default Credentials

- **Email**: `admin@ems.local`
- **Password**: `Admin123!`

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
