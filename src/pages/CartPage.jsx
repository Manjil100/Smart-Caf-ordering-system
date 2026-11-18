import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { formatPrice } from '../lib/format.js'
import { useCart } from '../context/CartContext.jsx'

// Feature 2: check the cart, enter a name and place the order. Payment is at the counter.
function CartPage() {
  const { items, total, changeQuantity, clearCart } = useCart()
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
      <>
        <h1>Your cart</h1>
        <p>Your cart is empty.</p>
        <Link to="/" className="button">Browse the menu</Link>
      </>
    )
  }

  return (
    <>
      <h1>Your cart</h1>
      <ul className="cart-list">
        {items.map((line) => (
          <li key={line.id} className="cart-line">
            <span className="cart-name">{line.name}</span>
            <div className="qty" aria-label={`Quantity of ${line.name}`}>
              <button type="button" onClick={() => changeQuantity(line.id, line.quantity - 1)} aria-label={`One less ${line.name}`}>−</button>
              <span>{line.quantity}</span>
              <button type="button" onClick={() => changeQuantity(line.id, line.quantity + 1)} aria-label={`One more ${line.name}`}>+</button>
            </div>
            <span className="price">{formatPrice(line.price * line.quantity)}</span>
          </li>
        ))}
      </ul>
      <p className="total">Total <strong>{formatPrice(total)}</strong></p>

      <form onSubmit={placeOrder} className="card" noValidate>
        <label htmlFor="name">Your name</label>
        <input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={40}
          autoComplete="given-name"
          aria-invalid={Boolean(error) && !name.trim()}
        />
        <p className="small muted">You pay at the counter when you collect your order.</p>
        {error && <p className="error" role="alert">{error}</p>}
        <button type="submit" disabled={sending}>{sending ? 'Placing order…' : 'Place order'}</button>
      </form>
    </>
  )
}

export default CartPage
