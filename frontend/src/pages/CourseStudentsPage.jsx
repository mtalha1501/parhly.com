import { useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { api } from '../lib/api.js'
import { getAuth } from '../lib/auth.js'

export default function CourseStudentsPage() {
  const { courseId } = useParams()
  const auth = getAuth()
  const role = auth?.user?.role

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [course, setCourse] = useState(null)
  const [enrollments, setEnrollments] = useState([])

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError('')
      try {
        const [courseRes, enrollRes] = await Promise.all([
          api.get(`/courses/${courseId}`),
          api.get(`/courses/${courseId}/enrollments`),
        ])
        if (cancelled) return
        setCourse(courseRes.data?.course || null)
        setEnrollments(enrollRes.data?.enrollments || [])
      } catch (e) {
        if (cancelled) return
        setError(e?.response?.data?.message || e?.message || 'Failed to load students')
        setCourse(null)
        setEnrollments([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [courseId])

  if (role !== 'teacher') return <Navigate to="/dashboard" replace />

  function fmt(dateString) {
    if (!dateString) return '—'
    const d = new Date(dateString)
    if (Number.isNaN(d.getTime())) return '—'
    return d.toLocaleDateString()
  }

  return (
    <div className="page">
      <header className="pageHeader">
        <div className="headerRow">
          <div>
            <h1 className="title">Enrolled students</h1>
            <p className="subtitle">{course?.title || 'Course'}</p>
          </div>
          <Link className="primary outline" to={`/courses/${courseId}`}>
            Back to course
          </Link>
        </div>
      </header>

      <section className="section" aria-label="Student list">
        {error ? <div className="notice error">{error}</div> : null}
        {loading ? (
          <div className="notice">Loading students…</div>
        ) : enrollments.length === 0 ? (
          <div className="notice">No students enrolled yet.</div>
        ) : (
          <div className="cardGrid">
            {enrollments.map((enr) => {
              const student = enr.student || {}
              const displayName = student.name?.trim() || student.email || 'Student'
              const status = enr.status || 'enrolled'
              const started = fmt(enr.enrolledAt || enr.createdAt)
              const completed = enr.completedAt ? fmt(enr.completedAt) : '—'
              return (
                <div className="tile" key={enr._id || `${student.email}-${enr.enrolledAt}`}>
                  <div className="tileTitle">{displayName}</div>
                  <div className="tileText">{student.email || 'No email'}</div>
                  <div className="tileText" style={{ marginTop: 6 }}>Status: {status}</div>
                  <div className="tileText">Enrolled: {started}</div>
                  <div className="tileText">Completed: {completed}</div>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
