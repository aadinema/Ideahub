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
import { ROLES } from '@shared/constants'

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
    isCeo:                 roles.includes(ROLES.CEO),
    // Convenience: can access admin/management views
    canAccessAdmin:        roles.includes(ROLES.ADMIN),
    canAccessReports:      hasRole(ROLES.ADMIN, ROLES.INNOVATION_COMMITTEE, ROLES.DEPT_INNOVATION_TEAM, ROLES.SUPERVISOR),
    canAccessCeo:          roles.includes(ROLES.CEO),
  }
}

export default useRole
