import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Menu, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import { selectCurrentUser, clearCredentials, setCredentials } from '../store/authSlice'
import { authAPI } from '../api'
import useRole from '../hooks/useRole'
import useTheme from '../hooks/useTheme'
import NotificationBell from '../components/NotificationBell'
import { ROLES } from '@shared/constants'
import {
  LayoutDashboard, Lightbulb, Calendar, BookOpen,
  BarChart2, Settings, LogOut, ChevronRight, Zap, CheckCircle2,
  Users, ClipboardList, Play, Menu as MenuIcon, X, Sun, Moon,
  User, UserCheck, Shield, Briefcase, Crown, Zap as ZapIcon
} from 'lucide-react'

// Role switcher configuration (dev/testing only)
// Identity is keyed by email (unique per demo account) — role ids alone cannot
// distinguish two users holding the same role (e.g. two department evaluators).
const ROLE_PROFILES = [
  { id: ROLES.EMPLOYEE,             label: 'Employee',                  icon: User,          color: '#3b82f6', email: 'employee@ideahub.local' },
  { id: ROLES.SUPERVISOR,           label: 'Supervisor',                icon: UserCheck,     color: '#f59e0b', email: 'supervisor@ideahub.local' },
  { id: ROLES.DEPT_INNOVATION_TEAM, label: 'Dept. Evaluator · Anita',   icon: ClipboardList, color: '#10b981', email: 'dept.team@ideahub.local' },
  { id: ROLES.DEPT_INNOVATION_TEAM, label: 'Dept. Evaluator · Suresh',  icon: ClipboardList, color: '#059669', email: 'dept.team2@ideahub.local' },
  { id: ROLES.INNOVATION_COMMITTEE, label: 'Committee Member',          icon: Users,         color: '#8b5cf6', email: 'committee@ideahub.local' },
  { id: ROLES.IMPLEMENTATION_OWNER, label: 'Implementation Owner',      icon: Briefcase,     color: '#ec4899', email: 'impl.owner@ideahub.local' },
  { id: ROLES.CEO,                  label: 'CEO',                       icon: Crown,         color: '#6366f1', email: 'ceo@ideahub.local' },
  { id: ROLES.ADMIN,                label: 'Admin',                     icon: Shield,        color: '#ef4444', email: 'admin@ideahub.local' },
]

const DEMO_PASSWORD = 'IdeaHub@Dev2026!'

