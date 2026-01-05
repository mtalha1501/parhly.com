import { NavLink, useNavigate } from 'react-router-dom'
import { clearAuth, getAuth } from '../lib/auth.js'

export default function SiteLayout({ children }) {
  const navigate = useNavigate()
  const auth = getAuth()
  const isLoggedIn = Boolean(auth?.token && auth?.user?.role)

  function logout() {
    clearAuth()
    navigate('/', { replace: true })
  }

  return (
    <div className="site">
      <a className="skipLink" href="#main">
        Skip to content
      </a>

      <header className="siteHeader">
        <div className="container headerInner">
          <div className="brand">
            <div className="brandMark" aria-hidden="true">
              <svg
                className="brandLogo"
                viewBox="0 0 24 24"
                role="img"
                aria-label="Parhly logo"
                style={{ color: 'var(--text)' }}
              >
                <path
                  fill="currentColor"
                  d="M6 5.5c-1.1 0-2 .9-2 2v10c0 .55.45 1 1 1h6.25c.66 0 1.29.26 1.76.74l.24.24.24-.24c.47-.48 1.1-.74 1.76-.74H19c.55 0 1-.45 1-1v-10c0-1.1-.9-2-2-2h-4.25c-.66 0-1.29.26-1.76.74L12 6.48l-.24-.24c-.47-.48-1.1-.74-1.76-.74H6Zm4.99 2c.64 0 1.16.52 1.16 1.16v6.7l1.77-.93c.57-.3 1.25.12 1.25.77 0 .3-.17.58-.44.72l-3.8 2a.83.83 0 0 1-.38.1.86.86 0 0 1-.86-.86V8.66c0-.64.52-1.16 1.16-1.16Z"
                />
              </svg>
            </div>
            <div className="brandText">
              <div className="brandName">Parhly.com</div>
              <div className="brandTag">Learn • Teach • Track progress</div>
            </div>
          </div>

          <nav className="nav" aria-label="Primary">
            {!isLoggedIn ? (
              <NavLink to="/" end className={({ isActive }) => (isActive ? 'navLink active' : 'navLink')}>
                Home
              </NavLink>
            ) : null}
            <NavLink to="/courses" className={({ isActive }) => (isActive ? 'navLink active' : 'navLink')}>
              Courses
            </NavLink>
            {isLoggedIn ? (
              <NavLink to="/dashboard" className={({ isActive }) => (isActive ? 'navLink active' : 'navLink')}>
                Dashboard
              </NavLink>
            ) : null}
            {!isLoggedIn && (
              <NavLink
                to="/auth?role=student&mode=login"
                className={({ isActive }) => (isActive ? 'navLink active' : 'navLink')}
              >
                Login
              </NavLink>
            )}
            {!isLoggedIn && (
              <NavLink
                to="/auth?role=student&mode=register"
                className={({ isActive }) => (isActive ? 'navLink active' : 'navLink')}
              >
                Sign up
              </NavLink>
            )}
            {isLoggedIn ? (
              <button type="button" className="navAction" onClick={logout}>
                Logout
              </button>
            ) : null}
          </nav>
        </div>
      </header>

      <main id="main" className="siteMain">
        {children}
      </main>

      <footer className="siteFooter">
        <div className="container footerInner">
          <div className="footerText">
            © {new Date().getFullYear()} Parhly.com
          </div>
          <div className="footerText">WT • MERN Assignment</div>
        </div>
      </footer>
    </div>
  )
}
