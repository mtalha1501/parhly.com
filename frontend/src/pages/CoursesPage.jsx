import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getAuth } from '../lib/auth.js'
import { api } from '../lib/api.js'

export default function CoursesPage() {
  const navigate = useNavigate()
  const auth = getAuth()
  const role = auth?.user?.role === 'teacher' ? 'teacher' : 'student'
  const isTeacher = role === 'teacher'
  const isStudent = role === 'student'

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [courses, setCourses] = useState([])

    const [showCreate, setShowCreate] = useState(false)

    const [view, setView] = useState('all')
    const [enrolledLoading, setEnrolledLoading] = useState(false)
    const [enrolledError, setEnrolledError] = useState('')
    const [enrolled, setEnrolled] = useState([])
    const [enrollingId, setEnrollingId] = useState('')
    const [actionError, setActionError] = useState('')

    const [creating, setCreating] = useState(false)
    const [createError, setCreateError] = useState('')
    const [createForm, setCreateForm] = useState(() => ({
      title: '',
      subtitle: '',
      about: '',
      isPublished: true,
    }))

    function setCreateField(field, value) {
      setCreateForm((prev) => ({ ...prev, [field]: value }))
    }

    function openCreate() {
      setCreateError('')
      setCreateForm({ title: '', subtitle: '', about: '', isPublished: true })
      setShowCreate(true)
    }

    function closeCreate() {
      setCreateError('')
      setShowCreate(false)
    }

    async function fetchCourses() {
      setLoading(true)
      setError('')
      try {
        const res = await api.get('/courses')
        setCourses(res.data?.courses || [])
      } catch (e) {
        setError(e?.response?.data?.message || e?.message || 'Failed to load courses')
        setCourses([])
      } finally {
        setLoading(false)
      }
    }

    async function fetchEnrolled() {
      if (!isStudent) return
      setEnrolledLoading(true)
      setEnrolledError('')
      try {
        const res = await api.get('/student/enrollments')
        setEnrolled(res.data?.enrolled || [])
      } catch (e) {
        setEnrolledError(
          e?.response?.data?.message || e?.message || 'Failed to load enrolled courses'
        )
        setEnrolled([])
      } finally {
        setEnrolledLoading(false)
      }
    }

    useEffect(() => {
      fetchCourses()
      fetchEnrolled()
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const enrolledCourseIdSet = useMemo(() => {
      const set = new Set()
      for (const item of enrolled || []) {
        const id = item?.course?._id
        if (id) set.add(String(id))
      }
      return set
    }, [enrolled])

    async function createCourse(e) {
      e.preventDefault()
      setCreateError('')

      const title = createForm.title.trim()
      if (title.length < 3) {
        setCreateError('Title must be at least 3 characters.')
        return
      }

      setCreating(true)
      try {
        const res = await api.post('/courses', {
          title,
          subtitle: createForm.subtitle.trim(),
          about: createForm.about.trim(),
          isPublished: Boolean(createForm.isPublished),
        })

        const id = res.data?.course?._id
        await fetchCourses()

        if (id) {
          setShowCreate(false)
          navigate(`/courses/${id}`)
        } else {
          setCreateError('Course created, but missing id in response.')
        }
      } catch (e2) {
        setCreateError(e2?.response?.data?.message || e2?.message || 'Failed to create course')
      } finally {
        setCreating(false)
      }
    }

    async function enrollInCourse(courseId) {
      if (!isStudent) return
      if (!courseId) return
      setActionError('')

      if (enrolledCourseIdSet.has(String(courseId))) {
        navigate(`/courses/${courseId}`)
        return
      }

      setEnrollingId(String(courseId))
      try {
        await api.post(`/courses/${courseId}/enroll`)
        await fetchEnrolled()
        navigate(`/courses/${courseId}`)
      } catch (e) {
        setActionError(e?.response?.data?.message || e?.message || 'Enroll failed')
      } finally {
        setEnrollingId('')
      }
    }

    return (
      <div className="page">
        <header className="pageHeader">
          <div className="headerRow">
            <div>
              <h1 className="title">Courses</h1>
              <p className="subtitle">
                {isTeacher
                  ? 'Preview courses you can publish and manage.'
                  : 'Browse courses you can enroll in.'}
              </p>
            </div>
            <Link className="primary outline" to="/dashboard">
              Back
            </Link>
          </div>
        </header>

        <section className="section" aria-label="Courses section">
          <div className="sectionHeader">
            <h2 className="sectionTitle">Courses</h2>
            <div className="buttonRow">
              {isStudent ? (
                <>
                  <button
                    type="button"
                    className={view === 'all' ? 'primary' : 'primary outline'}
                    onClick={() => setView('all')}
                    disabled={loading}
                  >
                    All courses
                  </button>
                  <button
                    type="button"
                    className={view === 'enrolled' ? 'primary' : 'primary outline'}
                    onClick={() => setView('enrolled')}
                    disabled={enrolledLoading}
                  >
                    Enrolled courses
                  </button>
                </>
              ) : null}

              {isTeacher ? (
                showCreate ? (
                  <button className="primary outline" type="button" onClick={closeCreate}>
                    Back
                  </button>
                ) : (
                  <button className="primary" type="button" onClick={openCreate}>
                    Create new course
                  </button>
                )
              ) : null}
            </div>
          </div>

          {actionError ? <div className="notice">{actionError}</div> : null}

          {isTeacher && showCreate ? (
            <div className="card" aria-label="Create course">
              <div className="cardTitle">Create a course</div>
              {createError ? <div className="notice">{createError}</div> : null}
              <form className="form" onSubmit={createCourse}>
                <div className="field">
                  <label className="label" htmlFor="courseTitle">Title</label>
                  <input
                    id="courseTitle"
                    className="input"
                    value={createForm.title}
                    onChange={(e) => setCreateField('title', e.target.value)}
                  />
                </div>

                <div className="field">
                  <label className="label" htmlFor="courseSubtitle">Subtitle</label>
                  <input
                    id="courseSubtitle"
                    className="input"
                    value={createForm.subtitle}
                    onChange={(e) => setCreateField('subtitle', e.target.value)}
                  />
                </div>

                <div className="field">
                  <label className="label" htmlFor="courseAbout">About</label>
                  <textarea
                    id="courseAbout"
                    className="input"
                    rows={4}
                    value={createForm.about}
                    onChange={(e) => setCreateField('about', e.target.value)}
                  />
                </div>

                <div className="buttonRow">
                  <button
                    type="button"
                    className={createForm.isPublished ? 'primary outline' : 'primary'}
                    onClick={() => setCreateField('isPublished', false)}
                    disabled={creating}
                  >
                    Save as draft
                  </button>
                  <button
                    type="button"
                    className={createForm.isPublished ? 'primary' : 'primary outline'}
                    onClick={() => setCreateField('isPublished', true)}
                    disabled={creating}
                  >
                    Publish
                  </button>
                  <button className="primary" type="submit" disabled={creating}>
                    {creating ? 'Creating…' : 'Create course'}
                  </button>
                </div>
              </form>
            </div>
          ) : view === 'enrolled' && isStudent ? (
            enrolledLoading ? (
              <div className="notice">Loading enrolled courses…</div>
            ) : enrolledError ? (
              <div className="notice">{enrolledError}</div>
            ) : (
              <div className="cardGrid" aria-label="Enrolled course list">
                {enrolled.length === 0 ? (
                  <div className="notice">You are not enrolled in any courses yet.</div>
                ) : (
                  enrolled.map((item) => (
                    <div className="tile" key={item.course._id}>
                      <div className="tileTitle">{item.course.title}</div>
                      <div className="tileText">{item.course.subtitle || '—'}</div>
                      <div style={{ marginTop: 12 }}>
                        <Link className="primary" to={`/courses/${item.course._id}`}>
                          Open course
                        </Link>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )
          ) : loading ? (
            <div className="notice">Loading courses…</div>
          ) : error ? (
            <div className="notice">{error}</div>
          ) : (
            <div className="cardGrid" aria-label="Course list">
              {courses.length === 0 ? (
                <div className="notice">
                  {isTeacher
                    ? 'No courses yet. Click “Create new course” to add one.'
                    : 'No published courses available yet.'}
                </div>
              ) : (
                courses.map((course) => {
                  const isEnrolled = isStudent && enrolledCourseIdSet.has(String(course._id))
                  const isWorking = enrollingId === String(course._id)
                  const stats = course.stats || {}
                  const lessonsCount = stats.lessons ?? 0
                  const resourcesCount = stats.resources ?? 0
                  const quizzesCount = stats.quizzes ?? 0
                  const studentsCount = stats.enrolled ?? 0

                  return (
                    <div className="tile" key={course._id}>
                      <div className="tileTitle">{course.title}</div>
                      <div className="tileText">{course.subtitle || '—'}</div>

                      <div
                        style={{
                          marginTop: 8,
                          display: 'flex',
                          gap: 12,
                          flexWrap: 'wrap',
                          color: 'var(--muted, #666)',
                          fontSize: 14,
                        }}
                      >
                        <span>{lessonsCount} lessons</span>
                        <span>• {resourcesCount} resources</span>
                        <span>• {quizzesCount} quizzes</span>
                        <span>• {studentsCount} students</span>
                      </div>

                      {isTeacher ? (
                        <div className="pill" style={{ marginTop: 10, display: 'inline-flex' }}>
                          {course.isPublished ? 'Published' : 'Draft'}
                        </div>
                      ) : isEnrolled ? (
                        <div className="pill" style={{ marginTop: 10, display: 'inline-flex' }}>
                          Enrolled
                        </div>
                      ) : null}

                      <div style={{ marginTop: 12, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <Link className="primary" to={`/courses/${course._id}`}>
                          {isTeacher ? 'Open course' : 'View course'}
                        </Link>

                        {isStudent ? (
                          isEnrolled ? (
                            <Link className="primary outline" to={`/courses/${course._id}`}>
                              Open
                            </Link>
                          ) : (
                            <button
                              type="button"
                              className="primary"
                              onClick={() => enrollInCourse(String(course._id))}
                              disabled={isWorking}
                            >
                              {isWorking ? 'Enrolling…' : 'Enroll'}
                            </button>
                          )
                        ) : null}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          )}
        </section>

        {!auth ? (
          <section className="section" aria-label="Sign in">
            <div className="notice">
              You are not logged in. Please{' '}
              <Link className="link" to="/auth?role=student&mode=login">
                Login
              </Link>{' '}
              to continue.
            </div>
          </section>
        ) : null}
      </div>
    )
  }
