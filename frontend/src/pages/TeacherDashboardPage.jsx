import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { getAuth } from '../lib/auth.js'
import { api } from '../lib/api.js'

export default function TeacherDashboardPage() {
  const auth = getAuth()
  const displayName = auth?.user?.name?.trim() || auth?.user?.email || 'Teacher'

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [stats, setStats] = useState({ courses: 0, students: 0, active: 0 })

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError('')
      try {
        const res = await api.get('/teacher/overview')
        if (cancelled) return
        setStats({
          courses: res.data?.courses ?? 0,
          students: res.data?.students ?? 0,
          active: res.data?.active ?? 0,
        })
      } catch (e) {
        if (cancelled) return
        setError(e?.response?.data?.message || e?.message || 'Failed to load your stats')
        setStats({ courses: 0, students: 0, active: 0 })
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
        <span style={{ top: '6%', left: '18%' }} />
        <span className="star-secondary" style={{ top: '10%', left: '52%' }} />
        <span className="star-tertiary" style={{ top: '16%', left: '78%' }} />
        <span className="star-glow" style={{ top: '24%', left: '34%' }} />
        <span style={{ top: '32%', left: '66%' }} />
        <span className="star-secondary" style={{ top: '40%', left: '24%' }} />
        <span className="star-tertiary" style={{ top: '46%', left: '86%' }} />
        <span className="star-glow" style={{ top: '54%', left: '48%' }} />
        <span style={{ top: '62%', left: '18%' }} />
        <span className="star-secondary" style={{ top: '70%', left: '72%' }} />
        <span className="star-tertiary" style={{ top: '76%', left: '36%' }} />
        <span className="star-glow" style={{ top: '82%', left: '62%' }} />
        <span style={{ top: '90%', left: '28%' }} />
        <span className="star-secondary" style={{ top: '94%', left: '74%' }} />
      </div>
      <header className="pageHeader">
        <div className="headerRow">
          <div>
            <h1 className="title">Teacher Dashboard</h1>
            <p className="subtitle">Welcome, {displayName}. Manage your courses and students.</p>
          </div>
        </div>
      </header>

      <section className="card">
        <div className="cardTitle">Quick actions</div>
        <div className="buttonRow">
          <Link className="primary" to="/courses">
            View courses
          </Link>
        </div>
        {error ? (
          <div className="notice error" style={{ marginTop: 12 }}>{error}</div>
        ) : loading ? (
          <div className="notice" style={{ marginTop: 12 }}>Loading your stats…</div>
        ) : null}
      </section>

      <section className="section" aria-label="Overview">
        <div className="sectionHeader">
          <h2 className="sectionTitle">Teaching overview</h2>
          <div className="sectionSubtitle">Live snapshots from your courses.</div>
        </div>
        <div className="statGrid">
          <div className="statCard">
            <div className="statLabel">Courses</div>
            <div className="statValue">{loading ? '…' : stats.courses}</div>
          </div>
          <div className="statCard">
            <div className="statLabel">Students</div>
            <div className="statValue">{loading ? '…' : stats.students}</div>
          </div>
          <div className="statCard">
            <div className="statLabel">Active</div>
            <div className="statValue">{loading ? '…' : stats.active}</div>
          </div>
        </div>
      </section>
    </div>
  )
}