const NAV_ITEMS = [
  { to: '/dashboard',       icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/ceo',             icon: Crown,           label: 'CEO Dashboard', roles: ['ceo'] },
  { to: '/ideas',           icon: Lightbulb,       label: 'My Ideas' },
  { to: '/supervisor/queue',icon: CheckCircle2,    label: 'Supervisor Queue', roles: ['supervisor', 'admin'] },
  { to: '/evaluations/queue',icon: ClipboardList,  label: 'Dept Evaluation',  roles: ['dept_innovation_team', 'admin'] },
  { to: '/committee/queue', icon: Users,           label: 'Committee Review', roles: ['innovation_committee', 'admin'] },
  { to: '/implementations/my', icon: Play,          label: 'Implementation',   roles: ['implementation_owner', 'admin'] },
  { to: '/events',          icon: Calendar,        label: 'Ideathons' },
  { to: '/gallery',         icon: BookOpen,        label: 'Gallery' },
  { to: '/reports',         icon: BarChart2,       label: 'Reports',          roles: ['admin', 'dept_innovation_team', 'innovation_committee', 'supervisor'] },
  { to: '/admin',           icon: Settings,        label: 'Admin',            roles: ['admin'] },
]

function AppLayout() {
  const user    = useSelector(selectCurrentUser)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { hasRole } = useRole()
  const { theme, toggle: toggleTheme, isDark } = useTheme()
  const [mobileOpen, setMobileOpen] = useState(false)

  // Find current profile by email (unique per demo account), falling back to
  // a role match for custom users not in the switcher list.
  const userRoles = user?.roles || []
  const currentProfile =
    ROLE_PROFILES.find((p) => p.email === user?.email) ||
    ROLE_PROFILES.find((p) => userRoles.includes(p.id)) ||
    ROLE_PROFILES[0]

  const handleLogout = async () => {
    try { await authAPI.logout() } catch {}
    dispatch(clearCredentials())
    navigate('/login')
  }

  const handleSwitchRole = async (profile) => {
    try {
      const { data } = await authAPI.login({ email: profile.email, password: DEMO_PASSWORD })
      dispatch(setCredentials({ user: data.data.user, accessToken: data.data.accessToken }))
      // Land on the role's home view — the CEO opens on the executive dashboard
      navigate(profile.id === ROLES.CEO ? '/ceo' : '/dashboard', { replace: true })
    } catch (err) {
      console.error('Role switch failed:', err)
    }
  }

  const visibleNav = NAV_ITEMS.filter((item) => {
    if (item.roles && !hasRole(...item.roles)) return false
    return true
  })

  const initials = user?.name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'U'

  const SidebarContent = (
    <>
      {/* Logo */}
      <div className="h-[64px] flex items-center gap-3 px-5 border-b border-theme-border/50">
        <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center flex-shrink-0">
          <Zap className="w-4 h-4 text-white" />
        </div>
        <div>
          <span className="text-heading text-base text-theme-text">IdeaHub</span>
          <div className="text-label text-[10px] mt-0.5">Innovation Platform</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2 overflow-y-auto" aria-label="Main navigation">
        {visibleNav.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User panel */}
      <div className="p-3 border-t border-theme-border/50">
        <div className="flex items-center gap-3 p-2 rounded-lg">
          <div className="w-8 h-8 rounded-full gradient-brand flex items-center justify-center flex-shrink-0 text-white text-xs font-bold relative">
            {initials}
            {/* Active role indicator dot */}
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white"
                  style={{ backgroundColor: currentProfile.color }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-theme-text truncate">{user?.name}</p>
            <p className="text-xs text-theme-text0 truncate">{user?.department}</p>
            <span 
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium text-white mt-1"
              style={{ backgroundColor: currentProfile.color }}
            >
              <currentProfile.icon className="w-2.5 h-2.5" />
              {currentProfile.label}
            </span>
          </div>
        </div>
        <button
          onClick={handleLogout}
          id="btn-logout"
          className="sidebar-item w-full mt-1 text-theme-text0 hover:!text-rose-500"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign out</span>
        </button>
      </div>
    </>
  )

  return (
    <div className="flex h-screen overflow-hidden bg-theme-bg">
      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:flex w-[240px] flex-shrink-0 flex-col h-full border-r border-theme-border/50" style={{ background: 'var(--sidebar-bg)' }}>
        {SidebarContent}
      </aside>

      {/* ── Mobile sidebar (drawer) ── */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <aside className="relative w-[260px] max-w-[80vw] flex flex-col h-full border-r border-theme-border/50 page-enter" style={{ background: 'var(--sidebar-bg)' }}>
            <button
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
              className="absolute top-4 right-3 p-1.5 rounded-lg text-theme-text0 hover:text-theme-text hover:bg-theme-surface z-10"
            >
              <X className="w-4 h-4" />
            </button>
            {SidebarContent}
          </aside>
        </div>
      )}

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Skip link (a11y) */}
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-2 focus:left-2 btn btn-primary btn-sm">
          Skip to content
        </a>

        {/* Top bar */}
        <header className="h-[64px] flex items-center justify-between px-4 md:px-6 border-b border-theme-border/50 flex-shrink-0" style={{ background: 'var(--surface)' }}>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
              className="md:hidden w-9 h-9 rounded-lg btn-ghost flex items-center justify-center"
            >
              <MenuIcon className="w-4 h-4 text-theme-text/80" />
            </button>
            <div className="hidden sm:flex items-center gap-1 text-sm text-theme-text0">
              <span>IdeaHub</span>
              <ChevronRight className="w-3 h-3" />
              <span className="text-theme-text/80">Platform</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              id="btn-theme-toggle"
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              className="w-9 h-9 rounded-lg btn-ghost flex items-center justify-center"
            >
              {isDark ? <Sun className="w-4 h-4 text-theme-text/80" /> : <Moon className="w-4 h-4 text-theme-text/80" />}
            </button>
            <NotificationBell />
            
            {/* Profile / Role Switcher Dropdown */}
            <ProfileSwitcher 
              currentProfile={currentProfile} 
              user={user} 
              profiles={ROLE_PROFILES} 
              onSwitchRole={handleSwitchRole} 
            />
            
            <NavLink
              to="/ideas/new"
              id="btn-submit-idea-header"
              className="btn btn-primary btn-sm"
            >
              <Lightbulb className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Submit Idea</span>
            </NavLink>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6" id="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

// Profile Switcher Dropdown Component
function ProfileSwitcher({ currentProfile, user, profiles, onSwitchRole }) {
  const initials = user?.name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'U'

  return (
    <Menu as="div" className="relative">
      <Menu.Button
        id="btn-profile-switcher"
        aria-label={`Profile menu. Current role: ${currentProfile.label}`}
        className="w-9 h-9 rounded-lg btn-ghost flex items-center justify-center relative group"
      >
        <div className="w-8 h-8 rounded-full gradient-brand flex items-center justify-center text-white text-xs font-bold">
          {initials}
        </div>
        {/* Active role indicator dot */}
        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white"
              style={{ backgroundColor: currentProfile.color }} />
      </Menu.Button>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-150"
        enterFrom="opacity-0 -translate-y-2"
        enterTo="opacity-100 translate-y-0"
        leave="transition ease-in duration-100"
        leaveFrom="opacity-100 translate-y-0"
        leaveTo="opacity-0 -translate-y-2"
      >
        <Menu.Items className="absolute right-0 mt-2 w-64 max-w-[90vw] origin-top-right glass rounded-xl shadow-2xl border border-theme-border/60 focus:outline-none z-50 overflow-hidden">
          {/* Current User Info */}
          <div className="px-4 py-3 border-b border-theme-border/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full gradient-brand flex items-center justify-center flex-shrink-0 text-white text-sm font-bold">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-theme-text truncate">{user?.name}</p>
                <p className="text-xs text-theme-text0 truncate">{user?.department}</p>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-[10px] font-medium text-theme-text0 uppercase tracking-wider">Current Role</span>
              <span 
                className="px-2 py-0.5 rounded-full text-[10px] font-medium text-white flex items-center gap-1"
                style={{ backgroundColor: currentProfile.color }}
              >
                <currentProfile.icon className="w-2.5 h-2.5" />
                {currentProfile.label}
              </span>
            </div>
          </div>

          {/* Switch Profile Section */}
          <div className="px-3 py-2">
            <p className="text-xs font-semibold text-theme-text0 uppercase tracking-wider mb-2 px-1">Switch Profile</p>
            <div className="space-y-1" role="listbox" aria-label="Available roles">
              {profiles.map((profile) => {
                const isActive = profile.email === currentProfile.email
                const Icon = profile.icon
                return (
                  <Menu.Item key={profile.email} disabled={isActive}>
                    {({ active }) => (
                      <button
                        onClick={() => !isActive && onSwitchRole(profile)}
                        disabled={isActive}
                        role="option"
                        aria-selected={isActive}
                        aria-disabled={isActive}
                        className={`w-full text-left px-3 py-2.5 rounded-lg transition-all duration-150 flex items-center gap-3 ${
                          isActive
                            ? 'bg-theme-accent/10 text-theme-text cursor-default'
                            : 'text-theme-text0 hover:bg-theme-surface/60 hover:text-theme-text focus:bg-theme-surface/60 focus:text-theme-text'
                        }`}
                      >
                        {/* Role icon with color */}
                        <div 
                          className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            isActive ? 'text-white' : 'text-theme-text/60'
                          }`}
                          style={{ backgroundColor: isActive ? profile.color : `${profile.color}15` }}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        
                        {/* Role label */}
                        <span className={`font-medium text-sm ${isActive ? 'text-theme-text' : 'text-theme-text0'}`}>
                          {profile.label}
                        </span>
                        
                        {/* Active checkmark */}
                        {isActive && (
                          <span className="ml-auto flex items-center justify-center">
                            <svg className="w-4 h-4 text-theme-accent" viewBox="0 0 10 8" fill="none">
                              <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </span>
                        )}
                      </button>
                    )}
                  </Menu.Item>
                )
              })}
            </div>
          </div>

          {/* Footer hint */}
          <div className="px-4 py-3 border-t border-theme-border/50">
            <p className="text-[10px] text-theme-text0 text-center">
              Development mode — switch profiles to test role-based views
            </p>
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  )
}

export default AppLayout
