import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { formatPrice } from '../lib/format.js'
import { useCart } from '../context/CartContext.jsx'

// Feature 2: check the cart, enter a name and place the order. Payment is at the counter.
function CartPage() {
  const { items, count, total, changeQuantity, clearCart } = useCart()
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)
  const navigate = useNavigate()

  async function placeOrder(event) {
    event.preventDefault()
    if (!name.trim()) {
      setError('Please enter your name so we can call you when it is ready.')
      return
    }
    setSending(true)
    setError('')

    // Only dish ids and quantities are sent. The database looks up the real prices.
    const { data, error: rpcError } = await supabase.rpc('place_order', {
      p_customer_name: name.trim(),
      p_items: items.map((line) => ({ menu_item_id: line.id, quantity: line.quantity })),
    })

    setSending(false)
    if (rpcError) {
      setError(rpcError.message || 'Your order could not be placed. Please try again.')
      return
    }
    clearCart()
    navigate(`/order/${data.order_id}`)
  }

  if (items.length === 0) {
    return (
      <section className="empty card">
        <span className="empty-icon" aria-hidden="true">🛒</span>
        <h1>Your cart is empty</h1>
        <p className="muted">Have a look at the menu and add something you like.</p>
        <Link to="/" className="button">Browse the menu</Link>
      </section>
    )
  }

  return (
    <>
      <h1>Your cart</h1>
      <div className="checkout">
        <ul className="cart-list card">
          {items.map((line) => (
            <li key={line.id} className="cart-line">
              <div>
                <p className="cart-name">{line.name}</p>
                <p className="muted small">{formatPrice(line.price)} each</p>
              </div>
              <div className="qty" aria-label={`Quantity of ${line.name}`}>
                <button type="button" onClick={() => changeQuantity(line.id, line.quantity - 1)} aria-label={`One less ${line.name}`}>−</button>
                <span>{line.quantity}</span>
                <button type="button" onClick={() => changeQuantity(line.id, line.quantity + 1)} aria-label={`One more ${line.name}`}>+</button>
              </div>
              <span className="price">{formatPrice(line.price * line.quantity)}</span>
            </li>
          ))}
        </ul>

        <form onSubmit={placeOrder} className="card summary" noValidate>
          <h2>Order summary</h2>
          <p className="summary-row"><span>{count} {count === 1 ? 'item' : 'items'}</span><strong>{formatPrice(total)}</strong></p>
          <label htmlFor="name">Your name</label>
          <input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={40}
            autoComplete="given-name"
            placeholder="So we can call you"
            aria-invalid={Boolean(error) && !name.trim()}
          />
          {error && <p className="error" role="alert">{error}</p>}
          <button type="submit" className="wide" disabled={sending}>{sending ? 'Placing order…' : `Place order · ${formatPrice(total)}`}</button>
          <p className="small muted center">💳 You pay at the counter when you collect.</p>
        </form>
      </div>
    </>
  )
}

export default CartPage
