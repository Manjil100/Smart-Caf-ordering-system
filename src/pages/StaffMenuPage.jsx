import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { categoryIcon, formatPrice } from '../lib/format.js'

// Staff mark dishes as sold out (or back on). Sold-out dishes disappear from the customer menu.
function StaffMenuPage() {
  const [categories, setCategories] = useState([])
  const [dishes, setDishes] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [cats, items] = await Promise.all([
        supabase.from('categories').select('id, name').order('sort_order'),
        supabase.from('menu_items').select('id, category_id, name, price, is_available').order('name'),
      ])
      setLoading(false)
      if (cats.error || items.error) {
        setError('Dishes could not be loaded.')
        return
      }
      setCategories(cats.data)
      setDishes(items.data)
    }
    load()
  }, [])

  async function toggle(dish) {
    const available = !dish.is_available
    // RLS only lets staff change is_available; customers can't change dishes.
    const { error: updateError } = await supabase.from('menu_items').update({ is_available: available }).eq('id', dish.id)
    if (updateError) {
      setError(`${dish.name} couldn't be updated.`)
      return
    }
    setError('')
    setDishes((current) => current.map((d) => (d.id === dish.id ? { ...d, is_available: available } : d)))
  }

  if (loading) return <p className="muted">Loading dishes…</p>

  const soldOut = dishes.filter((d) => !d.is_available).length

  return (
    <>
      <h1>Dishes</h1>
      <p className="muted">Switch a dish off when it runs out. It disappears from the menu straight away. {soldOut > 0 && <strong>{soldOut} sold out right now.</strong>}</p>
      {error && <p className="error" role="alert">{error}</p>}

      {categories.map((category) => (
        <section key={category.id} className="card">
          <h2><span aria-hidden="true">{categoryIcon(category.name)}</span> {category.name}</h2>
          <ul className="plain toggle-list">
            {dishes.filter((d) => d.category_id === category.id).map((dish) => (
              <li key={dish.id} className={dish.is_available ? '' : 'off'}>
                <span>
                  {dish.name} <span className="muted small">{formatPrice(dish.price)}</span>
                </span>
                <label className="switch">
                  <input type="checkbox" role="switch" checked={dish.is_available} onChange={() => toggle(dish)} />
                  <span className="switch-label">{dish.is_available ? 'Available' : 'Sold out'}</span>
                </label>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </>
  )
}

export default StaffMenuPage
