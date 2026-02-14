import type { FormEvent } from 'react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { LoginFeedbackState } from '../../hooks/useLogin'

interface LoginViewProps {
  email: string
  password: string
  loading: boolean
  resetLoading: boolean
  canSubmit: boolean
  feedback: LoginFeedbackState | null
  onEmailChange: (value: string) => void
  onPasswordChange: (value: string) => void
  onSubmit: (e: FormEvent<HTMLFormElement>) => void | Promise<void>
  onForgotPassword: () => void
}

export function LoginView({
  email,
  password,
  loading,
  resetLoading,
  canSubmit,
  feedback,
  onEmailChange,
  onPasswordChange,
  onSubmit,
  onForgotPassword,
}: LoginViewProps) {
  const [showPw, setShowPw] = useState(false)

  return (
    <div style={{ height: '100vh', background: '#F5F3FF', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* header */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 28px',
          borderBottom: '1px solid #E5E7EB',
          background: '#fff',
          position: 'sticky',
          top: 0,
          zIndex: 20,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: '#7C3AED',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 700,
              fontSize: 20,
            }}
          >
            M
          </div>
          <span style={{ fontSize: 20, fontWeight: 700, color: '#1E293B' }}>
            Матура<span style={{ color: '#7C3AED' }}>+</span>
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <Link to="/login" style={{ fontSize: 14, fontWeight: 600, color: '#475569', textDecoration: 'none' }}>
            Вход
          </Link>
          <Link
            to="/signup"
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: '#fff',
              background: '#7C3AED',
              padding: '10px 24px',
              borderRadius: 999,
              textDecoration: 'none',
            }}
          >
            Регистрация
          </Link>
        </div>
      </header>

      {/* main */}
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', overflow: 'hidden' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: 440 }}>
          {/* card */}
          <div
            style={{
              width: '100%',
              background: '#fff',
              borderRadius: 20,
              boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
              border: '1px solid #F1F5F9',
              padding: '48px 40px 40px',
              position: 'relative',
              overflow: 'visible',
              marginTop: 32,
            }}
          >
            {/* accent bar */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 5, background: '#7C3AED', borderRadius: '20px 20px 0 0', zIndex: 1 }} />

            <div style={{ display: 'flex', justifyContent: 'center', marginTop: -80, position: 'relative', zIndex: 2 }}>
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 18,
                  background: '#7C3AED',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 8px 20px rgba(124,58,237,0.3)',
                }}
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="8.5" cy="7" r="4" />
                  <line x1="20" y1="8" x2="20" y2="14" />
                  <line x1="23" y1="11" x2="17" y2="11" />
                </svg>
              </div>
            </div>

            {/* title */}
            <h1 style={{ textAlign: 'center', fontSize: 28, fontWeight: 700, color: '#0F172A', margin: '20px 0 6px' }}>
              Вход
            </h1>
            <p style={{ textAlign: 'center', fontSize: 14, color: '#94A3B8', margin: '0 0 32px' }}>
              Достъп до вашия акаунт
            </p>

            {/* form */}
            <form onSubmit={onSubmit}>
              {/* email */}
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#334155', marginBottom: 6 }}>
                Имейл
              </label>
              <div style={{ position: 'relative', marginBottom: 24 }}>
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </span>
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => onEmailChange(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    height: 44,
                    borderRadius: 12,
                    border: '1px solid #E2E8F0',
                    paddingLeft: 38,
                    paddingRight: 14,
                    fontSize: 14,
                    color: '#1E293B',
                    outline: 'none',
                    boxSizing: 'border-box',
                    background: '#fff',
                  }}
                  onFocus={(e) => { e.target.style.borderColor = '#7C3AED'; e.target.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.12)' }}
                  onBlur={(e) => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none' }}
                />
              </div>

              {/* password row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 500, color: '#334155' }}>Парола</label>
                <button
                  type="button"
                  onClick={onForgotPassword}
                  disabled={resetLoading}
                  style={{
                    fontSize: 12,
                    fontWeight: 500,
                    color: '#7C3AED',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  {resetLoading ? 'Изпращане...' : 'Забравена парола?'}
                </button>
              </div>

              {/* password input */}
              <div style={{ position: 'relative', marginBottom: 28 }}>
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </span>
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => onPasswordChange(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    height: 44,
                    borderRadius: 12,
                    border: '1px solid #E2E8F0',
                    paddingLeft: 38,
                    paddingRight: 52,
                    fontSize: 14,
                    color: '#1E293B',
                    outline: 'none',
                    boxSizing: 'border-box',
                    background: '#fff',
                  }}
                  onFocus={(e) => { e.target.style.borderColor = '#7C3AED'; e.target.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.12)' }}
                  onBlur={(e) => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((p) => !p)}
                  tabIndex={-1}
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: 12,
                    color: '#64748B',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  {showPw ? 'Скрий' : 'Покажи'}
                </button>
              </div>

              {/* submit button */}
              <button
                type="submit"
                disabled={!canSubmit}
                style={{
                  width: '100%',
                  height: 48,
                  borderRadius: 12,
                  border: 'none',
                  background: '#7C3AED',
                  color: '#fff',
                  fontSize: 16,
                  fontWeight: 600,
                  cursor: canSubmit ? 'pointer' : 'not-allowed',
                  opacity: canSubmit ? 1 : 0.6,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                {loading ? 'Влизане...' : 'Вход'} <span>→</span>
              </button>
            </form>

            {feedback && (
              <div
                style={{
                  marginTop: 16,
                  padding: 14,
                  borderRadius: 12,
                  border: `1px solid ${feedback.type === 'success' ? '#A7F3D0' : '#FECACA'}`,
                  background: feedback.type === 'success' ? '#ECFDF5' : '#FEF2F2',
                  color: feedback.type === 'success' ? '#065F46' : '#991B1B',
                  fontSize: 13,
                  fontWeight: 500,
                }}
              >
                {feedback.message}
              </div>
            )}

            {/* signup link */}
            <p style={{ textAlign: 'center', fontSize: 14, color: '#64748B', marginTop: 28 }}>
              Нямате акаунт?{' '}
              <Link to="/signup" style={{ color: '#7C3AED', fontWeight: 600, textDecoration: 'underline' }}>
                Регистрирайте се тук
              </Link>
            </p>
          </div>

          {/* footer */}
          <div style={{ marginTop: 40, display: 'flex', gap: 36, justifyContent: 'center' }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Помощ</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Поверителност</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Условия</span>
          </div>
        </div>
      </main>
    </div>
  )
}
