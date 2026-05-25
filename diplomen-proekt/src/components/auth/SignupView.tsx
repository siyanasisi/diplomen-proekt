import { Link } from 'react-router-dom';
import { useBrandLinkTarget } from '../../hooks/useBrandLinkTarget';
import { AlertBanner } from '../ui/feedback/AlertBanner';
import { CityAutocomplete } from './CityAutocomplete';

const inputStyle: React.CSSProperties = {
  width: '100%',
  height: 44,
  borderRadius: 12,
  border: '1px solid #E2E8F0',
  paddingLeft: 14,
  paddingRight: 14,
  fontSize: 14,
  color: '#1E293B',
  outline: 'none',
  boxSizing: 'border-box',
  background: '#fff',
};

const focusIn = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
  e.target.style.borderColor = '#7C3AED';
  e.target.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.12)';
};
const focusOut = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
  e.target.style.borderColor = '#E2E8F0';
  e.target.style.boxShadow = 'none';
};

export interface SignupViewProps {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  showPassword: boolean;
  showConfirmPassword: boolean;
  role: 'student' | 'teacher';
  grade: string;
  city: string;
  qualifications: string;
  loading: boolean;
  emailError: string;
  passwordError: string;
  confirmPasswordError: string;
  cityError: string;
  feedback: { type: 'success' | 'error'; message: string } | null;
  
