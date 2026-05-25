import { useCallback, useMemo, useState, type FormEvent } from 'react'
import { supabase } from '../supabase-client'

type FeedbackType = 'success' | 'error'

export interface LoginFeedbackState {
  type: FeedbackType
  message: string
}

interface UseLoginOptions {
  showToast: (message: string, durationMs?: number) => void
}

function toAuthErrorMessage(raw: string): string {
  const lower = raw.toLowerCase()

  if (lower.includes('invalid login credentials') || lower.includes('invalid credentials'))
    return 'Невалиден имейл или парола.'

  if (lower.includes('email not confirmed'))
    return 'Имейлът не е потвърден. Моля, проверете пощата си.'

  if (lower.includes('user not found'))
    return 'Не съществува акаунт с този имейл.'

  if (lower.includes('too many requests') || lower.includes('rate limit'))
    return 'Твърде много опити. Моля, изчакайте малко и опитайте отново.'

  if (lower.includes('email') && lower.includes('invalid'))
    return 'Моля, въведете валиден имейл адрес.'

  if (lower.includes('network') || lower.includes('fetch'))
    return 'Проблем с връзката. Проверете интернет връзката си и опитайте отново.'

  if (lower.includes('user banned') || lower.includes('user is banned'))
    return 'Този акаунт е блокиран. Свържете се с поддръжката.'

  if (lower.includes('signup disabled') || lower.includes('signups not allowed'))
    return 'Регистрацията е временно спряна.'

  return 'Възникна грешка. Моля, опитайте отново.'
}

export function useLogin({ showToast }: UseLoginOptions) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)
  const [feedback, setFeedback] = useState<LoginFeedbackState | null>(null)

  const clearFeedback = useCallback(() => setFeedback(null), [])

  const setSuccess = useCallback(
    (message: string) => {
      setFeedback({ type: 'success', message })
      showToast(message)
    },
    [showToast]
  )

  const setError = useCallback(
    (message: string) => {
      setFeedback({ type: 'error', message })
      showToast(message)
    },
    [showToast]
  )

  const onSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault()
      setLoading(true)
      clearFeedback()

      try {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        })

        if (error) {
          setError(toAuthErrorMessage(error.message))
          return
        }

        setSuccess('Успешно влизане! Пренасочване...')
      } catch (err) {
        console.error('[Login] signIn error:', err)
        setError('Нещо се обърка!')
      } finally {
        setLoading(false)
      }
    },
    [clearFeedback, email, password, setError, setSuccess]
  )

  const onForgotPassword = useCallback(async () => {
    const trimmedEmail = email.trim()
    if (!trimmedEmail) {
      setError('Въведете имейл, за да изпратим линк за нова парола.')
      return
    }

    setResetLoading(true)
    clearFeedback()

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
        redirectTo: `${window.location.origin}/login`,
      })

      if (error) {
        setError(toAuthErrorMessage(error.message))
        return
      }

      setSuccess('Изпратихме линк за смяна на паролата на вашия имейл.')
    } catch (err) {
      console.error('[Login] resetPasswordForEmail error:', err)
      setError('Не успяхме да изпратим имейл. Опитайте отново.')
    } finally {
      setResetLoading(false)
    }
  }, [clearFeedback, email, setError, setSuccess])

  const canSubmit = useMemo(() => {
    return !loading && email.trim().length > 0 && password.length > 0
  }, [email, loading, password])

  return {
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
  }
}
