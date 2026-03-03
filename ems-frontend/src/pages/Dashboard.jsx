import { useEffect, useState } from "react";
import { apiFetch } from "../api/client";

export default function Dashboard() {
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        // Para MVP: calculamos con 2 queries simples (podemos crear endpoint /api/stats luego)
        const all = await apiFetch("/api/employees?limit=1&page=1");
        const active = await apiFetch("/api/employees?status=active&limit=1&page=1");
        const inactive = await apiFetch("/api/employees?status=inactive&limit=1&page=1");
        setStats({ total: all.total, active: active.total, inactive: inactive.total });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div>
      <h2>Dashboard</h2>
      <div className="grid3">
        <div className="card">
          <div className="kpiLabel">Total employees</div>
          <div className="kpiValue">{loading ? "…" : stats.total}</div>
        </div>
        <div className="card">
          <div className="kpiLabel">Active</div>
          <div className="kpiValue">{loading ? "…" : stats.active}</div>
        </div>
        <div className="card">
          <div className="kpiLabel">Inactive</div>
          <div className="kpiValue">{loading ? "…" : stats.inactive}</div>
        </div>
      </div>
    </div>
  );
}
