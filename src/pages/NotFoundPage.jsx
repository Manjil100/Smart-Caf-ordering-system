import { Link } from 'react-router-dom'

function NotFoundPage() {
  return (
    <>
      <h1>Page not found</h1>
      <p>That page doesn't exist.</p>
      <Link to="/" className="button">Go to the menu</Link>
    </>
  )
}

export default NotFoundPage
