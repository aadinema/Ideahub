/**
 * client/src/hooks/useRole.js
 * React hook for role-based UI rendering.
 *
 * IMPORTANT: This is for UI-only conditional rendering.
 * Server ALWAYS enforces RBAC independently. Never use this as a security gate.
 *
 * Usage:
 *   const { hasRole, isAdmin, isSupervisor } = useRole()
 *   {hasRole('admin', 'innovation_committee') && <AdminPanel />}
 */
import { useSelector } from 'react-redux'
import { selectCurrentUser } from '../store/authSlice'

// Import role constants from shared (via Vite alias @shared)
const ROLES = {
  EMPLOYEE:             'employee',
  SUPERVISOR:           'supervisor',
  DEPT_INNOVATION_TEAM: 'dept_innovation_team',
  INNOVATION_COMMITTEE: 'innovation_committee',
  IMPLEMENTATION_OWNER: 'implementation_owner',
  ADMIN:                'admin',
}

export const useRole = () => {
  const user = useSelector(selectCurrentUser)
  const roles = user?.roles || []

  /**
   * Returns true if the current user has at least one of the given roles.
   * @param {...string} allowedRoles
   */
  const hasRole = (...allowedRoles) => allowedRoles.some((r) => roles.includes(r))

  return {
    roles,
    hasRole,
    isEmployee:            roles.includes(ROLES.EMPLOYEE),
    isSupervisor:          roles.includes(ROLES.SUPERVISOR),
    isDeptTeam:            roles.includes(ROLES.DEPT_INNOVATION_TEAM),
    isCommittee:           roles.includes(ROLES.INNOVATION_COMMITTEE),
    isImplementationOwner: roles.includes(ROLES.IMPLEMENTATION_OWNER),
    isAdmin:               roles.includes(ROLES.ADMIN),
    // Convenience: can access admin/management views
    canAccessAdmin:        roles.includes(ROLES.ADMIN),
    canAccessReports:      hasRole(ROLES.ADMIN, ROLES.INNOVATION_COMMITTEE, ROLES.DEPT_INNOVATION_TEAM, ROLES.SUPERVISOR),
  }
}

export default useRole
