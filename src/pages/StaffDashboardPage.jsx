import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { formatPrice, formatTime, nextStatus, STATUS_ICONS, STATUS_LABELS } from '../lib/format.js'

// The three columns on the dashboard, one per active status.
const COLUMNS = [
  { status: 'pending', title: 'New' },
  { status: 'preparing', title: 'Preparing' },
  { status: 'ready', title: 'Ready to collect' },
]

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

  if (loading) return <p className="muted">Loading orders…</p>

  return (
    <>
      <h1>Orders</h1>
      {error && <p className="error" role="alert">{error}</p>}

      {/* Quick counts at the top */}
      <div className="stats">
        {COLUMNS.map((col) => (
          <div key={col.status} className={`stat-card ${col.status}`}>
            <span className="stat-icon" aria-hidden="true">{STATUS_ICONS[col.status]}</span>
            <span className="stat">{orders.filter((o) => o.status === col.status).length}</span>
            <span>{col.title}</span>
          </div>
        ))}
      </div>

      <div className="board">
        {COLUMNS.map((col) => {
          const inColumn = orders.filter((o) => o.status === col.status)
          return (
            <section key={col.status} className="column" aria-labelledby={`col-${col.status}`}>
              <h2 id={`col-${col.status}`}>{col.title} <span className="chip">{inColumn.length}</span></h2>
              {inColumn.length === 0 && <p className="muted small">Nothing here.</p>}
              {inColumn.map((order) => (
                <article key={order.id} className={`card order ${order.status}`}>
                  <header className="order-head">
                    <h3>#{order.order_number} {order.customer_name}</h3>
                    <span className="muted small">{formatTime(order.created_at)}</span>
                  </header>
                  <ul className="plain">
                    {order.order_items.map((item, i) => (
                      <li key={i}><strong>{item.quantity}×</strong> {item.menu_items.name}</li>
                    ))}
                  </ul>
                  <p className="small muted">{formatPrice(order.total)}</p>
                  <button type="button" className="wide" onClick={() => moveOn(order)}>
                    {STATUS_ICONS[nextStatus(order.status)]} Mark as {STATUS_LABELS[nextStatus(order.status)].toLowerCase()}
                  </button>
                </article>
              ))}
            </section>
          )
        })}
      </div>
      <p className="muted small">New orders appear here automatically.</p>
    </>
  )
}

export default StaffDashboardPage
