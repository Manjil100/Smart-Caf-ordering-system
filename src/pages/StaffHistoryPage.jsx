import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { formatPrice, formatTime, STATUS_LABELS } from '../lib/format.js'

// Feature 5: past orders and basic sales information.
function StaffHistoryPage() {
  const [orders, setOrders] = useState([])
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    async function load() {
      // Last 30 days of orders, newest first.
      const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
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

  if (status === 'loading') return <p>Loading history…</p>
  if (status === 'error') return <p className="error">History couldn't be loaded.</p>

  // Sales per day: group the orders by date and add up their totals.
  const days = {}
  for (const order of orders) {
    const day = new Date(order.created_at).toLocaleDateString('en-NZ', { weekday: 'short', day: 'numeric', month: 'short' })
    days[day] = days[day] || { orders: 0, sales: 0 }
    days[day].orders += 1
    days[day].sales += Number(order.total)
  }
  const totalSales = orders.reduce((sum, o) => sum + Number(o.total), 0)
  const average = orders.length ? totalSales / orders.length : 0

  return (
    <>
      <h1>History and sales</h1>
      <p className="muted">The last 30 days.</p>

      <div className="stats">
        <div className="card"><p className="muted small">Orders</p><p className="stat">{orders.length}</p></div>
        <div className="card"><p className="muted small">Sales</p><p className="stat">{formatPrice(totalSales)}</p></div>
        <div className="card"><p className="muted small">Average order</p><p className="stat">{formatPrice(average)}</p></div>
      </div>

      <h2>By day</h2>
      <table>
        <thead><tr><th>Day</th><th>Orders</th><th>Sales</th></tr></thead>
        <tbody>
          {Object.entries(days).map(([day, d]) => (
            <tr key={day}><td>{day}</td><td>{d.orders}</td><td>{formatPrice(d.sales)}</td></tr>
          ))}
        </tbody>
      </table>

      <h2>All orders</h2>
      {orders.length === 0 ? <p>No orders yet.</p> : (
        <table>
          <thead><tr><th>#</th><th>Time</th><th>Name</th><th>Status</th><th>Total</th></tr></thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <td>{o.order_number}</td>
                <td>{new Date(o.created_at).toLocaleDateString('en-NZ')} {formatTime(o.created_at)}</td>
                <td>{o.customer_name}</td>
                <td>{STATUS_LABELS[o.status]}</td>
                <td>{formatPrice(o.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  )
}

export default StaffHistoryPage
