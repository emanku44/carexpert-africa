import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'

const MAKES = ['Toyota','Mercedes-Benz','Mazda','Audi','Volkswagen','Subaru','BMW','Lexus','Nissan','Mitsubishi','Porsche','Range Rover','Suzuki','Honda']
const BODIES = ['SUV','Sedan','Hatchback','Minivan','Pickup','Coupe']
const FUELS = ['Petrol','Diesel','Hybrid','Electric']
const TRANS = ['Automatic','Manual']
const DRIVES = ['AWD','4WD','FWD','RWD']

const SAMPLE_CARS = [
  { id:1, make:'Toyota', model:'Land Cruiser Prado 150', year:2019, price:6200000, km:62200, fuel:'Petrol', tx:'Automatic', body:'SUV', cc:2700, badge:'Featured', bg:'#C8DCF0', fg:'#0D3B6E' },
  { id:2, make:'Mercedes-Benz', model:'S300H', year:2016, price:5800000, km:75000, fuel:'Diesel', tx:'Automatic', body:'SUV', cc:2200, badge:'Special', bg:'#C8E6C9', fg:'#1B5E20' },
  { id:3, make:'Porsche', model:'Cayenne', year:2016, price:7500000, km:63062, fuel:'Petrol', tx:'Automatic', body:'SUV', cc:3000, badge:'Special', bg:'#F5E0C8', fg:'#6D3B00' },
  { id:4, make:'Toyota', model:'RAV4 LE', year:2019, price:4650000, km:96000, fuel:'Petrol', tx:'Automatic', body:'SUV', cc:2000, badge:null, bg:'#E0D0F0', fg:'#4A235A' },
  { id:5, make:'BMW', model:'X1', year:2016, price:3950000, km:94500, fuel:'Petrol', tx:'Automatic', body:'SUV', cc:2000, badge:null, bg:'#C8E0F0', fg:'#0D3B6E' },
  { id:6, make:'Mitsubishi', model:'Outlander PHEV', year:2017, price:3050000, km:46900, fuel:'Petrol', tx:'Automatic', body:'SUV', cc:2000, badge:null, bg:'#F0C8C8', fg:'#6D1B1B' },
  { id:7, make:'Mazda', model:'CX-5 2.0', year:2018, price:3400000, km:58000, fuel:'Petrol', tx:'Automatic', body:'SUV', cc:2000, badge:null, bg:'#C8F0D8', fg:'#1B5E30' },
  { id:8, make:'Audi', model:'Q5 2.0T', year:2017, price:5200000, km:71000, fuel:'Petrol', tx:'Automatic', body:'SUV', cc:2000, badge:null, bg:'#F0E8C8', fg:'#5D4E00' },
]

const fmt = (n) => 'KSH ' + Number(n).toLocaleString()

const CarSVG = ({ bg, fg }) => (
  <svg width="100" height="58" viewBox="0 0 100 58" fill="none">
    <rect x="9" y="20" width="82" height="24" rx="5" fill={fg} opacity=".15"/>
    <path d="M18 20 L29 5 H71 L82 20" fill={fg} opacity=".12"/>
    <circle cx="25" cy="45" r="10" fill={fg} opacity=".25"/>
    <circle cx="75" cy="45" r="10" fill={fg} opacity=".25"/>
    <circle cx="25" cy="45" r="4" fill={fg} opacity=".4"/>
    <circle cx="75" cy="45" r="4" fill={fg} opacity=".4"/>
  </svg>
)

