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
  return `Грешка: ${raw}`
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
