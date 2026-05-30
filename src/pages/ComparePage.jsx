import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { supabase } from '../lib/supabase'

const fmt = n => 'KSH ' + Number(n).toLocaleString()

export default function ComparePage({ user }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const [cars, setCars] = useState([])
  const [search, setSearch] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)

  const ids = searchParams.get('ids')?.split(',').filter(Boolean) || []

  useEffect(() => {
    if (ids.length === 0) return
    supabase.from('listings').select('*, listing_photos(*)').in('id', ids).eq('status', 'approved')
      .then(({ data }) => {
        if (data) {
          const ordered = ids.map(id => data.find(c => c.id === id)).filter(Boolean)
          setCars(ordered)
        }
      })
  }, [searchParams.get('ids')])

  useEffect(() => {
    if (!search.trim() || search.length < 2) { setSearchResults([]); return }
    setSearching(true)
    const timer = setTimeout(() => {
      supabase.from('listings').select('id, make, model, variant, year, price, listing_photos(*)')
        .eq('status', 'approved')
        .or(`make.ilike.%${search}%,model.ilike.%${search}%`)
        .not('id', 'in', `(${ids.join(',') || 'null'})`)
        .limit(6)
        .then(({ data }) => { setSearchResults(data || []); setSearching(false) })
    }, 350)
    return () => clearTimeout(timer)
  }, [search])

  const addCar = (car) => {
    if (ids.length >= 3) return
    const newIds = [...ids, car.id]
    setSearchParams({ ids: newIds.join(',') })
    setSearch('')
    setSearchResults([])
  }

  const removeCar = (id) => {
    const newIds = ids.filter(i => i !== id)
    setSearchParams(newIds.length > 0 ? { ids: newIds.join(',') } : {})
    setCars(prev => prev.filter(c => c.id !== id))
  }

  const FIELDS = [
    ['Price', c => fmt(c.price), true],
    ['Year', c => c.year],
    ['Make', c => c.make],
    ['Model', c => c.model],
    ['Variant', c => c.variant || '—'],
    ['Mileage', c => c.mileage ? `${Number(c.mileage).toLocaleString()} km` : '—'],
    ['Condition', c => c.condition || '—'],
    ['Body Type', c => c.body_type || '—'],
    ['Engine', c => c.engine_cc ? `${c.engine_cc} cc` : '—'],
    ['Fuel Type', c => c.fuel_type || '—'],
    ['Transmission', c => c.transmission || '—'],
    ['Drive Type', c => c.drive_type || '—'],
    ['Colour', c => c.colour || '—'],
    ['Location', c => c.location || '—'],
    ['Negotiable', c => c.negotiable ? 'Yes' : 'No'],
  ]

  const getBest = (label, values) => {
    if (label === 'Price') return values.indexOf(Math.min(...values.map(v => parseInt(v.replace(/\D/g,'')))))
    if (label === 'Mileage') {
      const nums = values.map(v => parseInt(v.replace(/\D/g,'')) || Infinity)
      return nums.indexOf(Math.min(...nums))
    }
    if (label === 'Year') return values.indexOf(String(Math.max(...values.map(Number))))
    return -1
  }

  return (
    <div style={{ fontFamily: 'DM Sans,sans-serif', background: '#F7F9FC', minHeight: '100vh' }}>
      <style>{`
        @media (max-width: 768px) {
          .compare-table { font-size: 11px !important; }
          .compare-header-grid { grid-template-columns: 100px repeat(${Math.max(cars.length,1)}, 1fr) !important; }
          .compare-row-grid { grid-template-columns: 100px repeat(${Math.max(cars.length,1)}, 1fr) !important; }
        }
      `}</style>
      <Navbar user={user} />
      <div style={{ background: 'linear-gradient(135deg,#0A2540,#1565C0)', padding: '32px 16px', textAlign: 'center' }}>
        <h1 style={{ fontFamily: 'Outfit,sans-serif', fontSize: 24, fontWeight: 800, color: '#fff', marginBottom: 8 }}>Compare Cars</h1>
        <p style={{ color: 'rgba(255,255,255,.55)', fontSize: 13 }}>Side-by-side spec comparison of up to 3 cars</p>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }}>

        {/* Add car search */}
        {ids.length < 3 && (
          <div style={{ background: '#fff', border: '1.5px solid #E8EDF3', borderRadius: 12, padding: 16, marginBottom: 20, position: 'relative' }}>
            <div style={{ fontFamily: 'Outfit,sans-serif', fontSize: 13, fontWeight: 700, color: '#0A2540', marginBottom: 10 }}>
              + Add a car to compare ({ids.length}/3)
            </div>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by make or model (e.g. Toyota Land Cruiser)..."
              style={{ width: '100%', padding: '11px 14px', border: '1.5px solid #E2E8F0', borderRadius: 8, fontSize: 13, fontFamily: 'DM Sans,sans-serif', outline: 'none', boxSizing: 'border-box' }}/>
            {searchResults.length > 0 && (
              <div style={{ position: 'absolute', top: '100%', left: 16, right: 16, background: '#fff', border: '1.5px solid #E2E8F0', borderRadius: 10, boxShadow: '0 8px 32px rgba(0,0,0,.1)', zIndex: 50, overflow: 'hidden' }}>
                {searchResults.map(r => (
                  <div key={r.id} onClick={() => addCar(r)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid #F0F4F8' }}
                    onMouseOver={e => e.currentTarget.style.background='#F8FAFC'}
                    onMouseOut={e => e.currentTarget.style.background='#fff'}>
                    <div style={{ width: 44, height: 32, borderRadius: 6, overflow: 'hidden', background: '#EEF5FF', flexShrink: 0 }}>
                      {r.listing_photos?.[0]?.url ? <img src={r.listing_photos[0].url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/> : <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🚗</div>}
                    </div>
                    <div>
                      <div style={{ fontFamily: 'Outfit,sans-serif', fontSize: 13, fontWeight: 700, color: '#0A2540' }}>{r.year} {r.make} {r.model}{r.variant ? ` — ${r.variant}` : ''}</div>
                      <div style={{ fontSize: 11, color: '#1565C0', fontWeight: 700 }}>{fmt(r.price)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {searching && <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 6 }}>Searching...</div>}
          </div>
        )}

        {cars.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, background: '#fff', borderRadius: 14, border: '1.5px solid #E8EDF3' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔄</div>
            <div style={{ fontFamily: 'Outfit,sans-serif', fontSize: 18, fontWeight: 700, color: '#0A2540', marginBottom: 8 }}>No cars selected</div>
            <div style={{ fontSize: 13, color: '#94A3B8', marginBottom: 20 }}>Search for cars above or add them from any listing page</div>
            <Link to="/listings" style={{ background: '#1565C0', color: '#fff', padding: '10px 24px', borderRadius: 8, fontSize: 13, fontWeight: 700, textDecoration: 'none', fontFamily: 'Outfit,sans-serif' }}>Browse Listings</Link>
          </div>
        ) : (
          <div style={{ background: '#fff', border: '1.5px solid #E8EDF3', borderRadius: 14, overflow: 'hidden' }}>
            {/* Car headers */}
            <div className="compare-header-grid" style={{ display: 'grid', gridTemplateColumns: `180px repeat(${cars.length}, 1fr)`, borderBottom: '2px solid #E8EDF3' }}>
              <div style={{ padding: 16, background: '#F8FAFC', borderRight: '1px solid #E8EDF3' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>Comparison</div>
              </div>
              {cars.map((car, i) => (
                <div key={car.id} style={{ borderRight: i < cars.length-1 ? '1px solid #E8EDF3' : 'none', background: i === 0 ? '#F8FBFF' : '#fff' }}>
                  <div style={{ height: 140, overflow: 'hidden', background: '#EEF5FF', position: 'relative' }}>
                    {car.listing_photos?.[0]?.url
                      ? <img src={car.listing_photos[0].url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
                      : <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>🚗</div>}
                    <button onClick={() => removeCar(car.id)} style={{ position: 'absolute', top: 6, right: 6, width: 24, height: 24, borderRadius: '50%', background: 'rgba(0,0,0,.5)', border: 'none', color: '#fff', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                  </div>
                  <div style={{ padding: '12px 14px' }}>
                    <div style={{ fontFamily: 'Outfit,sans-serif', fontSize: 13, fontWeight: 800, color: '#0A2540', marginBottom: 2 }}>{car.year} {car.make} {car.model}</div>
                    {car.variant && <div style={{ fontSize: 11, color: '#64748B', marginBottom: 6 }}>{car.variant}</div>}
                    <div style={{ fontFamily: 'Outfit,sans-serif', fontSize: 16, fontWeight: 800, color: '#1565C0', marginBottom: 8 }}>{fmt(car.price)}</div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <Link to={`/listings/${car.id}`} style={{ fontSize: 11, fontWeight: 700, color: '#1565C0', background: '#F0F6FF', padding: '4px 10px', borderRadius: 6, textDecoration: 'none', border: '1.5px solid #BDD5FF' }}>View →</Link>
                      <a href={`https://wa.me/${(car.phone||'').replace(/\D/g,'')}?text=Hi, I saw your ${car.year} ${car.make} ${car.model} on CarExpert Africa`}
                        target="_blank" rel="noopener noreferrer"
                        style={{ fontSize: 11, fontWeight: 700, color: '#fff', background: '#25D366', padding: '4px 10px', borderRadius: 6, textDecoration: 'none' }}>WhatsApp</a>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Spec rows */}
            {FIELDS.map(([label, getter, isPrice], rowIdx) => {
              const values = cars.map(c => getter(c))
              const bestIdx = getBest(label, values)
              return (
                <div key={label} className="compare-row-grid"
                  style={{ display: 'grid', gridTemplateColumns: `180px repeat(${cars.length}, 1fr)`, borderBottom: '1px solid #F0F4F8', background: rowIdx % 2 === 0 ? '#fff' : '#FAFBFC' }}>
                  <div style={{ padding: '11px 16px', fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '.3px', borderRight: '1px solid #F0F4F8', display: 'flex', alignItems: 'center', background: '#F8FAFC' }}>{label}</div>
                  {values.map((val, i) => (
                    <div key={i} style={{ padding: '11px 14px', fontSize: 13, fontWeight: 600, color: bestIdx === i ? '#16A34A' : '#0A2540', borderRight: i < values.length-1 ? '1px solid #F0F4F8' : 'none', display: 'flex', alignItems: 'center', gap: 6, background: i === 0 ? '#F8FBFF' : 'transparent' }}>
                      {bestIdx === i && <span style={{ fontSize: 10 }}>✅</span>}
                      {val}
                    </div>
                  ))}
                </div>
              )
            })}

            {/* WhatsApp row */}
            <div className="compare-row-grid" style={{ display: 'grid', gridTemplateColumns: `180px repeat(${cars.length}, 1fr)`, background: '#F8FAFC' }}>
              <div style={{ padding: '14px 16px', fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', borderRight: '1px solid #F0F4F8', display: 'flex', alignItems: 'center', background: '#F8FAFC' }}>Contact</div>
              {cars.map((car, i) => (
                <div key={car.id} style={{ padding: '12px 14px', borderRight: i < cars.length-1 ? '1px solid #F0F4F8' : 'none', background: i === 0 ? '#F8FBFF' : 'transparent' }}>
                  <a href={`https://wa.me/${(car.phone||'').replace(/\D/g,'')}?text=Hi, interested in your ${car.year} ${car.make} ${car.model}`}
                    target="_blank" rel="noopener noreferrer"
                    style={{ display: 'block', textAlign: 'center', background: '#25D366', color: '#fff', padding: '8px', borderRadius: 7, fontSize: 12, fontWeight: 700, textDecoration: 'none', fontFamily: 'Outfit,sans-serif' }}>
                    📱 WhatsApp
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {cars.length > 0 && ids.length < 3 && (
          <div style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: '#94A3B8' }}>
            Add up to {3 - ids.length} more car{3 - ids.length !== 1 ? 's' : ''} to compare
          </div>
        )}
      </div>
    </div>
  )
}