export default function ListingsPage({ user }) {
  const navigate = useNavigate()
  const [checks, setChecks] = useState({ makes: new Set(), bodies: new Set(), fuels: new Set(), trans: new Set(), drives: new Set() })
  const [minPrice, setMinPrice] = useState(0)
  const [maxPrice, setMaxPrice] = useState(30000000)
  const [minYear, setMinYear]   = useState(2010)
  const [maxYear, setMaxYear]   = useState(2025)
  const [minKm, setMinKm]       = useState(0)
  const [maxKm, setMaxKm]       = useState(250000)
  const [sort, setSort]         = useState('newest')
  const [saved, setSaved]       = useState(new Set())

  const toggleCheck = (key, val) => {
    setChecks(prev => {
      const next = new Set(prev[key])
      next.has(val) ? next.delete(val) : next.add(val)
      return { ...prev, [key]: next }
    })
  }

  const clearAll = () => {
    setChecks({ makes: new Set(), bodies: new Set(), fuels: new Set(), trans: new Set(), drives: new Set() })
    setMinPrice(0); setMaxPrice(30000000)
    setMinYear(2010); setMaxYear(2025)
    setMinKm(0); setMaxKm(250000)
  }

  const filtered = SAMPLE_CARS.filter(c => {
    if (checks.makes.size  && !checks.makes.has(c.make))  return false
    if (checks.bodies.size && !checks.bodies.has(c.body)) return false
    if (checks.fuels.size  && !checks.fuels.has(c.fuel))  return false
    if (checks.trans.size  && !checks.trans.has(c.tx))    return false
    if (c.price < minPrice || c.price > maxPrice) return false
    if (c.year  < minYear  || c.year  > maxYear)  return false
    if (c.km    < minKm    || c.km    > maxKm)    return false
    return true
  }).sort((a, b) => {
    if (sort === 'price_asc')  return a.price - b.price
    if (sort === 'price_desc') return b.price - a.price
    if (sort === 'mileage')    return a.km - b.km
    if (sort === 'year')       return b.year - a.year
    return b.id - a.id
  })

  const activeTags = [
    ...[...checks.makes].map(v => ({ label: v, clear: () => toggleCheck('makes', v) })),
    ...[...checks.bodies].map(v => ({ label: v, clear: () => toggleCheck('bodies', v) })),
    ...[...checks.fuels].map(v => ({ label: v, clear: () => toggleCheck('fuels', v) })),
    ...[...checks.trans].map(v => ({ label: v, clear: () => toggleCheck('trans', v) })),
    ...(minPrice > 0 || maxPrice < 30000000 ? [{ label: `KSH ${(minPrice/1e6).toFixed(1)}M – ${(maxPrice/1e6).toFixed(1)}M`, clear: () => { setMinPrice(0); setMaxPrice(30000000) } }] : []),
    ...(minYear > 2010 || maxYear < 2025 ? [{ label: `${minYear} – ${maxYear}`, clear: () => { setMinYear(2010); setMaxYear(2025) } }] : []),
    ...(minKm > 0 || maxKm < 250000 ? [{ label: `${minKm.toLocaleString()} – ${maxKm.toLocaleString()} km`, clear: () => { setMinKm(0); setMaxKm(250000) } }] : []),
  ]

  const SbSection = ({ title, items, filterKey }) => (
    <div style={{ borderTop: '1px solid #F5F7FA', padding: '12px 16px' }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: 10, fontFamily: 'Outfit, sans-serif' }}>{title}</div>
      {items.map(item => (
        <div key={item} onClick={() => toggleCheck(filterKey, item)} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7, cursor: 'pointer' }}>
          <div style={{ width: 14, height: 14, border: `1.5px solid ${checks[filterKey].has(item) ? '#1565C0' : '#CBD5E1'}`, borderRadius: 3, background: checks[filterKey].has(item) ? '#1565C0' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 9, color: '#fff' }}>
            {checks[filterKey].has(item) ? '✓' : ''}
          </div>
          <span style={{ fontSize: 12, color: '#475569', fontWeight: 500 }}>{item}</span>
        </div>
      ))}
    </div>
  )

  const RangeSection = ({ title, min, max, absMin, absMax, setMin, setMax, format }) => (
    <div style={{ borderTop: '1px solid #F5F7FA', padding: '12px 16px' }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: 10, fontFamily: 'Outfit, sans-serif' }}>{title}</div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
        <input value={format ? format(min) : min} readOnly style={{ flex: 1, padding: '6px 8px', border: '1.5px solid #E2E8F0', borderRadius: 7, fontSize: 11, fontWeight: 600, textAlign: 'center', background: '#F8FAFC', fontFamily: 'DM Sans, sans-serif' }} />
        <span style={{ alignSelf: 'center', color: '#94A3B8', fontSize: 12 }}>–</span>
        <input value={format ? format(max) : max} readOnly style={{ flex: 1, padding: '6px 8px', border: '1.5px solid #E2E8F0', borderRadius: 7, fontSize: 11, fontWeight: 600, textAlign: 'center', background: '#F8FAFC', fontFamily: 'DM Sans, sans-serif' }} />
      </div>
      <input type="range" min={absMin} max={absMax} value={min} onChange={e => setMin(Math.min(Number(e.target.value), max - 1))} style={{ width: '100%', accentColor: '#1565C0', marginBottom: 4 }} />
      <input type="range" min={absMin} max={absMax} value={max} onChange={e => setMax(Math.max(Number(e.target.value), min + 1))} style={{ width: '100%', accentColor: '#1565C0' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#94A3B8', marginTop: 4 }}>
        <span>{format ? format(absMin) : absMin}</span><span>{format ? format(absMax) : absMax}</span>
      </div>
    </div>
  )

  return (
    <div style={{ fontFamily: 'DM Sans, sans-serif', background: '#F7F9FC', minHeight: '100vh' }}>
      <Navbar user={user} />
      <div style={{ background: '#fff', borderBottom: '1px solid #E8EDF3', padding: '10px 24px', fontSize: 12, color: '#94A3B8' }}>
        <Link to="/" style={{ color: '#1565C0', textDecoration: 'none' }}>Home</Link> / All Listings
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '252px 1fr', minHeight: 'calc(100vh - 96px)' }}>
        {/* Sidebar */}
        <aside style={{ background: '#fff', borderRight: '1px solid #E8EDF3', overflowY: 'auto' }}>
          <div style={{ padding: '14px 16px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F0F4F8', position: 'sticky', top: 0, background: '#fff', zIndex: 2 }}>
            <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: 13, fontWeight: 700, color: '#0A2540' }}>Filters</span>
            <button onClick={clearAll} style={{ fontSize: 11, color: '#EF4444', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>✕ Clear all</button>
          </div>
          <SbSection title="Make"       items={MAKES}  filterKey="makes" />
          <SbSection title="Body Type"  items={BODIES} filterKey="bodies" />
          <RangeSection title="Budget (KSH)" min={minPrice} max={maxPrice} absMin={0} absMax={30000000} setMin={setMinPrice} setMax={setMaxPrice} format={n => `${(n/1e6).toFixed(1)}M`} />
          <RangeSection title="Year"    min={minYear}  max={maxYear}  absMin={1990} absMax={2025} setMin={setMinYear}  setMax={setMaxYear} />
          <RangeSection title="Mileage (km)" min={minKm} max={maxKm} absMin={0} absMax={300000} setMin={setMinKm} setMax={setMaxKm} format={n => n.toLocaleString()} />
          <SbSection title="Fuel Type"  items={FUELS}  filterKey="fuels" />
          <SbSection title="Transmission" items={TRANS} filterKey="trans" />
          <SbSection title="Drive Type" items={DRIVES} filterKey="drives" />
          <div style={{ padding: 16 }}>
            <button style={{ width: '100%', background: '#0A2540', color: '#fff', border: 'none', padding: 10, borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}>Apply Filters</button>
          </div>
        </aside>

        {/* Main */}
        <main style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 18, fontWeight: 700, color: '#0A2540' }}>
              {filtered.length} Cars <span style={{ color: '#94A3B8', fontSize: 13, fontWeight: 400, fontFamily: 'DM Sans, sans-serif' }}>in Kenya</span>
            </div>
            <select value={sort} onChange={e => setSort(e.target.value)} style={{ padding: '7px 12px', border: '1.5px solid #E2E8F0', borderRadius: 7, fontSize: 12, fontFamily: 'DM Sans, sans-serif', outline: 'none', background: '#fff' }}>
              <option value="newest">Newest First</option>
              <option value="price_asc">Price: Low → High</option>
              <option value="price_desc">Price: High → Low</option>
              <option value="mileage">Lowest Mileage</option>
              <option value="year">Newest Year</option>
            </select>
          </div>

          {/* Active filter tags */}
          {activeTags.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
              {activeTags.map((t, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#EEF4FF', border: '1px solid #BDD5FF', borderRadius: 100, padding: '3px 10px', fontSize: 11, fontWeight: 600, color: '#1565C0' }}>
                  {t.label} <span onClick={t.clear} style={{ cursor: 'pointer', fontSize: 14 }}>×</span>
                </div>
              ))}
            </div>
          )}

          {/* Cars grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {filtered.map(car => (
              <div key={car.id} style={{ background: '#fff', border: '1.5px solid #E8EDF3', borderRadius: 12, overflow: 'hidden', cursor: 'pointer', transition: 'all .2s' }}
                onMouseOver={e => { e.currentTarget.style.borderColor='#1565C0'; e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 8px 24px rgba(21,101,192,.1)' }}
                onMouseOut={e => { e.currentTarget.style.borderColor='#E8EDF3'; e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='none' }}>
                <div style={{ height: 160, background: car.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                  {car.badge && <span style={{ position: 'absolute', top: 8, left: 8, background: '#1565C0', color: '#fff', fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 100, textTransform: 'uppercase', fontFamily: 'Outfit, sans-serif' }}>{car.badge}</span>}
                  <button onClick={e => { e.stopPropagation(); setSaved(prev => { const n = new Set(prev); n.has(car.id) ? n.delete(car.id) : n.add(car.id); return n }) }}
                    style={{ position: 'absolute', top: 8, right: 8, width: 28, height: 28, background: 'rgba(255,255,255,.92)', borderRadius: '50%', border: 'none', cursor: 'pointer', fontSize: 14, color: saved.has(car.id) ? '#EF4444' : '#94A3B8' }}>
                    {saved.has(car.id) ? '♥' : '♡'}
                  </button>
                  <CarSVG bg={car.bg} fg={car.fg} />
                </div>
                <div style={{ padding: 12 }}>
                  <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 17, fontWeight: 800, color: '#0A2540', marginBottom: 2 }}>{fmt(car.price)}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#64748B', marginBottom: 8 }}>{car.year} {car.make} {car.model}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
                    {[`${car.km.toLocaleString()} km`, car.fuel, car.tx, `${car.cc}cc`, car.body].map((s, i) => (
                      <span key={i} style={{ fontSize: 10, color: '#94A3B8', padding: '2px 6px', background: '#F8FAFC', borderRadius: 100, border: '1px solid #E8EDF3' }}>{s}</span>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <a href={`https://wa.me/?text=I'm interested in the ${car.year} ${car.make} ${car.model} on CarExpert Africa`} target="_blank" rel="noopener noreferrer"
                      style={{ flex: 1, background: '#25D366', color: '#fff', border: 'none', padding: '7px 0', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'Outfit, sans-serif', textAlign: 'center', textDecoration: 'none' }}>
                      WhatsApp
                    </a>
                    <Link to={`/listings/${car.id}`} style={{ flex: 1, background: '#F0F6FF', color: '#1565C0', border: '1.5px solid #BDD5FF', padding: '7px 0', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'Outfit, sans-serif', textAlign: 'center', textDecoration: 'none' }}>
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: 60, color: '#94A3B8' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>🔍</div>
              <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 16, fontWeight: 700, color: '#0A2540', marginBottom: 6 }}>No cars match your filters</div>
              <div style={{ fontSize: 13 }}>Try adjusting or clearing your filters</div>
              <button onClick={clearAll} style={{ marginTop: 16, background: '#1565C0', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}>Clear All Filters</button>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
