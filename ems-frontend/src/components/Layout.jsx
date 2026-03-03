import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { clearAuth, getUser } from "../auth/authStore";
import { apiFetch } from "../api/client";
import { useState } from "react";


export default function Layout() {
  const nav = useNavigate();
  const user = getUser();
  const [sidebarOpen, setSidebarOpen] = useState(false);


  async function logout() {
    try { await apiFetch("/api/auth/logout", { method: "POST" }); } catch { /* ignore logout errors */ }
    clearAuth();
    nav("/login");
  }

  return (
    <div className="shell">
      {sidebarOpen ? (
        <div
          className="sidebarBackdrop"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close sidebar"
        />
      ) : null}

      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="brand">EMS Tool</div>

        <nav className="nav">
          <NavLink to="/dashboard" className="link" onClick={() => setSidebarOpen(false)}>Dashboard</NavLink>
          <NavLink to="/employees" className="link" onClick={() => setSidebarOpen(false)}>Employees</NavLink>
          <NavLink to="/ui-playground" className="link" onClick={() => setSidebarOpen(false)}>UI Playground</NavLink>
        </nav>

        <div className="sidebarFooter">
          <div className="userBox">
            <div className="userEmail">{user?.email}</div>
            <div className="userRole">{user?.role}</div>
          </div>
          <button className="btn btnGhost" onClick={logout}>Logout</button>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
           <button
            className="hamburger"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
            data-testid="open-sidebar">
            ☰
          </button>
          <div className="crumbs">EMS Management</div>
          <div className="topActions">
            <a className="pill" href="/api/docs" target="_blank" rel="noreferrer">
              Swagger
            </a>
          </div>
        </header>

        <section className="content">
          <Outlet />
        </section>
      </main>
    </div>
  );
}
