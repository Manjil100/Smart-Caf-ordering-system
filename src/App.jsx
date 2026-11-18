import { Routes, Route } from 'react-router-dom'
import Header from './components/Header.jsx'
import RequireStaff from './components/RequireStaff.jsx'
import MenuPage from './pages/MenuPage.jsx'
import CartPage from './pages/CartPage.jsx'
import OrderStatusPage from './pages/OrderStatusPage.jsx'
import StaffLoginPage from './pages/StaffLoginPage.jsx'
import StaffDashboardPage from './pages/StaffDashboardPage.jsx'
import StaffHistoryPage from './pages/StaffHistoryPage.jsx'
import StaffMenuPage from './pages/StaffMenuPage.jsx'
import NotFoundPage from './pages/NotFoundPage.jsx'

// App is the map of the whole website: each address shows one page.
function App() {
  return (
    <>
      <Header />
      <main className="container">
        <Routes>
          {/* Customer pages */}
          <Route path="/" element={<MenuPage />} />
          <Route path="/cart" element={<CartPage />} />
          {/* :orderId is filled in from the link, e.g. /order/3f2a... */}
          <Route path="/order/:orderId" element={<OrderStatusPage />} />

          {/* Staff pages (RequireStaff sends anyone else to the login page) */}
          <Route path="/staff/login" element={<StaffLoginPage />} />
          <Route path="/staff" element={<RequireStaff><StaffDashboardPage /></RequireStaff>} />
          <Route path="/staff/menu" element={<RequireStaff><StaffMenuPage /></RequireStaff>} />
          <Route path="/staff/history" element={<RequireStaff><StaffHistoryPage /></RequireStaff>} />

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
    </>
  )
}

export default App
