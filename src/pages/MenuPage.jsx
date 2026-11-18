import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { categoryIcon, formatPrice } from '../lib/format.js'
import { useCart } from '../context/CartContext.jsx'
import KitchenWait from '../components/KitchenWait.jsx'

// Feature 1: customers browse the menu and add dishes to their cart.
function MenuPage() {
  const { items: cartItems, addItem, count, total } = useCart()
  const [categories, setCategories] = useState([])
  const [dishes, setDishes] = useState([])
  const [status, setStatus] = useState('loading') // 'loading' | 'error' | 'ready'

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

  // How many of a dish are already in the cart (shown on its card).
  function inCart(id) {
    return cartItems.find((line) => line.id === id)?.quantity || 0
  }

  // Only show categories that have at least one dish available.
  const sections = categories
    .map((category) => ({ ...category, dishes: dishes.filter((d) => d.category_id === category.id) }))
    .filter((section) => section.dishes.length > 0)

  return (
    <>
      <section className="welcome card">
        <div>
          <p className="eyebrow">Order ahead, skip the queue</p>
          <h1>Good food, made to order</h1>
          <p className="muted">Pick your favourites, place your order, and we'll let you know the moment it's ready. Pay at the counter when you collect.</p>
        </div>
        <KitchenWait />
      </section>

      {status === 'loading' && <p className="muted">Loading the menu…</p>}
      {status === 'error' && <p className="error">Sorry, the menu couldn't be loaded. Please refresh the page.</p>}

      {status === 'ready' && (
        <>
          {/* Buttons that jump to each part of the menu */}
          <nav className="pills" aria-label="Menu categories">
            {sections.map((section) => (
              <a key={section.id} href={`#cat-${section.id}`} className="pill">
                <span aria-hidden="true">{categoryIcon(section.name)}</span> {section.name}
              </a>
            ))}
          </nav>

          {sections.map((section) => (
            <section key={section.id} id={`cat-${section.id}`} className="category">
              <h2>
                <span aria-hidden="true">{categoryIcon(section.name)}</span> {section.name}
              </h2>
              <ul className="dish-grid">
                {section.dishes.map((dish) => (
                  <li key={dish.id} className="dish card">
                    <div className="dish-top">
                      <span className="dish-icon" aria-hidden="true">{categoryIcon(section.name)}</span>
                      <span className="chip">⏱ {dish.prep_time_minutes} min</span>
                    </div>
                    <h3>{dish.name}</h3>
                    <p className="muted small">{dish.description}</p>
                    <div className="dish-bottom">
                      <span className="price">{formatPrice(dish.price)}</span>
                      <button type="button" onClick={() => addItem(dish)} aria-label={`Add ${dish.name} to cart`}>
                        {inCart(dish.id) > 0 ? `Add another (${inCart(dish.id)})` : 'Add'}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </>
      )}

      {count > 0 && (
        <div className="cart-bar" role="status">
          <span>
            <strong>{count} {count === 1 ? 'item' : 'items'}</strong> · {formatPrice(total)}
          </span>
          <Link to="/cart" className="button">View cart →</Link>
        </div>
      )}
    </>
  )
}

export default MenuPage
