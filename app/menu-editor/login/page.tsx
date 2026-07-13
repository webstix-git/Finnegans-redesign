'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  clearStoredAuth,
  getStoredAuth,
  setStoredAuth,
  verifySessionOnServer,
} from '@/lib/menuAuth';
import '@/components/menu-editor/editor-ui.css';

export default function MenuEditorLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const token = getStoredAuth();
      if (!token) return;
      const ok = await verifySessionOnServer();
      if (cancelled) return;
      if (ok) {
        router.replace('/menu-editor');
      } else {
        clearStoredAuth();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    clearStoredAuth();

    try {
      const res = await fetch('/api/menu-auth', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password: password.trim() }),
      });
      const json = (await res.json()) as { token?: string; error?: string };
      if (!res.ok) throw new Error(json.error || 'Invalid email or password');
      if (!json.token) throw new Error('No session token received');
      setStoredAuth(json.token);
      router.replace('/menu-editor');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fw-login-root">
      <div className="fw-login-card">
        <img
          src="/assets/8d4b777e-5d92-4ad2-b353-2abba0a8f804.webp"
          alt="Finnegan's Wake"
          className="fw-login-logo"
        />
        <h1 className="fw-login-title">Admin Editor</h1>

        {error ? <div className="fw-login-error">{error}</div> : null}

        <form onSubmit={handleSubmit} autoComplete="off">
          <div className="fw-login-field">
            <label htmlFor="fw-menu-email">Email</label>
            <input
              id="fw-menu-email"
              name="fw-menu-email"
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              required
            />
          </div>
          <div className="fw-login-field">
            <label htmlFor="fw-menu-password">Password</label>
            <input
              id="fw-menu-password"
              name="fw-menu-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              autoComplete="new-password"
              required
            />
          </div>
          <button type="submit" className="fw-login-btn" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
