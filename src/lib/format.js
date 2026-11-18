// 5.5 -> "$5.50"
export function formatPrice(amount) {
  return new Intl.NumberFormat('en-NZ', { style: 'currency', currency: 'NZD' }).format(amount)
}

// 2026-11-18T03:15:00Z -> "4:15 pm"
export function formatTime(isoDate) {
  return new Date(isoDate).toLocaleTimeString('en-NZ', { hour: 'numeric', minute: '2-digit' })
}

// Status values stored in the database, and how we show them to people.
export const STATUS_LABELS = {
  pending: 'Order received',
  preparing: 'Being prepared',
  ready: 'Ready to collect',
  completed: 'Collected',
}

// The order a status moves through. Staff press a button to go to the next one.
export const STATUS_STEPS = ['pending', 'preparing', 'ready', 'completed']

export function nextStatus(status) {
  const i = STATUS_STEPS.indexOf(status)
  return i >= 0 && i < STATUS_STEPS.length - 1 ? STATUS_STEPS[i + 1] : null
}

// A small picture for each menu category, so the menu is easy to scan.
const CATEGORY_ICONS = {
  Coffee: '☕',
  'Other drinks': '🧃',
  Breakfast: '🍳',
  Lunch: '🥪',
  Cabinet: '🧁',
}

export function categoryIcon(name) {
  return CATEGORY_ICONS[name] || '🍽️'
}

// One icon per order status, used on the tracker and the staff dashboard.
export const STATUS_ICONS = {
  pending: '🧾',
  preparing: '👩‍🍳',
  ready: '🔔',
  completed: '✅',
}
