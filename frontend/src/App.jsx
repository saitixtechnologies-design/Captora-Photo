import { lazy, Suspense, useEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router'
import Lenis from 'lenis'
import MainLayout from './layouts/MainLayout.jsx'
import Preloader from './components/Preloader.jsx'
import { AdminAuthProvider } from './admin/AdminAuthContext.jsx'
import PrivacyPolicy from './pages/PrivacyPolicy.jsx'
import TermsAndConditions from './pages/TermsAndConditions.jsx'

const AdminRoutes = lazy(() => import('./admin/AdminRoutes.jsx'))
const Home = lazy(() => import('./pages/Home.jsx'))
const Portfolio = lazy(() => import('./pages/Portfolio.jsx'))
const ProjectDetails = lazy(() => import('./pages/ProjectDetails.jsx'))
const About = lazy(() => import('./pages/About.jsx'))
const Services = lazy(() => import('./pages/Services.jsx'))
const Contact = lazy(() => import('./pages/Contact.jsx'))
const Feedback = lazy(() => import('./pages/Feedback.jsx'))
const WeddingPhotography = lazy(() => import('./pages/WeddingPhotography.jsx'))
const Gallery = lazy(() => import('./pages/Gallery.jsx'))

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }) }, [pathname])
  return null
}

function App() {
  const { pathname } = useLocation()
  const isAdmin = pathname.startsWith('/admin')
  useEffect(() => {
    if (isAdmin) return undefined
    const lenis = new Lenis({
      lerp: 0.14,
      smoothWheel: true,
      wheelMultiplier: 1.08,
      anchors: true,
      respectReducedMotion: true,
      autoRaf: true,
    })
    return () => lenis.destroy()
  }, [isAdmin])

  return (
    <>
      {!pathname.startsWith('/admin') && <Preloader />}
      <ScrollToTop />
      <Suspense fallback={<div className="page-loading" aria-label="Loading page" />}>
        <Routes>
          <Route path="/admin/*" element={<AdminAuthProvider><AdminRoutes /></AdminAuthProvider>} />
          <Route element={<MainLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/work/wedding-photography" element={<WeddingPhotography />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/portfolio/:id" element={<ProjectDetails />} />
            <Route path="/about" element={<About />} />
            <Route path="/services" element={<Services />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/feedback" element={<Feedback />} />
            <Route path="privacy-policy" element={<PrivacyPolicy />} />
<Route path="terms-and-conditions" element={<TermsAndConditions />} />
            <Route path="*" element={<Home />} />
          </Route>
        </Routes>
      </Suspense>
    </>
  )
}

export default App
