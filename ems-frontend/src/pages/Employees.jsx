import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../api/client";
import EmployeeModal from "../components/EmployeeModal";


export default function Employees() {
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("");
    const [department, setDepartment] = useState("");
    const [page, setPage] = useState(1);
    const [limit] = useState(10);

    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState("create"); // "create" | "edit"
    const [selected, setSelected] = useState(null);

    const [loadingEmployee, setLoadingEmployee] = useState(false);


    const [data, setData] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const pages = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total, limit]);

    async function load() {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: String(page),
                limit: String(limit)
            });
            if (search) params.set("search", search);
            if (status) params.set("status", status);
            if (department) params.set("department", department);

            const res = await apiFetch(`/api/employees?${params.toString()}`);
            setData(res.data);
            setTotal(res.total);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { load(); }, [page, limit]); // eslint-disable-line

    // Reset to page 1 when filters change, then load
    useEffect(() => {
        setPage(1);
    }, [search, status, department]);

    useEffect(() => { load(); }, [search, status, department]); // eslint-disable-line

    async function openEdit(id) {
  setModalMode("edit");
  setModalOpen(true);

  // placeholder mientras carga
  setSelected({ id });

  setLoadingEmployee(true);
  try {
    const slowEnabled = import.meta.env.VITE_DEBUG_SLOW_EDIT === "true";
    const slowMs = Number(import.meta.env.VITE_DEBUG_SLOW_MS || 800);

    // Forzar loading SOLO en debug
    if (slowEnabled) {
      await apiFetch(`/api/slow?ms=${slowMs}`);
    }

    const full = await apiFetch(`/api/employees/${id}`);
    setSelected(full);
  } catch (err) {
    console.error(err);
    alert(err.message || "Could not load employee");
    setModalOpen(false);
    setSelected(null);
  } finally {
    setLoadingEmployee(false);
  }
}



    return (
        <div>
            <div className="row between">
                <h2>Employees</h2>
                <div className="row gap">
                    <button
                        className="btn"
                        onClick={() => {
                            setSelected(null);
                            setModalMode("create");
                            setModalOpen(true);
                        }}
                        data-testid="employees-new"
                    >
                        New employee
                    </button>
                    <button className="btn btnGhost" onClick={load} data-testid="employees-refresh">
                        Refresh
                    </button>
                </div>
            </div>

            <div className="card filters">
                <input
                    className="input"
                    placeholder="Search name/email…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    data-testid="employees-search"
                />

                <select className="input" value={status} onChange={(e) => setStatus(e.target.value)} data-testid="employees-status">
                    <option value="">All status</option>
                    <option value="active">active</option>
                    <option value="inactive">inactive</option>
                </select>

                <select className="input" value={department} onChange={(e) => setDepartment(e.target.value)} data-testid="employees-dept">
                    <option value="">All departments</option>
                    <option value="HR">HR</option>
                    <option value="Engineering">Engineering</option>
                    <option value="QA">QA</option>
                    <option value="Finance">Finance</option>
                    <option value="Operations">Operations</option>
                    <option value="Support">Support</option>
                </select>
            </div>

            <div className="card">
                <div className="row between">
                    <div className="muted">
                        {loading ? "Loading…" : `Showing ${data.length} of ${total}`}
                    </div>
                    <div className="row gap">
                        <button className="btn btnGhost" disabled={page <= 1} onClick={() => setPage(p => p - 1)} data-testid="employees-prev">
                            Prev
                        </button>
                        <div className="pill" data-testid="employees-page">{page} / {pages}</div>
                        <button className="btn btnGhost" disabled={page >= pages} onClick={() => setPage(p => p + 1)} data-testid="employees-next">
                            Next
                        </button>
                    </div>
                </div>

                <div className="tableWrap">
                    <table className="table" data-testid="employees-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Name</th>
                                <th>Department</th>
                                <th>Status</th>
                                <th>Email</th>
                                <th>Hire date</th>
                                <th>Notes</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="6" className="muted">Loading…</td></tr>
                            ) : data.length === 0 ? (
                                <tr><td colSpan="6" className="muted">No results</td></tr>
                            ) : (
                                data.map((e) => (
                                    <tr key={e.id}
                                        data-testid={`employee-row-${e.id}`}
                                        className="clickRow"
                                        onClick={() => openEdit(e.id)}>
                                        <td>{e.id}</td>
                                        <td>{e.first_name} {e.last_name}</td>
                                        <td>{e.department}</td>
                                        <td><span className={`badge ${e.status}`}>{e.status}</span></td>
                                        <td>{e.email}</td>
                                        <td>{e.hire_date}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>

                </div>
            </div>
            <EmployeeModal
                open={modalOpen}
                mode={modalMode}
                employee={selected}
                loading={loadingEmployee}
                onClose={() => setModalOpen(false)}
                onSaved={() => load()}
            />
        </div>

    );
}
