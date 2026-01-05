import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import heroGirl from '../assets/hero-girl.svg'

const ICONS = {
  react: 'https://cdn.jsdelivr.net/npm/simple-icons@v13/icons/react.svg',
  node: 'https://cdn.jsdelivr.net/npm/simple-icons@v13/icons/nodedotjs.svg',
  mongo: 'https://cdn.jsdelivr.net/npm/simple-icons@v13/icons/mongodb.svg',
  secure: 'https://cdn.jsdelivr.net/npm/simple-icons@v13/icons/shield.svg',
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

export default function EntryPage() {
  const navigate = useNavigate()
  const getStartedRef = useRef(null)

  const [role, setRole] = useState('student')
  const [mode, setMode] = useState('register')
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState('')

  function scrollToGetStarted() {
    getStartedRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function continueToAuth() {
    const trimmed = email.trim()
    if (!trimmed) {
      setEmailError('Email is required to get started.')
      return
    }
    if (!isValidEmail(trimmed)) {
      setEmailError('Enter a valid email address.')
      return
    }

    setEmailError('')
    navigate(
      `/auth?role=${encodeURIComponent(role)}&mode=${encodeURIComponent(mode)}&email=${encodeURIComponent(trimmed)}`
    )
  }

  return (
    <div className="page homePage hasFloatingBg">
      <div className="floatingBg floatingBg--home" aria-hidden="true">
        <span style={{ top: '4%', left: '10%' }} />
        <span className="star-secondary" style={{ top: '12%', left: '32%' }} />
        <span className="star-tertiary" style={{ top: '8%', left: '70%' }} />
        <span className="star-glow" style={{ top: '14%', left: '86%' }} />
        <span style={{ top: '26%', left: '18%' }} />
        <span className="star-secondary" style={{ top: '30%', left: '54%' }} />
        <span className="star-tertiary" style={{ top: '34%', left: '78%' }} />
        <span className="star-glow" style={{ top: '40%', left: '12%' }} />
        <span style={{ top: '48%', left: '46%' }} />
        <span className="star-secondary" style={{ top: '52%', left: '82%' }} />
        <span className="star-tertiary" style={{ top: '62%', left: '26%' }} />
        <span className="star-glow" style={{ top: '68%', left: '58%' }} />
        <span style={{ top: '74%', left: '14%' }} />
        <span className="star-secondary" style={{ top: '80%', left: '44%' }} />
        <span className="star-tertiary" style={{ top: '84%', left: '72%' }} />
        <span className="star-glow" style={{ top: '90%', left: '22%' }} />
        <span style={{ top: '92%', left: '60%' }} />
      </div>
      <section className="hero">
        <div className="floatingBg floatingBg--hero" aria-hidden="true">
          <span style={{ top: '-6%', left: '-4%' }} />
          <span className="star-secondary" style={{ top: '8%', left: '18%' }} />
          <span className="star-tertiary" style={{ top: '2%', left: '54%' }} />
          <span className="star-glow" style={{ top: '14%', left: '82%' }} />
          <span style={{ top: '32%', left: '6%' }} />
          <span className="star-secondary" style={{ top: '40%', left: '48%' }} />
          <span className="star-tertiary" style={{ top: '44%', left: '80%' }} />
          <span className="star-glow" style={{ top: '64%', left: '18%' }} />
          <span style={{ top: '72%', left: '46%' }} />
          <span className="star-secondary" style={{ top: '82%', left: '74%' }} />
        </div>
        <div className="heroGrid">
          <div>
            <div className="pill">Modern E‑Learning</div>
            <h1 className="heroTitle">Work together. Learn together.</h1>
            <p className="heroSubtitle">
              A clean experience for teachers to publish and students to
              enroll, with fast access to courses, lessons, and progress.
            </p>

            <div className="buttonRow" style={{ marginTop: 18, gap: 12 }}>
              <button type="button" className="primary" onClick={scrollToGetStarted}>
                Get started
              </button>
            </div>

            <div className="iconStrip" aria-label="Highlights" style={{ marginTop: 18 }}>
              <span className="iconPill">Secure access</span>
              <span className="iconPill">Courses</span>
              <span className="iconPill">Progress</span>
            </div>
          </div>

          <div className="heroPanel" aria-hidden="true">
            <div className="heroPanelBody">
              <img className="heroIllustration" src={heroGirl} alt="Productivity illustration" />
            </div>
          </div>
        </div>
      </section>

      <section className="featureGrid" aria-label="Highlights">
        <div className="featureCard">
          <div className="featureTitle">Role-based access</div>
          <div className="featureText">
            Students and teachers get the right experience with protected routes.
          </div>
        </div>
        <div className="featureCard">
          <div className="featureTitle">Courses & enrollment</div>
          <div className="featureText">
            Teachers create courses; students enroll and follow structured content.
          </div>
        </div>
        <div className="featureCard">
          <div className="featureTitle">Progress tracking</div>
          <div className="featureText">
            Track learning progress and keep momentum across lessons.
          </div>
        </div>
      </section>

      <section className="section" aria-label="Browse">
        <div className="sectionHeader">
          <h2 className="sectionTitle">Popular learning paths</h2>
          <div className="sectionSubtitle">A clean structure, just like big platforms.</div>
        </div>

        <div className="cardGrid">
          <Link className="tile" to="/auth?role=student&mode=register">
            <div className="tileTitle">Web Development</div>
            <div className="tileText">React, Node.js, APIs, deployment</div>
          </Link>
          <Link className="tile" to="/auth?role=student&mode=register">
            <div className="tileTitle">Databases</div>
            <div className="tileText">MongoDB schema design & queries</div>
          </Link>
          <Link className="tile" to="/auth?role=student&mode=register">
            <div className="tileTitle">UI/UX Foundations</div>
            <div className="tileText">Layouts, forms, accessibility</div>
          </Link>
          <Link className="tile" to="/auth?role=student&mode=register">
            <div className="tileTitle">Productivity</div>
            <div className="tileText">Project planning & teamwork</div>
          </Link>
          <Link className="tile" to="/auth?role=student&mode=register">
            <div className="tileTitle">Security Basics</div>
            <div className="tileText">Auth, roles, protected routes</div>
          </Link>
          <Link className="tile" to="/auth?role=student&mode=register">
            <div className="tileTitle">Career Prep</div>
            <div className="tileText">Portfolios, resumes, interviews</div>
          </Link>
        </div>
      </section>

      <section className="section" aria-label="How it works">
        <div className="sectionHeader">
          <h2 className="sectionTitle">How it works</h2>
          <div className="sectionSubtitle">A simple flow for students and teachers.</div>
        </div>
        <div className="howGrid">
          <div className="howCard">
            <div className="howNum">1</div>
            <div className="howTitle">Choose your role</div>
            <div className="howText">Student for learning, Teacher for course creation.</div>
          </div>
          <div className="howCard">
            <div className="howNum">2</div>
            <div className="howTitle">Create an account</div>
            <div className="howText">Register once, then login anytime.</div>
          </div>
          <div className="howCard">
            <div className="howNum">3</div>
            <div className="howTitle">Start learning/teaching</div>
            <div className="howText">Access courses, materials, and progress tracking.</div>
          </div>
        </div>
      </section>

      <section className="section" aria-label="Get started" ref={getStartedRef}>
        <div className="getStartedCard">
          <div className="getStartedHeader">
            <div>
              <div className="pill">Get started in seconds</div>
              <div className="getStartedTitle">Tell us a bit about you</div>
              <div className="getStartedSubtitle">We’ll take you to the right signup page.</div>
            </div>
            <button type="button" className="primary outline" onClick={scrollToGetStarted}>
              Jump here
            </button>
          </div>

          <div className="stepGrid">
            <div className="stepCard">
              <div className="stepLabel">Step 1</div>
              <div className="stepTitle">Role</div>
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
            </div>

            <div className="stepCard">
              <div className="stepLabel">Step 2</div>
              <div className="stepTitle">Account</div>
              <div className="segmented" role="tablist" aria-label="Auth mode">
                <button
                  type="button"
                  className={mode === 'register' ? 'segmentedBtn active' : 'segmentedBtn'}
                  onClick={() => setMode('register')}
                >
                  Register
                </button>
                <button
                  type="button"
                  className={mode === 'login' ? 'segmentedBtn active' : 'segmentedBtn'}
                  onClick={() => setMode('login')}
                >
                  Login
                </button>
              </div>
            </div>

            <div className="stepCard">
              <div className="stepLabel">Step 3</div>
              <div className="stepTitle">Email</div>
              <div className="field" style={{ marginTop: 8 }}>
                <label className="label" htmlFor="getStartedEmail">
                  Email address
                </label>
                <input
                  id="getStartedEmail"
                  className={emailError ? 'input error' : 'input'}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (emailError) setEmailError('')
                  }}
                  placeholder="you@example.com"
                  inputMode="email"
                  autoComplete="email"
                />
                {emailError ? <div className="errorText">{emailError}</div> : null}
              </div>

              <button type="button" className="primary" onClick={continueToAuth}>
                Continue
              </button>
              <div className="tinyNote">
                By continuing, you’ll be redirected to the auth page.
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
