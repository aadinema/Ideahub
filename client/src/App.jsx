import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { selectIsAuth } from './store/authSlice'
import AppLayout from './layouts/AppLayout'
import LoginPage from './features/auth/LoginPage'
import DashboardPage from './features/dashboard/DashboardPage'
import CeoDashboardPage from './features/ceo/CeoDashboardPage'
import IdeaListPage from './features/ideas/IdeaListPage'
import IdeaFormPage from './features/ideas/IdeaFormPage'
import IdeaDetailPage from './features/ideas/IdeaDetailPage'
import SupervisorQueuePage from './features/supervisor/SupervisorQueuePage' // Phase 2
import EvaluationQueuePage from './features/evaluation/EvaluationQueuePage' // Phase 2
import EvaluationFormPage from './features/evaluation/EvaluationFormPage' // Phase 2
import CommitteeQueuePage from './features/committee/CommitteeQueuePage' // Phase 2
import Committee360Page from './features/committee/Committee360Page' // Phase 2
import EventsExplorePage from './features/events/EventsExplorePage' // Phase 3
import EventDetailPage from './features/events/EventDetailPage' // Phase 3
import GalleryPage from './features/gallery/GalleryPage' // Phase 4
import ImplementationBoardPage from './features/implementation/ImplementationBoardPage' // Phase 5
import BenefitsFormPage from './features/implementation/BenefitsFormPage' // Phase 5
import ReportsPage from './features/reports/ReportsPage' // Phase 6
import AdminDashboardPage from './features/admin/AdminDashboardPage' // Phase 6
import NotFoundPage from './components/NotFoundPage'
import ErrorBoundary from './components/ErrorBoundary'

/** Redirect to /login if not authenticated */
const ProtectedRoute = ({ children }) => {
  const isAuth = useSelector(selectIsAuth)
  return isAuth ? children : <Navigate to="/login" replace />
}

/** Redirect to /dashboard if already logged in */
const PublicRoute = ({ children }) => {
  const isAuth = useSelector(selectIsAuth)
  return isAuth ? <Navigate to="/dashboard" replace /> : children
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
        {/* Public routes */}
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />

        {/* Protected routes — wrapped in AppLayout (sidebar + header) */}
        <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="ceo" element={<CeoDashboardPage />} />
          <Route path="ideas" element={<IdeaListPage />} />
          <Route path="ideas/new" element={<IdeaFormPage />} />
          <Route path="ideas/:id" element={<IdeaDetailPage />} />
          <Route path="ideas/:id/edit" element={<IdeaFormPage />} />
          <Route path="supervisor/queue" element={<SupervisorQueuePage />} />
          <Route path="evaluations/queue" element={<EvaluationQueuePage />} />
          <Route path="evaluations/:id/score" element={<EvaluationFormPage />} />
          <Route path="committee/queue" element={<CommitteeQueuePage />} />
          <Route path="committee/ideas/:id" element={<Committee360Page />} />
          <Route path="events" element={<EventsExplorePage />} />
          <Route path="events/:id" element={<EventDetailPage />} />
          <Route path="gallery" element={<GalleryPage />} />
          <Route path="implementations/my" element={<ImplementationBoardPage />} />
          <Route path="benefits/record/:ideaId/:implementationId" element={<BenefitsFormPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="admin" element={<AdminDashboardPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
    </ErrorBoundary>
  )
}
