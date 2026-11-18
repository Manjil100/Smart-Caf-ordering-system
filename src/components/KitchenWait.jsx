import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'

// Shows roughly how long the kitchen is taking right now.
// get_kitchen_wait only returns numbers, never anyone's order details.
function KitchenWait() {
  const [wait, setWait] = useState(null)

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase.rpc('get_kitchen_wait')
      if (!error) setWait(data)
    }
    load()
    const timer = setInterval(load, 30000) // refresh every 30 seconds
    return () => clearInterval(timer)
  }, [])

  if (!wait) return null

  const quiet = wait.active_orders === 0
  return (
    <div className={`wait ${quiet ? 'quiet' : 'busy'}`} role="status">
      <span className="wait-number">{quiet ? '0' : wait.queue_minutes}</span>
      <span>
        <strong>{quiet ? 'No queue right now' : `About ${wait.queue_minutes} min wait`}</strong>
        <br />
        <span className="muted small">
          {quiet ? 'Orders are usually ready in a few minutes.' : `${wait.active_orders} ${wait.active_orders === 1 ? 'order' : 'orders'} ahead of you`}
        </span>
      </span>
    </div>
  )
}

export default KitchenWait
