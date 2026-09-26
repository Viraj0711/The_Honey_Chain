import { useState } from 'react';
import { api, storeSession } from '../api';

export default function LoginPage() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const result = await api.login({ phone, password });
      storeSession(result);
      window.location.href = '/';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'login failed');
      setBusy(false);
    }
  };

  return (
    <div className="login-wrap">
      <form className="card login-card" onSubmit={submit}>
        <h1>Honey Chain</h1>
        <p className="muted">Sign in with your registered phone number</p>
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Phone number"
          autoComplete="username"
          required
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          autoComplete="current-password"
          required
        />
        {error && <p className="error-text">{error}</p>}
        <button type="submit" disabled={busy}>
          {busy ? 'Signing in...' : 'Sign in'}
        </button>
        <p className="muted">Demo: 9000000001 / farmer123 or 9000000002 / admin123</p>
      </form>
    </div>
  );
}
