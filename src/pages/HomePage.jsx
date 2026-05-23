import { Link, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import { getFeaturedListings, supabase } from '../lib/supabase'

const MAKES = ['Toyota','Mercedes-Benz','Mazda','Audi','Volkswagen','Subaru','BMW','Lexus','Nissan','Mitsubishi','Porsche','Suzuki','Honda','Isuzu']
const BODY_TYPES = [{ t:'SUV', c:58 },{ t:'Sedan', c:9 },{ t:'Hatchback', c:8 },{ t:'Minivan', c:5 },{ t:'Pickup', c:2 },{ t:'Coupe', c:2 }]

export default function HomePage({ user }) {
  const navigate = useNavigate()
  const [make, setMake]               = useState('')
  const [body, setBody]               = useState('')
  const [price, setPrice]             = useState('')
  const [showMore, setShowMore]       = useState(false)
  const [transmission, setTransmission] = useState('')
  const [fuel, setFuel]               = useState('')
  const [minYear, setMinYear] = useState(2000)
const [maxYear, setMaxYear] = useState(2025)
const [minKm, setMinKm] = useState(0)
const [maxKm, setMaxKm] = useState(300000)
const [minPrice, setMinPrice] = useState(0)
const [maxPrice, setMaxPrice] = useState(20000000)
  const [featured, setFeatured]       = useState([])
  const [totalCars, setTotalCars]     = useState(0)
  const [makeCounts, setMakeCounts]   = useState({})

  useEffect(() => {
    getFeaturedListings().then(({ data }) => setFeatured(data || []))
    supabase.from('listings').select('make').eq('status', 'approved').then(({ data }) => {
      if (!data) return
      setTotalCars(data.length)
      const counts = {}
      data.forEach(l => { counts[l.make] = (counts[l.make] || 0) + 1 })
      setMakeCounts(counts)
    })
  }, [])

  const search = () => {
    const p = new URLSearchParams()
    if (make)         p.set('make', make)
    if (body)         p.set('body', body)
    
    if (transmission) p.set('transmission', transmission)
    if (fuel)         p.set('fuel', fuel)
    if (minPrice > 0)    p.set('minPrice', minPrice)
    if (maxPrice < 20000000) p.set('maxPrice', maxPrice)
    if (minYear > 2000)  p.set('minYear', minYear)
    if (maxYear < 2025)  p.set('maxYear', maxYear)
    if (minKm > 0)       p.set('minKm', minKm)
    if (maxKm < 300000)  p.set('maxKm', maxKm)
    navigate(`/listings?${p.toString()}`)
  }

  return (
    <div style={{ fontFamily: 'DM Sans, sans-serif', background: '#F7F9FC', minHeight: '100vh' }}>
      <Navbar user={user} />

      {/* Hero */}
      <div style={{
        backgroundImage: 'linear-gradient(rgba(10,37,64,0.7), rgba(10,37,64,0.85)), url(/hero.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        padding: '80px 24px 0'
      }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ color: '#4DA6FF', fontSize: 11, fontWeight: 700, letterSpacing: '1.8px', textTransform: 'uppercase', marginBottom: 12 }}>Kenya's #1 Car Platform</div>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 52, fontWeight: 800, color: '#fff', lineHeight: 1.08, marginBottom: 14, letterSpacing: -1 }}>
            Find Your <span style={{ color: '#4DA6FF' }}>Perfect</span><br />Car in Kenya
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 16, marginBottom: 36, maxWidth: 480 }}>
            Browse verified listings from trusted dealers and private sellers across Kenya.
          </p>

          {/* Search box */}
          <div style={{ background: '#fff', borderRadius: '14px 14px 0 0', padding: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 12, alignItems: 'end' }}>
              <div>
                <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: 5 }}>Make</label>
                <select value={make} onChange={e => setMake(e.target.value)} style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #E2E8F0', borderRadius: 8, fontSize: 13, fontFamily: 'DM Sans, sans-serif', outline: 'none', background: '#F8FAFC' }}>
                  <option value="">Any Make</option>
                  {MAKES.map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: 5 }}>Body Type</label>
                <select value={body} onChange={e => setBody(e.target.value)} style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #E2E8F0', borderRadius: 8, fontSize: 13, fontFamily: 'DM Sans, sans-serif', outline: 'none', background: '#F8FAFC' }}>
                  <option value="">Any Body</option>
                  {BODY_TYPES.map(b => <option key={b.t}>{b.t}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: 5 }}>Budget (KSH)</label>
                <div style={{ paddingTop: 4 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#1565C0', marginBottom: 4 }}>
                    <div>
  <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: 5 }}>
    Budget — <span style={{ color: '#1565C0' }}>KSH {(minPrice/1e6).toFixed(1)}M – {(maxPrice/1e6).toFixed(1)}M</span>
  </label>
  <input type="range" min={0} max={20000000} step={500000} value={minPrice}
    onChange={e => setMinPrice(Math.min(Number(e.target.value), maxPrice - 500000))}
    style={{ width: '100%', accentColor: '#1565C0', marginBottom: 2 }} />
  <input type="range" min={0} max={20000000} step={500000} value={maxPrice}
    onChange={e => setMaxPrice(Math.max(Number(e.target.value), minPrice + 500000))}
    style={{ width: '100%', accentColor: '#1565C0' }} />
  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#CBD5E1', marginTop: 2 }}>
    <span>0</span><span>20M</span>
  </div>
