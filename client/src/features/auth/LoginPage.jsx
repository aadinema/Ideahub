import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { setCredentials } from '../../store/authSlice'
import { authAPI } from '../../api'
import usePageTitle from '../../hooks/usePageTitle';
import { Zap, Eye, EyeOff, AlertCircle } from 'lucide-react'

const DEMO_USERS = [
  { label: 'Admin User', email: 'admin@ideahub.local' },
  { label: 'Employee', email: 'employee@ideahub.local' },
  { label: 'Supervisor', email: 'supervisor@ideahub.local' },
  { label: 'Dept Innovation Team', email: 'dept.team@ideahub.local' },
  { label: 'Dept Innovation Team 2', email: 'dept.team2@ideahub.local' },
  { label: 'Committee Member', email: 'committee@ideahub.local' },
  { label: 'Implementation Owner', email: 'impl.owner@ideahub.local' },
  { label: 'CEO', email: 'ceo@ideahub.local' },
]

export default function LoginPage() {
  usePageTitle('Sign in');
  const [form, setForm]           = useState({ email: '', password: '' })
  const [showPass, setShowPass]   = useState(false)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const dispatch  = useDispatch()
  const navigate  = useNavigate()
  const [params]  = useSearchParams()

  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }))
    if (error) setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.email || !form.password) {
      setError('Please enter your email and password.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const { data } = await authAPI.login({ email: form.email, password: form.password })
      dispatch(setCredentials({ user: data.data.user, accessToken: data.data.accessToken }))
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  const isExpired = params.get('expired') === '1'

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-theme-bg">
      {/* Background gradient orbs */}
      <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-theme-accent/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-theme-accent/10 blur-[100px] pointer-events-none" />

      <div className="w-full max-w-[420px] px-4 relative z-10 page-enter">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-14 h-14 rounded-2xl gradient-brand flex items-center justify-center mb-4 shadow-2xl glow-brand">
            <Zap className="w-7 h-7 text-white" strokeWidth={2.5} />
          </div>
          <h1 className="text-display text-3xl text-theme-text mb-1">IdeaHub</h1>
          <p className="text-sm text-theme-text/80">MPOnline Innovation Platform</p>
        </div>

        {/* Card */}
        <div className="glass rounded-2xl p-8 shadow-2xl">
          <h2 className="text-heading text-xl text-theme-text mb-1">Welcome back</h2>
          <p className="text-sm text-theme-text/80 mb-7">Sign in to your account</p>

          {import.meta.env.DEV && (
            <div className="mb-6 p-4 rounded-xl bg-theme-accent/10 border border-theme-accent/20">
              <label htmlFor="dev-quick-login" className="text-xs font-semibold text-theme-accent block mb-2 uppercase tracking-wider">
                Dev Mode: Quick Login
              </label>
              <select
                id="dev-quick-login"
                className="input-base text-sm"
                onChange={(e) => {
                  if (!e.target.value) return;
                  setForm({ email: e.target.value, password: 'IdeaHub@Dev2026!' })
                  setError('')
                }}
                defaultValue=""
              >
                <option value="" disabled>Select demo account...</option>
                {DEMO_USERS.map(u => (
                  <option key={u.email} value={u.email}>{u.label} ({u.email})</option>
                ))}
              </select>
            </div>
          )}

          {/* Session expired notice */}
          {isExpired && (
            <div role="status" className="mb-5 flex items-start gap-2 p-3 rounded-lg bg-warning-light border border-warning/30 text-warning-text text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <span>Your session expired. Please sign in again.</span>
            </div>
          )}

          {/* Error */}
          {error && (
            <div
              id="login-error"
              role="alert"
              className="mb-5 flex items-start gap-2 p-3 rounded-lg bg-error-light border border-error/20 text-error-text text-sm"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            {/* Email */}
            <div className="mb-4">
              <label htmlFor="email" className="text-label block mb-2">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                autoFocus
                value={form.email}
                onChange={handleChange}
                className="input-base"
                placeholder="you@mpoline.in"
                disabled={loading}
                aria-required="true"
              />
            </div>

            {/* Password */}
            <div className="mb-7">
              <label htmlFor="password" className="text-label block mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPass ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={form.password}
                  onChange={handleChange}
                  className="input-base pr-10"
                  placeholder="••••••••"
                  disabled={loading}
                  aria-required="true"
                />
                <button
                  type="button"
                  id="btn-toggle-password"
                  onClick={() => setShowPass((v) => !v)}
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-theme-text0 hover:text-theme-text/80 transition-colors"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              id="btn-login-submit"
              type="submit"
              className="btn btn-primary w-full btn-lg"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner w-4 h-4" />
                  Signing in…
                </>
              ) : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-theme-text/60 mt-6">
          Having trouble? Contact your IT Administrator.
        </p>
      </div>
    </div>
  )
}
