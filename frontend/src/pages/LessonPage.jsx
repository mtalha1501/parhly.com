import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { api } from '../lib/api.js'
import { getAuth } from '../lib/auth.js'

export default function LessonPage() {
  const { courseId, lessonId } = useParams()

  const auth = getAuth()
  const role = auth?.user?.role === 'teacher' ? 'teacher' : 'student'

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [course, setCourse] = useState(null)
  const [lessons, setLessons] = useState([])
  const [enrollment, setEnrollment] = useState(null)
  const [saving, setSaving] = useState(false)

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
  const [activeQuiz, setActiveQuiz] = useState(null)
  const [answers, setAnswers] = useState({})
  const [timeLeft, setTimeLeft] = useState(0)
  const [quizMessage, setQuizMessage] = useState('')
  const [attempts, setAttempts] = useState({})
  const [resultModal, setResultModal] = useState({ open: false, title: '', score: '', attemptsUsed: 0 })

  useEffect(() => {
    if (!error) return
    const timer = setTimeout(() => setError(''), 6000)
    return () => clearTimeout(timer)
  }, [error])

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
    if (!activeQuiz) return undefined
    if (timeLeft <= 0) return undefined
    const id = setInterval(() => {
      setTimeLeft((t) => (t > 0 ? t - 1 : 0))
    }, 1000)
    return () => clearInterval(id)
  }, [activeQuiz, timeLeft])

  useEffect(() => {
    if (activeQuiz && timeLeft === 0) {
      submitQuiz()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeQuiz, timeLeft])

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError('')
      try {
        const res = await api.get(`/courses/${courseId}`)
        if (cancelled) return
        setCourse(res.data?.course || null)
        setLessons(res.data?.lessons || [])
        setEnrollment(res.data?.enrollment || null)
        // hydrate attempts from localStorage
        const attemptMap = {}
        ;(res.data?.quizzes || []).forEach((q) => {
          const key = q._id || q.title
          const stored = Number(localStorage.getItem(`quizAttempts:${key}`)) || 0
          attemptMap[key] = stored
        })
        setAttempts(attemptMap)
      } catch (e) {
        if (cancelled) return
        setError(e?.response?.data?.message || e?.message || 'Failed to load lesson')
        setCourse(null)
        setLessons([])
        setEnrollment(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [courseId])

  const lesson = useMemo(() => {
    return lessons.find((l) => String(l._id) === String(lessonId)) || null
  }, [lessons, lessonId])

  const index = useMemo(() => {
    return lessons.findIndex((l) => String(l._id) === String(lessonId))
  }, [lessons, lessonId])

  const prev = index > 0 ? lessons[index - 1] : null
  const next = index >= 0 && index < lessons.length - 1 ? lessons[index + 1] : null

  const completed = useMemo(() => {
    if (role !== 'student') return false
    const set = new Set((enrollment?.completedLessonIds || []).map((x) => String(x)))
    return set.has(String(lessonId))
  }, [enrollment, lessonId, role])

  useEffect(() => {
    let cancelled = false

    async function fetchResources() {
      if (!courseId || !lessonId) return
      try {
        const res = await api.get(`/courses/${courseId}/lessons/${lessonId}/resources`)
        if (cancelled) return
        setResources(res.data?.resources || [])
      } catch (e) {
        if (cancelled) return
        setResourceError(e?.response?.data?.message || e?.message || 'Failed to load resources')
        setResources([])
      }
    }

    async function fetchQuizzes() {
      if (!courseId || !lessonId) return
      try {
        const res = await api.get(`/courses/${courseId}/lessons/${lessonId}/quizzes`)
        if (cancelled) return
        setQuizzes(res.data?.quizzes || [])
        const attemptMap = {}
        ;(res.data?.quizzes || []).forEach((q) => {
          const key = q._id || q.title
          const stored = Number(localStorage.getItem(`quizAttempts:${key}`)) || 0
          attemptMap[key] = stored
        })
        setAttempts(attemptMap)
      } catch (e) {
        if (cancelled) return
        setQuizError(e?.response?.data?.message || e?.message || 'Failed to load quizzes')
        setQuizzes([])
      }
    }

    fetchResources()
    fetchQuizzes()
    return () => {
      cancelled = true
    }
  }, [courseId, lessonId])

  async function toggleComplete() {
    if (role !== 'student') return
    setError('')
    setSaving(true)
    try {
      const res = await api.post(`/courses/${courseId}/progress/lessons/${lessonId}`, {
        completed: !completed,
      })
      setEnrollment(res.data?.enrollment || null)
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Failed to update progress')
    } finally {
      setSaving(false)
    }
  }

  function setResourceField(field, value) {
    setResourceForm((prev) => ({ ...prev, [field]: value }))
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
        await api.patch(`/courses/${courseId}/lessons/${lessonId}/resources/${resourceEditId}`, payload)
      } else {
        await api.post(`/courses/${courseId}/lessons/${lessonId}/resources`, payload)
      }
      setResourceForm({ title: '', type: 'link', url: '', description: '' })
      setResourceEditId('')
      const res = await api.get(`/courses/${courseId}/lessons/${lessonId}/resources`)
      setResources(res.data?.resources || [])
    } catch (e2) {
      setResourceError(e2?.response?.data?.message || e2?.message || 'Failed to save resource')
    } finally {
      setResourceSaving(false)
    }
  }

  function startEditResource(res) {
    setResourceEditId(res._id || '')
    setResourceForm({
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
      await api.delete(`/courses/${courseId}/lessons/${lessonId}/resources/${resourceId}`)
      if (resourceEditId === resourceId) setResourceEditId('')
      const res = await api.get(`/courses/${courseId}/lessons/${lessonId}/resources`)
      setResources(res.data?.resources || [])
    } catch (e2) {
      setResourceError(e2?.response?.data?.message || e2?.message || 'Failed to delete resource')
    }
  }

  function setQuizField(field, value) {
    setQuizForm((prev) => ({ ...prev, [field]: value }))
  }

  function setQuizQuestion(index, next) {
    setQuizForm((prev) => {
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
        await api.patch(`/courses/${courseId}/lessons/${lessonId}/quizzes/${quizEditId}`, payload)
      } else {
        await api.post(`/courses/${courseId}/lessons/${lessonId}/quizzes`, payload)
      }
      setQuizForm({
        title: '',
        deadline: '',
        durationMinutes: 20,
        questions: [{ prompt: '', options: ['', '', '', ''], correctOption: 0 }],
      })
      setQuizEditId('')
      const res = await api.get(`/courses/${courseId}/lessons/${lessonId}/quizzes`)
      setQuizzes(res.data?.quizzes || [])
    } catch (e2) {
      setQuizError(e2?.response?.data?.message || e2?.message || 'Failed to save quiz')
    } finally {
      setQuizSaving(false)
    }
  }

  function startEditQuiz(quiz) {
    setQuizEditId(quiz._id || '')
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

  async function deleteQuiz(quizId) {
    if (!quizId) return
    setQuizError('')
    try {
      await api.delete(`/courses/${courseId}/lessons/${lessonId}/quizzes/${quizId}`)
      if (quizEditId === quizId) setQuizEditId('')
      const res = await api.get(`/courses/${courseId}/lessons/${lessonId}/quizzes`)
      setQuizzes(res.data?.quizzes || [])
    } catch (e2) {
      setQuizError(e2?.response?.data?.message || e2?.message || 'Failed to delete quiz')
    }
  }

  function formatTime(seconds) {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  function startQuiz(quiz) {
    const key = quiz._id || quiz.title
    const used = attempts[key] || 0
    if (used >= 3) {
      const totalQs = (quiz.questions || []).length || 0
      setQuizMessage('Attempt limit reached (3). Score recorded as 0.')
      setResultModal({ open: true, title: quiz.title, score: `0/${totalQs}`, attemptsUsed: used })
      return
    }
    setActiveQuiz(quiz)
    setAnswers({})
    setQuizMessage('')
    setTimeLeft(Math.max(1, (quiz?.durationMinutes || 20) * 60))
  }

  function selectAnswer(questionId, optionIndex) {
    setAnswers((prev) => ({ ...prev, [questionId]: optionIndex }))
  }

  async function submitQuiz() {
    if (!activeQuiz) return
    const key = activeQuiz._id || activeQuiz.title
    const used = attempts[key] || 0
    if (used >= 3) {
      setQuizMessage('Attempt limit reached (3). Score recorded as 0.')
      setActiveQuiz(null)
      setTimeLeft(0)
      setResultModal({ open: true, title: activeQuiz.title, score: '0/0', attemptsUsed: used })
      return
    }
    const qs = activeQuiz.questions || []
    let correct = 0
    qs.forEach((q, idx) => {
      const chosen = answers[q._id || idx]
      if (Number(chosen) === Number(q.correctOption)) correct += 1
    })
    const score = `${correct}/${qs.length || 0}`
    setQuizMessage(`Score: ${score}`)
    setActiveQuiz(null)
    setTimeLeft(0)

    const nextAttempts = { ...attempts, [key]: used + 1 }
    setAttempts(nextAttempts)
    localStorage.setItem(`quizAttempts:${key}`, used + 1)
    setResultModal({ open: true, title: activeQuiz.title, score, attemptsUsed: used + 1 })

    // Try to persist if backend supports it; ignore errors silently
    try {
      if (activeQuiz._id) {
        await api.post(`/courses/${courseId}/quizzes/${activeQuiz._id}/submit`, {
          answers,
          score,
        })
      }
    } catch (e) {
      // optional
    }
  }

  if (!loading && !course) return <Navigate to="/404" replace />
  if (!loading && course && !lesson) return <Navigate to={`/courses/${courseId}`} replace />

  return (
    <div className="page">
      <header className="pageHeader">
        <div className="headerRow">
          <div>
            <h1 className="title">{loading ? 'Loading…' : lesson?.title}</h1>
            <p className="subtitle">{course?.title} • {lesson?.duration || '—'}</p>
          </div>
          <Link className="primary outline" to={`/courses/${courseId}`}>
            Back
          </Link>
        </div>
      </header>

      <section className="card">
        <div className="lessonBody">
          {error ? <div className="notice error">{error}</div> : null}
          <div className="lessonBadge">
            Lesson {Math.max(0, index) + 1} of {lessons.length || 0}
          </div>
          <p className="lessonText">{loading ? 'Loading content…' : lesson?.content}</p>

          <div className="section" aria-label="Resources">
            <div className="sectionHeader">
              <h3 className="sectionTitle">Resources</h3>
              <div className="sectionSubtitle">Links and videos for this lesson.</div>
            </div>
            {resourceError ? <div className="notice error">{resourceError}</div> : null}

            {role === 'teacher' ? (
              <div className="card" style={{ marginBottom: 12 }}>
                <div className="cardTitle">{resourceEditId ? 'Edit resource' : 'Add resource'}</div>
                <form className="form" onSubmit={addResource}>
                  <div className="field">
                    <label className="label" htmlFor="resourceTitle">Title</label>
                    <input
                      id="resourceTitle"
                      className="input"
                      value={resourceForm.title}
                      onChange={(e) => setResourceField('title', e.target.value)}
                    />
                  </div>
                  <div className="field">
                    <label className="label" htmlFor="resourceType">Type</label>
                    <select
                      id="resourceType"
                      className="input"
                      value={resourceForm.type}
                      onChange={(e) => setResourceField('type', e.target.value)}
                    >
                      <option value="link">Link</option>
                      <option value="video">Video</option>
                      <option value="file">File</option>
                    </select>
                  </div>
                  <div className="field">
                    <label className="label" htmlFor="resourceUrl">URL</label>
                    <input
                      id="resourceUrl"
                      className="input"
                      value={resourceForm.url}
                      onChange={(e) => setResourceField('url', e.target.value)}
                      placeholder="https://..."
                    />
                  </div>
                  <div className="field">
                    <label className="label" htmlFor="resourceDesc">Description</label>
                    <textarea
                      id="resourceDesc"
                      className="input"
                      rows={3}
                      value={resourceForm.description}
                      onChange={(e) => setResourceField('description', e.target.value)}
                    />
                  </div>
                  <div className="buttonRow">
                    <button className="primary" type="submit" disabled={resourceSaving}>
                      {resourceSaving ? 'Saving…' : resourceEditId ? 'Update resource' : 'Add resource'}
                    </button>
                    {resourceEditId ? (
                      <button
                        type="button"
                        className="primary outline"
                        disabled={resourceSaving}
                        onClick={() => {
                          setResourceEditId('')
                          setResourceForm({ title: '', type: 'link', url: '', description: '' })
                        }}
                      >
                        Cancel edit
                      </button>
                    ) : null}
                  </div>
                </form>
              </div>
            ) : null}

            <div className="cardGrid">
              {resources?.length ? (
                resources.map((res) => {
                  const isYoutube = /youtube|youtu\.be/i.test(res.url || '')
                  const key = res._id || res.url
                  const isOpen = openResourceId === key
                  return (
                    <div className="tile" key={key}>
                      <div className="tileTitle">{res.title}</div>
                      <div className="tileText">{res.description || res.type}</div>
                      {isYoutube ? (
                        <div className="videoEmbed">
                          <iframe
                            title={res.title}
                            src={res.url.replace('watch?v=', 'embed/')}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                      ) : null}
                      <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <a className="primary outline" href={res.url} target="_blank" rel="noreferrer">
                          Open
                        </a>
                        {isYoutube ? (
                          <button
                            type="button"
                            className="primary outline"
                            onClick={() => setOpenResourceId(isOpen ? '' : key)}
                          >
                            {isOpen ? 'Hide video viewer' : 'Open inline'}
                          </button>
                        ) : null}
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
                      {isYoutube && isOpen ? (
                        <div className="videoEmbed" style={{ marginTop: 8 }}>
                          <iframe
                            title={`${res.title}-inline`}
                            src={res.url.replace('watch?v=', 'embed/')}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                      ) : null}
                    </div>
                  )
                })
              ) : (
                <div className="notice">No resources yet.</div>
              )}
            </div>
          </div>

          <div className="section" aria-label="Quizzes">
            <div className="sectionHeader">
              <h3 className="sectionTitle">Quizzes</h3>
              <div className="sectionSubtitle">Attempt before the deadline. Timer starts when you begin.</div>
            </div>

            {quizError ? <div className="notice error">{quizError}</div> : null}

            {role === 'teacher' ? (
              <div className="card" style={{ marginBottom: 12 }}>
                <div className="cardTitle">{quizEditId ? 'Edit quiz' : 'Create quiz'}</div>
                <form className="form" onSubmit={addQuiz}>
                  <div className="field">
                    <label className="label" htmlFor="quizTitle">Title</label>
                    <input
                      id="quizTitle"
                      className="input"
                      value={quizForm.title}
                      onChange={(e) => setQuizField('title', e.target.value)}
                    />
                  </div>
                  <div className="field">
                    <label className="label" htmlFor="quizDeadline">Deadline</label>
                    <input
                      id="quizDeadline"
                      type="datetime-local"
                      className="input"
                      value={quizForm.deadline}
                      onChange={(e) => setQuizField('deadline', e.target.value)}
                    />
                  </div>
                  <div className="field">
                    <label className="label" htmlFor="quizDuration">Duration (minutes)</label>
                    <input
                      id="quizDuration"
                      className="input"
                      inputMode="numeric"
                      value={quizForm.durationMinutes}
                      onChange={(e) => setQuizField('durationMinutes', e.target.value)}
                    />
                  </div>

                  {quizForm.questions.map((q, idx) => (
                    <div className="card" key={idx} style={{ padding: 16, marginTop: 12 }}>
                      <div className="field">
                        <label className="label">Question {idx + 1}</label>
                        <input
                          className="input"
                          value={q.prompt}
                          onChange={(e) => setQuizQuestion(idx, { prompt: e.target.value })}
                        />
                      </div>
                      <div className="field">
                        <label className="label">Options</label>
                        {q.options.map((opt, oi) => (
                          <div key={oi} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                            <input
                              className="input"
                              value={opt}
                              onChange={(e) => setQuizOption(idx, oi, e.target.value)}
                              placeholder={`Option ${oi + 1}`}
                            />
                            <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <input
                                type="radio"
                                name={`correct-${idx}`}
                                checked={Number(q.correctOption) === oi}
                                onChange={() => setQuizQuestion(idx, { correctOption: oi })}
                              />
                              Correct
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  <div className="buttonRow" style={{ marginTop: 12 }}>
                    <button type="button" className="primary outline" onClick={addQuizQuestion}>
                      Add question
                    </button>
                    <button className="primary" type="submit" disabled={quizSaving}>
                      {quizSaving ? 'Saving…' : quizEditId ? 'Update quiz' : 'Create quiz'}
                    </button>
                    {quizEditId ? (
                      <button
                        type="button"
                        className="primary outline"
                        disabled={quizSaving}
                        onClick={() => {
                          setQuizEditId('')
                          setQuizForm({
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
              </div>
            ) : null}

            {quizMessage ? <div className="notice">{quizMessage}</div> : null}

            {activeQuiz ? (
              <div className="card" style={{ marginBottom: 12 }}>
                <div className="cardTitle">{activeQuiz.title}</div>
                <div className="pill" style={{ marginBottom: 12 }}>Time left: {formatTime(timeLeft)}</div>
                {(activeQuiz.questions || []).map((q, idx) => (
                  <div key={q._id || idx} style={{ marginBottom: 14 }}>
                    <div className="tileTitle" style={{ marginBottom: 6 }}>Q{idx + 1}. {q.prompt}</div>
                    <div className="buttonRow" style={{ gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      {(q.options || []).map((opt, oi) => (
                        <button
                          key={oi}
                          type="button"
                          className={Number(answers[q._id || idx]) === oi ? 'primary' : 'primary outline'}
                          onClick={() => selectAnswer(q._id || idx, oi)}
                        >
                          {opt || `Option ${oi + 1}`}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                <div className="buttonRow" style={{ marginTop: 12 }}>
                  <button className="primary" type="button" onClick={submitQuiz} disabled={timeLeft === 0}>
                    Submit quiz
                  </button>
                  <button className="primary outline" type="button" onClick={() => setActiveQuiz(null)}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : null}

            {resultModal.open ? (
              <div className="modalOverlay" role="dialog" aria-modal="true">
                <div className="modalCard">
                  <div className="cardTitle">{resultModal.title}</div>
                  <div className="tileText" style={{ marginTop: 8 }}>Score: {resultModal.score}</div>
                  <div className="tileText">Attempts used: {resultModal.attemptsUsed}/3</div>
                  <div className="modalActions">
                    <button className="primary" type="button" onClick={() => setResultModal({ open: false, title: '', score: '', attemptsUsed: 0 })}>
                      Close
                    </button>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="cardGrid">
              {quizzes?.length ? (
                quizzes.map((quiz) => {
                  const key = quiz._id || quiz.title
                  const used = attempts[key] || 0
                  const disabled = used >= 3 && role === 'student'
                  return (
                    <div className="tile" key={key}>
                      <div className="tileTitle">{quiz.title}</div>
                      <div className="tileText">
                        Duration: {quiz.durationMinutes || 20} min • Deadline: {quiz.deadline || '—'}
                      </div>
                      {role === 'student' ? (
                        <>
                          <div className="tileText" style={{ marginTop: 4 }}>Attempts used: {used}/3</div>
                          <div style={{ marginTop: 10 }}>
                            <button
                              className="primary"
                              type="button"
                              onClick={() => startQuiz(quiz)}
                              disabled={disabled}
                            >
                              {disabled ? 'Limit reached' : 'Start quiz'}
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="pill" style={{ marginTop: 8 }}>Teacher view</div>
                      )}
                      {role === 'teacher' ? (
                        <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          <button type="button" className="primary outline" onClick={() => startEditQuiz(quiz)}>
                            Edit
                          </button>
                          <button type="button" className="primary" onClick={() => deleteQuiz(quiz._id)}>
                            Delete
                          </button>
                        </div>
                      ) : null}
                    </div>
                  )
                })
              ) : (
                <div className="notice">No quizzes available.</div>
              )}
            </div>
          </div>

          <div className="buttonRow" style={{ marginTop: 16 }}>
            {role === 'student' ? (
              <button
                type="button"
                className={completed ? 'primary outline' : 'primary'}
                onClick={toggleComplete}
                disabled={loading || saving || !enrollment}
              >
                {saving
                  ? 'Saving…'
                  : !enrollment
                    ? 'Enroll to track progress'
                    : completed
                      ? 'Mark as incomplete'
                      : 'Mark as complete'}
              </button>
            ) : (
              <button type="button" className="primary outline" disabled>
                Teacher preview
              </button>
            )}
            {next ? (
              <Link className="primary" to={`/courses/${courseId}/lesson/${next._id}`}>
                Next lesson
              </Link>
            ) : (
              <Link className="primary" to={`/courses/${courseId}`}>
                Finish
              </Link>
            )}
          </div>

          <div className="lessonNav">
            {prev ? (
              <Link className="link" to={`/courses/${courseId}/lesson/${prev._id}`}>
                ← {prev.title}
              </Link>
            ) : (
              <span />
            )}
            {next ? (
              <Link className="link" to={`/courses/${courseId}/lesson/${next._id}`}>
                {next.title} →
              </Link>
            ) : (
              <span />
            )}
          </div>
        </div>
      </section>

      <section className="section" aria-label="Up next">
        <div className="sectionHeader">
          <h2 className="sectionTitle">All lessons</h2>
          <div className="sectionSubtitle">Jump to any lesson quickly.</div>
        </div>
        <div className="syllabus">
          {lessons.map((l, idx) => (
            <Link
              key={l._id}
              to={`/courses/${courseId}/lesson/${l._id}`}
              className={String(l._id) === String(lessonId) ? 'syllabusRow active' : 'syllabusRow'}
            >
              <div className="syllabusLeft">
                <div className="syllabusIndex">{idx + 1}</div>
                <div>
                  <div className="syllabusTitle">{l.title}</div>
                  <div className="syllabusSub">{l.duration}</div>
                </div>
              </div>
              <div className="syllabusRight">Open</div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
