import { Navigate } from 'react-router-dom'
import { getAuth } from '../lib/auth.js'

export default function ProtectedRoute({ children, requireRole }) {
  const auth = getAuth()

  if (!auth?.token || !auth?.user?.role) {
    return <Navigate to="/auth?role=student&mode=login" replace />
  }

  if (requireRole && auth.user.role !== requireRole) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}
