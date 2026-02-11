import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import type { LoginFeedbackState } from '../../hooks/useLogin'

const inputClassName =
  'w-full px-4 py-3.5 border-2 border-slate-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 transition-colors placeholder:text-slate-400 text-slate-800'

const loginCopy = {
  title: '\u0412\u0445\u043e\u0434',
  subtitle: '\u0414\u043e\u0441\u0442\u044a\u043f \u0434\u043e \u0432\u0430\u0448\u0438\u044f \u0430\u043a\u0430\u0443\u043d\u0442',
  emailLabel: '\u0418\u043c\u0435\u0439\u043b',
  passwordLabel: '\u041f\u0430\u0440\u043e\u043b\u0430',
  forgotPassword: '\u0417\u0430\u0431\u0440\u0430\u0432\u0435\u043d\u0430 \u043f\u0430\u0440\u043e\u043b\u0430?',
  forgotPasswordLoading: '\u0418\u0437\u043f\u0440\u0430\u0449\u0430\u043d\u0435...',
  submitLabel: '\u0412\u0445\u043e\u0434',
  submitLoadingLabel: '\u0412\u043b\u0438\u0437\u0430\u043d\u0435...',
  signUpPrompt: '\u041d\u044f\u043c\u0430\u0442\u0435 \u0430\u043a\u0430\u0443\u043d\u0442?',
  signUpLabel: '\u0420\u0435\u0433\u0438\u0441\u0442\u0440\u0438\u0440\u0430\u0439\u0442\u0435 \u0441\u0435 \u0442\u0443\u043a',
}

interface LoginFieldProps {
  id: string
  label: string
  type: 'email' | 'password'
  placeholder: string
  value: string
  onChange: (value: string) => void
}

function LoginField({ id, label, type, placeholder, value, onChange }: LoginFieldProps) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-slate-700 mb-2">
        {label}
      </label>
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        className={inputClassName}
      />
    </div>
  )
}

interface PasswordFieldProps {
  value: string
  onChange: (value: string) => void
  onForgotPassword: () => void
  resetLoading: boolean
}

function PasswordField({ value, onChange, onForgotPassword, resetLoading }: PasswordFieldProps) {
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <label htmlFor="password" className="block text-sm font-semibold text-slate-700">
          {loginCopy.passwordLabel}
        </label>
        <button
          type="button"
          onClick={onForgotPassword}
          disabled={resetLoading}
          className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {resetLoading ? loginCopy.forgotPasswordLoading : loginCopy.forgotPassword}
        </button>
      </div>
      <input
        id="password"
        type="password"
        placeholder="\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        className={inputClassName}
      />
    </div>
  )
}

function FeedbackBanner({ feedback }: { feedback: LoginFeedbackState }) {
  return (
    <div className="mt-8">
      <div
        className={`p-5 rounded-xl border-2 ${
          feedback.type === 'success'
            ? 'bg-emerald-50/50 border-emerald-200 text-emerald-800'
            : 'bg-red-50/50 border-red-200 text-red-800'
        }`}
      >
        <p className="text-sm font-medium leading-relaxed">{feedback.message}</p>
      </div>
    </div>
  )
}

function SectionDivider() {
  return (
    <div className="px-10">
      <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
    </div>
  )
}

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
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-rose-50 px-6 py-16">
      <div className="w-full max-w-xl">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-gray-100/50 overflow-hidden">
          <div className="pt-16 pb-12 px-10 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-rose-500 to-rose-600 shadow-lg shadow-rose-500/30 mb-8">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                />
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-3 tracking-tight">{loginCopy.title}</h1>
            <p className="text-gray-500 text-base">{loginCopy.subtitle}</p>
          </div>

          <SectionDivider />

          <div className="px-10 pt-12 pb-10">
            <form onSubmit={onSubmit} className="space-y-8">
              <LoginField
                id="email"
                type="email"
                label={loginCopy.emailLabel}
                placeholder="name@example.com"
                value={email}
                onChange={onEmailChange}
              />

              <PasswordField
                value={password}
                onChange={onPasswordChange}
                onForgotPassword={onForgotPassword}
                resetLoading={resetLoading}
              />

              <button
                type="submit"
                disabled={!canSubmit}
                className="w-full py-3.5 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 disabled:from-rose-300 disabled:to-rose-400 text-white rounded-xl text-lg font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-100 shadow-lg shadow-rose-500/25 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:ring-offset-2 disabled:cursor-not-allowed"
              >
                {loading ? loginCopy.submitLoadingLabel : loginCopy.submitLabel}
              </button>
            </form>

            {feedback && <FeedbackBanner feedback={feedback} />}
          </div>

          <SectionDivider />

          <div className="px-10 py-8 text-center">
            <p className="text-sm text-gray-600">
              {loginCopy.signUpPrompt}{' '}
              <Link
                to="/signup"
                className="font-semibold text-rose-600 hover:text-rose-700 transition-colors duration-200 hover:underline underline-offset-4"
              >
                {loginCopy.signUpLabel}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
