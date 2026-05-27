import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import HomePage from './pages/HomePage'
import ListingsPage from './pages/ListingsPage'
import AdminPage from './pages/AdminPage'
import { TermsPage } from './pages/TermsPage'
import EditListingPage from './pages/EditListingPage'
import ArticlePage from './pages/ArticlePage'
import {
  AuthPage, ListCarPage, DashboardPage,
  ValuationPage, PricingPage, NewsReviewsPage,
  DealerProfilePage, CarDetailPage
} from './pages/AllOtherPages'

function ProtectedRoute({ user, children }) {
  if (!user) return <Navigate to="/auth" replace />
  return children
}

function AdminRoute({ user, children }) {
  if (!user) return <Navigate to="/auth" replace />
  if (user?.user_metadata?.role !== 'admin') return <Navigate to="/" replace />
  return children
}

export default function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', fontFamily:'Outfit,sans-serif', color:'#1565C0', fontSize:18, fontWeight:700 }}>
      CarExpert Africa®
    </div>
  )

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"             element={<HomePage user={user} />} />
        <Route path="/listings"     element={<ListingsPage user={user} />} />
        <Route path="/listings/:id" element={<CarDetailPage user={user} />} />
        <Route path="/dealers/:id"  element={<DealerProfilePage user={user} />} />
        <Route path="/valuation"    element={<ValuationPage user={user} />} />
        <Route path="/auth"         element={<AuthPage user={user} />} />
        <Route path="/pricing"      element={<PricingPage user={user} />} />
        <Route path="/news"         element={<NewsReviewsPage user={user} />} />
        <Route path="/news/:slug"   element={<ArticlePage user={user} />} />
        <Route path="/list-car"     element={<ProtectedRoute user={user}><ListCarPage user={user} /></ProtectedRoute>} />
        <Route path="/dashboard"    element={<ProtectedRoute user={user}><DashboardPage user={user} /></ProtectedRoute>} />
        <Route path="/admin"        element={<AdminRoute user={user}><AdminPage user={user} /></AdminRoute>} />
        <Route path="/terms"        element={<TermsPage user={user} />} />
        <Route path="/edit-listing/:id" element={<ProtectedRoute user={user}><EditListingPage user={user} /></ProtectedRoute>} />
<Route path="*"             element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}