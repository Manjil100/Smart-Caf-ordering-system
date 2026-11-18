import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { formatPrice, formatTime, nextStatus, STATUS_LABELS } from '../lib/format.js'

// Feature 3: staff see active orders live and move each one to its next status.
function StaffDashboardPage() {
  const [orders, setOrders] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const loadOrders = useCallback(async () => {
    // RLS only lets staff read orders, so customers can never load this list.
    const { data, error: loadError } = await supabase
      .from('orders')
      .select('id, order_number, customer_name, status, total, created_at, order_items(quantity, menu_items(name))')
      .in('status', ['pending', 'preparing', 'ready'])
      .order('created_at')
    setLoading(false)
    if (loadError) {
      setError('Orders could not be loaded.')
      return
    }
    setError('')
    setOrders(data)
  }, [])

  useEffect(() => {
    loadOrders()
    // Reload when any order is added or changed.
    const channel = supabase
      .channel('staff-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => loadOrders())
      .subscribe()
    const timer = setInterval(loadOrders, 20000) // backup refresh
    return () => {
      supabase.removeChannel(channel)
      clearInterval(timer)
    }
  }, [loadOrders])

  async function moveOn(order) {
    const status = nextStatus(order.status)
    const { error: updateError } = await supabase.from('orders').update({ status }).eq('id', order.id)
    if (updateError) setError(`Order #${order.order_number} couldn't be updated.`)
    else loadOrders()
  }

  if (loading) return <p>Loading orders…</p>

  return (
    <>
      <h1>Orders</h1>
      {error && <p className="error" role="alert">{error}</p>}
      {orders.length === 0 && <p>No active orders right now. New orders appear here automatically.</p>}
      <div className="order-grid">
        {orders.map((order) => (
          <article key={order.id} className={`card order ${order.status}`}>
            <header className="order-head">
              <h2>#{order.order_number} {order.customer_name}</h2>
              <span className="tag">{STATUS_LABELS[order.status]}</span>
            </header>
            <p className="small muted">{formatTime(order.created_at)} · {formatPrice(order.total)}</p>
            <ul className="plain">
              {order.order_items.map((item, i) => (
                <li key={i}>{item.quantity} × {item.menu_items.name}</li>
              ))}
            </ul>
            <button type="button" onClick={() => moveOn(order)}>
              Mark as {STATUS_LABELS[nextStatus(order.status)].toLowerCase()}
            </button>
          </article>
        ))}
      </div>
    </>
  )
}

export default StaffDashboardPage