</div>
                  </div>
                  <input type="range" min={0} max={20000000} step={500000} value={price || 0}
                    onChange={e => setPrice(e.target.value === '0' ? '' : e.target.value)}
                    style={{ width: '100%', accentColor: '#1565C0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#CBD5E1', marginTop: 2 }}>
                    <span>0</span><span>20M</span>
                  </div>
                </div>
              </div>
              <button onClick={search} style={{ background: '#1565C0', color: '#fff', border: 'none', padding: '11px 24px', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'Outfit, sans-serif', whiteSpace: 'nowrap' }}>
                Search {totalCars > 0 ? `${totalCars} Cars` : ''} →
              </button>
            </div>

            {/* More filters toggle */}
            <div onClick={() => setShowMore(!showMore)}
              style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', width: 'fit-content' }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#1565C0' }}>{showMore ? '▲ Hide filters' : '▼ More filters'}</span>
            </div>

            {showMore && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12, marginTop: 14, paddingTop: 14, borderTop: '1px solid #F0F4F8' }}>
                <div>
                  <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: 5 }}>Transmission</label>
                  <select value={transmission} onChange={e => setTransmission(e.target.value)} style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #E2E8F0', borderRadius: 8, fontSize: 13, fontFamily: 'DM Sans, sans-serif', outline: 'none', background: '#F8FAFC' }}>
                    <option value="">Any</option>
                    <option>Automatic</option>
                    <option>Manual</option>
                    <option>CVT</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: 5 }}>Fuel Type</label>
                  <select value={fuel} onChange={e => setFuel(e.target.value)} style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #E2E8F0', borderRadius: 8, fontSize: 13, fontFamily: 'DM Sans, sans-serif', outline: 'none', background: '#F8FAFC' }}>
                    <option value="">Any</option>
                    <option>Petrol</option>
                    <option>Diesel</option>
                    <option>Hybrid</option>
                    <option>Electric</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: 5 }}>
                   <div>
                  <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: 5 }}>
                    Year — <span style={{ color: '#1565C0' }}>{minYear} – {maxYear}</span>
                  </label>
                  <input type="range" min={2000} max={2025} value={minYear}
                    onChange={e => setMinYear(Math.min(Number(e.target.value), maxYear - 1))}
                    style={{ width: '100%', accentColor: '#1565C0', marginBottom: 2 }} />
                  <input type="range" min={2000} max={2025} value={maxYear}
                    onChange={e => setMaxYear(Math.max(Number(e.target.value), minYear + 1))}
                    style={{ width: '100%', accentColor: '#1565C0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#CBD5E1', marginTop: 2 }}>
                    <span>2000</span><span>2025</span>
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: 5 }}>
                    Mileage — <span style={{ color: '#1565C0' }}>{minKm.toLocaleString()} – {maxKm.toLocaleString()} km</span>
                  </label>
                  <input type="range" min={0} max={300000} step={5000} value={minKm}
                    onChange={e => setMinKm(Math.min(Number(e.target.value), maxKm - 5000))}
                    style={{ width: '100%', accentColor: '#1565C0', marginBottom: 2 }} />
                  <input type="range" min={0} max={300000} step={5000} value={maxKm}
                    onChange={e => setMaxKm(Math.max(Number(e.target.value), minKm + 5000))}
                    style={{ width: '100%', accentColor: '#1565C0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#CBD5E1', marginTop: 2 }}>
                    <span>0 km</span><span>300,000 km</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div style={{ background: '#EEF5FF', borderBottom: '1px solid #D9E8FA', padding: '14px 24px', display: 'flex', gap: 40 }}>
        {[
          [totalCars > 0 ? `${totalCars}+` : '0', 'Active Listings'],
          [Object.keys(makeCounts).length || '19', 'Car Makes'],
          ['100%', 'Verified Sellers'],
          ['7 Days', 'Support']
        ].map(([n,l]) => (
          <div key={l}>
            <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 20, fontWeight: 700, color: '#1565C0' }}>{n}</div>
            <div style={{ fontSize: 11, color: '#64748B' }}>{l}</div>
          </div>
        ))}
      </div>

      {/* Featured Listings */}
      {featured.length > 0 && (
        <section style={{ padding: '60px 24px', background: '#f8faff' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
              <span style={{ fontSize: 24 }}>⭐</span>
              <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 28, fontWeight: 700, color: '#0A2540', margin: 0 }}>Featured Listings</h2>
              <span style={{ background: '#1565C0', color: 'white', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, letterSpacing: 1 }}>PROMOTED</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
              {featured.map(car => (
                <div key={car.id} style={{ background: 'white', borderRadius: 12, overflow: 'hidden', boxShadow: '0 4px 20px rgba(21,101,192,0.15)', border: '2px solid #1565C0', position: 'relative' }}>
                  <div style={{ position: 'absolute', top: 12, left: 12, background: '#1565C0', color: 'white', fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20, zIndex: 1 }}>⭐ FEATURED</div>
                  <div style={{ height: 200, background: '#e8f0fe', overflow: 'hidden' }}>
                    {car.listing_photos?.[0] ? (
                      <img src={car.listing_photos[0].url} alt={car.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1565C0', fontSize: 40 }}>🚗</div>
                    )}
                  </div>
                  <div style={{ padding: 16 }}>
                    <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700, color: '#0A2540' }}>{car.year} {car.make} {car.model}</h3>
                    <p style={{ margin: '0 0 12px', fontSize: 20, fontWeight: 800, color: '#1565C0' }}>KSH {car.price?.toLocaleString()}</p>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                      {[car.mileage && `${car.mileage?.toLocaleString()} km`, car.fuel_type, car.transmission].filter(Boolean).map((tag, i) => (
                        <span key={i} style={{ background: '#f0f4ff', color: '#1565C0', fontSize: 12, padding: '3px 8px', borderRadius: 6 }}>{tag}</span>
                      ))}
                    </div>
                    <a href={`/listings/${car.id}`} style={{ display: 'block', textAlign: 'center', background: '#1565C0', color: 'white', padding: '10px', borderRadius: 8, textDecoration: 'none', fontWeight: 600, fontSize: 14 }}>View Listing</a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Browse by Make */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 24px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 }}>
          <div>
            <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 24, fontWeight: 700, color: '#0A2540' }}>Browse by Make</div>
            <div style={{ fontSize: 13, color: '#94A3B8', marginTop: 4 }}>Find your preferred brand</div>
          </div>
          <Link to="/listings" style={{ fontSize: 13, fontWeight: 600, color: '#1565C0', textDecoration: 'none' }}>View all →</Link>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {MAKES.map(m => (
            <button key={m} onClick={() => navigate(`/listings?make=${m}`)}
              style={{ padding: '8px 16px', border: '1.5px solid #E2E8F0', borderRadius: 100, fontSize: 13, fontWeight: 600, color: '#475569', cursor: 'pointer', background: '#fff', fontFamily: 'DM Sans, sans-serif' }}
              onMouseOver={e => { e.currentTarget.style.background='#0A2540'; e.currentTarget.style.color='#fff'; e.currentTarget.style.borderColor='#0A2540' }}
              onMouseOut={e => { e.currentTarget.style.background='#fff'; e.currentTarget.style.color='#475569'; e.currentTarget.style.borderColor='#E2E8F0' }}>
              {m}{makeCounts[m] ? <span style={{ fontSize:11, color:'#94A3B8', marginLeft:4 }}>({makeCounts[m]})</span> : ''}
            </button>
          ))}
        </div>
      </div>

      {/* Body Types */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 24px 0' }}>
        <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 24, fontWeight: 700, color: '#0A2540', marginBottom: 20 }}>Browse by Body Style</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12 }}>
          {BODY_TYPES.map(b => (
            <div key={b.t} onClick={() => navigate(`/listings?body=${b.t}`)}
              style={{ background: '#fff', border: '1.5px solid #E8EDF3', borderRadius: 12, padding: '18px 12px', textAlign: 'center', cursor: 'pointer' }}>
              <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 13, fontWeight: 700, color: '#0A2540', marginBottom: 3 }}>{b.t}</div>
              <div style={{ fontSize: 11, color: '#94A3B8' }}>{b.t in makeCounts ? makeCounts[b.t] : b.c} cars</div>
            </div>
          ))}
        </div>
      </div>

      {/* Dealer CTA */}
      <div style={{ maxWidth: 1200, margin: '48px auto', padding: '0 24px' }}>
        <div style={{ background: '#0A2540', borderRadius: 16, padding: '48px', display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center', gap: 32 }}>
          <div>
            <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 28, fontWeight: 800, color: '#fff', marginBottom: 10 }}>Are You a Dealer?<br />List Your Inventory Free</div>
            <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14, lineHeight: 1.6 }}>Join Kenya's fastest-growing car platform. Reach thousands of active buyers with zero listing fees for a limited time.</div>
          </div>
          <Link to="/pricing" style={{ background: '#4DA6FF', color: '#0A2540', padding: '14px 28px', borderRadius: 10, fontWeight: 800, fontSize: 14, textDecoration: 'none', fontFamily: 'Outfit, sans-serif', whiteSpace: 'nowrap' }}>Become a Dealer →</Link>
        </div>
      </div>

      {/* Footer */}
      <footer style={{ background: '#060F1A', padding: '28px 24px', textAlign: 'center' }}>
        <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 16, fontWeight: 800, color: '#fff', marginBottom: 6 }}>CarExpert<span style={{ color: '#4DA6FF' }}>Africa</span>®</div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>Kenya's Ultimate Car Listing Platform · Westlands, Nairobi · © 2025</div>
      </footer>
    </div>
  )
}
