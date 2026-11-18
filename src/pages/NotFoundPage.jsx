import { Link } from 'react-router-dom'

function NotFoundPage() {
  return (
    <section className="empty card">
      <span className="empty-icon" aria-hidden="true">🤔</span>
      <h1>Page not found</h1>
      <p className="muted">That page doesn't exist.</p>
      <Link to="/" className="button">Go to the menu</Link>
    </section>
  )
}

export default NotFoundPage
