import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { formatPrice } from '../lib/format.js'
import { useCart } from '../context/CartContext.jsx'
import KitchenWait from '../components/KitchenWait.jsx'

// Feature 1: customers browse the menu and add dishes to their cart.
function MenuPage() {
  const { addItem, count } = useCart()
  const [categories, setCategories] = useState([])
  const [dishes, setDishes] = useState([])
  const [status, setStatus] = useState('loading') // 'loading' | 'error' | 'ready'
  const [added, setAdded] = useState(null)

  useEffect(() => {
    async function loadMenu() {
      // Load categories and dishes at the same time.
      const [cats, items] = await Promise.all([
        supabase.from('categories').select('id, name').order('sort_order'),
        supabase
          .from('menu_items')
          .select('id, category_id, name, description, price, prep_time_minutes')
          .eq('is_available', true)
          .order('name'),
      ])
      if (cats.error || items.error) {
        setStatus('error')
        return
      }
      setCategories(cats.data)
      setDishes(items.data)
      setStatus('ready')
    }
    loadMenu()
  }, [])

  function handleAdd(dish) {
    addItem(dish)
    setAdded(dish.name)
  }

  if (status === 'loading') return <p>Loading the menu…</p>
  if (status === 'error') return <p className="error">Sorry, the menu couldn't be loaded. Please refresh the page.</p>

  return (
    <>
      <h1>Menu</h1>
      <KitchenWait />

      {categories.map((category) => {
        const inCategory = dishes.filter((dish) => dish.category_id === category.id)
        if (inCategory.length === 0) return null
        return (
          <section key={category.id} className="category">
            <h2>{category.name}</h2>
            <ul className="dish-list">
              {inCategory.map((dish) => (
                <li key={dish.id} className="dish">
                  <div>
                    <h3>{dish.name}</h3>
                    <p className="muted">{dish.description}</p>
                    <p className="small muted">About {dish.prep_time_minutes} min</p>
                  </div>
                  <div className="dish-buy">
                    <span className="price">{formatPrice(dish.price)}</span>
                    <button type="button" onClick={() => handleAdd(dish)} aria-label={`Add ${dish.name} to cart`}>
                      Add
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )
      })}

      {count > 0 && (
        <div className="cart-bar" role="status">
          <span>{added ? `${added} added. ` : ''}{count} in cart</span>
          <Link to="/cart" className="button">View cart</Link>
        </div>
      )}
    </>
  )
}

export default MenuPage
