import { useState, useEffect } from "react";

// ─── Keycloak config ────────────────────────────────────────────────────────
const KEYCLOAK_URL   = "http://localhost:8080";
const REALM          = "LaboratorioDev";
const CLIENT_ID      = "backend-api";
const CLIENT_SECRET  = ""; // paste your client secret here
const TOKEN_ENDPOINT = `${KEYCLOAK_URL}/realms/${REALM}/protocol/openid-connect/token`;
const API_PRIVATE    = "http://localhost:3000/api/privado";
const API_PUBLIC     = "http://localhost:3000/api/publico";

// ─── Token helpers ──────────────────────────────────────────────────────────
function saveToken(token)   { sessionStorage.setItem("access_token", token); }
function getToken()         { return sessionStorage.getItem("access_token"); }
function clearToken()       { sessionStorage.removeItem("access_token"); }
function isTokenExpired(t)  {
  try {
    const { exp } = JSON.parse(atob(t.split(".")[1]));
    return Date.now() / 1000 > exp;
  } catch { return true; }
}
function getUsername(t) {
  try { return JSON.parse(atob(t.split(".")[1])).preferred_username || "user"; }
  catch { return "user"; }
}

// ─── Styles ─────────────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg:       #f7f6f3;
    --surface:  #ffffff;
    --border:   #e8e5de;
    --text:     #1a1916;
    --muted:    #8a8780;
    --accent:   #2563eb;
    --accent-light: #eff6ff;
    --danger:   #dc2626;
    --success:  #16a34a;
    --radius:   10px;
    --shadow:   0 1px 3px rgba(0,0,0,.06), 0 4px 16px rgba(0,0,0,.04);
  }

  body {
    font-family: 'DM Sans', sans-serif;
    background: var(--bg);
    color: var(--text);
    min-height: 100vh;
  }

  /* ── Login page ── */
  .login-wrap {
    min-height: 100vh;
    display: grid;
    place-items: center;
    background: var(--bg);
  }
  .login-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 48px 44px;
    width: 100%;
    max-width: 400px;
    box-shadow: var(--shadow);
    animation: fadeUp .35s ease both;
  }
  .login-logo {
    width: 36px;
    height: 36px;
    background: var(--text);
    border-radius: 8px;
    margin-bottom: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .login-logo svg { color: white; }
  .login-card h1 { font-size: 1.4rem; font-weight: 600; margin-bottom: 6px; }
  .login-card p  { font-size: .875rem; color: var(--muted); margin-bottom: 32px; }

  .field       { margin-bottom: 16px; }
  .field label { display: block; font-size: .8rem; font-weight: 500; color: var(--muted);
                 text-transform: uppercase; letter-spacing: .06em; margin-bottom: 6px; }
  .field input {
    width: 100%; padding: 10px 14px;
    border: 1px solid var(--border); border-radius: var(--radius);
    font-family: inherit; font-size: .9rem; color: var(--text);
    background: var(--bg); outline: none; transition: border-color .2s;
  }
  .field input:focus { border-color: var(--accent); background: white; }

  .totp-row { display: flex; align-items: flex-end; gap: 10px; }
  .totp-row .field { flex: 1; margin-bottom: 0; }
  .totp-toggle {
    padding: 10px 14px; font-size: .8rem; font-weight: 500; color: var(--muted);
    background: none; border: 1px solid var(--border); border-radius: var(--radius);
    cursor: pointer; white-space: nowrap; transition: all .2s; height: 38px;
  }
  .totp-toggle:hover { border-color: var(--accent); color: var(--accent); }

  .btn-primary {
    width: 100%; padding: 11px;
    background: var(--text); color: white;
    border: none; border-radius: var(--radius);
    font-family: inherit; font-size: .9rem; font-weight: 500;
    cursor: pointer; margin-top: 8px; transition: opacity .2s;
  }
  .btn-primary:hover:not(:disabled) { opacity: .85; }
  .btn-primary:disabled { opacity: .5; cursor: not-allowed; }

  .error-msg {
    margin-top: 14px; padding: 10px 14px;
    background: #fef2f2; border: 1px solid #fecaca;
    border-radius: var(--radius); font-size: .84rem; color: var(--danger);
  }

  /* ── App shell ── */
  .app-shell { min-height: 100vh; display: flex; flex-direction: column; }

  .topbar {
    background: var(--surface);
    border-bottom: 1px solid var(--border);
    padding: 0 32px;
    height: 56px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: sticky; top: 0; z-index: 10;
  }
  .topbar-left  { display: flex; align-items: center; gap: 10px; }
  .topbar-logo  {
    width: 28px; height: 28px; background: var(--text);
    border-radius: 6px; display: flex; align-items: center; justify-content: center;
  }
  .topbar-logo svg { color: white; }
  .topbar-name  { font-size: .95rem; font-weight: 600; }
  .topbar-right { display: flex; align-items: center; gap: 16px; }
  .topbar-user  { font-size: .84rem; color: var(--muted); font-family: 'DM Mono', monospace; }

  .btn-logout {
    padding: 6px 14px; font-size: .82rem; font-weight: 500;
    background: none; border: 1px solid var(--border); border-radius: 6px;
    cursor: pointer; color: var(--text); font-family: inherit; transition: all .2s;
  }
  .btn-logout:hover { border-color: var(--danger); color: var(--danger); }

  /* ── Main content ── */
  .main { flex: 1; padding: 48px 32px; max-width: 900px; margin: 0 auto; width: 100%; }

  .greeting { margin-bottom: 40px; animation: fadeUp .3s ease both; }
  .greeting h2 { font-size: 1.75rem; font-weight: 600; margin-bottom: 6px; }
  .greeting p  { color: var(--muted); font-size: .95rem; }

  .cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px; }

  .card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 24px;
    animation: fadeUp .35s ease both;
  }
  .card:nth-child(2) { animation-delay: .05s; }
  .card:nth-child(3) { animation-delay: .1s; }

  .card-label {
    font-size: .75rem; font-weight: 500; text-transform: uppercase;
    letter-spacing: .08em; color: var(--muted); margin-bottom: 12px;
  }
  .card-title { font-size: 1rem; font-weight: 600; margin-bottom: 8px; }
  .card-body  { font-size: .875rem; color: var(--muted); line-height: 1.6; }

  .card-action {
    margin-top: 20px; padding: 8px 16px; font-size: .84rem; font-weight: 500;
    background: var(--accent-light); color: var(--accent);
    border: 1px solid #bfdbfe; border-radius: 6px;
    cursor: pointer; font-family: inherit; transition: all .2s;
  }
  .card-action:hover { background: var(--accent); color: white; border-color: var(--accent); }
  .card-action:disabled { opacity: .5; cursor: not-allowed; }

  .api-result {
    margin-top: 12px; padding: 10px 14px;
    border-radius: 6px; font-size: .82rem;
    font-family: 'DM Mono', monospace; line-height: 1.5;
  }
  .api-result.ok  { background: #f0fdf4; border: 1px solid #bbf7d0; color: var(--success); }
  .api-result.err { background: #fef2f2; border: 1px solid #fecaca; color: var(--danger); }

  .token-card { grid-column: 1 / -1; }
  .token-value {
    font-family: 'DM Mono', monospace; font-size: .72rem; color: var(--muted);
    word-break: break-all; line-height: 1.6; margin-top: 8px;
    padding: 12px; background: var(--bg); border-radius: 6px;
    border: 1px solid var(--border); max-height: 80px; overflow: hidden;
    position: relative;
  }
  .token-fade {
    position: absolute; bottom: 0; left: 0; right: 0; height: 30px;
    background: linear-gradient(transparent, var(--bg));
  }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
`;

// ─── Login page ──────────────────────────────────────────────────────────────
function LoginPage({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [totp,     setTotp]     = useState("");
  const [showTotp, setShowTotp] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const body = new URLSearchParams({
        grant_type:    "password",
        client_id:     CLIENT_ID,
        client_secret: CLIENT_SECRET,
        username,
        password,
        scope:         "openid",
        ...(showTotp && totp ? { totp } : {})
      });
      const res  = await fetch(TOKEN_ENDPOINT, { method: "POST", body });
      const data = await res.json();
      if (!res.ok) {
        const msg = data.error_description || data.error || "Login failed";
        setError(msg);
      } else {
        saveToken(data.access_token);
        onLogin(data.access_token);
      }
    } catch {
      setError("Could not reach Keycloak. Is it running on port 8080?");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="login-logo">
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
          </svg>
        </div>
        <h1>Welcome back</h1>
        <p>Sign in with your Keycloak credentials</p>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Username</label>
            <input value={username} onChange={e => setUsername(e.target.value)}
              placeholder="estudiante1" required autoFocus />
          </div>
          <div className="field">
            <label>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••" required />
          </div>

          <div className="totp-row">
            {showTotp && (
              <div className="field">
                <label>Authenticator code</label>
                <input value={totp} onChange={e => setTotp(e.target.value)}
                  placeholder="123456" maxLength={6} />
              </div>
            )}
            <button type="button" className="totp-toggle"
              onClick={() => setShowTotp(p => !p)}>
              {showTotp ? "Hide MFA" : "+ MFA code"}
            </button>
          </div>

          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </button>
          {error && <div className="error-msg">{error}</div>}
        </form>
      </div>
    </div>
  );
}

// ─── Home page ───────────────────────────────────────────────────────────────
function HomePage({ token, onLogout }) {
  const username = getUsername(token);
  const [pubResult,  setPubResult]  = useState(null);
  const [privResult, setPrivResult] = useState(null);
  const [loadingPub,  setLoadingPub]  = useState(false);
  const [loadingPriv, setLoadingPriv] = useState(false);

  async function callPublic() {
    setLoadingPub(true);
    try {
      const res  = await fetch(API_PUBLIC);
      const data = await res.json();
      setPubResult({ ok: true, text: JSON.stringify(data, null, 2) });
    } catch {
      setPubResult({ ok: false, text: "Could not reach the API server." });
    } finally { setLoadingPub(false); }
  }

  async function callPrivate() {
    setLoadingPriv(true);
    try {
      const res  = await fetch(API_PRIVATE, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setPrivResult({ ok: res.ok, text: JSON.stringify(data, null, 2) });
    } catch {
      setPrivResult({ ok: false, text: "Could not reach the API server." });
    } finally { setLoadingPriv(false); }
  }

  const expired = isTokenExpired(token);

  return (
    <div className="app-shell">
      <nav className="topbar">
        <div className="topbar-left">
          <div className="topbar-logo">
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
            </svg>
          </div>
          <span className="topbar-name">AuthApp</span>
        </div>
        <div className="topbar-right">
          <span className="topbar-user">{username}</span>
          <button className="btn-logout" onClick={onLogout}>Sign out</button>
        </div>
      </nav>

      <main className="main">
        <div className="greeting">
          <h2>Hello, {username} 👋</h2>
          <p>You are authenticated via Keycloak · JWT is {expired ? "⚠️ expired" : "✓ valid"}</p>
        </div>

        <div className="cards">
          {/* Public endpoint */}
          <div className="card">
            <div className="card-label">Public endpoint</div>
            <div className="card-title">GET /api/publico</div>
            <div className="card-body">No token required. Anyone can call this endpoint.</div>
            <button className="card-action" onClick={callPublic} disabled={loadingPub}>
              {loadingPub ? "Calling…" : "Call endpoint →"}
            </button>
            {pubResult && (
              <div className={`api-result ${pubResult.ok ? "ok" : "err"}`}>
                {pubResult.text}
              </div>
            )}
          </div>

          {/* Private endpoint */}
          <div className="card">
            <div className="card-label">Private endpoint</div>
            <div className="card-title">GET /api/privado</div>
            <div className="card-body">Requires a valid Bearer Token. Your token is sent automatically.</div>
            <button className="card-action" onClick={callPrivate} disabled={loadingPriv || expired}>
              {loadingPriv ? "Calling…" : "Call endpoint →"}
            </button>
            {privResult && (
              <div className={`api-result ${privResult.ok ? "ok" : "err"}`}>
                {privResult.text}
              </div>
            )}
          </div>

          {/* Token viewer */}
          <div className="card token-card">
            <div className="card-label">Your access token</div>
            <div className="card-body">This JWT was issued by Keycloak and is stored in sessionStorage.</div>
            <div className="token-value">
              {token}
              <div className="token-fade" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// ─── Root ────────────────────────────────────────────────────────────────────
export default function App() {
  const [token, setToken] = useState(() => {
    const t = getToken();
    return t && !isTokenExpired(t) ? t : null;
  });

  function handleLogin(t)  { setToken(t); }
  function handleLogout()  { clearToken(); setToken(null); }

  return (
    <>
      <style>{css}</style>
      {token
        ? <HomePage  token={token} onLogout={handleLogout} />
        : <LoginPage onLogin={handleLogin} />}
    </>
  );
}
