import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

function FullPageLoader() {
  return <div className="min-h-screen bg-slate-50" />
}

export function ProtectedRoute() {
  const { user, loading } = useAuth()

  if (loading) return <FullPageLoader />
  if (!user) return <Navigate to="/login" replace />

  return <Outlet />
}

export function GuestOnlyRoute() {
  const { user, loading } = useAuth()

  if (loading) return <FullPageLoader />
  if (user) return <Navigate to="/home" replace />

  return <Outlet />
}
