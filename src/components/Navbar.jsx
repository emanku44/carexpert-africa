import { Link, useLocation } from 'react-router-dom'

export default function Navbar({ user }) {
  const { pathname } = useLocation()

  const linkStyle = (path) => ({
    color: pathname === path ? '#fff' : 'rgba(255,255,255,0.6)',
    fontWeight: pathname === path ? 600 : 400,
    fontSize: 13,
    textDecoration: 'none',
    cursor: 'pointer',
  })

  return (
    <nav style={{ background: '#0A2540', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
      <Link to="/" style={{ fontFamily: 'Outfit, sans-serif', fontSize: 16, fontWeight: 800, color: '#fff', textDecoration: 'none' }}>
        CarExpert<span style={{ color: '#4DA6FF' }}>Africa</span>®
      </Link>

      <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
        <Link to="/listings"  style={linkStyle('/listings')}>Listings</Link>
        <Link to="/news"      style={linkStyle('/news')}>News & Reviews</Link>
        <Link to="/valuation" style={linkStyle('/valuation')}>Valuation</Link>
        <Link to="/pricing"   style={linkStyle('/pricing')}>Pricing</Link>
      </div>

      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        {user ? (
          <>
            <Link to="/dashboard" style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, textDecoration: 'none' }}>My Account</Link>
            <Link to="/list-car" style={{ background: '#1565C0', color: '#fff', padding: '7px 16px', borderRadius: 7, fontSize: 13, fontWeight: 700, textDecoration: 'none', fontFamily: 'Outfit, sans-serif' }}>List a Car</Link>
          </>
        ) : (
          <>
            <Link to="/auth" style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, textDecoration: 'none' }}>Sign In</Link>
            <Link to="/list-car" style={{ background: '#1565C0', color: '#fff', padding: '7px 16px', borderRadius: 7, fontSize: 13, fontWeight: 700, textDecoration: 'none', fontFamily: 'Outfit, sans-serif' }}>List a Car</Link>
          </>
        )}
      </div>
    </nav>
  )
}