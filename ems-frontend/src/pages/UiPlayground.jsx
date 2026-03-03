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
        overtime: true
    });

    const tableRows = useMemo(() => ([
        { id: 12, first_name: "Eric", last_name: "Freeman", department: "Finance", workload_pct: 40, overtime_eligible: 1 },
        { id: 7, first_name: "Ada", last_name: "Lovelace", department: "Engineering", workload_pct: 80, overtime_eligible: 0 },
        { id: 33, first_name: "Juan", last_name: "Pérez", department: "QA", workload_pct: 65, overtime_eligible: 1 },
        { id: 2, first_name: "Zoe", last_name: "Álvarez", department: "HR", workload_pct: 25, overtime_eligible: 0 },
        { id: 19, first_name: "Mabel", last_name: "Pug", department: "Support", workload_pct: 95, overtime_eligible: 1 },
    ]), []);

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

    function togglePerm(id) {
        setPerms(prev => prev.map(p => (p.id === id ? { ...p, checked: !p.checked } : p)));
    }

    function setAllPerms(value) {
        setPerms(prev => prev.map(p => ({ ...p, checked: value })));
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

                    <div className="pill" data-testid="pg-sort-state">
                        sort={sortKey}:{sortDir}
                    </div>
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
