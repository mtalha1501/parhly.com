import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { getAuth } from '../lib/auth.js'
import { api } from '../lib/api.js'

export default function StudentDashboardPage() {
  const auth = getAuth()
  const displayName = auth?.user?.name?.trim() || auth?.user?.email || 'Student'

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [stats, setStats] = useState({ enrolled: 0, inProgress: 0, completed: 0 })

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError('')
      try {
        const res = await api.get('/student/enrollments')
        if (cancelled) return
        const enrolledList = res.data?.enrolled || []
        const total = enrolledList.length
        const completed = enrolledList.filter((e) => e.enrollment?.status === 'completed').length
        const inProgress = Math.max(0, total - completed)
        setStats({ enrolled: total, inProgress, completed })
      } catch (e) {
        if (cancelled) return
        setError(e?.response?.data?.message || e?.message || 'Failed to load enrollments')
        setStats({ enrolled: 0, inProgress: 0, completed: 0 })
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="page hasFloatingBg">
      <div className="floatingBg floatingBg--dash" aria-hidden="true">
        <span style={{ top: '6%', left: '12%' }} />
        <span className="star-secondary" style={{ top: '12%', left: '48%' }} />
        <span className="star-tertiary" style={{ top: '16%', left: '76%' }} />
        <span className="star-glow" style={{ top: '22%', left: '30%' }} />
        <span style={{ top: '30%', left: '62%' }} />
        <span className="star-secondary" style={{ top: '38%', left: '20%' }} />
        <span className="star-tertiary" style={{ top: '44%', left: '84%' }} />
        <span className="star-glow" style={{ top: '52%', left: '46%' }} />
        <span style={{ top: '60%', left: '14%' }} />
        <span className="star-secondary" style={{ top: '66%', left: '68%' }} />
        <span className="star-tertiary" style={{ top: '72%', left: '34%' }} />
        <span className="star-glow" style={{ top: '78%', left: '58%' }} />
        <span style={{ top: '86%', left: '26%' }} />
        <span className="star-secondary" style={{ top: '90%', left: '72%' }} />
      </div>
      <header className="pageHeader">
        <div className="headerRow">
          <div>
            <h1 className="title">Student Dashboard</h1>
            <p className="subtitle">Welcome, {displayName}.</p>
          </div>
        </div>
      </header>

      <section className="card">
        <div className="cardTitle">Quick actions</div>
        <div className="buttonRow">
          <Link className="primary" to="/courses">
            Browse courses
          </Link>
        </div>
        {error ? (
          <div className="notice error" style={{ marginTop: 12 }}>{error}</div>
        ) : loading ? (
          <div className="notice" style={{ marginTop: 12 }}>Loading your enrollments…</div>
        ) : null}
      </section>

      <section className="section" aria-label="Overview">
        <div className="sectionHeader">
          <h2 className="sectionTitle">Your overview</h2>
          <div className="sectionSubtitle">Synced with your enrollments.</div>
        </div>
        <div className="statGrid">
          <div className="statCard">
            <div className="statLabel">Enrolled</div>
            <div className="statValue">{loading ? '…' : stats.enrolled}</div>
          </div>
          <div className="statCard">
            <div className="statLabel">In progress</div>
            <div className="statValue">{loading ? '…' : stats.inProgress}</div>
          </div>
          <div className="statCard">
            <div className="statLabel">Completed</div>
            <div className="statValue">{loading ? '…' : stats.completed}</div>
          </div>
        </div>
      </section>
    </div>
  )
}
