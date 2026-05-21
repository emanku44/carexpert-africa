import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
export default function Navbar({ user }) {
  const navigate = useNavigate()

  return (
    <nav style={{
      background: '#0A2540', padding: '0 24px', height: 56,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      position: 'sticky', top: 0, zIndex: 100
    }}>
      {/* Logo */}
      <Link to="/" style={{ fontFamily: 'Outfit, sans-serif', fontSize: 16, fontWeight: 800, color: '#fff', textDecoration: 'none', flexShrink: 0 }}>
        CarExpert<span style={{ color: '#4DA6FF' }}>Africa</span>®
      </Link>

      {/* Nav links */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {[
          { label: 'Buy a Car',    to: '/listings' },
          { label: 'Sell',         to: '/list-car' },
          { label: 'Valuation',    to: '/valuation' },
          { label: 'News',         to: '/news' },
          { label: 'Pricing',      to: '/pricing' },
        ].map(({ label, to }) => (
          <Link key={to} to={to} style={{
            color: 'rgba(255,255,255,.7)', fontSize: 13, fontWeight: 500,
            textDecoration: 'none', padding: '6px 12px', borderRadius: 7,
            transition: 'all .15s'
          }}
            onMouseOver={e => { e.target.style.color = '#fff'; e.target.style.background = 'rgba(255,255,255,.08)' }}
            onMouseOut={e => { e.target.style.color = 'rgba(255,255,255,.7)'; e.target.style.background = 'transparent' }}
          >
            {label}
          </Link>
        ))}
      </div>

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        {user ? (
          <>
            <Link to="/list-car" style={{
              background: '#1565C0', color: '#fff', textDecoration: 'none',
              padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700,
              fontFamily: 'Outfit, sans-serif'
            }}>
              + List a Car
            </Link>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
  <Link to="/dashboard" style={{
    width: 32, height: 32, borderRadius: '50%', background: '#1565C0',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: 'Outfit, sans-serif', fontSize: 12, fontWeight: 700,
    color: '#fff', textDecoration: 'none'
  }}>
    {user.email?.[0]?.toUpperCase() || 'U'}
  </Link>
  <button
    onClick={async () => {
      await supabase.auth.signOut()
      window.location.href = '/'
    }}
    style={{
      marginLeft: 8, background: 'rgba(255,255,255,.1)', color: '#fff',
      border: '1.5px solid rgba(255,255,255,.2)', padding: '5px 12px',
      borderRadius: 7, fontSize: 11, fontWeight: 600, cursor: 'pointer',
      fontFamily: 'DM Sans, sans-serif'
    }}>
    Log out
  </button>
</div>
          </>
        ) : (
          <>
            <Link to="/auth" style={{
              color: 'rgba(255,255,255,.7)', fontSize: 13, fontWeight: 500,
              textDecoration: 'none', padding: '6px 12px'
            }}>
              Sign In
            </Link>
            <Link to="/auth" style={{
              background: '#1565C0', color: '#fff', textDecoration: 'none',
              padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700,
              fontFamily: 'Outfit, sans-serif'
            }}>
              + List a Car
            </Link>
          </>
        )}
      </div>
    </nav>
  )
}