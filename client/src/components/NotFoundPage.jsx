import { Link } from 'react-router-dom'
import { Zap } from 'lucide-react'

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-theme-bg text-center px-4">
      <div className="w-16 h-16 rounded-2xl gradient-brand flex items-center justify-center mb-6 glow-brand">
        <Zap className="w-8 h-8 text-theme-text" />
      </div>
      <h1 className="text-display text-6xl text-theme-text mb-3">404</h1>
      <p className="text-theme-text/80 mb-8 max-w-sm">
        This page doesn't exist or you don't have permission to view it.
      </p>
      <Link to="/dashboard" className="btn btn-primary">Go to Dashboard</Link>
    </div>
  )
}
