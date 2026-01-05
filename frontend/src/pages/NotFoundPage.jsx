import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="page">
      <section className="card">
        <h1 className="title" style={{ marginTop: 0 }}>
          Page not found
        </h1>
        <p className="subtitle">The page you’re looking for doesn’t exist.</p>
        <div className="buttonRow">
          <Link className="primary" to="/">
            Go home
          </Link>
          <Link className="primary outline" to="/auth?role=student&mode=login">
            Login
          </Link>
        </div>
      </section>
    </div>
  )
}
