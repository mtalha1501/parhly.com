import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { setAuth } from '../lib/auth.js'
import { api } from '../lib/api.js'

const ROLES = /** @type {const} */ (['student', 'teacher'])

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

export default function AuthPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()

  const initialRole = useMemo(() => {
    const role = String(searchParams.get('role') ?? '').toLowerCase()
    return ROLES.includes(role) ? role : 'student'
  }, [searchParams])

  const initialMode = useMemo(() => {
    const mode = String(searchParams.get('mode') ?? '').toLowerCase()
    return mode === 'register' ? 'register' : 'login'
  }, [searchParams])

  const initialEmail = useMemo(() => {
    const email = String(searchParams.get('email') ?? '').trim()
    return email
  }, [searchParams])

  const [role, setRole] = useState(initialRole)
  const [mode, setMode] = useState(initialMode) // 'login' | 'register'
  const [loading, setLoading] = useState(false)
  const [serverMessage, setServerMessage] = useState('')

  const [form, setForm] = useState(() => ({
    name: '',
    email: initialEmail,
    password: '',
    confirmPassword: '',
  }))

  const [errors, setErrors] = useState({})

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  useEffect(() => {
    setRole(initialRole)
    setMode(initialMode)
  }, [initialRole, initialMode])

  useEffect(() => {
    if (!initialEmail) return
    setForm((prev) => (prev.email ? prev : { ...prev, email: initialEmail }))
  }, [initialEmail])

  useEffect(() => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('role', role)
      next.set('mode', mode)
      return next
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, mode])

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function validate() {
    /** @type {Record<string, string>} */
    const nextErrors = {}

    if (mode === 'register') {
      if (!form.name.trim()) nextErrors.name = 'Name is required.'
    }

    if (!form.email.trim()) nextErrors.email = 'Email is required.'
    else if (!isValidEmail(form.email)) nextErrors.email = 'Enter a valid email.'

    if (!form.password) nextErrors.password = 'Password is required.'
    else if (form.password.length < 6) {
      nextErrors.password = 'Password must be at least 6 characters.'
    }

    if (mode === 'register') {
      if (!form.confirmPassword) {
        nextErrors.confirmPassword = 'Confirm your password.'
      } else if (form.confirmPassword !== form.password) {
        nextErrors.confirmPassword = 'Passwords do not match.'
      }
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  async function onSubmit(e) {
    e.preventDefault()
    setServerMessage('')

    if (!validate()) return

    setLoading(true)
    try {
      const payload = {
        email: form.email.trim(),
        password: form.password,
      }

      const response =
        mode === 'register'
          ? await api.post('/auth/register', {
              ...payload,
              role,
              name: form.name.trim(),
            })
          : await api.post('/auth/login', payload)

      const { user, token } = response.data || {}
      if (!user?.role || !token) {
        throw new Error('Invalid server response')
      }

      // If user selected a role on login, we can keep UX consistent by syncing it.
      // The server remains the source of truth.
      setRole(user.role)

      setAuth({ user, token, ts: Date.now() })
      setServerMessage('Success. Redirecting…')
      navigate('/dashboard', { replace: true })
    } catch (err) {
      const message =
        err?.response?.data?.message || err?.message || 'Login failed'
      setServerMessage(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page">
      <div className="authGrid">
        <aside className="authAside" aria-label="About">
          <div className="authAsideInner">
            <div className="pill">Secure access</div>
            <h1 className="authTitle">{mode === 'login' ? 'Sign in to continue' : 'Create your account'}</h1>
            <p className="authSubtitle">
              {role === 'teacher'
                ? 'Publish courses, organize lessons, and reach your learners.'
                : 'Enroll, learn faster, and keep your progress synced.'}
            </p>
            <Link className="link" to="/">
              ← Back to Home
            </Link>
          </div>
        </aside>

        <section className="card authCard">
          <div className="cardHeader">
            <div>
              <div className="cardKicker">{role === 'teacher' ? 'Teacher' : 'Student'}</div>
              <div className="cardTitleLg">{mode === 'login' ? 'Login' : 'Register'}</div>
            </div>
          </div>

          <div className="segmented" role="tablist" aria-label="Role">
            <button
              type="button"
              className={role === 'student' ? 'segmentedBtn active' : 'segmentedBtn'}
              onClick={() => setRole('student')}
            >
              Student
            </button>
            <button
              type="button"
              className={role === 'teacher' ? 'segmentedBtn active' : 'segmentedBtn'}
              onClick={() => setRole('teacher')}
            >
              Teacher
            </button>
          </div>

          <div className="segmented" role="tablist" aria-label="Auth Mode">
            <button
              type="button"
              className={mode === 'login' ? 'segmentedBtn active' : 'segmentedBtn'}
              onClick={() => setMode('login')}
            >
              Login
            </button>
            <button
              type="button"
              className={mode === 'register' ? 'segmentedBtn active' : 'segmentedBtn'}
              onClick={() => setMode('register')}
            >
              Register
            </button>
          </div>

          <form className="form" onSubmit={onSubmit}>
          {mode === 'register' && (
            <div className="field">
              <label className="label" htmlFor="name">
                Full name
              </label>
              <input
                id="name"
                className={errors.name ? 'input error' : 'input'}
                value={form.name}
                onChange={(e) => updateField('name', e.target.value)}
                autoComplete="name"
              />
              {errors.name ? <div className="errorText">{errors.name}</div> : null}
            </div>
          )}

          <div className="field">
            <label className="label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              className={errors.email ? 'input error' : 'input'}
              value={form.email}
              onChange={(e) => updateField('email', e.target.value)}
              autoComplete="email"
              inputMode="email"
            />
            {errors.email ? <div className="errorText">{errors.email}</div> : null}
          </div>

          <div className="field">
            <label className="label" htmlFor="password">
              Password
            </label>
            <div className="inputWrap">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className={errors.password ? 'input inputWithAction error' : 'input inputWithAction'}
                value={form.password}
                onChange={(e) => updateField('password', e.target.value)}
                autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
              />
              <button
                type="button"
                className="inputAction"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                  {showPassword ? (
                    <path
                      fill="currentColor"
                      d="M12 5c-5 0-9.27 3.11-11 7.5C2.73 16.89 7 20 12 20s9.27-3.11 11-7.5C21.27 8.11 17 5 12 5Zm0 12c-2.49 0-4.5-2.01-4.5-4.5S9.51 8 12 8s4.5 2.01 4.5 4.5S14.49 17 12 17Zm0-2.2a2.3 2.3 0 1 0 0-4.6 2.3 2.3 0 0 0 0 4.6Z"
                    />
                  ) : (
                    <path
                      fill="currentColor"
                      d="M3.53 2.47a.75.75 0 0 0-1.06 1.06l2.02 2.02C2.88 6.83 1.65 8.58 1 10.5 2.73 14.89 7 18 12 18c1.55 0 3.03-.28 4.39-.8l2.08 2.08a.75.75 0 1 0 1.06-1.06l-16.08-16.08ZM12 16.5c-3.98 0-7.45-2.33-9-6  .6-1.43 1.56-2.77 2.8-3.86l2.02 2.02A4.49 4.49 0 0 0 7.5 12c0 2.49 2.01 4.5 4.5 4.5.9 0 1.74-.26 2.45-.72l1.38 1.38c-.58.22-1.2.34-1.83.34Zm3.35-2.21-1.52-1.52c.1-.24.17-.5.17-.77A2 2 0 0 0 12 10c-.27 0-.53.06-.77.17L9.71 8.65c.67-.42 1.47-.65 2.29-.65 2.49 0 4.5 2.01 4.5 4.5 0 .82-.23 1.62-.65 2.29Zm2.18 2.18-1.06-1.06c1.46-1.03 2.65-2.43 3.53-4.01-1.55-3.67-5.02-6-9-6-.95 0-1.88.13-2.75.39L7.09 4.62A11.7 11.7 0 0 1 12 4c5 0 9.27 3.11 11 7.5-.86 2.17-2.28 3.98-4.47 4.97Z"
                    />
                  )}
                </svg>
              </button>
            </div>
            {errors.password ? (
              <div className="errorText">{errors.password}</div>
            ) : null}
          </div>

          {mode === 'register' && (
            <div className="field">
              <label className="label" htmlFor="confirmPassword">
                Confirm password
              </label>
              <div className="inputWrap">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  className={
                    errors.confirmPassword
                      ? 'input inputWithAction error'
                      : 'input inputWithAction'
                  }
                  value={form.confirmPassword}
                  onChange={(e) => updateField('confirmPassword', e.target.value)}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="inputAction"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  title={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                    {showConfirmPassword ? (
                      <path
                        fill="currentColor"
                        d="M12 5c-5 0-9.27 3.11-11 7.5C2.73 16.89 7 20 12 20s9.27-3.11 11-7.5C21.27 8.11 17 5 12 5Zm0 12c-2.49 0-4.5-2.01-4.5-4.5S9.51 8 12 8s4.5 2.01 4.5 4.5S14.49 17 12 17Zm0-2.2a2.3 2.3 0 1 0 0-4.6 2.3 2.3 0 0 0 0 4.6Z"
                      />
                    ) : (
                      <path
                        fill="currentColor"
                        d="M3.53 2.47a.75.75 0 0 0-1.06 1.06l2.02 2.02C2.88 6.83 1.65 8.58 1 10.5 2.73 14.89 7 18 12 18c1.55 0 3.03-.28 4.39-.8l2.08 2.08a.75.75 0 1 0 1.06-1.06l-16.08-16.08ZM12 16.5c-3.98 0-7.45-2.33-9-6 .6-1.43 1.56-2.77 2.8-3.86l2.02 2.02A4.49 4.49 0 0 0 7.5 12c0 2.49 2.01 4.5 4.5 4.5.9 0 1.74-.26 2.45-.72l1.38 1.38c-.58.22-1.2.34-1.83.34Zm3.35-2.21-1.52-1.52c.1-.24.17-.5.17-.77A2 2 0 0 0 12 10c-.27 0-.53.06-.77.17L9.71 8.65c.67-.42 1.47-.65 2.29-.65 2.49 0 4.5 2.01 4.5 4.5 0 .82-.23 1.62-.65 2.29Zm2.18 2.18-1.06-1.06c1.46-1.03 2.65-2.43 3.53-4.01-1.55-3.67-5.02-6-9-6-.95 0-1.88.13-2.75.39L7.09 4.62A11.7 11.7 0 0 1 12 4c5 0 9.27 3.11 11 7.5-.86 2.17-2.28 3.98-4.47 4.97Z"
                      />
                    )}
                  </svg>
                </button>
              </div>
              {errors.confirmPassword ? (
                <div className="errorText">{errors.confirmPassword}</div>
              ) : null}
            </div>
          )}

          <button className="primary" type="submit" disabled={loading}>
            {loading
              ? 'Please wait...'
              : mode === 'login'
                ? 'Login'
                : 'Create account'}
          </button>

          {serverMessage ? <div className="notice">{serverMessage}</div> : null}
          </form>
        </section>
      </div>
    </div>
  )
}
