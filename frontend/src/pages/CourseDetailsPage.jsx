import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { getAuth } from '../lib/auth.js'
import { api } from '../lib/api.js'

export default function CourseDetailsPage() {
  const { courseId } = useParams()
  const auth = getAuth()
  const role = auth?.user?.role === 'teacher' ? 'teacher' : 'student'

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [course, setCourse] = useState(null)
  const [lessons, setLessons] = useState([])
  const [enrollment, setEnrollment] = useState(null)
  const [enrollmentCount, setEnrollmentCount] = useState(0)

  const [resources, setResources] = useState([])
  const [resourceSaving, setResourceSaving] = useState(false)
  const [resourceError, setResourceError] = useState('')
  const [resourceForm, setResourceForm] = useState(() => ({
    title: '',
    type: 'link',
    url: '',
    description: '',
  }))
  const [resourceEditId, setResourceEditId] = useState('')
  const [openResourceId, setOpenResourceId] = useState('')

  const [quizzes, setQuizzes] = useState([])
  const [quizSaving, setQuizSaving] = useState(false)
  const [quizError, setQuizError] = useState('')
  const [quizForm, setQuizForm] = useState(() => ({
    title: '',
    deadline: '',
    durationMinutes: 20,
    questions: [
      { prompt: '', options: ['', '', '', ''], correctOption: 0 },
    ],
  }))
  const [quizEditId, setQuizEditId] = useState('')

  const [saving, setSaving] = useState(false)
  const [lessonSaving, setLessonSaving] = useState(false)
  const [lessonError, setLessonError] = useState('')
  const [lessonForm, setLessonForm] = useState(() => ({
    order: 1,
    title: '',
    duration: '',
    content: '',
    isPublished: true,
  }))
  const [lessonEditId, setLessonEditId] = useState('')

  const [manageLessonId, setManageLessonId] = useState('')
  const [lessonResources, setLessonResources] = useState([])
  const [lessonResourceSaving, setLessonResourceSaving] = useState(false)
  const [lessonResourceError, setLessonResourceError] = useState('')
  const [lessonResourceForm, setLessonResourceForm] = useState(() => ({
    title: '',
    type: 'link',
    url: '',
    description: '',
  }))
  const [lessonResourceEditId, setLessonResourceEditId] = useState('')
  const [lessonQuizzes, setLessonQuizzes] = useState([])
  const [lessonQuizSaving, setLessonQuizSaving] = useState(false)
  const [lessonQuizError, setLessonQuizError] = useState('')
  const [lessonQuizForm, setLessonQuizForm] = useState(() => ({
    title: '',
    deadline: '',
    durationMinutes: 20,
    questions: [
      { prompt: '', options: ['', '', '', ''], correctOption: 0 },
    ],
  }))
  const [lessonQuizEditId, setLessonQuizEditId] = useState('')

  // Auto-dismiss transient errors after 6 seconds so they don't stick around.
  useEffect(() => {
    if (!error) return
    const timer = setTimeout(() => setError(''), 6000)
    return () => clearTimeout(timer)
  }, [error])

  useEffect(() => {
    if (!lessonError) return
    const timer = setTimeout(() => setLessonError(''), 6000)
    return () => clearTimeout(timer)
  }, [lessonError])

  useEffect(() => {
    if (!resourceError) return
    const timer = setTimeout(() => setResourceError(''), 6000)
    return () => clearTimeout(timer)
  }, [resourceError])

  useEffect(() => {
    if (!quizError) return
    const timer = setTimeout(() => setQuizError(''), 6000)
    return () => clearTimeout(timer)
  }, [quizError])

  useEffect(() => {
    if (!lessonResourceError) return
    const timer = setTimeout(() => setLessonResourceError(''), 6000)
    return () => clearTimeout(timer)
  }, [lessonResourceError])

  useEffect(() => {
    if (!lessonQuizError) return
    const timer = setTimeout(() => setLessonQuizError(''), 6000)
    return () => clearTimeout(timer)
  }, [lessonQuizError])

  async function load() {
    setLoading(true)
    setError('')
    try {
      const res = await api.get(`/courses/${courseId}`)
      setCourse(res.data?.course || null)
      setLessons(res.data?.lessons || [])
      setEnrollment(res.data?.enrollment || null)
      setResources(res.data?.resources || [])
      setQuizzes(res.data?.quizzes || [])
      setEnrollmentCount(Number(res.data?.enrollmentCount || 0))

      // Keep lesson order suggestion in sync
      setLessonForm((prev) => ({
        ...prev,
        order: Math.max(1, (res.data?.lessons || []).length + 1),
      }))
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Failed to load course')
      setCourse(null)
      setLessons([])
      setEnrollment(null)
      setEnrollmentCount(0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId])

  useEffect(() => {
    if (!lessons.length) {
      setManageLessonId('')
      return
    }
    setManageLessonId((prev) => prev || lessons[0]._id || '')
  }, [lessons])

  useEffect(() => {
    let cancelled = false
    async function loadLessonExtras() {
      if (!manageLessonId) {
        setLessonResources([])
        setLessonQuizzes([])
        return
      }
      try {
        const [resResources, resQuizzes] = await Promise.all([
          api.get(`/courses/${courseId}/lessons/${manageLessonId}/resources`),
          api.get(`/courses/${courseId}/lessons/${manageLessonId}/quizzes`),
        ])
        if (cancelled) return
        setLessonResources(resResources.data?.resources || [])
        setLessonQuizzes(resQuizzes.data?.quizzes || [])
      } catch (e) {
        if (cancelled) return
        setLessonResourceError(e?.response?.data?.message || e?.message || 'Failed to load resources')
        setLessonQuizError(e?.response?.data?.message || e?.message || 'Failed to load quizzes')
        setLessonResources([])
        setLessonQuizzes([])
      }
    }

    loadLessonExtras()
    return () => {
      cancelled = true
    }
  }, [courseId, manageLessonId])

  useEffect(() => {
    setLessonResourceError('')
    setLessonResourceEditId('')
    setLessonResourceForm({ title: '', type: 'link', url: '', description: '' })
    setLessonQuizError('')
    setLessonQuizEditId('')
    setLessonQuizForm({
      title: '',
      deadline: '',
      durationMinutes: 20,
      questions: [{ prompt: '', options: ['', '', '', ''], correctOption: 0 }],
    })
  }, [manageLessonId])

  const progress = useMemo(() => {
    if (role !== 'student') return { completed: 0, total: lessons.length }
    const completed = (enrollment?.completedLessonIds || []).length
    const total = lessons.length
    return { completed, total }
  }, [enrollment, lessons.length, role])

  const percent = useMemo(() => {
    return progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : 0
  }, [progress.completed, progress.total])

  const counts = {
    lessons: lessons.length,
    resources: resources.length,
    quizzes: quizzes.length,
    students: enrollmentCount,
  }

  const firstLesson = lessons[0]

  const viewerResource = useMemo(() => {
    if (!openResourceId) return null
    return resources.find((r) => (r._id || r.url) === openResourceId) || null
  }, [openResourceId, resources])

  const viewerEmbedUrl = useMemo(() => {
    if (!viewerResource) return ''
    if (/youtube\.com|youtu\.be/i.test(viewerResource.url || '')) {
      return toYoutubeEmbed(viewerResource.url)
    }
    return ''
  }, [viewerResource])

  function toYoutubeEmbed(url = '') {
    if (!url) return ''
    if (url.includes('youtube.com/watch')) return url.replace('watch?v=', 'embed/')
    if (url.includes('youtu.be/')) return url.replace('youtu.be/', 'www.youtube.com/embed/')
    return url
  }

  async function enroll() {
    setError('')
    try {
      await api.post(`/courses/${courseId}/enroll`)
      await load()
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Enroll failed')
    }
  }

  async function togglePublish(nextValue) {
    if (role !== 'teacher') return
    setError('')
    setSaving(true)
    try {
      await api.patch(`/courses/${courseId}`, { isPublished: Boolean(nextValue) })
      await load()
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Failed to update course')
    } finally {
      setSaving(false)
    }
  }

  function setLessonField(field, value) {
    setLessonForm((prev) => ({ ...prev, [field]: value }))
  }

  function setResourceField(field, value) {
    setResourceForm((prev) => ({ ...prev, [field]: value }))
  }

  function setLessonResourceField(field, value) {
    setLessonResourceForm((prev) => ({ ...prev, [field]: value }))
  }

  function setQuizField(field, value) {
    setQuizForm((prev) => ({ ...prev, [field]: value }))
  }

  function setLessonQuizField(field, value) {
    setLessonQuizForm((prev) => ({ ...prev, [field]: value }))
  }

  function setQuizQuestion(index, next) {
    setQuizForm((prev) => {
      const questions = prev.questions.map((q, i) => (i === index ? { ...q, ...next } : q))
      return { ...prev, questions }
    })
  }

  function setLessonQuizQuestion(index, next) {
    setLessonQuizForm((prev) => {
      const questions = prev.questions.map((q, i) => (i === index ? { ...q, ...next } : q))
      return { ...prev, questions }
    })
  }

  function setQuizOption(index, optIndex, value) {
    setQuizForm((prev) => {
      const questions = prev.questions.map((q, i) => {
        if (i !== index) return q
        const options = q.options.map((opt, oi) => (oi === optIndex ? value : opt))
        return { ...q, options }
      })
      return { ...prev, questions }
    })
  }

  function setLessonQuizOption(index, optIndex, value) {
    setLessonQuizForm((prev) => {
      const questions = prev.questions.map((q, i) => {
        if (i !== index) return q
        const options = q.options.map((opt, oi) => (oi === optIndex ? value : opt))
        return { ...q, options }
      })
      return { ...prev, questions }
    })
  }

  function addQuizQuestion() {
    const last = quizForm.questions[quizForm.questions.length - 1]
    if (last && !last.prompt.trim() && last.options.every((o) => !o.trim())) {
      setQuizError('Fill the current question before adding another.')
      return
    }
    setQuizForm((prev) => ({
      ...prev,
      questions: [...prev.questions, { prompt: '', options: ['', '', '', ''], correctOption: 0 }],
    }))
  }

  function addLessonQuizQuestion() {
    const last = lessonQuizForm.questions[lessonQuizForm.questions.length - 1]
    if (last && !last.prompt.trim() && last.options.every((o) => !o.trim())) {
      setLessonQuizError('Fill the current question before adding another.')
      return
    }
    setLessonQuizForm((prev) => ({
      ...prev,
      questions: [...prev.questions, { prompt: '', options: ['', '', '', ''], correctOption: 0 }],
    }))
  }

  async function addLesson(e) {
    e.preventDefault()
    if (role !== 'teacher') return
    setLessonError('')

    const title = lessonForm.title.trim()
    if (title.length < 2) {
      setLessonError('Lesson title must be at least 2 characters.')
      return
    }

    const payload = {
      order: Number(lessonForm.order),
      title,
      duration: lessonForm.duration.trim(),
      content: lessonForm.content.trim(),
      isPublished: Boolean(lessonForm.isPublished),
    }

    setLessonSaving(true)
    try {
      if (lessonEditId) {
        await api.patch(`/courses/${courseId}/lessons/${lessonEditId}`, payload)
      } else {
        await api.post(`/courses/${courseId}/lessons`, payload)
      }

      setLessonForm((prev) => ({
        ...prev,
        title: '',
        duration: '',
        content: '',
        order: Math.max(1, lessons.length + 2),
      }))
      setLessonEditId('')
      await load()
    } catch (e2) {
      setLessonError(e2?.response?.data?.message || e2?.message || 'Failed to save lesson')
    } finally {
      setLessonSaving(false)
    }
  }

  function startEditLesson(lesson) {
    setLessonEditId(lesson._id)
    setLessonForm({
      order: lesson.order || 1,
      title: lesson.title || '',
      duration: lesson.duration || '',
      content: lesson.content || '',
      isPublished: Boolean(lesson.isPublished),
    })
  }

  async function deleteLesson(lessonId) {
    if (!lessonId) return
    setLessonError('')
    try {
      await api.delete(`/courses/${courseId}/lessons/${lessonId}`)
      if (lessonEditId === lessonId) setLessonEditId('')
      await load()
    } catch (e2) {
      setLessonError(e2?.response?.data?.message || e2?.message || 'Failed to delete lesson')
    }
  }

  async function addResource(e) {
    e.preventDefault()
    if (role !== 'teacher') return
    setResourceError('')

    const title = resourceForm.title.trim()
    const url = resourceForm.url.trim()
    if (!title) {
      setResourceError('Resource title is required.')
      return
    }
    if (!url) {
      setResourceError('Resource URL is required.')
      return
    }

    const payload = {
      title,
      url,
      type: resourceForm.type,
      description: resourceForm.description.trim(),
    }

    setResourceSaving(true)
    try {
      if (resourceEditId) {
        await api.patch(`/courses/${courseId}/resources/${resourceEditId}`, payload)
      } else {
        await api.post(`/courses/${courseId}/resources`, payload)
      }
      setResourceForm({ title: '', type: 'link', url: '', description: '' })
      setResourceEditId('')
      await load()
    } catch (e2) {
      const message =
        e2?.response?.status === 404
          ? 'Endpoint missing: add POST /courses/:courseId/resources on the backend.'
          : e2?.response?.data?.message || e2?.message || 'Failed to save resource'
      setResourceError(message)
    } finally {
      setResourceSaving(false)
    }
  }

  async function addLessonResource(e) {
    e.preventDefault()
    if (role !== 'teacher' || !manageLessonId) return
    setLessonResourceError('')

    const title = lessonResourceForm.title.trim()
    const url = lessonResourceForm.url.trim()
    if (!title) {
      setLessonResourceError('Resource title is required.')
      return
    }
    if (!url) {
      setLessonResourceError('Resource URL is required.')
      return
    }

    const payload = {
      title,
      url,
      type: lessonResourceForm.type,
      description: lessonResourceForm.description.trim(),
    }

    setLessonResourceSaving(true)
    try {
      if (lessonResourceEditId) {
        await api.patch(`/courses/${courseId}/lessons/${manageLessonId}/resources/${lessonResourceEditId}`, payload)
      } else {
        await api.post(`/courses/${courseId}/lessons/${manageLessonId}/resources`, payload)
      }
      setLessonResourceForm({ title: '', type: 'link', url: '', description: '' })
      setLessonResourceEditId('')
      const res = await api.get(`/courses/${courseId}/lessons/${manageLessonId}/resources`)
      setLessonResources(res.data?.resources || [])
      await load()
    } catch (e2) {
      setLessonResourceError(e2?.response?.data?.message || e2?.message || 'Failed to save resource')
    } finally {
      setLessonResourceSaving(false)
    }
  }

  function startEditResource(res) {
    const key = res._id || res.url
    setResourceEditId(res._id || key)
    setResourceForm({
      title: res.title || '',
      type: res.type || 'link',
      url: res.url || '',
      description: res.description || '',
    })
  }

  function startEditLessonResource(res) {
    const key = res._id || res.url
    setLessonResourceEditId(res._id || key)
    setLessonResourceForm({
      title: res.title || '',
      type: res.type || 'link',
      url: res.url || '',
      description: res.description || '',
    })
  }

  async function deleteResource(resourceId) {
    if (!resourceId) return
    setResourceError('')
    try {
      await api.delete(`/courses/${courseId}/resources/${resourceId}`)
      if (resourceEditId === resourceId) setResourceEditId('')
      await load()
    } catch (e2) {
      setResourceError(e2?.response?.data?.message || e2?.message || 'Failed to delete resource')
    }
  }

  async function deleteLessonResource(resourceId) {
    if (!resourceId || !manageLessonId) return
    setLessonResourceError('')
    try {
      await api.delete(`/courses/${courseId}/lessons/${manageLessonId}/resources/${resourceId}`)
      if (lessonResourceEditId === resourceId) setLessonResourceEditId('')
      const res = await api.get(`/courses/${courseId}/lessons/${manageLessonId}/resources`)
      setLessonResources(res.data?.resources || [])
      await load()
    } catch (e2) {
      setLessonResourceError(e2?.response?.data?.message || e2?.message || 'Failed to delete resource')
    }
  }

  async function addQuiz(e) {
    e.preventDefault()
    if (role !== 'teacher') return
    setQuizError('')

    const title = quizForm.title.trim()
    if (!title) {
      setQuizError('Quiz title is required.')
      return
    }
    if (!quizForm.questions.length) {
      setQuizError('Add at least one question.')
      return
    }

    const cleanedQuestions = quizForm.questions.map((q) => ({
      prompt: q.prompt.trim(),
      options: q.options.map((o) => o.trim()),
      correctOption: Number(q.correctOption) || 0,
    }))

    const hasInvalid = cleanedQuestions.some((q) => {
      const filledOptions = q.options.filter((o) => o.length > 0)
      const inRange = q.correctOption >= 0 && q.correctOption < q.options.length
      return !q.prompt || filledOptions.length < 2 || !inRange
    })
    if (hasInvalid) {
      setQuizError('Each question needs a prompt, two options, and a valid correct answer.')
      return
    }

    const payload = {
      title,
      deadline: quizForm.deadline,
      durationMinutes: Number(quizForm.durationMinutes) || 20,
      questions: cleanedQuestions,
    }

    setQuizSaving(true)
    try {
      if (quizEditId) {
        await api.patch(`/courses/${courseId}/quizzes/${quizEditId}`, payload)
      } else {
        await api.post(`/courses/${courseId}/quizzes`, payload)
      }
      setQuizForm({
        title: '',
        deadline: '',
        durationMinutes: 20,
        questions: [{ prompt: '', options: ['', '', '', ''], correctOption: 0 }],
      })
      setQuizEditId('')
      await load()
    } catch (e2) {
      setQuizError(e2?.response?.data?.message || e2?.message || 'Failed to save quiz')
    } finally {
      setQuizSaving(false)
    }
  }

  async function addLessonQuiz(e) {
    e.preventDefault()
    if (role !== 'teacher' || !manageLessonId) return
    setLessonQuizError('')

    const title = lessonQuizForm.title.trim()
    if (!title) {
      setLessonQuizError('Quiz title is required.')
      return
    }
    if (!lessonQuizForm.questions.length) {
      setLessonQuizError('Add at least one question.')
      return
    }

    const cleanedQuestions = lessonQuizForm.questions.map((q) => ({
      prompt: q.prompt.trim(),
      options: q.options.map((o) => o.trim()),
      correctOption: Number(q.correctOption) || 0,
    }))

    const hasInvalid = cleanedQuestions.some((q) => {
      const filledOptions = q.options.filter((o) => o.length > 0)
      const inRange = q.correctOption >= 0 && q.correctOption < q.options.length
      return !q.prompt || filledOptions.length < 2 || !inRange
    })
    if (hasInvalid) {
      setLessonQuizError('Each question needs a prompt, two options, and a valid correct answer.')
      return
    }

    const payload = {
      title,
      deadline: lessonQuizForm.deadline,
      durationMinutes: Number(lessonQuizForm.durationMinutes) || 20,
      questions: cleanedQuestions,
    }

    setLessonQuizSaving(true)
    try {
      if (lessonQuizEditId) {
        await api.patch(`/courses/${courseId}/lessons/${manageLessonId}/quizzes/${lessonQuizEditId}`, payload)
      } else {
        await api.post(`/courses/${courseId}/lessons/${manageLessonId}/quizzes`, payload)
      }
      setLessonQuizForm({
        title: '',
        deadline: '',
        durationMinutes: 20,
        questions: [{ prompt: '', options: ['', '', '', ''], correctOption: 0 }],
      })
      setLessonQuizEditId('')
      const res = await api.get(`/courses/${courseId}/lessons/${manageLessonId}/quizzes`)
      setLessonQuizzes(res.data?.quizzes || [])
      await load()
    } catch (e2) {
      setLessonQuizError(e2?.response?.data?.message || e2?.message || 'Failed to save quiz')
    } finally {
      setLessonQuizSaving(false)
    }
  }

  function startEditQuiz(quiz) {
    setQuizEditId(quiz._id)
    setQuizForm({
      title: quiz.title || '',
      deadline: quiz.deadline ? quiz.deadline.slice(0, 16) : '',
      durationMinutes: quiz.durationMinutes || 20,
      questions: (quiz.questions || []).map((q) => ({
        prompt: q.prompt || '',
        options: (q.options || []).length ? q.options : ['', '', '', ''],
        correctOption: Number(q.correctOption) || 0,
      })),
    })
  }

  function startEditLessonQuiz(quiz) {
    setLessonQuizEditId(quiz._id)
    setLessonQuizForm({
      title: quiz.title || '',
      deadline: quiz.deadline ? quiz.deadline.slice(0, 16) : '',
      durationMinutes: quiz.durationMinutes || 20,
      questions: (quiz.questions || []).map((q) => ({
        prompt: q.prompt || '',
        options: (q.options || []).length ? q.options : ['', '', '', ''],
        correctOption: Number(q.correctOption) || 0,
      })),
    })
  }

  async function deleteQuiz(quizId) {
    if (!quizId) return
    setQuizError('')
    try {
      await api.delete(`/courses/${courseId}/quizzes/${quizId}`)
      if (quizEditId === quizId) setQuizEditId('')
      await load()
    } catch (e2) {
      setQuizError(e2?.response?.data?.message || e2?.message || 'Failed to delete quiz')
    }
  }

  async function deleteLessonQuiz(quizId) {
    if (!quizId || !manageLessonId) return
    setLessonQuizError('')
    try {
      await api.delete(`/courses/${courseId}/lessons/${manageLessonId}/quizzes/${quizId}`)
      if (lessonQuizEditId === quizId) setLessonQuizEditId('')
      const res = await api.get(`/courses/${courseId}/lessons/${manageLessonId}/quizzes`)
      setLessonQuizzes(res.data?.quizzes || [])
      await load()
    } catch (e2) {
      setLessonQuizError(e2?.response?.data?.message || e2?.message || 'Failed to delete quiz')
    }
  }

  // If the API says "not found" or we failed to load and have no course, go to 404.
  if (!loading && !course) return <Navigate to="/404" replace />

  // Initial load: avoid dereferencing `course` before it exists.
  const courseTitle = course?.title || (loading ? 'Loading course…' : 'Course')
  const courseSubtitle = course?.subtitle || ''

  return (
    <div className="page">
      <header className="pageHeader">
        <div className="headerRow">
          <div>
            <h1 className="title">{courseTitle}</h1>
            <p className="subtitle">{courseSubtitle}</p>
          </div>
          <Link className="primary outline" to="/courses">
            Back to Courses
          </Link>
        </div>
      </header>

      <section className="card">
        {error ? <div className="notice error">{error}</div> : null}
        <div className="courseMeta">
          <div>
            <div className="cardKicker">{role === 'teacher' ? 'Instructor view' : 'Student view'}</div>
            <div className="courseAbout">{course?.about || '—'}</div>
          </div>

          {role === 'student' ? (
            <div className="progressBox" aria-label="Progress">
              <div className="progressLabel">Progress</div>
              <div className="progressValue">
                {progress.completed}/{progress.total} ({percent}%)
              </div>
              <div className="progressTrack" aria-hidden="true">
                <div className="progressFill" style={{ width: `${percent}%` }} />
              </div>
            </div>
          ) : null}
        </div>

        <div className="statGrid" style={{ marginTop: 12 }}>
          <div className="statCard">
            <div className="statLabel">Lessons</div>
            <div className="statValue">{counts.lessons}</div>
          </div>
          <div className="statCard">
            <div className="statLabel">Resources</div>
            <div className="statValue">{counts.resources}</div>
          </div>
          <div className="statCard">
            <div className="statLabel">Quizzes</div>
            <div className="statValue">{counts.quizzes}</div>
          </div>
          <div className="statCard">
            <div className="statLabel">Students</div>
            <div className="statValue">{counts.students}</div>
          </div>
        </div>

        <div style={{ marginTop: 16, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {loading ? (
            <button className="primary" type="button" disabled>
              Loading…
            </button>
          ) : !firstLesson ? (
            <button className="primary" type="button" disabled>
              No lessons yet
            </button>
          ) : role === 'student' && !enrollment ? (
            <button className="primary" type="button" onClick={enroll}>
              Enroll
            </button>
          ) : (
            <Link className="primary" to={`/courses/${courseId}/lesson/${firstLesson._id}`}>
              {role === 'teacher' ? 'Preview lessons' : 'Start learning'}
            </Link>
          )}

          {role === 'teacher' ? (
            <Link className="primary outline" to={`/courses/${courseId}/students`}>
              Show students
            </Link>
          ) : null}
        </div>
      </section>

      {role === 'teacher' ? (
        <section className="card" aria-label="Teacher tools" style={{ marginTop: 16 }}>
          <div className="cardTitle">Teacher tools</div>

          <div className="buttonRow" style={{ marginTop: 12 }}>
            <button
              type="button"
              className={course?.isPublished ? 'primary outline' : 'primary'}
              onClick={() => togglePublish(false)}
              disabled={saving || loading}
            >
              {saving && !course?.isPublished ? 'Saving…' : 'Set draft'}
            </button>
            <button
              type="button"
              className={course?.isPublished ? 'primary' : 'primary outline'}
              onClick={() => togglePublish(true)}
              disabled={saving || loading}
            >
              {saving && course?.isPublished ? 'Saving…' : 'Publish'}
            </button>
            <div className="pill" style={{ display: 'inline-flex' }}>
              {course?.isPublished ? 'Published' : 'Draft'}
            </div>
          </div>

          <div style={{ marginTop: 16 }}>
            <div className="cardTitle" style={{ fontSize: 16 }}>
              {lessonEditId ? 'Edit lesson' : 'Add lesson'}
            </div>
            {lessonError ? <div className="notice error">{lessonError}</div> : null}
            <form className="form" onSubmit={addLesson}>
              <div className="field">
                <label className="label" htmlFor="lessonOrder">Order</label>
                <input
                  id="lessonOrder"
                  className="input"
                  inputMode="numeric"
                  value={String(lessonForm.order)}
                  onChange={(e) => setLessonField('order', Number(e.target.value || 1))}
                />
              </div>
              <div className="field">
                <label className="label" htmlFor="lessonTitle">Title</label>
                <input
                  id="lessonTitle"
                  className="input"
                  value={lessonForm.title}
                  onChange={(e) => setLessonField('title', e.target.value)}
                />
              </div>
              <div className="field">
                <label className="label" htmlFor="lessonDuration">Duration</label>
                <input
                  id="lessonDuration"
                  className="input"
                  value={lessonForm.duration}
                  onChange={(e) => setLessonField('duration', e.target.value)}
                  placeholder="e.g. 8 min"
                />
              </div>
              <div className="field">
                <label className="label" htmlFor="lessonContent">Content</label>
                <textarea
                  id="lessonContent"
                  className="input"
                  rows={5}
                  value={lessonForm.content}
                  onChange={(e) => setLessonField('content', e.target.value)}
                />
              </div>

              <div className="buttonRow">
                <button
                  type="button"
                  className={lessonForm.isPublished ? 'primary outline' : 'primary'}
                  onClick={() => setLessonField('isPublished', false)}
                  disabled={lessonSaving}
                >
                  Save as draft
                </button>
                <button
                  type="button"
                  className={lessonForm.isPublished ? 'primary' : 'primary outline'}
                  onClick={() => setLessonField('isPublished', true)}
                  disabled={lessonSaving}
                >
                  Publish
                </button>
                <button className="primary" type="submit" disabled={lessonSaving}>
                  {lessonSaving ? 'Saving…' : lessonEditId ? 'Update lesson' : 'Add lesson'}
                </button>
                {lessonEditId ? (
                  <button
                    type="button"
                    className="primary outline"
                    disabled={lessonSaving}
                    onClick={() => {
                      setLessonEditId('')
                      setLessonForm((prev) => ({
                        ...prev,
                        title: '',
                        duration: '',
                        content: '',
                        order: Math.max(1, lessons.length + 1),
                      }))
                    }}
                  >
                    Cancel edit
                  </button>
                ) : null}
              </div>
            </form>
          </div>
        </section>
      ) : null}

        {role === 'teacher' ? (
          <section className="section" aria-label="Lesson resources and quizzes">
            <div className="sectionHeader">
              <h2 className="sectionTitle">Lesson resources and quizzes</h2>
              <div className="sectionSubtitle">Pick a lesson and add resources or quizzes without opening it.</div>
            </div>

            <div className="card" style={{ marginBottom: 12 }}>
              <div className="field">
                <label className="label" htmlFor="manageLesson">Select lesson</label>
                <select
                  id="manageLesson"
                  className="input"
                  value={manageLessonId}
                  onChange={(e) => setManageLessonId(e.target.value)}
                >
                  <option value="" disabled>
                    {lessons.length ? 'Choose a lesson' : 'No lessons yet'}
                  </option>
                  {lessons.map((l) => (
                    <option key={l._id} value={l._id}>
                      {l.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {!manageLessonId ? (
              <div className="notice">Add a lesson first, then select it to manage resources and quizzes.</div>
            ) : (
              <div className="card" style={{ display: 'grid', gap: 16 }}>
                <div>
                  {lessonResourceError ? <div className="notice error">{lessonResourceError}</div> : null}
                  <div className="cardTitle">Resources</div>
                  <form className="form" onSubmit={addLessonResource}>
                    <div className="field">
                      <label className="label" htmlFor="lessonResTitle">Title</label>
                      <input
                        id="lessonResTitle"
                        className="input"
                        value={lessonResourceForm.title}
                        onChange={(e) => setLessonResourceField('title', e.target.value)}
                      />
                    </div>
                    <div className="field">
                      <label className="label" htmlFor="lessonResType">Type</label>
                      <select
                        id="lessonResType"
                        className="input"
                        value={lessonResourceForm.type}
                        onChange={(e) => setLessonResourceField('type', e.target.value)}
                      >
                        <option value="link">Link</option>
                        <option value="video">Video</option>
                        <option value="file">File</option>
                      </select>
                    </div>
                    <div className="field">
                      <label className="label" htmlFor="lessonResUrl">URL</label>
                      <input
                        id="lessonResUrl"
                        className="input"
                        value={lessonResourceForm.url}
                        onChange={(e) => setLessonResourceField('url', e.target.value)}
                        placeholder="https://..."
                      />
                    </div>
                    <div className="field">
                      <label className="label" htmlFor="lessonResDesc">Description</label>
                      <textarea
                        id="lessonResDesc"
                        className="input"
                        rows={3}
                        value={lessonResourceForm.description}
                        onChange={(e) => setLessonResourceField('description', e.target.value)}
                      />
                    </div>
                    <div className="buttonRow">
                      <button className="primary" type="submit" disabled={lessonResourceSaving}>
                        {lessonResourceSaving
                          ? 'Saving…'
                          : lessonResourceEditId
                            ? 'Update resource'
                            : 'Add resource'}
                      </button>
                      {lessonResourceEditId ? (
                        <button
                          type="button"
                          className="primary outline"
                          disabled={lessonResourceSaving}
                          onClick={() => {
                            setLessonResourceEditId('')
                            setLessonResourceForm({ title: '', type: 'link', url: '', description: '' })
                          }}
                        >
                          Cancel edit
                        </button>
                      ) : null}
                    </div>
                  </form>

                  <div className="cardGrid" style={{ marginTop: 10 }}>
                    {lessonResources?.length ? (
                      lessonResources.map((res) => {
                        const key = res._id || res.url
                        return (
                          <div className="tile" key={key}>
                            <div className="tileTitle">{res.title}</div>
                            <div className="tileText">{res.description || res.type}</div>
                            <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                              <a className="primary outline" href={res.url} target="_blank" rel="noreferrer">
                                Open
                              </a>
                              <button type="button" className="primary outline" onClick={() => startEditLessonResource(res)}>
                                Edit
                              </button>
                              <button type="button" className="primary" onClick={() => deleteLessonResource(res._id || key)}>
                                Delete
                              </button>
                            </div>
                          </div>
                        )
                      })
                    ) : (
                      <div className="notice">No resources yet.</div>
                    )}
                  </div>
                </div>

                <div>
                  {lessonQuizError ? <div className="notice error">{lessonQuizError}</div> : null}
                  <div className="cardTitle">Quizzes</div>
                  <form className="form" onSubmit={addLessonQuiz}>
                    <div className="field">
                      <label className="label" htmlFor="lessonQuizTitle">Title</label>
                      <input
                        id="lessonQuizTitle"
                        className="input"
                        value={lessonQuizForm.title}
                        onChange={(e) => setLessonQuizField('title', e.target.value)}
                      />
                    </div>
                    <div className="field">
                      <label className="label" htmlFor="lessonQuizDeadline">Deadline</label>
                      <input
                        id="lessonQuizDeadline"
                        type="datetime-local"
                        className="input"
                        value={lessonQuizForm.deadline}
                        onChange={(e) => setLessonQuizField('deadline', e.target.value)}
                      />
                    </div>
                    <div className="field">
                      <label className="label" htmlFor="lessonQuizDuration">Duration (minutes)</label>
                      <input
                        id="lessonQuizDuration"
                        className="input"
                        inputMode="numeric"
                        value={lessonQuizForm.durationMinutes}
                        onChange={(e) => setLessonQuizField('durationMinutes', e.target.value)}
                      />
                    </div>

                    {lessonQuizForm.questions.map((q, idx) => (
                      <div className="card" key={idx} style={{ padding: 16, marginTop: 12 }}>
                        <div className="field">
                          <label className="label">Question {idx + 1}</label>
                          <input
                            className="input"
                            value={q.prompt}
                            onChange={(e) => setLessonQuizQuestion(idx, { prompt: e.target.value })}
                          />
                        </div>
                        <div className="field">
                          <label className="label">Options</label>
                          {q.options.map((opt, oi) => (
                            <div key={oi} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                              <input
                                className="input"
                                value={opt}
                                onChange={(e) => setLessonQuizOption(idx, oi, e.target.value)}
                                placeholder={`Option ${oi + 1}`}
                              />
                              <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <input
                                  type="radio"
                                  name={`lesson-correct-${idx}`}
                                  checked={Number(q.correctOption) === oi}
                                  onChange={() => setLessonQuizQuestion(idx, { correctOption: oi })}
                                />
                                Correct
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}

                    <div className="buttonRow" style={{ marginTop: 12 }}>
                      <button type="button" className="primary outline" onClick={addLessonQuizQuestion}>
                        Add question
                      </button>
                      <button className="primary" type="submit" disabled={lessonQuizSaving}>
                        {lessonQuizSaving
                          ? 'Saving…'
                          : lessonQuizEditId
                            ? 'Update quiz'
                            : 'Create quiz'}
                      </button>
                      {lessonQuizEditId ? (
                        <button
                          type="button"
                          className="primary outline"
                          disabled={lessonQuizSaving}
                          onClick={() => {
                            setLessonQuizEditId('')
                            setLessonQuizForm({
                              title: '',
                              deadline: '',
                              durationMinutes: 20,
                              questions: [{ prompt: '', options: ['', '', '', ''], correctOption: 0 }],
                            })
                          }}
                        >
                          Cancel edit
                        </button>
                      ) : null}
                    </div>
                  </form>

                  <div className="cardGrid" style={{ marginTop: 10 }}>
                    {lessonQuizzes?.length ? (
                      lessonQuizzes.map((quiz) => (
                        <div className="tile" key={quiz._id || quiz.title}>
                          <div className="tileTitle">{quiz.title}</div>
                          <div className="tileText">
                            Duration: {quiz.durationMinutes || 20} min • Deadline: {quiz.deadline || '—'}
                          </div>
                          <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            {firstLesson ? (
                              <Link className="primary outline" to={`/courses/${courseId}/lesson/${manageLessonId}`}>
                                Preview lesson
                              </Link>
                            ) : null}
                            <button type="button" className="primary outline" onClick={() => startEditLessonQuiz(quiz)}>
                              Edit
                            </button>
                            <button type="button" className="primary" onClick={() => deleteLessonQuiz(quiz._id)}>
                              Delete
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="notice">No quizzes scheduled yet.</div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </section>
        ) : null}

      <section className="section" aria-label="Syllabus">
        <div className="sectionHeader">
          <h2 className="sectionTitle">Syllabus</h2>
          <div className="sectionSubtitle">Lessons included in this course.</div>
        </div>

        <div className="syllabus">
          {loading ? (
            <div className="notice">Loading lessons…</div>
          ) : lessons.length === 0 ? (
            <div className="notice">No lessons available yet.</div>
          ) : lessons.map((lesson, idx) => (
            <div className="syllabusRow" key={lesson._id}>
              <Link to={`/courses/${courseId}/lesson/${lesson._id}`} className="syllabusLeft">
                <div className="syllabusIndex">{idx + 1}</div>
                <div>
                  <div className="syllabusTitle">{lesson.title}</div>
                  <div className="syllabusSub">{lesson.duration}</div>
                </div>
              </Link>
              <div className="syllabusRight" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <Link to={`/courses/${courseId}/lesson/${lesson._id}`} className="link">Open</Link>
                {role === 'teacher' ? (
                  <>
                    <button
                      type="button"
                      className="primary outline"
                      onClick={() => startEditLesson(lesson)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="primary"
                      onClick={() => deleteLesson(lesson._id)}
                    >
                      Delete
                    </button>
                  </>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="section" aria-label="Resources">
        <div className="sectionHeader">
          <h2 className="sectionTitle">Resources</h2>
          <div className="sectionSubtitle">Links, videos, and reading material.</div>
        </div>

        {resourceError ? <div className="notice error">{resourceError}</div> : null}

        {role === 'teacher' ? (
          <div className="notice" style={{ marginBottom: 12 }}>
            Manage resources per lesson on the lesson page. This course-level view is read-only.
          </div>
        ) : null}

        <div className="cardGrid" aria-label="Resource list">
          {resources?.length ? (
            resources.map((res) => {
              const isYoutube = /youtube\.com|youtu\.be/i.test(res.url || '')
              const key = res._id || res.url
              const isOpen = openResourceId === key

              return (
                <div className="tile" key={key}>
                  <div className="tileTitle">{res.title}</div>
                  <div className="tileText">{res.description || res.type}</div>
                  <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {isYoutube ? (
                      <button
                        type="button"
                        className="primary"
                        onClick={() => setOpenResourceId(isOpen ? '' : key)}
                      >
                        {isOpen ? 'Hide video viewer' : 'Open video below'}
                      </button>
                    ) : null}
                    <a className="primary outline" href={res.url} target="_blank" rel="noreferrer">
                      Open in new tab
                    </a>
                    {role === 'teacher' ? (
                      <>
                        <button type="button" className="primary outline" onClick={() => startEditResource(res)}>
                          Edit
                        </button>
                        <button type="button" className="primary" onClick={() => deleteResource(res._id || key)}>
                          Delete
                        </button>
                      </>
                    ) : null}
                  </div>
                </div>
              )
            })
          ) : (
            <div className="notice">No resources yet.</div>
          )}
        </div>

        {viewerResource && viewerEmbedUrl ? (
          <div className="card" style={{ marginTop: 12 }}>
            <div className="cardTitle" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>{viewerResource.title}</span>
              <button type="button" className="primary outline" onClick={() => setOpenResourceId('')}>
                Close
              </button>
            </div>
            {viewerResource.description ? (
              <div className="tileText" style={{ marginBottom: 10 }}>{viewerResource.description}</div>
            ) : null}
            <div className="videoEmbed fullWidth">
              <iframe
                title={viewerResource.title}
                src={viewerEmbedUrl}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        ) : null}
      </section>

      <section className="section" aria-label="Quizzes">
        <div className="sectionHeader">
          <h2 className="sectionTitle">Quizzes</h2>
          <div className="sectionSubtitle">Schedule quizzes with deadlines and time limits.</div>
        </div>

        {quizError ? <div className="notice error">{quizError}</div> : null}

        {role === 'teacher' ? (
          <div className="notice" style={{ marginBottom: 12 }}>
            Quizzes are now managed per lesson on the lesson page. This course-level view is read-only.
          </div>
        ) : null}

        <div className="cardGrid" aria-label="Quiz list">
          {quizzes?.length ? (
            quizzes.map((quiz) => (
              <div className="tile" key={quiz._id || quiz.title}>
                <div className="tileTitle">{quiz.title}</div>
                <div className="tileText">
                  Duration: {quiz.durationMinutes || 20} min • Deadline: {quiz.deadline || '—'}
                </div>
                <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {firstLesson ? (
                    <Link className="primary" to={`/courses/${courseId}/lesson/${firstLesson._id}`}>
                      Open to attempt
                    </Link>
                  ) : null}
                  {role === 'teacher' ? (
                    <>
                      <button type="button" className="primary outline" onClick={() => startEditQuiz(quiz)}>
                        Edit
                      </button>
                      <button type="button" className="primary" onClick={() => deleteQuiz(quiz._id)}>
                        Delete
                      </button>
                    </>
                  ) : null}
                </div>
              </div>
            ))
          ) : (
            <div className="notice">No quizzes scheduled yet.</div>
          )}
        </div>
      </section>
    </div>
  )
}
