import { Navigate, Route, Routes } from 'react-router-dom'
import EntryPage from './pages/EntryPage.jsx'
import AuthPage from './pages/AuthPage.jsx'
import StudentDashboardPage from './pages/StudentDashboardPage.jsx'
import TeacherDashboardPage from './pages/TeacherDashboardPage.jsx'
import CoursesPage from './pages/CoursesPage.jsx'
import CourseDetailsPage from './pages/CourseDetailsPage.jsx'
import CourseStudentsPage from './pages/CourseStudentsPage.jsx'
import LessonPage from './pages/LessonPage.jsx'
import NotFoundPage from './pages/NotFoundPage.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import { getAuth } from './lib/auth.js'

function DashboardGate() {
  const auth = getAuth()
  const role = auth?.user?.role
  if (!auth?.token || !role) return <Navigate to="/auth?role=student&mode=login" replace />
  return role === 'teacher' ? (
    <Navigate to="/teacher" replace />
  ) : (
    <Navigate to="/student" replace />
  )
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<EntryPage />} />
      <Route path="/auth" element={<AuthPage />} />

      <Route path="/dashboard" element={<DashboardGate />} />
      <Route
        path="/student"
        element={
          <ProtectedRoute requireRole="student">
            <StudentDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher"
        element={
          <ProtectedRoute requireRole="teacher">
            <TeacherDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/courses"
        element={
          <ProtectedRoute>
            <CoursesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/courses/:courseId"
        element={
          <ProtectedRoute>
            <CourseDetailsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/courses/:courseId/lesson/:lessonId"
        element={
          <ProtectedRoute>
            <LessonPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/courses/:courseId/students"
        element={
          <ProtectedRoute requireRole="teacher">
            <CourseStudentsPage />
          </ProtectedRoute>
        }
      />

      <Route path="/404" element={<NotFoundPage />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  )
}
