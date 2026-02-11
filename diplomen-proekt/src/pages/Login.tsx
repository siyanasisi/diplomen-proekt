import { LoginView } from '../components/auth/LoginView'
import { useToast } from '../context/ToastContext'
import { useLogin } from '../hooks/useLogin'

export default function Login() {
  const showToast = useToast()
  const {
    email,
    setEmail,
    password,
    setPassword,
    loading,
    resetLoading,
    feedback,
    canSubmit,
    onSubmit,
    onForgotPassword,
  } = useLogin({ showToast })

  return (
    <LoginView
      email={email}
      password={password}
      loading={loading}
      resetLoading={resetLoading}
      canSubmit={canSubmit}
      feedback={feedback}
      onEmailChange={setEmail}
      onPasswordChange={setPassword}
      onSubmit={onSubmit}
      onForgotPassword={onForgotPassword}
    />
  )
}
