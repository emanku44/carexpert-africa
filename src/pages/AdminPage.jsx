import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getAllListingsAdmin, approveListing, declineListing, markAsFeatured, removeFeatured } from '../lib/supabase'

const DECLINE_REASONS = [
  'Insufficient photos (min 5)',
  'Price appears incorrect',
  'Mileage inconsistency',
  'Missing service history',
  'Poor photo quality',
  'Incomplete vehicle info',
  'Duplicate listing',
  'Unverified seller',
  'Suspicious listing',
]

const fmt = (n) => 'KSH ' + Number(n).toLocaleString()

function Toast({ msg, type, show }) {
  if (!show) return null
  const bg = type === 'success' ? '#16A34A' : type === 'error' ? '#EF4444' : '#1565C0'
  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, background: bg, color: '#fff',
      padding: '12px 20px', borderRadius: 12, fontFamily: 'Outfit, sans-serif',
      fontSize: 13, fontWeight: 700, zIndex: 9999, boxShadow: '0 4px 20px rgba(0,0,0,.2)'
    }}>{msg}</div>
  )
}

function StatCard({ icon, number, label, color }) {
  return (
    <div style={{ background: '#fff', border: '1.5px solid #E8EDF3', borderRadius: 12, padding: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ width: 36, height: 36, borderRadius: 9, background: color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>{icon}</div>
      <div>
        <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 24, fontWeight: 800, color: color, lineHeight: 1 }}>{number}</div>
        <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>{label}</div>
      </div>
    </div>
  )
}

