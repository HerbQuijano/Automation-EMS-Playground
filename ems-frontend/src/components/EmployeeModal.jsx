import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../api/client";

const emptyForm = {
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    department: "QA",
    status: "active",
    salary: 0,
    hire_date: "",
    notes: "",
    employment_type: "full_time",
    overtime_eligible: false,
    workload_pct: 100,

};

export default function EmployeeModal({ open, mode, employee, loading = false, onClose, onSaved }) {
    const isEdit = mode === "edit";

    const initial = useMemo(() => {
        if (!isEdit || !employee) return emptyForm;
        return {
            first_name: employee.first_name ?? "",
            last_name: employee.last_name ?? "",
            email: employee.email ?? "",
            phone: employee.phone ?? "",
            department: employee.department ?? "QA",
            status: employee.status ?? "active",
            salary: employee.salary ?? 0,
            hire_date: employee.hire_date ?? "",
            notes: employee.notes ?? "",
            employment_type: employee.employment_type ?? "full_time",
            overtime_eligible: Boolean(employee.overtime_eligible ?? 0),
            workload_pct: Number(employee.workload_pct ?? 100),

        };
    }, [isEdit, employee]);

    {
        loading ? (
            <div className="card" style={{ marginBottom: 10 }}>
                <div className="muted">Loading employee…</div>
            </div>
        ) : null
    }


    const [form, setForm] = useState(initial);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [touched, setTouched] = useState(false);

    useEffect(() => {
        if (open) {
            setForm(initial);
            setError("");
            setSaving(false);
            setTouched(false);
        }
    }, [open, initial]);

    function update(field, value) {
        setTouched(true);
        setForm((f) => ({ ...f, [field]: value }));
    }

    function validate() {
        if (!form.first_name.trim()) return "First name is required";
        if (!form.last_name.trim()) return "Last name is required";
        if (!form.email.trim()) return "Email is required";
        // validación simple de email
        if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) return "Email format is invalid";
        if (!form.department.trim()) return "Department is required";
        if (!form.hire_date.trim()) return "Hire date is required";
        if (Number.isNaN(Number(form.salary))) return "Salary must be a number";
        return "";
    }

    async function save() {
        const v = validate();
        if (v) {
            setError(v);
            return;
        }

        setSaving(true);
        setError("");

        const payload = {
            ...form,
            salary: Number(form.salary || 0),
            phone: form.phone?.trim() || null,
            overtime_eligible: form.overtime_eligible ? 1 : 0,
            workload_pct: Number(form.workload_pct ?? 100)
        };

        try {
            if (isEdit) {
                await apiFetch(`/api/employees/${employee.id}`, {
                    method: "PUT",
                    body: JSON.stringify(payload)
                });
            } else {
                await apiFetch("/api/employees", {
                    method: "POST",
                    body: JSON.stringify(payload)
                });
            }

            onSaved?.();
            onClose?.();
        } catch (err) {
            // manejo bonito de 409 duplicado
            if (err.status === 409) {
                setError("Email already exists. Try a different one.");
            } else {
                setError(err.message || "Could not save employee");
            }
        } finally {
            setSaving(false);
        }
    }

    function requestClose() {
        if (saving || loading) return;

        if (touched) {
            const ok = confirm("Discard changes?");
            if (!ok) return;
        }
        onClose?.();
    }

    if (!open) return null;

    return (
        <div className="modalOverlay" role="dialog" aria-modal="true">
            <div className="modalCard">
                <div className="modalHeader">
                    <div>
                        <h3 className="modalTitle">{isEdit ? "Edit employee" : "New employee"}</h3>
                        <div className="muted small">
                            {isEdit ? `ID: ${employee.id}` : "Create a new employee record"}
                        </div>
                    </div>

                    <button className="iconBtn" onClick={requestClose} aria-label="Close">
                        ✕
                    </button>
                </div>

                <div className="modalBody">
                    <div className="grid2">
                        <div>
                            <label className="label">First name *</label>
                            <input
                                className="input"
                                value={form.first_name}
                                onChange={(e) => update("first_name", e.target.value)}
                                data-testid="emp-first-name"
                            />
                        </div>

                        <div>
                            <label className="label">Last name *</label>
                            <input
                                className="input"
                                value={form.last_name}
                                onChange={(e) => update("last_name", e.target.value)}
                                data-testid="emp-last-name"
                            />
                        </div>

                        <div>
                            <label className="label">Email *</label>
                            <input
                                className="input"
                                value={form.email}
                                onChange={(e) => update("email", e.target.value)}
                                data-testid="emp-email"
                            />
                        </div>

                        <div>
                            <label className="label">Phone</label>
                            <input
                                className="input"
                                value={form.phone}
                                onChange={(e) => update("phone", e.target.value)}
                                data-testid="emp-phone"
                            />
                        </div>

                        <div>
                            <label className="label">Department *</label>
                            <select
                                className="input"
                                value={form.department}
                                onChange={(e) => update("department", e.target.value)}
                                data-testid="emp-department"
                            >
                                <option value="HR">HR</option>
                                <option value="Engineering">Engineering</option>
                                <option value="QA">QA</option>
                                <option value="Finance">Finance</option>
                                <option value="Operations">Operations</option>
                                <option value="Support">Support</option>
                            </select>
                        </div>

                        <div>
                            <label className="label">Status</label>
                            <select
                                className="input"
                                value={form.status}
                                onChange={(e) => update("status", e.target.value)}
                                data-testid="emp-status"
                            >
                                <option value="active">active</option>
                                <option value="inactive">inactive</option>
                            </select>
                        </div>

                        <div style={{ marginTop: 10 }}>
                            <label className="label">Employment type</label>
                            <div className="row gap" data-testid="emp-employment-type">
                                <label className="pill">
                                    <input
                                        type="radio"
                                        name="employment_type"
                                        checked={form.employment_type === "full_time"}
                                        onChange={() => update("employment_type", "full_time")}
                                    />
                                    {" "}Full-time
                                </label>

                                <label className="pill">
                                    <input
                                        type="radio"
                                        name="employment_type"
                                        checked={form.employment_type === "part_time"}
                                        onChange={() => update("employment_type", "part_time")}
                                    />
                                    {" "}Part-time
                                </label>

                                <label className="pill">
                                    <input
                                        type="radio"
                                        name="employment_type"
                                        checked={form.employment_type === "contractor"}
                                        onChange={() => update("employment_type", "contractor")}
                                    />
                                    {" "}Contractor
                                </label>
                            </div>
                        </div>

                        <div style={{ marginTop: 10 }}>
                            <label className="pill" style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
                                <input
                                    type="checkbox"
                                    checked={form.overtime_eligible}
                                    onChange={(e) => update("overtime_eligible", e.target.checked)}
                                    data-testid="emp-overtime"
                                />
                                Overtime eligible
                            </label>
                        </div>

                        <div style={{ marginTop: 10 }}>
                            <label className="label">
                                Workload ({form.workload_pct}%)
                            </label>
                            <input
                                className="input"
                                type="range"
                                min="0"
                                max="100"
                                value={form.workload_pct}
                                onChange={(e) => update("workload_pct", Number(e.target.value))}
                                data-testid="emp-workload"
                            />
                        </div>

                        <div>
                            <label className="label">Salary</label>
                            <input
                                className="input"
                                type="number"
                                value={form.salary}
                                onChange={(e) => update("salary", e.target.value)}
                                data-testid="emp-salary"
                            />
                        </div>

                        <div>
                            <label className="label">Hire date *</label>
                            <input
                                className="input"
                                type="date"
                                value={form.hire_date}
                                onChange={(e) => update("hire_date", e.target.value)}
                                data-testid="emp-hire-date"
                            />
                        </div>
                    </div>

                    <div style={{ marginTop: 10 }}>
                        <label className="label">Notes</label>
                        <textarea
                            className="input"
                            rows={3}
                            value={form.notes}
                            onChange={(e) => update("notes", e.target.value)}
                            data-testid="emp-notes"
                        />
                    </div>

                    {error ? <div className="error" data-testid="emp-error">{error}</div> : null}
                </div>

                <div className="modalFooter">
                    <button className="btn btnGhost" onClick={requestClose} disabled={saving}>
                        Cancel
                    </button>
                    <button className="btn" onClick={save} disabled={saving || loading} data-testid="emp-save">
                        {saving ? "Saving..." : "Save"}
                    </button>
                </div>
            </div>
        </div>
    );
}
