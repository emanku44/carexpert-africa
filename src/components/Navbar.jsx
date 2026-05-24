import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Navbar({ user }) {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const NAV_LINKS = [
    { label: 'Buy a Car', to: '/listings' },
    { label: 'Sell',      to: '/list-car' },
    { label: 'Valuation', to: '/valuation' },
    { label: 'News',      to: '/news' },
    { label: 'Pricing',   to: '/pricing' },
  ]

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return (
    <>
      <style>{`
        @media (max-width: 768px) {
          .nav-desktop { display: none !important; }
          .nav-mobile-btn { display: flex !important; }
        }
        @media (min-width: 769px) {
          .nav-desktop { display: flex !important; }
          .nav-mobile-btn { display: none !important; }
        }
      `}</style>

      <nav style={{
        background: '#0A2540', padding: '0 16px', height: 56,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 100
      }}>
        {/* Logo */}
        <Link to="/" onClick={() => setMenuOpen(false)}
          style={{ fontFamily: 'Outfit, sans-serif', fontSize: 16, fontWeight: 800, color: '#fff', textDecoration: 'none', flexShrink: 0 }}>
          CarExpert<span style={{ color: '#4DA6FF' }}>Africa</span>®
        </Link>

        {/* Desktop nav links */}
        <div className="nav-desktop" style={{ alignItems: 'center', gap: 4 }}>
          {NAV_LINKS.map(({ label, to }) => (
            <Link key={to} to={to} style={{
              color: 'rgba(255,255,255,.7)', fontSize: 13, fontWeight: 500,
              textDecoration: 'none', padding: '6px 12px', borderRadius: 7,
            }}
              onMouseOver={e => { e.target.style.color = '#fff'; e.target.style.background = 'rgba(255,255,255,.08)' }}
              onMouseOut={e => { e.target.style.color = 'rgba(255,255,255,.7)'; e.target.style.background = 'transparent' }}>
              {label}
            </Link>
          ))}
        </div>

        {/* Desktop right */}
        <div className="nav-desktop" style={{ alignItems: 'center', gap: 10, flexShrink: 0 }}>
          {user ? (
            <>
              <Link to="/list-car" style={{ background: '#1565C0', color: '#fff', textDecoration: 'none', padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, fontFamily: 'Outfit, sans-serif' }}>
                + List a Car
              </Link>
              <Link to="/dashboard" style={{ width: 32, height: 32, borderRadius: '50%', background: '#1565C0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Outfit, sans-serif', fontSize: 12, fontWeight: 700, color: '#fff', textDecoration: 'none' }}>
                {user.email?.[0]?.toUpperCase() || 'U'}
              </Link>
              <button onClick={handleSignOut} style={{ background: 'rgba(255,255,255,.1)', color: '#fff', border: '1.5px solid rgba(255,255,255,.2)', padding: '5px 12px', borderRadius: 7, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/auth" style={{ color: 'rgba(255,255,255,.7)', fontSize: 13, fontWeight: 500, textDecoration: 'none', padding: '6px 12px' }}>Sign In</Link>
              <Link to="/auth" style={{ background: '#1565C0', color: '#fff', textDecoration: 'none', padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, fontFamily: 'Outfit, sans-serif' }}>
                + List a Car
              </Link>
            </>
          )}
        </div>

        {/* Mobile right: List + Hamburger */}
        <div className="nav-mobile-btn" style={{ alignItems: 'center', gap: 10 }}>
          <Link to="/list-car" style={{ background: '#1565C0', color: '#fff', textDecoration: 'none', padding: '6px 12px', borderRadius: 7, fontSize: 12, fontWeight: 700, fontFamily: 'Outfit, sans-serif', whiteSpace: 'nowrap' }}>
            + List
          </Link>
          <button onClick={() => setMenuOpen(!menuOpen)}
            style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 4, display: 'flex', flexDirection: 'column', gap: 5, alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ display: 'block', width: 22, height: 2, background: '#fff', borderRadius: 2, transition: 'all .2s', transform: menuOpen ? 'rotate(45deg) translate(5px, 5px)' : 'none' }}/>
            <span style={{ display: 'block', width: 22, height: 2, background: '#fff', borderRadius: 2, transition: 'all .2s', opacity: menuOpen ? 0 : 1 }}/>
            <span style={{ display: 'block', width: 22, height: 2, background: '#fff', borderRadius: 2, transition: 'all .2s', transform: menuOpen ? 'rotate(-45deg) translate(5px, -5px)' : 'none' }}/>
          </button>
        </div>
      </nav>

      {/* Mobile menu drawer */}
      {menuOpen && (
        <div style={{
          position: 'fixed', top: 56, left: 0, right: 0, bottom: 0,
          background: '#0A2540', zIndex: 99, overflowY: 'auto',
          display: 'flex', flexDirection: 'column'
        }}>
          {/* Nav links */}
          <div style={{ padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,.08)' }}>
            {NAV_LINKS.map(({ label, to }) => (
              <Link key={to} to={to} onClick={() => setMenuOpen(false)}
                style={{ display: 'block', color: '#fff', fontSize: 16, fontWeight: 600, textDecoration: 'none', padding: '14px 24px', borderBottom: '1px solid rgba(255,255,255,.06)', fontFamily: 'DM Sans, sans-serif' }}>
                {label}
              </Link>
            ))}
          </div>

          {/* User section */}
          <div style={{ padding: '16px 24px' }}>
            {user ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, padding: '12px 16px', background: 'rgba(255,255,255,.06)', borderRadius: 10 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#1565C0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Outfit, sans-serif', fontSize: 16, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                    {user.email?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{user.user_metadata?.full_name || user.email}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,.5)' }}>Free Plan</div>
                  </div>
                </div>
                {[
                  { label: '📊 Dashboard', to: '/dashboard' },
                  { label: '🚗 My Listings', to: '/dashboard' },
                  { label: '❤️ Saved Cars', to: '/dashboard' },
                  { label: '🔖 Saved Searches', to: '/dashboard' },
                ].map(({ label, to }) => (
                  <Link key={label} to={to} onClick={() => setMenuOpen(false)}
                    style={{ display: 'block', background: 'rgba(255,255,255,.06)', color: '#fff', textDecoration: 'none', padding: '12px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, marginBottom: 8, fontFamily: 'DM Sans, sans-serif' }}>
                    {label}
                  </Link>
                ))}
                <button onClick={handleSignOut}
                  style={{ width: '100%', background: '#FEE2E2', color: '#DC2626', border: 'none', padding: '12px 16px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'Outfit, sans-serif', marginTop: 8 }}>
                  Log Out
                </button>
              </>
            ) : (
              <>
                <Link to="/auth" onClick={() => setMenuOpen(false)}
                  style={{ display: 'block', background: '#1565C0', color: '#fff', textDecoration: 'none', padding: '14px 16px', borderRadius: 10, fontSize: 15, fontWeight: 700, textAlign: 'center', fontFamily: 'Outfit, sans-serif', marginBottom: 10 }}>
                  Sign In / Register
                </Link>
                <Link to="/list-car" onClick={() => setMenuOpen(false)}
                  style={{ display: 'block', background: 'rgba(255,255,255,.08)', color: '#fff', textDecoration: 'none', padding: '14px 16px', borderRadius: 10, fontSize: 15, fontWeight: 700, textAlign: 'center', fontFamily: 'Outfit, sans-serif', border: '1px solid rgba(255,255,255,.15)' }}>
                  + List a Car
                </Link>
              </>
            )}
          </div>

          {/* Bottom links */}
          <div style={{ marginTop: 'auto', padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,.08)', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {[['Terms', '/terms'], ['Pricing', '/pricing'], ['News', '/news']].map(([label, to]) => (
              <Link key={label} to={to} onClick={() => setMenuOpen(false)}
                style={{ color: 'rgba(255,255,255,.4)', fontSize: 12, textDecoration: 'none' }}>{label}</Link>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
