import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { formatPrice, formatTime, STATUS_LABELS } from '../lib/format.js'

// Feature 5: past orders and basic sales information.
function StaffHistoryPage() {
  const [orders, setOrders] = useState([])
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    async function load() {
      // Last 7 days of orders, newest first.
      const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      const { data, error } = await supabase
        .from('orders')
        .select('id, order_number, customer_name, status, total, created_at')
        .gte('created_at', since)
        .order('created_at', { ascending: false })
      if (error) {
        setStatus('error')
        return
      }
      setOrders(data)
      setStatus('ready')
    }
    load()
  }, [])

  if (status === 'loading') return <p className="muted">Loading history…</p>
  if (status === 'error') return <p className="error">History couldn't be loaded.</p>

  // Build the last 7 days (including days with no orders), oldest first, for the chart.
  const days = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push({ key: d.toDateString(), label: d.toLocaleDateString('en-NZ', { weekday: 'short' }), orders: 0, sales: 0 })
  }
  for (const order of orders) {
    const day = days.find((d) => d.key === new Date(order.created_at).toDateString())
    if (day) {
      day.orders += 1
      day.sales += Number(order.total)
    }
  }
  const totalSales = orders.reduce((sum, o) => sum + Number(o.total), 0)
  const average = orders.length ? totalSales / orders.length : 0
  const best = Math.max(...days.map((d) => d.sales), 1) // tallest bar, so the others scale to it

  return (
    <>
      <h1>History and sales</h1>
      <p className="muted">The last 7 days.</p>

      <div className="stats">
        <div className="stat-card ready"><span className="stat-icon" aria-hidden="true">🧾</span><span className="stat">{orders.length}</span><span>Orders</span></div>
        <div className="stat-card preparing"><span className="stat-icon" aria-hidden="true">💰</span><span className="stat">{formatPrice(totalSales)}</span><span>Sales</span></div>
        <div className="stat-card pending"><span className="stat-icon" aria-hidden="true">📊</span><span className="stat">{formatPrice(average)}</span><span>Average order</span></div>
      </div>

      <section className="card">
        <h2>Sales per day</h2>
        <div className="chart" role="img" aria-label={days.map((d) => `${d.label} ${formatPrice(d.sales)}`).join(', ')}>
          {days.map((d) => (
            <div key={d.key} className="bar-col">
              <span className="bar-value">{d.sales > 0 ? formatPrice(d.sales) : ''}</span>
              <span className="bar" style={{ height: `${(d.sales / best) * 100}%` }} />
              <span className="bar-label">{d.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <h2>All orders</h2>
        {orders.length === 0 ? <p className="muted">No orders yet.</p> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>#</th><th>When</th><th>Name</th><th>Status</th><th>Total</th></tr></thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td>{o.order_number}</td>
                    <td>{new Date(o.created_at).toLocaleDateString('en-NZ', { day: 'numeric', month: 'short' })} {formatTime(o.created_at)}</td>
                    <td>{o.customer_name}</td>
                    <td><span className={`chip ${o.status}`}>{STATUS_LABELS[o.status]}</span></td>
                    <td>{formatPrice(o.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  )
}

export default StaffHistoryPage
