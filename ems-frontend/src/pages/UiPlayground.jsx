import { useEffect, useMemo, useState, useRef } from "react";
import { apiFetch } from "../api/client";

function Section({ title, subtitle, children }) {
    return (
        <div className="card" style={{ marginBottom: 12 }}>
            <div className="row between" style={{ marginBottom: 10 }}>
                <div>
                    <h3 style={{ margin: 0 }}>{title}</h3>
                    {subtitle ? <div className="muted small">{subtitle}</div> : null}
                </div>
            </div>
            {children}
        </div>
    );
}

export default function UiPlayground() {
    // --- Checkbox / radio
    const [accept, setAccept] = useState(false);
    const [plan, setPlan] = useState("basic");

    // --- Slider
    const [volume, setVolume] = useState(40);

    // --- Dynamic list (select all + indeterminate)
    const initialItems = useMemo(
        () => [
            { id: "A1", label: "Export reports", checked: false },
            { id: "B2", label: "Approve overtime", checked: false },
            { id: "C3", label: "View payroll", checked: false }
        ],
        []
    );
    const [perms, setPerms] = useState(initialItems);

    const checkedCount = perms.filter(p => p.checked).length;
    const allChecked = checkedCount === perms.length;
    const noneChecked = checkedCount === 0;

    // Instructor Mode
    const defaultMode = (import.meta.env.VITE_PLAYGROUND_MODE || "student").toLowerCase();
    const [mode, setMode] = useState(defaultMode === "instructor" ? "instructor" : "student");
    const isInstructor = mode === "instructor";

    useEffect(() => {
        const saved = localStorage.getItem("pg_mode");
        if (saved) setMode(saved);
    }, []);

    useEffect(() => {
        localStorage.setItem("pg_mode", mode);
    }, [mode]);

    // --- Tabs + async load (with /api/slow)
    const [tab, setTab] = useState("profile");
    const [tabLoading, setTabLoading] = useState(false);
    const [tabData, setTabData] = useState(null);

    // --- Flaky demo
    const [flakyMsg, setFlakyMsg] = useState("");
    const [flakyLoading, setFlakyLoading] = useState(false);

    // --- Simple toast
    const [toast, setToast] = useState("");

    // --- States and Handlers
    const [iframeMsg, setIframeMsg] = useState("");

    // --- Table sorting
    const [sortKey, setSortKey] = useState("last_name");
    const [sortDir, setSortDir] = useState("asc"); // asc | desc

    const [cols, setCols] = useState({
        id: true,
        name: true,
        department: true,
        workload: true,
        overtime: true,
        last_name: true
    });

    const tableRows = useMemo(() => ([
        { id: 12, first_name: "Eric", last_name: "Freeman", department: "Finance", workload_pct: 40, overtime_eligible: 1 },
        { id: 7, first_name: "Ada", last_name: "Lovelace", department: "Engineering", workload_pct: 80, overtime_eligible: 0 },
        { id: 33, first_name: "Juan", last_name: "Pérez", department: "QA", workload_pct: 65, overtime_eligible: 1 },
        { id: 2, first_name: "Zoe", last_name: "Álvarez", department: "HR", workload_pct: 25, overtime_eligible: 0 },
        { id: 19, first_name: "Mabel", last_name: "Pug", department: "Support", workload_pct: 95, overtime_eligible: 1 },
    ]), []);

    const locatorPool = useMemo(
        () => [
            { id: "E101", first: "Chris", last: "Lee", department: "QA", status: "Active", shift: "Night" },
            { id: "E102", first: "Chris", last: "Lee", department: "Support", status: "On leave", shift: "Day" },
            { id: "E214", first: "Noah", last: "Patel", department: "Finance", status: "Active", shift: "Day" },
            { id: "E309", first: "Mia", last: "Chen", department: "Engineering", status: "Probation", shift: "Swing" },
            { id: "E450", first: "Rosa", last: "Nguyen", department: "Operations", status: "Active", shift: "Night" }
        ],
        []
    );

    const [locatorFilter, setLocatorFilter] = useState("all");
    const [locatorShuffle, setLocatorShuffle] = useState(false);
    const [locatorAction, setLocatorAction] = useState("No action yet");

    const [eventLog, setEventLog] = useState([]);
    const [stopBubble, setStopBubble] = useState(false);
    const [hotkeyResult, setHotkeyResult] = useState("Waiting for Ctrl+K");
    const [draftNote, setDraftNote] = useState("");
    const [lastSavedNote, setLastSavedNote] = useState("Nothing saved");
    const [customEventCount, setCustomEventCount] = useState(0);

    function sortBy(key) {
        if (sortKey === key) {
            setSortDir(d => (d === "asc" ? "desc" : "asc"));
        } else {
            setSortKey(key);
            setSortDir("asc");
        }
    }

    const sortedRows = useMemo(() => {
        const dir = sortDir === "asc" ? 1 : -1;

        function getValue(r) {
            switch (sortKey) {
                case "id": return r.id;
                case "name": return `${r.last_name} ${r.first_name}`.toLowerCase();
                case "department": return (r.department || "").toLowerCase();
                case "workload": return Number(r.workload_pct || 0);
                case "overtime": return Number(r.overtime_eligible || 0);
                case "last_name": return (r.last_name || "").toLowerCase();
                default: return "";
            }
        }

        return [...tableRows].sort((a, b) => {
            const av = getValue(a);
            const bv = getValue(b);
            if (av < bv) return -1 * dir;
            if (av > bv) return 1 * dir;
            return 0;
        });
    }, [tableRows, sortKey, sortDir]);

    const complexLocatorRows = useMemo(() => {
        const filtered = locatorFilter === "all"
            ? locatorPool
            : locatorPool.filter((row) => row.status.toLowerCase() === locatorFilter);

        const rows = locatorShuffle
            ? [...filtered].sort((a, b) => `${a.last}${a.first}`.localeCompare(`${b.last}${b.first}`))
            : filtered;

        return rows.map((row, index) => ({
            ...row,
            unstableDomId: `emp-${row.id}-${locatorShuffle ? "v2" : "v1"}`,
            visualIndex: index + 1
        }));
    }, [locatorFilter, locatorPool, locatorShuffle]);

    // AutoComplete and debounce
    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);

    useEffect(() => {
        let alive = true;

        async function run() {
            const q = query.trim();
            if (q.length < 2) {
                setResults([]);
                setSelectedItem(null);
                return;
            }

            setSearchLoading(true);
            try {
                // delay artificial para practicar waits
                await apiFetch("/api/slow?ms=500");

                // si tienes endpoint real:
                // const res = await apiFetch(`/api/search/employees?q=${encodeURIComponent(q)}`);
                // setResults(res.data);

                // mock local (sin backend)
                const mock = [
                    { id: 1, label: "Eric Freeman (Finance)" },
                    { id: 2, label: "Ada Lovelace (Engineering)" },
                    { id: 3, label: "Juan Pérez (QA)" },
                    { id: 4, label: "Zoe Álvarez (HR)" }
                ];
                const filtered = mock.filter(x => x.label.toLowerCase().includes(q.toLowerCase()));
                if (alive) setResults(filtered);
            } finally {
                if (alive) setSearchLoading(false);
            }
        }

        const t = setTimeout(run, 350); // debounce 350ms
        return () => {
            alive = false;
            clearTimeout(t);
        };
    }, [query]);

    // File Upload

    const [pickedFile, setPickedFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadResult, setUploadResult] = useState("");

    async function fakeUpload() {
        if (!pickedFile) {
            setUploadResult("No file selected");
            return;
        }

        setUploading(true);
        setUploadResult("");

        try {
            // Simula red lenta
            await apiFetch("/api/slow?ms=900");

            // Simula validaciones típicas
            const maxBytes = 2 * 1024 * 1024; // 2MB
            if (pickedFile.size > maxBytes) {
                setUploadResult("Rejected: file too large (max 2MB)");
                return;
            }

            const allowed = ["application/pdf", "image/png", "image/jpeg", "text/plain"];
            if (!allowed.includes(pickedFile.type) && pickedFile.type !== "") {
                setUploadResult(`Rejected: type not allowed (${pickedFile.type})`);
                return;
            }

            setUploadResult(`Uploaded: ${pickedFile.name} (${pickedFile.size} bytes)`);
            showToast("Upload completed");
        } catch (e) {
            setUploadResult(`Upload failed: ${e.message}`);
        } finally {
            setUploading(false);
        }
    }

    // Clear ref
    const fileInputRef = useRef(null);

    // --- Functions
    function showToast(msg) {
        setToast(msg);
        setTimeout(() => setToast(""), 2200);
    }

    function appendEventLog(source, type, detail = "") {
        setEventLog((prev) => {
            const line = `${source} | ${type}${detail ? ` | ${detail}` : ""}`;
            return [line, ...prev].slice(0, 10);
        });
    }

    function togglePerm(id) {
        setPerms(prev => prev.map(p => (p.id === id ? { ...p, checked: !p.checked } : p)));
    }

    function setAllPerms(value) {
        setPerms(prev => prev.map(p => ({ ...p, checked: value })));
    }

    function triggerCustomWindowEvent() {
        window.dispatchEvent(
            new CustomEvent("pg:sync", {
                detail: {
                    source: "manual-trigger",
                    at: new Date().toISOString()
                }
            })
        );
    }

    function handlePropagationShellCapture() {
        appendEventLog("propagation", "capture", "shell");
    }

    function handlePropagationShellBubble() {
        appendEventLog("propagation", "bubble", "shell");
    }

    function handlePropagationMiddleBubble() {
        appendEventLog("propagation", "bubble", "middle");
    }

    function handleInnerAction(e) {
        if (stopBubble) {
            e.stopPropagation();
            appendEventLog("propagation", "stopPropagation", "inner button");
        }
        appendEventLog("propagation", "click", "inner button");
        showToast("Inner action fired");
    }

    function handleHotkey(e) {
        if (e.ctrlKey && e.key.toLowerCase() === "k") {
            e.preventDefault();
            const value = e.currentTarget.value.trim();
            const command = value || "empty command";
            setHotkeyResult(`Command palette simulation: ${command}`);
            appendEventLog("keyboard", "Ctrl+K", command);
        }
    }

    function handleNoteBlur(e) {
        const nextValue = e.currentTarget.value.trim() || "(empty note)";
        setLastSavedNote(nextValue);
        appendEventLog("input", "blur", nextValue);
    }

    useEffect(() => {
        // Lazy load tab content with artificial delay -> good for waits
        (async () => {
            setTabLoading(true);
            setTabData(null);
            try {
                await apiFetch("/api/slow?ms=600");
                setTabData({ tab, loadedAt: new Date().toISOString() });
            } finally {
                setTabLoading(false);
            }
        })();
    }, [tab]);

    async function callFlaky() {
        setFlakyLoading(true);
        setFlakyMsg("");
        try {
            const res = await apiFetch("/api/flaky?failRate=0.35");
            setFlakyMsg(`OK (roll=${res.roll.toFixed(3)})`);
            showToast("Flaky call succeeded");
        } catch (e) {
            setFlakyMsg(`FAILED: ${e.message}`);
        } finally {
            setFlakyLoading(false);
        }
    }

    useEffect(() => {
        function onMessage(e) {
            if (e?.data?.type === "IFRAME_SUBMIT") {
                setIframeMsg(`Received: ${JSON.stringify(e.data.payload)}`);
                showToast("Iframe form submitted");
            }
        }
        window.addEventListener("message", onMessage);
        return () => window.removeEventListener("message", onMessage);
    }, []);

    useEffect(() => {
        function onSync(e) {
            const source = e?.detail?.source || "unknown";
            setCustomEventCount((prev) => prev + 1);
            appendEventLog("custom-event", "pg:sync", source);
        }

        window.addEventListener("pg:sync", onSync);
        return () => window.removeEventListener("pg:sync", onSync);
    }, []);


    return (
        <div>
            <div className="row between" style={{ marginBottom: 12 }}>
                <h2 style={{ margin: 0 }}>UI Playground
                    <div className="row gap" style={{ alignItems: "center" }}>
                        <div className="pill" data-testid="pg-mode">
                            Mode: <b>{mode}</b>
                        </div>

                        <button
                            className="btn btnGhost"
                            onClick={() => setMode((m) => (m === "student" ? "instructor" : "student"))}
                            data-testid="pg-mode-toggle"
                        >
                            Toggle mode
                        </button>
                    </div>

                </h2>
                <div className="muted">Locator gym + waits + edge cases</div>
            </div>

            {toast ? (
                <div className="toast" data-testid="toast">
                    {toast}
                </div>
            ) : null}

            <Section
                title="Checkboxes + Radios"
                subtitle="Basic inputs and state assertions"
            >
                <div className="row gap" style={{ flexWrap: "wrap" }}>
                    <label className="pill" data-testid="pg-accept">
                        <input type="checkbox" checked={accept} onChange={(e) => setAccept(e.target.checked)} />
                        {" "}Accept policy
                    </label>

                    <div className="row gap" data-testid="pg-plan">
                        <label className="pill">
                            <input type="radio" name="plan" checked={plan === "basic"} onChange={() => setPlan("basic")} />
                            {" "}Basic
                        </label>
                        <label className="pill">
                            <input type="radio" name="plan" checked={plan === "pro"} onChange={() => setPlan("pro")} />
                            {" "}Pro
                        </label>
                        <label className="pill">
                            <input type="radio" name="plan" checked={plan === "enterprise"} onChange={() => setPlan("enterprise")} />
                            {" "}Enterprise
                        </label>
                    </div>

                    <button className="btn btnGhost" onClick={() => showToast("Saved preferences")} data-testid="pg-save-prefs">
                        Save
                    </button>
                </div>

                <div className="muted small" style={{ marginTop: 10 }} data-testid="pg-state">
                    accept={String(accept)} | plan={plan}
                </div>
            </Section>

            <Section
                title="Slider"
                subtitle="Range input with numeric assertion"
            >
                <div className="row gap" style={{ alignItems: "center" }}>
                    <div className="pill" data-testid="pg-volume-label">Volume: {volume}</div>
                    <input
                        className="input"
                        type="range"
                        min="0"
                        max="100"
                        value={volume}
                        onChange={(e) => setVolume(Number(e.target.value))}
                        data-testid="pg-volume"
                    />
                    <button className="btn btnGhost" onClick={() => setVolume(50)} data-testid="pg-volume-reset">
                        Reset to 50
                    </button>
                </div>
            </Section>

            <Section
                title="Select all + Indeterminate"
                subtitle="The classic table-permissions pain 😈"
            >
                <div className="row gap" style={{ alignItems: "center", marginBottom: 10 }}>
                    <label className="pill" data-testid="pg-select-all">
                        <input
                            type="checkbox"
                            checked={allChecked}
                            ref={(el) => { if (el) el.indeterminate = !allChecked && !noneChecked; }}
                            onChange={(e) => setAllPerms(e.target.checked)}
                        />
                        {" "}Select all permissions
                    </label>

                    <div className="muted small" data-testid="pg-perms-count">
                        {checkedCount}/{perms.length} selected
                    </div>
                </div>

                <div className="grid3">
                    {perms.map((p) => (
                        <label key={p.id} className="pill" data-testid={`pg-perm-${p.id}`}>
                            <input type="checkbox" checked={p.checked} onChange={() => togglePerm(p.id)} />
                            {" "}{p.label}
                        </label>
                    ))}
                </div>
                {isInstructor ? (
                    <div className="hintBox" data-testid="pg-hint-ac">
                        Hint: TBD
                    </div>
                ) : null}

            </Section>

            <Section
                title="Table sorting + column toggles"
                subtitle="Click headers to sort. Toggle columns to force resilient locators."
            >
                <div className="row gap" style={{ flexWrap: "wrap", alignItems: "center", marginBottom: 10 }}>
                    <div className="muted small">Columns:</div>

                    {Object.keys(cols).map((k) => (
                        <label key={k} className="pill" data-testid={`pg-col-${k}`}>
                            <input
                                type="checkbox"
                                checked={cols[k]}
                                onChange={(e) => setCols(prev => ({ ...prev, [k]: e.target.checked }))}
                            />
                            {" "}{k}
                        </label>
                    ))}
                </div>

                <div className="tableWrap">
                    <table className="table" data-testid="pg-sort-table">
                        <thead>
                            <tr>
                                {cols.id && (
                                    <th>
                                        <button className="thBtn" onClick={() => sortBy("id")} data-testid="pg-th-id">
                                            ID {sortKey === "id" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                                        </button>
                                    </th>
                                )}

                                {cols.name && (
                                    <th>
                                        <button className="thBtn" onClick={() => sortBy("name")} data-testid="pg-th-name">
                                            Name {sortKey === "name" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                                        </button>
                                    </th>
                                )}

                                {cols.department && (
                                    <th>
                                        <button className="thBtn" onClick={() => sortBy("department")} data-testid="pg-th-department">
                                            Department {sortKey === "department" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                                        </button>
                                    </th>
                                )}

                                {cols.workload && (
                                    <th>
                                        <button className="thBtn" onClick={() => sortBy("workload")} data-testid="pg-th-workload">
                                            Workload {sortKey === "workload" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                                        </button>
                                    </th>
                                )}

                                {cols.overtime && (
                                    <th>
                                        <button className="thBtn" onClick={() => sortBy("overtime")} data-testid="pg-th-overtime">
                                            Overtime {sortKey === "overtime" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                                        </button>
                                    </th>
                                )}

                                 {cols.last_name && (
                                    <th>
                                        <button className="thBtn" onClick={() => sortBy("last_name")} data-testid="pg-th-last-name">
                                            Last Name {sortKey === "last_name" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                                        </button>
                                    </th>
                                )}
                            </tr>
                        </thead>

                        <tbody>
                            {sortedRows.map((r) => (
                                <tr key={r.id} data-testid={`pg-row-${r.id}`}>
                                    {cols.id && <td>{r.id}</td>}
                                    {cols.name && <td>{r.last_name}, {r.first_name}</td>}
                                    {cols.department && <td>{r.department}</td>}
                                    {cols.workload && <td>{r.workload_pct}%</td>}
                                    {cols.overtime && <td>{r.overtime_eligible ? "Yes" : "No"}</td>}
                                    {cols.last_name && <td>{r.last_name}</td>}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Section>


            <Section
                title="Tabs + Lazy loading"
                subtitle="Content loads with /api/slow?ms=600"
            >
                <div className="tabs" role="tablist">
                    <button className={`tab ${tab === "profile" ? "active" : ""}`} onClick={() => setTab("profile")} data-testid="pg-tab-profile">
                        Profile
                    </button>
                    <button className={`tab ${tab === "security" ? "active" : ""}`} onClick={() => setTab("security")} data-testid="pg-tab-security">
                        Security
                    </button>
                    <button className={`tab ${tab === "audit" ? "active" : ""}`} onClick={() => setTab("audit")} data-testid="pg-tab-audit">
                        Audit
                    </button>
                </div>

                <div className="card" style={{ marginTop: 10 }} data-testid="pg-tab-panel">
                    {tabLoading ? (
                        <div className="muted">Loading tab content…</div>
                    ) : (
                        <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>
                            {JSON.stringify(tabData, null, 2)}
                        </pre>
                    )}
                </div>
                {isInstructor ? (
                    <div className="hintBox" data-testid="pg-hint-ac">
                        Hint: TBD
                    </div>
                ) : null}
            </Section>

            <Section
                title="Hard + complex locators"
                subtitle="Duplicate names, repeated action labels, and unstable DOM ids. Prefer role + name + scoped locators."
            >
                <div className="row gap" style={{ flexWrap: "wrap", marginBottom: 10 }}>
                    <button
                        className={`btn ${locatorFilter === "all" ? "" : "btnGhost"}`}
                        onClick={() => setLocatorFilter("all")}
                        data-testid="pg-hard-filter-all"
                    >
                        All
                    </button>
                    <button
                        className={`btn ${locatorFilter === "active" ? "" : "btnGhost"}`}
                        onClick={() => setLocatorFilter("active")}
                        data-testid="pg-hard-filter-active"
                    >
                        Active
                    </button>
                    <button
                        className={`btn ${locatorFilter === "on leave" ? "" : "btnGhost"}`}
                        onClick={() => setLocatorFilter("on leave")}
                        data-testid="pg-hard-filter-leave"
                    >
                        On leave
                    </button>
                    <button
                        className="btn btnGhost"
                        onClick={() => setLocatorShuffle((v) => !v)}
                        data-testid="pg-hard-shuffle"
                    >
                        {locatorShuffle ? "Reset order" : "Shuffle order"}
                    </button>
                </div>

                <div className="grid3" data-testid="pg-hard-grid">
                    {complexLocatorRows.map((row) => {
                        const fullName = `${row.first} ${row.last}`;
                        return (
                            <article
                                key={`${row.id}-${row.unstableDomId}`}
                                className="card"
                                data-testid={`pg-hard-card-${row.id}`}
                                data-employee-key={`${row.department.toLowerCase()}-${row.id}`}
                            >
                                <div className="row between" style={{ marginBottom: 8 }}>
                                    <div>
                                        <div className="muted small">Visual row #{row.visualIndex}</div>
                                        <h4 style={{ margin: "4px 0" }}>
                                            <span>{row.last},</span> <span>{row.first}</span>
                                        </h4>
                                    </div>
                                    <span className="pill" data-testid={`pg-hard-status-${row.id}`}>{row.status}</span>
                                </div>

                                <div className="muted small" style={{ marginBottom: 8 }}>
                                    Dept: {row.department} | Shift: {row.shift}
                                </div>

                                <div id={row.unstableDomId} className="muted small" data-testid={`pg-hard-dom-id-${row.id}`}>
                                    DOM id: {row.unstableDomId}
                                </div>

                                <div className="row gap" style={{ marginTop: 10, flexWrap: "wrap" }}>
                                    <button
                                        className="btn btnGhost"
                                        aria-label={`Open profile for ${fullName}`}
                                        onClick={() => {
                                            setLocatorAction(`Profile opened for ${fullName}`);
                                            appendEventLog("locator", "open", `profile:${row.id}`);
                                        }}
                                        data-testid={`pg-hard-open-profile-${row.id}`}
                                    >
                                        Open
                                    </button>

                                    <button
                                        className="btn btnGhost"
                                        aria-label={`Open audit for ${fullName}`}
                                        onClick={() => {
                                            setLocatorAction(`Audit opened for ${fullName}`);
                                            appendEventLog("locator", "open", `audit:${row.id}`);
                                        }}
                                        data-testid={`pg-hard-open-audit-${row.id}`}
                                    >
                                        Open
                                    </button>
                                </div>
                            </article>
                        );
                    })}
                </div>

                <div className="pill" style={{ marginTop: 10 }} data-testid="pg-hard-last-action">
                    Last action: {locatorAction}
                </div>
            </Section>

            <Section
                title="Event handling techniques"
                subtitle="Propagation, keyboard shortcuts, blur commit, and custom window events with a live event log."
            >
                <div className="grid2" style={{ alignItems: "start" }}>
                    <div className="card" data-testid="pg-evt-propagation-panel">
                        <div className="muted small" style={{ marginBottom: 8 }}>
                            Propagation lab
                        </div>

                        <label className="pill" style={{ display: "inline-flex", marginBottom: 10 }} data-testid="pg-evt-stop-bubble">
                            <input
                                type="checkbox"
                                checked={stopBubble}
                                onChange={(e) => setStopBubble(e.target.checked)}
                            />
                            {" "}Stop bubbling on inner click
                        </label>

                        <div
                            className="card"
                            onClickCapture={handlePropagationShellCapture}
                            onClick={handlePropagationShellBubble}
                            data-testid="pg-evt-shell"
                        >
                            <div
                                className="card"
                                onClick={handlePropagationMiddleBubble}
                                data-testid="pg-evt-middle"
                            >
                                <button className="btn" onClick={handleInnerAction} data-testid="pg-evt-inner-btn">
                                    Trigger inner action
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="card" data-testid="pg-evt-input-panel">
                        <div className="muted small">Keyboard + blur handlers</div>

                        <input
                            className="input"
                            placeholder="Type command, then press Ctrl+K"
                            onKeyDown={handleHotkey}
                            data-testid="pg-evt-hotkey-input"
                            style={{ marginTop: 8 }}
                        />

                        <div className="pill" style={{ marginTop: 10 }} data-testid="pg-evt-hotkey-result">
                            {hotkeyResult}
                        </div>

                        <textarea
                            className="input"
                            rows={3}
                            value={draftNote}
                            onChange={(e) => setDraftNote(e.target.value)}
                            onBlur={handleNoteBlur}
                            placeholder="Draft note. Blur the field to trigger save."
                            data-testid="pg-evt-note"
                            style={{ marginTop: 10, resize: "vertical", minHeight: 84 }}
                        />

                        <div className="muted small" data-testid="pg-evt-last-saved">
                            Last saved note: {lastSavedNote}
                        </div>

                        <div className="row gap" style={{ marginTop: 10, flexWrap: "wrap" }}>
                            <button className="btn btnGhost" onClick={triggerCustomWindowEvent} data-testid="pg-evt-custom-trigger">
                                Dispatch window event
                            </button>

                            <div className="pill" data-testid="pg-evt-custom-count">
                                pg:sync count: {customEventCount}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="card" style={{ marginTop: 10 }} data-testid="pg-evt-log-wrap">
                    <div className="muted small" style={{ marginBottom: 8 }}>
                        Event log (latest first)
                    </div>

                    {eventLog.length === 0 ? (
                        <div className="muted" data-testid="pg-evt-log-empty">No events yet</div>
                    ) : (
                        <div className="tableWrap">
                            <table className="table" data-testid="pg-evt-log-table">
                                <thead>
                                    <tr>
                                        <th>Event</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {eventLog.map((line, idx) => (
                                        <tr key={`${line}-${idx}`} data-testid={`pg-evt-log-${idx}`}>
                                            <td>{line}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </Section>

            <Section
                title="Iframe mini-form"
                subtitle="Switch into iframe, submit, assert parent received postMessage"
            >
                <div className="row gap" style={{ alignItems: "flex-start", flexWrap: "wrap" }}>
                    <div style={{ flex: "1 1 520px" }}>
                        <iframe
                            title="playground-iframe"
                            data-testid="pg-iframe"
                            className="iframeBox"
                            srcDoc={`
<!doctype html>
<html>
<head>
  <meta charset="utf-8"/>
  <style>
    body { font-family: system-ui, Arial; padding: 12px; margin: 0; }
    .card { border: 1px solid #e8eaf2; border-radius: 12px; padding: 12px; }
    .row { display: flex; gap: 10px; margin-top: 10px; flex-wrap: wrap; }
    input, select { padding: 10px 12px; border: 1px solid #d7dbe8; border-radius: 10px; }
    button { padding: 10px 12px; border: 0; border-radius: 10px; background: #0f172a; color: white; font-weight: 700; cursor: pointer; }
    .muted { opacity: .7; font-size: 12px; margin-top: 8px; }
  </style>
</head>
<body>
  <div class="card">
    <h3 style="margin:0">Internal form</h3>
    <div class="muted">Inside iframe (good for frame locators)</div>

    <div class="row">
      <input id="if-name" placeholder="Name" data-testid="if-name"/>
      <select id="if-type" data-testid="if-type">
        <option value="incident">Incident</option>
        <option value="request">Request</option>
        <option value="change">Change</option>
      </select>
    </div>

    <div class="row">
      <button id="if-submit" data-testid="if-submit">Submit</button>
    </div>

    <div id="if-result" class="muted" data-testid="if-result">—</div>
  </div>

  <script>
    const btn = document.getElementById('if-submit');
    btn.addEventListener('click', () => {
      const payload = {
        name: document.getElementById('if-name').value || '',
        type: document.getElementById('if-type').value
      };
      document.getElementById('if-result').textContent = 'Submitted: ' + JSON.stringify(payload);
      parent.postMessage({ type: 'IFRAME_SUBMIT', payload }, '*');
    });
  </script>
</body>
</html>
        `}
                        />
                    </div>

                    <div style={{ flex: "1 1 260px" }}>
                        <div className="card" data-testid="pg-iframe-received">
                            <div className="muted small">Parent received:</div>
                            <div style={{ marginTop: 8, wordBreak: "break-word" }}>
                                {iframeMsg || "—"}
                            </div>
                        </div>
                    </div>
                </div>
                {isInstructor ? (
                    <div className="hintBox" data-testid="pg-hint-ac">
                        Hint: TBD
                    </div>
                ) : null}
            </Section>

            <Section
                title="Flaky endpoint"
                subtitle="Calls /api/flaky?failRate=0.35 (sometimes 503)"
            >
                <div className="row gap">
                    <button className="btn" onClick={callFlaky} disabled={flakyLoading} data-testid="pg-flaky-call">
                        {flakyLoading ? "Calling…" : "Call flaky"}
                    </button>
                    <div className="pill" data-testid="pg-flaky-result">
                        {flakyMsg || "—"}
                    </div>
                </div>

                <div className="muted small" style={{ marginTop: 10 }}>
                    Tip: tus tests deben tolerar falla con retry controlado.
                </div>
                {isInstructor ? (
                    <div className="hintBox" data-testid="pg-hint-ac">
                        Hint: TBD
                    </div>
                ) : null}
            </Section>

            <Section
                title="Autocomplete + debounce + slow"
                subtitle="Type 2+ chars. Debounced search + artificial delay. Great for wait strategies."
            >
                <div style={{ position: "relative", maxWidth: 520 }}>
                    <input
                        className="input"
                        placeholder="Search employee… (try: er, ad, ju)"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        data-testid="pg-ac-input"
                    />

                    {searchLoading ? (
                        <div className="muted small" style={{ marginTop: 8 }} data-testid="pg-ac-loading">
                            Searching…
                        </div>
                    ) : null}

                    {results.length > 0 ? (
                        <div className="dropdown" data-testid="pg-ac-dropdown">
                            {results.map((r) => (
                                <button
                                    key={r.id}
                                    className="dropdownItem"
                                    onClick={() => {
                                        setSelectedItem(r);
                                        setQuery(r.label);
                                        setResults([]);
                                        showToast("Selected from autocomplete");
                                    }}
                                    data-testid={`pg-ac-item-${r.id}`}
                                >
                                    {r.label}
                                </button>
                            ))}
                        </div>
                    ) : null}

                    <div className="muted small" style={{ marginTop: 10 }} data-testid="pg-ac-selected">
                        Selected: {selectedItem ? selectedItem.label : "—"}
                    </div>
                </div>
                {isInstructor ? (
                    <div className="hintBox" data-testid="pg-hint-ac">
                        Hint: TBD
                    </div>
                ) : null}
            </Section>

            <Section
                title="File upload"
                subtitle="Pick a file. Simulates slow upload + validations (size/type). Great for waits."
            >
                <div className="row gap" style={{ alignItems: "center", flexWrap: "wrap" }}>
                    <input
                        ref={fileInputRef}
                        type="file"
                        className="input"
                        onChange={(e) => {
                            const f = e.target.files?.[0] || null;
                            setPickedFile(f);
                            setUploadResult("");
                        }}
                        data-testid="pg-upload-input"
                    />


                    <button
                        className="btn"
                        onClick={fakeUpload}
                        disabled={uploading}
                        data-testid="pg-upload-btn"
                    >
                        {uploading ? "Uploading…" : "Upload"}
                    </button>

                    <button
                        className="btn btnGhost"
                        onClick={() => {
                            setPickedFile(null);
                            setUploadResult("");
                            if (fileInputRef.current) fileInputRef.current.value = "";
                            showToast("Cleared");
                            // Ojo: no podemos limpiar visualmente el input file sin ref; para automation está bien.
                        }}
                        disabled={uploading}
                        data-testid="pg-upload-clear"
                    >
                        Clear
                    </button>
                </div>

                <div style={{ marginTop: 10 }}>
                    <div className="muted small" data-testid="pg-upload-meta">
                        Selected: {pickedFile ? `${pickedFile.name} (${pickedFile.type || "unknown type"})` : "—"}
                    </div>

                    <div className="pill" style={{ marginTop: 10 }} data-testid="pg-upload-result">
                        {uploadResult || "—"}
                    </div>
                </div>
                {isInstructor ? (
                    <div className="hintBox" data-testid="pg-hint-ac">
                        Hint: TBD
                    </div>
                ) : null}
            </Section>


        </div>
    );
}
