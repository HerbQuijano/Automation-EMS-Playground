import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../api/client";
import { setAuth } from "../auth/authStore";

export default function Login() {
    const nav = useNavigate();
    const [email, setEmail] = useState("admin@ems.local");
    const [password, setPassword] = useState("Admin123!");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function onSubmit(e) {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const login = await apiFetch("/api/auth/login", {
                method: "POST",
                body: JSON.stringify({ email, password })
            });

            // opcional: valida /me
            //const me = await apiFetch("/api/auth/me");

            setAuth({
                token: login.token,
                expires_at: login.expires_at,
                user: login.user
            });
            nav("/dashboard");
        } catch (err) {
            setError(err.message || "Login failed");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="loginWrap">
            <form className="card loginCard" onSubmit={onSubmit}>
                <h1>Sign in</h1>
                <p className="muted">Use your EMS credentials.</p>

                <label className="label">Email</label>
                <input
                    data-testid="login-email"
                    className="input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="username"
                />

                <label className="label">Password</label>
                <input
                    data-testid="login-password"
                    className="input"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                />

                {error ? <div className="error" data-testid="login-error">{error}</div> : null}

                <button className="btn" data-testid="login-submit" disabled={loading}>
                    {loading ? "Signing in..." : "Sign in"}
                </button>

                <div className="hint">
                    Admin: <b>admin@ems.local</b> / <b>Admin123!</b>
                </div>
            </form>
        </div>
    );
}
