import { createContext, useContext, useEffect, useState } from 'react'

const CartContext = createContext(null)

// Keeps the cart in the browser's storage, so a refresh doesn't empty it.
function loadSavedCart() {
  try {
    return JSON.parse(localStorage.getItem('cart')) || []
  } catch {
    return []
  }
}

export function CartProvider({ children }) {
  // Each line looks like: { id, name, price, quantity }
  const [items, setItems] = useState(loadSavedCart)

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items))
  }, [items])

  function addItem(dish) {
    setItems((current) => {
      const existing = current.find((line) => line.id === dish.id)
      if (existing) {
        return current.map((line) =>
          line.id === dish.id ? { ...line, quantity: Math.min(line.quantity + 1, 20) } : line,
        )
      }
      return [...current, { id: dish.id, name: dish.name, price: Number(dish.price), quantity: 1 }]
    })
  }

  function changeQuantity(id, quantity) {
    setItems((current) =>
      quantity <= 0
        ? current.filter((line) => line.id !== id)
        : current.map((line) => (line.id === id ? { ...line, quantity: Math.min(quantity, 20) } : line)),
    )
  }

  function clearCart() {
    setItems([])
  }

  const count = items.reduce((sum, line) => sum + line.quantity, 0)
  // Only an estimate for the customer. The real total is worked out by the database.
  const total = items.reduce((sum, line) => sum + line.price * line.quantity, 0)

  return (
    <CartContext.Provider value={{ items, count, total, addItem, changeQuantity, clearCart }}>
      {children}
    </CartContext.Provider>
  )
}

// Any page can call useCart() to read or change the cart.
export function useCart() {
  return useContext(CartContext)
}
