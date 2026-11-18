import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { formatPrice, formatTime, STATUS_LABELS, STATUS_STEPS } from '../lib/format.js'

// Feature 4: the customer watches their order's status change live.
function OrderStatusPage() {
  const { orderId } = useParams()
  const [order, setOrder] = useState(null)
  const [status, setStatus] = useState('loading') // 'loading' | 'error' | 'notfound' | 'ready'

  const loadOrder = useCallback(async () => {
    const { data, error } = await supabase.rpc('get_order_status', { p_order_id: orderId })
    if (error) {
      // An id that isn't a real UUID is treated the same as an order that doesn't exist.
      setStatus(error.code === '22P02' ? 'notfound' : 'error')
      return
    }
    if (!data) {
      setStatus('notfound')
      return
    }
    setOrder(data)
    setStatus('ready')
  }, [orderId])

  useEffect(() => {
    loadOrder()

    // Live updates: the database sends a message on a channel named after this order
    // whenever staff change its status. Only someone with this link knows the id.
    const channel = supabase
      .channel(`order:${orderId}`)
      .on('broadcast', { event: 'status_changed' }, () => loadOrder())
      .subscribe()

    // Backup: check again every 20 seconds in case a live message is missed.
    const timer = setInterval(loadOrder, 20000)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(timer)
    }
  }, [orderId, loadOrder])

  if (status === 'loading') return <p>Loading your order…</p>
  if (status === 'notfound') return <p>We couldn't find that order. Check the link and try again.</p>
  if (status === 'error') return <p className="error">Something went wrong. Please refresh the page.</p>

  const currentStep = STATUS_STEPS.indexOf(order.status)

  return (
    <>
      <h1>Order #{order.order_number}</h1>
      <p>Thanks, {order.customer_name}. Placed at {formatTime(order.created_at)}. Keep this page open, it updates by itself.</p>

      <ol className="steps" aria-label="Order progress">
        {STATUS_STEPS.map((step, i) => (
          <li key={step} className={i < currentStep ? 'done' : i === currentStep ? 'current' : ''} aria-current={i === currentStep ? 'step' : undefined}>
            {STATUS_LABELS[step]}
          </li>
        ))}
      </ol>
      <p className="status-now" role="status">{STATUS_LABELS[order.status]}</p>

      <div className="card">
        <h2>Your order</h2>
        <ul className="plain">
          {order.items.map((item, i) => (
            <li key={i}>{item.quantity} × {item.name} <span className="muted">{formatPrice(item.unit_price * item.quantity)}</span></li>
          ))}
        </ul>
        <p className="total">Total <strong>{formatPrice(order.total)}</strong>, pay at the counter</p>
      </div>
      <Link to="/">Back to the menu</Link>
    </>
  )
}

export default OrderStatusPage