function ListingRow({ listing, onApprove, onDecline }) {
  const [expanded, setExpanded]     = useState(false)
  const [showDecline, setShowDecline] = useState(false)
  const [showApprove, setShowApprove] = useState(false)
  const [selectedReasons, setSelectedReasons] = useState(new Set())
  const [note, setNote]             = useState('')
  const [tier, setTier]             = useState('standard')

  const statusColors = {
    pending:  { bg: '#FEF3C7', text: '#D97706', label: '⏳ Pending'  },
    approved: { bg: '#DCFCE7', text: '#16A34A', label: '✓ Approved'  },
    declined: { bg: '#FEE2E2', text: '#EF4444', label: '✕ Declined'  },
  }
  const sc = statusColors[listing.status] || statusColors.pending

  const toggleReason = (r) => {
    const next = new Set(selectedReasons)
    next.has(r) ? next.delete(r) : next.add(r)
    setSelectedReasons(next)
  }

  const handleDeclineConfirm = () => {
    const parts = [...selectedReasons]
    if (note.trim()) parts.push(note.trim())
    const fullNote = parts.join('. ') || 'Listing did not meet our requirements. Please review and resubmit.'
    onDecline(listing.id, fullNote)
    setShowDecline(false)
  }

  const handleApproveConfirm = () => {
    onApprove(listing.id, tier)
    setShowApprove(false)
  }

  const borderColor = listing.status === 'approved' ? '#16A34A' : listing.status === 'declined' ? '#EF4444' : '#D97706'

  return (
    <div style={{ background: '#fff', border: `1.5px solid #E8EDF3`, borderLeft: `4px solid ${borderColor}`, borderRadius: 12, marginBottom: 10, overflow: 'hidden' }}>
      {/* Main row */}
      <div style={{ display: 'grid', gridTemplateColumns: '72px 1fr auto', gap: 14, padding: 14, alignItems: 'center', cursor: 'pointer' }} onClick={() => setExpanded(!expanded)}>
        {/* Thumbnail */}
        <div style={{ width: 72, height: 50, borderRadius: 8, background: '#EEF5FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
          {listing.listing_photos?.[0]?.url
            ? <img src={listing.listing_photos[0].url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600 }}>No photo</span>}
        </div>

        {/* Info */}
        <div>
          <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 13, fontWeight: 700, color: '#0A2540', marginBottom: 2 }}>
            {listing.year} {listing.make} {listing.model}
          </div>
          <div style={{ fontSize: 11, color: '#64748B', marginBottom: 4 }}>
            by <strong>{listing.contact_name}</strong>
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {[fmt(listing.price), `${Number(listing.mileage).toLocaleString()} km`, listing.fuel, listing.transmission, listing.body_type, `${listing.listing_photos?.length || 0} photos`, listing.location].map((t, i) => (
              <span key={i} style={{ fontSize: 10, color: '#94A3B8', padding: '2px 7px', background: '#F8FAFC', borderRadius: 100, border: '1px solid #E8EDF3', fontWeight: 500 }}>{t}</span>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end', flexShrink: 0 }}>
          <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 100, background: sc.bg, color: sc.text, fontFamily: 'Outfit, sans-serif', whiteSpace: 'nowrap' }}>
            {sc.label}
          </span>
          <span style={{ fontSize: 10, color: '#94A3B8' }}>{new Date(listing.created_at).toLocaleDateString('en-GB')}</span>
          {listing.status === 'pending' && (
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={(e) => { e.stopPropagation(); setShowApprove(!showApprove); setShowDecline(false); setExpanded(true) }}
                style={{ background: '#16A34A', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}>
                ✓ Approve
              </button>
              <button onClick={(e) => { e.stopPropagation(); setShowDecline(!showDecline); setShowApprove(false); setExpanded(true) }}
                style={{ background: '#FEE2E2', color: '#DC2626', border: '1.5px solid #FECACA', padding: '6px 12px', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}>
                ✕ Decline
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div style={{ borderTop: '1px solid #F0F4F8', padding: 16, background: '#FAFBFC' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 14 }}>
            <div style={{ fontSize: 12, color: '#475569' }}><span style={{ display: 'block', fontSize: 10, color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 2 }}>Engine / Drive</span>{listing.engine_cc}cc · {listing.drive_type}</div>
            <div style={{ fontSize: 12, color: '#475569' }}><span style={{ display: 'block', fontSize: 10, color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 2 }}>Colour</span>{listing.colour || '—'}</div>
            <div style={{ fontSize: 12, color: '#475569' }}><span style={{ display: 'block', fontSize: 10, color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 2 }}>Condition</span>{listing.condition}</div>
            <div style={{ fontSize: 12, color: '#475569', gridColumn: '1/-1' }}><span style={{ display: 'block', fontSize: 10, color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 2 }}>Seller Description</span>{listing.description}</div>
            {listing.admin_note && (
              <div style={{ fontSize: 12, color: '#DC2626', gridColumn: '1/-1' }}><span style={{ display: 'block', fontSize: 10, color: '#DC2626', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 2 }}>Admin Note (sent to seller)</span>{listing.admin_note}</div>
            )}
          </div>

          {/* Decline panel */}
          {showDecline && listing.status === 'pending' && (
            <div style={{ background: '#FFF5F5', border: '1.5px solid #FECACA', borderRadius: 10, padding: 14, marginTop: 10 }}>
              <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 13, fontWeight: 700, color: '#DC2626', marginBottom: 10 }}>✕ Decline — Add Reason for Seller</div>

              <div style={{ fontSize: 11, fontWeight: 600, color: '#64748B', marginBottom: 6 }}>Quick reasons (select all that apply)</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                {DECLINE_REASONS.map(r => (
                  <button key={r} onClick={() => toggleReason(r)}
                    style={{ border: `1.5px solid ${selectedReasons.has(r) ? '#EF4444' : '#FECACA'}`, borderRadius: 100, padding: '4px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer', background: selectedReasons.has(r) ? '#EF4444' : '#fff', color: selectedReasons.has(r) ? '#fff' : '#DC2626', fontFamily: 'DM Sans, sans-serif', transition: 'all .15s' }}>
                    {r}
                  </button>
                ))}
              </div>

              <div style={{ fontSize: 11, fontWeight: 600, color: '#64748B', marginBottom: 5 }}>Additional note to seller (optional)</div>
              <textarea
                value={note} onChange={e => setNote(e.target.value)}
                placeholder="e.g. Please upload at least 5 clear photos. Resubmit once updated."
                style={{ width: '100%', padding: '9px 11px', border: '1.5px solid #FECACA', borderRadius: 7, fontSize: 12, fontFamily: 'DM Sans, sans-serif', resize: 'vertical', minHeight: 70, outline: 'none', lineHeight: 1.5 }}
              />
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 10 }}>
                <button onClick={() => setShowDecline(false)} style={{ background: '#fff', color: '#64748B', border: '1.5px solid #E2E8F0', padding: '7px 14px', borderRadius: 7, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}>Cancel</button>
                <button onClick={handleDeclineConfirm} style={{ background: '#EF4444', color: '#fff', border: 'none', padding: '7px 14px', borderRadius: 7, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}>Send Decline & Notify Seller</button>
              </div>
            </div>
          )}

          {/* Approve panel */}
          {showApprove && listing.status === 'pending' && (
            <div style={{ background: '#F0FDF4', border: '1.5px solid #86EFAC', borderRadius: 10, padding: 14, marginTop: 10 }}>
              <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 13, fontWeight: 700, color: '#16A34A', marginBottom: 6 }}>✓ Approve Listing</div>
              <div style={{ fontSize: 12, color: '#475569', marginBottom: 10 }}>Listing will go live immediately. Seller notified by email.</div>

              <div style={{ fontSize: 11, fontWeight: 600, color: '#64748B', marginBottom: 6 }}>Listing tier</div>
              <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                {['standard', 'featured', 'special deal'].map(t => (
                  <button key={t} onClick={() => setTier(t)}
                    style={{ border: `1.5px solid ${tier === t ? '#16A34A' : '#E2E8F0'}`, borderRadius: 7, padding: '5px 12px', fontSize: 11, fontWeight: 600, cursor: 'pointer', background: tier === t ? '#DCFCE7' : '#fff', color: tier === t ? '#16A34A' : '#475569', fontFamily: 'DM Sans, sans-serif', textTransform: 'capitalize', transition: 'all .15s' }}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button onClick={() => setShowApprove(false)} style={{ background: '#fff', color: '#64748B', border: '1.5px solid #E2E8F0', padding: '7px 14px', borderRadius: 7, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}>Cancel</button>
                <button onClick={handleApproveConfirm} style={{ background: '#16A34A', color: '#fff', border: 'none', padding: '7px 14px', borderRadius: 7, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}>✓ Approve & Publish</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
{/* Featured toggle */}
          {listing.status === 'approved' && (
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #f0f0f0' }}>
              <p style={{ fontSize: 13, color: '#666', margin: '0 0 8px' }}>
                <strong>Featured:</strong>{' '}
                {listing.featured
                  ? `Yes — until ${new Date(listing.featured_until).toLocaleDateString()}`
                  : 'No'}
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                {[7, 14, 30].map(days => (
                  <button key={days}
                    onClick={async (e) => { e.stopPropagation(); await markAsFeatured(listing.id, days) }}
                    style={{ background: listing.featured ? '#e8f0fe' : '#1565C0', color: listing.featured ? '#1565C0' : 'white', border: '1px solid #1565C0', borderRadius: 6, padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                    ⭐ {days}d
                  </button>
                ))}
                {listing.featured && (
                  <button onClick={async (e) => { e.stopPropagation(); await removeFeatured(listing.id) }}
                    style={{ background: '#fff0f0', color: '#dc2626', border: '1px solid #dc2626', borderRadius: 6, padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                    ✕ Remove
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
  <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #f0f0f0' }}>
    <p style={{ fontSize: 13, color: '#666', margin: '0 0 8px' }}>
      <strong>Featured:</strong>{' '}
      {listing.featured
        ? `Yes — until ${new Date(listing.featured_until).toLocaleDateString()}`
        : 'No'}
    </p>
    <div style={{ display: 'flex', gap: 8 }}>
      {[7, 14, 30].map(days => (
        <button
          key={days}
          onClick={async () => {
            await markAsFeatured(listing.id, days)
            setToast(`Featured for ${days} days!`)
            loadListings()
          }}
          style={{
            background: listing.featured ? '#e8f0fe' : '#1565C0',
            color: listing.featured ? '#1565C0' : 'white',
            border: '1px solid #1565C0',
            borderRadius: 6, padding: '6px 12px',
            fontSize: 12, fontWeight: 600, cursor: 'pointer'
          }}
        >
          ⭐ {days}d
        </button>
      ))}
      {listing.featured && (
        <button
          onClick={async () => {
            await removeFeatured(listing.id)
            setToast('Removed from featured')
            loadListings()
          }}
          style={{
            background: '#fff0f0', color: '#dc2626',
            border: '1px solid #dc2626',
            borderRadius: 6, padding: '6px 12px',
            fontSize: 12, fontWeight: 600, cursor: 'pointer'
          }}
        >
          ✕ Remove
        </button>
      )}
    </div>
  </div>
)}
export default function AdminPage({ user }) {
  const [listings, setListings] = useState([])
  const [filter, setFilter]     = useState('all')
  const [search, setSearch]     = useState('')
  const [loading, setLoading]   = useState(true)
  const [toast, setToast]       = useState({ show: false, msg: '', type: 'success' })

  useEffect(() => { fetchListings() }, [])

  const fetchListings = async () => {
    setLoading(true)
    const { data, error } = await getAllListingsAdmin()
    if (!error) setListings(data || [])
    setLoading(false)
  }

  const showToast = (msg, type = 'success') => {
    setToast({ show: true, msg, type })
    setTimeout(() => setToast(t => ({ ...t, show: false })), 3000)
  }

  const handleApprove = async (id, tier) => {
    const { error } = await approveListing(id, tier)
    if (error) { showToast('Error approving listing', 'error'); return }
    setListings(prev => prev.map(l => l.id === id ? { ...l, status: 'approved' } : l))
    showToast('Listing approved and published! Seller notified.', 'success')
    // TODO: trigger email notification via Supabase Edge Function or Resend
  }

  const handleDecline = async (id, note) => {
    const { error } = await declineListing(id, note)
    if (error) { showToast('Error declining listing', 'error'); return }
    setListings(prev => prev.map(l => l.id === id ? { ...l, status: 'declined', admin_note: note } : l))
    showToast('Listing declined. Seller notified with reason.', 'error')
    // TODO: trigger email notification via Supabase Edge Function or Resend
  }

  const filtered = listings.filter(l => {
    const matchesFilter = filter === 'all' || l.status === filter
    const q = search.toLowerCase()
    const matchesSearch = !q || `${l.make} ${l.model} ${l.contact_name}`.toLowerCase().includes(q)
    return matchesFilter && matchesSearch
  })

  const counts = {
    all: listings.length,
    pending:  listings.filter(l => l.status === 'pending').length,
    approved: listings.filter(l => l.status === 'approved').length,
    declined: listings.filter(l => l.status === 'declined').length,
  }

  const TABS = ['all', 'pending', 'approved', 'declined']

  return (
    <div style={{ fontFamily: 'DM Sans, sans-serif', background: '#F0F2F5', minHeight: '100vh' }}>
      {/* Nav */}
      <nav style={{ background: '#060F1A', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 15, fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: 10 }}>
          <Link to="/" style={{ color: '#fff', textDecoration: 'none' }}>CarExpert<span style={{ color: '#4DA6FF' }}>Africa</span>®</Link>
          <span style={{ color: 'rgba(255,255,255,.3)', fontWeight: 400, fontSize: 12 }}>/ Admin</span>
          {counts.pending > 0 && (
            <span style={{ background: '#EF4444', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 100 }}>{counts.pending} pending</span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          {['Listings', 'Users', 'Dealers', 'Analytics'].map(l => (
            <span key={l} style={{ color: 'rgba(255,255,255,.5)', fontSize: 12, cursor: 'pointer' }}>{l}</span>
          ))}
          <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#1565C0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Outfit, sans-serif', fontSize: 11, fontWeight: 700, color: '#fff' }}>
            {user?.email?.[0]?.toUpperCase() || 'A'}
          </div>
        </div>
      </nav>

      <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', minHeight: 'calc(100vh - 56px)' }}>
        {/* Sidebar */}
        <aside style={{ background: '#0A2540', padding: '16px 0' }}>
          {[
            { label: 'Overview', icon: '⊞', active: true },
            { label: 'Pending', icon: '⏳', badge: counts.pending, badgeRed: true },
            { label: 'Approved', icon: '✓' },
            { label: 'Declined', icon: '✕' },
            { label: 'Flagged', icon: '⚑', badge: 0 },
            { label: '—', section: true },
            { label: 'All Users', icon: '👤' },
            { label: 'Dealers', icon: '🏢' },
            { label: '—', section: true },
            { label: 'Analytics', icon: '📊' },
            { label: 'Settings', icon: '⚙' },
          ].map((item, i) => item.section ? (
            <div key={i} style={{ height: 1, background: 'rgba(255,255,255,.06)', margin: '8px 0' }} />
          ) : (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '9px 16px',
              fontSize: 12, fontWeight: item.active ? 600 : 500, cursor: 'pointer',
              color: item.active ? '#4DA6FF' : 'rgba(255,255,255,.5)',
              background: item.active ? 'rgba(77,166,255,.1)' : 'transparent',
              borderLeft: item.active ? '3px solid #4DA6FF' : '3px solid transparent',
              transition: 'all .15s'
            }}>
              <span style={{ fontSize: 12 }}>{item.icon}</span>
              {item.label}
              {item.badge > 0 && (
                <span style={{ background: item.badgeRed ? '#EF4444' : '#D97706', color: '#fff', borderRadius: 100, padding: '1px 6px', fontSize: 9, fontWeight: 700, marginLeft: 'auto', fontFamily: 'Outfit, sans-serif' }}>{item.badge}</span>
              )}
            </div>
          ))}
        </aside>

        {/* Main */}
        <main style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 20, fontWeight: 800, color: '#0A2540' }}>Listing Approvals</h2>
            <div style={{ display: 'flex', gap: 8 }}>
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search listings or sellers..."
                style={{ padding: '8px 12px', border: '1.5px solid #E2E8F0', borderRadius: 8, fontSize: 12, outline: 'none', background: '#fff', fontFamily: 'DM Sans, sans-serif', width: 220 }}
              />
              <select style={{ padding: '8px 12px', border: '1.5px solid #E2E8F0', borderRadius: 8, fontSize: 12, outline: 'none', background: '#fff', fontFamily: 'DM Sans, sans-serif' }}>
                <option>Newest First</option>
                <option>Oldest First</option>
                <option>Price High</option>
              </select>
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 18 }}>
            <StatCard icon="⏳" number={counts.pending}  label="Pending Review"  color="#D97706" />
            <StatCard icon="✓"  number={listings.filter(l => l.status === 'approved' && new Date(l.updated_at) > new Date(Date.now() - 86400000)).length} label="Approved Today" color="#16A34A" />
            <StatCard icon="✕"  number={listings.filter(l => l.status === 'declined' && new Date(l.updated_at) > new Date(Date.now() - 86400000)).length} label="Declined Today"  color="#EF4444" />
            <StatCard icon="📋" number={counts.approved} label="Total Live"      color="#1565C0" />
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 0, background: '#fff', border: '1.5px solid #E8EDF3', borderRadius: 10, overflow: 'hidden', marginBottom: 14, width: 'fit-content' }}>
            {TABS.map(t => (
              <button key={t} onClick={() => setFilter(t)}
                style={{ padding: '8px 16px', fontSize: 12, fontWeight: 600, cursor: 'pointer', color: filter === t ? '#fff' : '#64748B', background: filter === t ? '#0A2540' : 'transparent', border: 'none', borderRight: '1px solid #F0F4F8', fontFamily: 'Outfit, sans-serif', display: 'flex', alignItems: 'center', gap: 5, transition: 'all .15s' }}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
                <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 100, background: filter === t ? 'rgba(255,255,255,.2)' : 'rgba(0,0,0,.08)' }}>{counts[t]}</span>
              </button>
            ))}
          </div>

          {/* Listings */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#94A3B8', fontFamily: 'Outfit, sans-serif', fontWeight: 600 }}>Loading listings…</div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#94A3B8', fontFamily: 'Outfit, sans-serif', fontWeight: 600 }}>No listings found.</div>
          ) : filtered.map(l => (
            <ListingRow key={l.id} listing={l} onApprove={handleApprove} onDecline={handleDecline} />
          ))}
        </main>
      </div>

      <Toast msg={toast.msg} type={toast.type} show={toast.show} />
    </div>
  )
}
