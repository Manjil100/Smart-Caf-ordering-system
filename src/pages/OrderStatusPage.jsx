import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { formatPrice, formatTime, STATUS_ICONS, STATUS_LABELS, STATUS_STEPS } from '../lib/format.js'

// A short message for each stage, shown under the tracker.
const STATUS_MESSAGES = {
  pending: 'We’ve got your order and it’s next in line.',
  preparing: 'Our team is making your order now.',
  ready: 'Your order is ready! Come to the counter to collect it.',
  completed: 'Enjoy! Thanks for ordering with us.',
}

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

  if (status === 'loading') return <p className="muted">Loading your order…</p>
  if (status === 'notfound') return <p>We couldn't find that order. Check the link and try again.</p>
  if (status === 'error') return <p className="error">Something went wrong. Please refresh the page.</p>

  const currentStep = STATUS_STEPS.indexOf(order.status)
  const percent = (currentStep / (STATUS_STEPS.length - 1)) * 100

  return (
    <div className="tracker-page">
      <section className={`card status-hero ${order.status}`} role="status">
        <span className="status-icon" aria-hidden="true">{STATUS_ICONS[order.status]}</span>
        <p className="eyebrow">Order #{order.order_number}</p>
        <h1>{STATUS_LABELS[order.status]}</h1>
        <p>{STATUS_MESSAGES[order.status]}</p>
      </section>

      <section className="card">
        <div className="progress" aria-hidden="true"><span style={{ width: `${percent}%` }} /></div>
        <ol className="steps" aria-label="Order progress">
          {STATUS_STEPS.map((step, i) => (
            <li key={step} className={i < currentStep ? 'done' : i === currentStep ? 'current' : ''} aria-current={i === currentStep ? 'step' : undefined}>
              <span className="step-icon" aria-hidden="true">{STATUS_ICONS[step]}</span>
              {STATUS_LABELS[step]}
            </li>
          ))}
        </ol>
        <p className="small muted center">This page updates by itself. Keep it open.</p>
      </section>

      <section className="card">
        <h2>Your order</h2>
        <p className="muted small">For {order.customer_name}, placed at {formatTime(order.created_at)}</p>
        <ul className="receipt">
          {order.items.map((item, i) => (
            <li key={i}><span>{item.quantity} × {item.name}</span><span>{formatPrice(item.unit_price * item.quantity)}</span></li>
          ))}
        </ul>
        <p className="summary-row total"><span>Total, pay at the counter</span><strong>{formatPrice(order.total)}</strong></p>
      </section>
      <Link to="/">← Back to the menu</Link>
    </div>
  )
}

export default OrderStatusPage
