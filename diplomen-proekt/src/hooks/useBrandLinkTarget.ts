import { useAuth } from '../context/AuthContext'

export function useBrandLinkTarget(): string {
  const { user, loading } = useAuth()
  if (loading) return '/'
  return user ? '/home' : '/'
}
