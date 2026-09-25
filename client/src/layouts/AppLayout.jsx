import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { selectCurrentUser, clearCredentials } from '../store/authSlice'
import { authAPI } from '../api'
import useRole from '../hooks/useRole'
import useTheme from '../hooks/useTheme'
import NotificationBell from '../components/NotificationBell'
import {
  LayoutDashboard, Lightbulb, Calendar, BookOpen,
  BarChart2, Settings, LogOut, ChevronRight, Zap, CheckCircle2,
  Users, ClipboardList, Play, Menu as MenuIcon, X, Sun, Moon
} from 'lucide-react'

const NAV_ITEMS = [
  { to: '/dashboard',       icon: LayoutDashboard, label: 'Dashboard' },
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

export default function AppLayout() {
  const user    = useSelector(selectCurrentUser)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { hasRole } = useRole()
  const { theme, toggle: toggleTheme, isDark } = useTheme()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = async () => {
    try { await authAPI.logout() } catch {}
    dispatch(clearCredentials())
    navigate('/login')
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
          <div className="w-8 h-8 rounded-full gradient-brand flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-theme-text truncate">{user?.name}</p>
            <p className="text-xs text-theme-text0 truncate">{user?.department}</p>
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
