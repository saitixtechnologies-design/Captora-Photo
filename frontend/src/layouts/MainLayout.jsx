import { Outlet, useLocation } from 'react-router'
import { useEffect } from 'react'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'

function MainLayout() {
  const { pathname } = useLocation()
  const isHomePage = pathname === '/'
  useEffect(() => { document.body.classList.toggle('dark-page', pathname === '/') }, [pathname])
  return (
    <div className="app-shell">
      <Navbar />
      <main className={`main-content ${isHomePage ? 'main-content-home' : 'main-content-page'}`}>
  <Outlet />
</main>
      <Footer />
    </div>
  )
}

export default MainLayout
