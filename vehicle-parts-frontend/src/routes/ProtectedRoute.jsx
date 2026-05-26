import { Navigate, Outlet } from 'react-router-dom'
import { hasAnyRole, isAuthenticated } from '../services/authService'

function ProtectedRoute({ allowedRoles = [], redirectTo = '/login' }) {
  if (!isAuthenticated()) {
    return <Navigate to={redirectTo} replace />
  }

  if (!hasAnyRole(allowedRoles)) {
    return <Navigate to="/public" replace />
  }

  return <Outlet />
}

export default ProtectedRoute

