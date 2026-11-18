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
  if (wait.active_orders === 0) {
    return <p className="wait">No queue right now. Orders are usually ready in a few minutes.</p>
  }
  return (
    <p className="wait">
      {wait.active_orders} {wait.active_orders === 1 ? 'order' : 'orders'} ahead. Estimated wait about{' '}
      <strong>{wait.queue_minutes} minutes</strong>.
    </p>
  )
}

export default KitchenWait