  onFirstNameChange: (value: string) => void;
  onLastNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  onShowPasswordToggle: () => void;
  onShowConfirmPasswordToggle: () => void;
  onRoleChange: (role: 'student' | 'teacher') => void;
  onGradeChange: (value: string) => void;
  onCityChange: (value: string) => void;
  onQualificationsChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function SignupView({
  firstName,
  lastName,
  email,
  password,
  confirmPassword,
  showPassword,
  showConfirmPassword,
  role,
  grade,
  city,
  qualifications,
  loading,
  emailError,
  passwordError,
  confirmPasswordError,
  cityError,
  feedback,
  onFirstNameChange,
  onLastNameChange,
  onEmailChange,
  onPasswordChange,
  onConfirmPasswordChange,
  onShowPasswordToggle,
  onShowConfirmPasswordToggle,
  onRoleChange,
  onGradeChange,
  onCityChange,
  onQualificationsChange,
  onSubmit,
}: SignupViewProps) {
  const brandLinkTarget = useBrandLinkTarget();
  const subtitle = role === 'teacher'
    ? 'Създайте своя нов учителски акаунт в Matura+'
    : 'Създайте своя нов акаунт в Matura+';

  const selectArrow = 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' fill=\'%2394A3B8\' viewBox=\'0 0 16 16\'%3E%3Cpath d=\'M8 11L3 6h10l-5 5z\'/%3E%3C/svg%3E")';
  const selectExtra: React.CSSProperties = { 
    appearance: 'none', 
    paddingRight: 32, 
    backgroundImage: selectArrow, 
    backgroundRepeat: 'no-repeat', 
    backgroundPosition: 'right 12px center' 
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
      {/* header */}
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1.5rem', height: '4rem', borderBottom: '1px solid #e2e8f0', background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)', position: 'sticky', top: 0, zIndex: 20 }}>
        <Link to={brandLinkTarget} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
          <div style={{ width: '2.25rem', height: '2.25rem', borderRadius: '0.625rem', background: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
            <span className="material-icons" style={{ fontSize: '1.25rem' }}>auto_stories</span>
          </div>
          <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>Matura<span style={{ color: '#7c3aed' }}>+</span></span>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <Link to="/login" style={{ fontSize: '0.875rem', fontWeight: 600, color: '#475569', textDecoration: 'none' }}>Вход</Link>
          <Link to="/signup" style={{ fontSize: '0.875rem', fontWeight: 600, color: '#fff', background: '#7c3aed', padding: '0.5rem 1.25rem', borderRadius: '0.5rem', textDecoration: 'none' }}>Регистрация</Link>
        </div>
      </header>

      {/* main */}
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: 480 }}>
          {/* card */}
          <div style={{ width: '100%', background: '#fff', borderRadius: '1rem', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0', padding: '2.5rem 2.25rem 2rem', position: 'relative', overflow: 'visible', marginTop: '1.75rem' }}>
            {/* accent bar */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: '#7c3aed', borderRadius: '1rem 1rem 0 0', zIndex: 1 }} />

            {/* icon */}
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: -72, position: 'relative', zIndex: 2 }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 20px rgba(124,58,237,0.3)' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="8.5" cy="7" r="4" />
                  <line x1="20" y1="8" x2="20" y2="14" />
                  <line x1="23" y1="11" x2="17" y2="11" />
                </svg>
              </div>
            </div>

            {/* title */}
            <h1 style={{ textAlign: 'center', fontSize: 24, fontWeight: 700, color: '#0F172A', margin: '14px 0 4px' }}>Регистрация</h1>
            <p style={{ textAlign: 'center', fontSize: 13, color: '#94A3B8', margin: '0 0 22px' }}>{subtitle}</p>

            {/* form */}
            <form onSubmit={onSubmit}>
              {/* name row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#334155', marginBottom: 5 }}>Име</label>
                  <input value={firstName} onChange={(e) => onFirstNameChange(e.target.value)} placeholder="Иван" style={inputStyle} onFocus={focusIn} onBlur={focusOut} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#334155', marginBottom: 5 }}>Фамилия</label>
                  <input value={lastName} onChange={(e) => onLastNameChange(e.target.value)} placeholder="Иванов" style={inputStyle} onFocus={focusIn} onBlur={focusOut} required />
                </div>
              </div>

              {/* email */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#334155', marginBottom: 5 }}>Имейл адрес</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </span>
                  <input type="email" value={email} onChange={(e) => onEmailChange(e.target.value)} placeholder="example@email.com" style={{ ...inputStyle, paddingLeft: 38 }} onFocus={focusIn} onBlur={focusOut} required />
                </div>
                {emailError && <p style={{ fontSize: 12, color: '#DC2626', marginTop: 3 }}>{emailError}</p>}
              </div>

              {/* password */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#334155', marginBottom: 5 }}>Парола</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </span>
                  <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => onPasswordChange(e.target.value)} placeholder="Минимум 8 символа" style={{ ...inputStyle, paddingLeft: 38, paddingRight: 52 }} onFocus={focusIn} onBlur={focusOut} required />
                  <button type="button" onClick={onShowPasswordToggle} tabIndex={-1} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: '#64748B', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                    {showPassword ? 'Скрий' : 'Покажи'}
                  </button>
                </div>
                {passwordError && <p style={{ fontSize: 12, color: '#DC2626', marginTop: 3 }}>{passwordError}</p>}
              </div>

              {/* confirm password */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#334155', marginBottom: 5 }}>Повторете паролата</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </span>
                  <input type={showConfirmPassword ? 'text' : 'password'} value={confirmPassword} onChange={(e) => onConfirmPasswordChange(e.target.value)} placeholder="Повторете паролата" style={{ ...inputStyle, paddingLeft: 38, paddingRight: 52 }} onFocus={focusIn} onBlur={focusOut} required />
                  <button type="button" onClick={onShowConfirmPasswordToggle} tabIndex={-1} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: '#64748B', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                    {showConfirmPassword ? 'Скрий' : 'Покажи'}
                  </button>
                </div>
                {confirmPasswordError && <p style={{ fontSize: 12, color: '#DC2626', marginTop: 3 }}>{confirmPasswordError}</p>}
              </div>

              {/* role row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#334155', marginBottom: 5 }}>Роля</label>
                  <select value={role} onChange={(e) => onRoleChange(e.target.value as 'student' | 'teacher')} style={{ ...inputStyle, ...selectExtra }} onFocus={focusIn} onBlur={focusOut}>
                    <option value="student">Ученик</option>
                    <option value="teacher">Учител</option>
                  </select>
                </div>

                {role === 'student' && (
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#334155', marginBottom: 5 }}>Клас</label>
                    <select value={grade} onChange={(e) => onGradeChange(e.target.value)} style={{ ...inputStyle, ...selectExtra }} onFocus={focusIn} onBlur={focusOut}>
                      <option value="">Изберете клас</option>
                      <option value="8">8 клас</option>
                      <option value="9">9 клас</option>
                      <option value="10">10 клас</option>
                      <option value="11">11 клас</option>
                      <option value="12">12 клас</option>
                    </select>
                  </div>
                )}

                {role === 'teacher' && (
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#334155', marginBottom: 5 }}>Квалификации</label>
                    <input value={qualifications} onChange={(e) => onQualificationsChange(e.target.value)} placeholder="Математика, Физика" style={inputStyle} onFocus={focusIn} onBlur={focusOut} />
                  </div>
                )}
              </div>

              {/* city */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#334155', marginBottom: 5 }}>Град</label>
                <CityAutocomplete
                  value={city}
                  onChange={onCityChange}
                  placeholder="Започнете да пишете град..."
                  disabled={loading}
                  error={cityError}
                  inputStyle={inputStyle}
                  onFocus={focusIn}
                  onBlur={focusOut}
                />
                {cityError && <p style={{ fontSize: 12, color: '#DC2626', marginTop: 3 }}>{cityError}</p>}
              </div>

              {/* submit */}
              <button type="submit" disabled={loading} style={{ width: '100%', height: 46, borderRadius: 12, border: 'none', background: '#7C3AED', color: '#fff', fontSize: 15, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                {loading ? 'Регистриране...' : 'Регистрирай се'} <span>→</span>
              </button>
            </form>

            {/* feedback */}
            {feedback && (
              <AlertBanner
                variant={feedback.type === 'success' ? 'success' : 'error'}
                message={feedback.message}
                style={{ marginTop: 12 }}
              />
            )}

            {/* login link */}
            <p style={{ textAlign: 'center', fontSize: 14, color: '#64748B', marginTop: 18 }}>
              Вече имате акаунт?{' '}
              <Link to="/login" style={{ color: '#7C3AED', fontWeight: 600, textDecoration: 'underline' }}>Влезте тук</Link>
            </p>
          </div>

          {/* terms */}
          <p style={{ textAlign: 'center', fontSize: 11, color: '#94A3B8', marginTop: 16, maxWidth: 320, lineHeight: 1.5 }}>
            Регистрирайки се, вие приемате нашите{' '}
            <span style={{ color: '#7C3AED', fontWeight: 600, cursor: 'pointer' }}>Условия за ползване</span>
            {' '}и{' '}
            <span style={{ color: '#7C3AED', fontWeight: 600, cursor: 'pointer' }}>Политика за поверителност</span>.
          </p>
        </div>
      </main>
    </div>
  );
}
