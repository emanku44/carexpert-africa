import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { supabase } from '../lib/supabase'

const MAKES = ['Toyota','Mercedes-Benz','Mazda','Audi','Volkswagen','Subaru','BMW','Lexus','Nissan','Mitsubishi','Porsche','Land Rover','Suzuki','Honda','Hyundai','Kia','Ford','Isuzu']
const BODIES = ['SUV','Sedan','Hatchback','Minivan','Pickup','Coupe','Wagon','Truck']
const FUELS = ['Petrol','Diesel','Hybrid','Electric','LPG']
const TRANS = ['Automatic','Manual','CVT']
const DRIVES = ['AWD','4WD','FWD','RWD','4x4']

const fmt = (n) => 'KSH ' + Number(n).toLocaleString()

export default function ListingsPage({ user }) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)

  const [checks, setChecks] = useState({
    makes: searchParams.get('make') ? new Set([searchParams.get('make')]) : new Set(),
    bodies: searchParams.get('body') ? new Set([searchParams.get('body')]) : new Set(),
    fuels: new Set(),
    trans: new Set(),
    drives: new Set()
  })
  const [minPrice, setMinPrice] = useState(0)
  const [maxPrice, setMaxPrice] = useState(30000000)
  const [minYear, setMinYear]   = useState(1990)
  const [maxYear, setMaxYear]   = useState(2025)
  const [minKm, setMinKm]       = useState(0)
  const [maxKm, setMaxKm]       = useState(300000)
  const [sort, setSort]         = useState('newest')
  const [selectedModel, setSelectedModel] = useState('')
  const [saved, setSaved]       = useState(new Set())

  useEffect(() => {
    fetchListings()
  }, [])

  const fetchListings = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('listings')
      .select('*, listing_photos(*)')
      .eq('status', 'approved')
      .order('featured', { ascending: false })
      .order('created_at', { ascending: false })
    if (!error) setListings(data || [])
    setLoading(false)
  }

  const toggleCheck = (key, val) => {
    setChecks(prev => {
      const next = new Set(prev[key])
      next.has(val) ? next.delete(val) : next.add(val)
      return { ...prev, [key]: next }
    })
  }

const clearAll = () => {
  setChecks({ makes: new Set(), bodies: new Set(), fuels: new Set(), trans: new Set(), drives: new Set() })
  setSelectedModel('')
  setMinPrice(0); setMaxPrice(30000000)
  setMinYear(1990); setMaxYear(2025)
  setMinKm(0); setMaxKm(300000)
}

  const filtered = listings.filter(c => {
    if (checks.makes.size  && !checks.makes.has(c.make))       return false
    if (selectedModel && c.model !== selectedModel) return false
    if (checks.bodies.size && !checks.bodies.has(c.body_type)) return false
    if (checks.fuels.size  && !checks.fuels.has(c.fuel_type))  return false
    if (checks.trans.size  && !checks.trans.has(c.transmission)) return false
    if (checks.drives.size && !checks.drives.has(c.drive_type)) return false
    if (c.price < minPrice || c.price > maxPrice) return false
    if (c.year  < minYear  || c.year  > maxYear)  return false
    if (c.mileage < minKm  || c.mileage > maxKm)  return false
    return true
  }).sort((a, b) => {
    if (sort === 'price_asc')  return a.price - b.price
    if (sort === 'price_desc') return b.price - a.price
    if (sort === 'mileage')    return a.mileage - b.mileage
    if (sort === 'year')       return b.year - a.year
    return new Date(b.created_at) - new Date(a.created_at)
  })

  const activeTags = [
    ...[...checks.makes].map(v => ({ label: v, clear: () => toggleCheck('makes', v) })),
    ...[...checks.bodies].map(v => ({ label: v, clear: () => toggleCheck('bodies', v) })),
    ...[...checks.fuels].map(v => ({ label: v, clear: () => toggleCheck('fuels', v) })),
    ...[...checks.trans].map(v => ({ label: v, clear: () => toggleCheck('trans', v) })),
    ...(minPrice > 0 || maxPrice < 30000000 ? [{ label: `KSH ${(minPrice/1e6).toFixed(1)}M – ${(maxPrice/1e6).toFixed(1)}M`, clear: () => { setMinPrice(0); setMaxPrice(30000000) } }] : []),
    ...(minYear > 1990 || maxYear < 2025 ? [{ label: `${minYear} – ${maxYear}`, clear: () => { setMinYear(1990); setMaxYear(2025) } }] : []),
    ...(minKm > 0 || maxKm < 300000 ? [{ label: `${minKm.toLocaleString()} – ${maxKm.toLocaleString()} km`, clear: () => { setMinKm(0); setMaxKm(300000) } }] : []),
  ]

  const SbSection = ({ title, items, filterKey }) => {
  const [open, setOpen] = useState(false)
  const activeCount = checks[filterKey].size
  return (
    <div style={{ borderTop: '1px solid #F5F7FA' }}>
      <div onClick={() => setOpen(!open)}
        style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '.8px', fontFamily: 'Outfit, sans-serif' }}>{title}</span>
          {activeCount > 0 && (
            <span style={{ background: '#1565C0', color: '#fff', borderRadius: 100, padding: '1px 6px', fontSize: 9, fontWeight: 700, fontFamily: 'Outfit, sans-serif' }}>{activeCount}</span>
          )}
        </div>
        <span style={{ color: '#94A3B8', fontSize: 12, transition: 'transform .2s', display: 'inline-block', transform: open ? 'rotate(180deg)' : 'none' }}>▾</span>
      </div>
      {open && (
        <div style={{ padding: '0 16px 12px' }}>
          {items.map(item => (
            <div key={item} onClick={() => toggleCheck(filterKey, item)} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7, cursor: 'pointer' }}>
              <div style={{ width: 14, height: 14, border: `1.5px solid ${checks[filterKey].has(item) ? '#1565C0' : '#CBD5E1'}`, borderRadius: 3, background: checks[filterKey].has(item) ? '#1565C0' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 9, color: '#fff' }}>
                {checks[filterKey].has(item) ? '✓' : ''}
              </div>
              <span style={{ fontSize: 12, color: '#475569', fontWeight: 500 }}>
  {item}
  {filterKey === 'makes' && listings.filter(l => l.make === item).length > 0 && (
    <span style={{ color: '#94A3B8', fontSize: 11, marginLeft: 4 }}>
      ({listings.filter(l => l.make === item).length})
    </span>
  )}
</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

  const RangeSection = ({ title, min, max, absMin, absMax, setMin, setMax, format }) => (
  <div style={{ borderTop: '1px solid #F5F7FA', padding: '12px 16px' }}>
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
      <span style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '.8px', fontFamily: 'Outfit, sans-serif' }}>{title}</span>
      <span style={{ fontSize: 11, fontWeight: 700, color: '#1565C0', fontFamily: 'Outfit, sans-serif' }}>
        {format ? format(min) : min} – {format ? format(max) : max}
      </span>
    </div>
    <input type="range" min={absMin} max={absMax} value={min}
      onChange={e => setMin(Math.min(Number(e.target.value), max - 1))}
      style={{ width: '100%', accentColor: '#1565C0', marginBottom: 4 }} />
    <input type="range" min={absMin} max={absMax} value={max}
      onChange={e => setMax(Math.max(Number(e.target.value), min + 1))}
      style={{ width: '100%', accentColor: '#1565C0' }} />
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#CBD5E1', marginTop: 4 }}>
      <span>{format ? format(absMin) : absMin}</span>
      <span>{format ? format(absMax) : absMax}</span>
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
          <SbSection title="Make" items={MAKES} filterKey="makes" />

{checks.makes.size === 1 && (() => {
  const selectedMake = [...checks.makes][0]
  const CAR_MODELS = {
    Toyota: ['Allion','Alphard','Camry','Corolla','Crown','Fielder','Fortuner','Harrier','Hiace','Hilux','Land Cruiser 200','Land Cruiser 300','Land Cruiser Prado 120','Land Cruiser Prado 150','Mark X','Noah','Premio','Probox','RAV4','Rush','Succeed','Vanguard','Vellfire','Voxy','Wish'],
    Nissan: ['Caravan','Elgrand','Juke','March','Murano','Navara','Note','Patrol','Qashqai','Serena','Sylphy','Teana','Tiida','Urvan','X-Trail'],
    Mazda: ['Atenza','Axela','BT-50','CX-3','CX-5','CX-7','CX-9','Demio','MPV'],
    Subaru: ['Forester','Impreza','Legacy','Outback','Tribeca','WRX','XV'],
    Mitsubishi: ['Colt','Eclipse Cross','Galant','L200','Lancer','Montero','Outlander','Pajero','Pajero Mini'],
    BMW: ['1 Series','2 Series','3 Series','5 Series','7 Series','X1','X3','X5','X6'],
    'Mercedes-Benz': ['A-Class','B-Class','C-Class','E-Class','GLC','GLE','GLS','GL','ML','S-Class'],
    Audi: ['A3','A4','A6','Q3','Q5','Q7','TT'],
    Volkswagen: ['Amarok','Golf','Passat','Polo','Tiguan','Touareg','Transporter'],
    Honda: ['Accord','CR-V','Civic','Fit','Freed','HR-V','Jazz','Odyssey','Pilot','StepWagon','Stream'],
    Hyundai: ['Creta','Elantra','Santa Fe','Tucson','i10','i20','ix35'],
    Kia: ['Carnival','Cerato','Picanto','Rio','Sorento','Sportage'],
    Ford: ['EcoSport','Everest','Explorer','Fusion','Mustang','Ranger'],
    'Land Rover': ['Defender','Discovery','Discovery Sport','Freelander','Range Rover','Range Rover Evoque','Range Rover Sport'],
    Lexus: ['GS','GX','IS','LS','LX','NX','RX','UX'],
    Isuzu: ['D-Max','MU-X','Trooper'],
    Suzuki: ['Alto','Baleno','Ertiga','Escudo','Grand Vitara','Jimny','Swift','Vitara'],
    Porsche: ['911','Cayenne','Macan','Panamera'],
  }
  const allModels = CAR_MODELS[selectedMake] || []
  const liveCounts = {}
  listings.filter(l => l.make === selectedMake).forEach(l => {
    if (l.model) liveCounts[l.model] = (liveCounts[l.model] || 0) + 1
  })
  return (
    <div style={{ borderTop: '1px solid #F5F7FA', padding: '12px 16px' }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: 8, fontFamily: 'Outfit, sans-serif' }}>Model</div>
      <select value={selectedModel} onChange={e => setSelectedModel(e.target.value)}
        style={{ width: '100%', padding: '8px 10px', border: '1.5px solid #E2E8F0', borderRadius: 7, fontSize: 12, fontFamily: 'DM Sans, sans-serif', outline: 'none', background: '#F8FAFC' }}>
        <option value="">All {selectedMake} Models</option>
        {allModels.map(m => (
          <option key={m} value={m}>{m}{liveCounts[m] ? ` (${liveCounts[m]})` : '
          <SbSection title="Body Type"    items={BODIES} filterKey="bodies" />
          <RangeSection title="Budget (KSH)" min={minPrice} max={maxPrice} absMin={0} absMax={30000000} setMin={setMinPrice} setMax={setMaxPrice} format={n => `${(n/1e6).toFixed(1)}M`} />
          <RangeSection title="Year"      min={minYear}  max={maxYear}  absMin={1990} absMax={2025} setMin={setMinYear}  setMax={setMaxYear} />
          <RangeSection title="Mileage (km)" min={minKm} max={maxKm} absMin={0} absMax={300000} setMin={setMinKm} setMax={setMaxKm} format={n => n.toLocaleString()} />
          <SbSection title="Fuel Type"    items={FUELS}  filterKey="fuels" />
          <SbSection title="Transmission" items={TRANS}  filterKey="trans" />
          <SbSection title="Drive Type"   items={DRIVES} filterKey="drives" />
        </aside>

        {/* Main */}
        <main style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 18, fontWeight: 700, color: '#0A2540' }}>
              {loading ? 'Loading...' : `${filtered.length} Cars`} <span style={{ color: '#94A3B8', fontSize: 13, fontWeight: 400, fontFamily: 'DM Sans, sans-serif' }}>in Kenya</span>
            </div>
            <select value={sort} onChange={e => setSort(e.target.value)} style={{ padding: '7px 12px', border: '1.5px solid #E2E8F0', borderRadius: 7, fontSize: 12, fontFamily: 'DM Sans, sans-serif', outline: 'none', background: '#fff' }}>
              <option value="newest">Newest First</option>
              <option value="price_asc">Price: Low → High</option>
              <option value="price_desc">Price: High → Low</option>
              <option value="mileage">Lowest Mileage</option>
              <option value="year">Newest Year</option>
            </select>
          </div>

          {activeTags.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
              {activeTags.map((t, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#EEF4FF', border: '1px solid #BDD5FF', borderRadius: 100, padding: '3px 10px', fontSize: 11, fontWeight: 600, color: '#1565C0' }}>
                  {t.label} <span onClick={t.clear} style={{ cursor: 'pointer', fontSize: 14 }}>×</span>
                </div>
              ))}
            </div>
          )}

          {loading ? (
            <div style={{ textAlign: 'center', padding: 60, color: '#94A3B8' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>🔍</div>
              <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 16, fontWeight: 700, color: '#0A2540' }}>Loading listings...</div>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, color: '#94A3B8' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>🔍</div>
              <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 16, fontWeight: 700, color: '#0A2540', marginBottom: 6 }}>
                {listings.length === 0 ? 'No listings yet' : 'No cars match your filters'}
              </div>
              <div style={{ fontSize: 13, marginBottom: 16 }}>
                {listings.length === 0 ? 'Be the first to list a car on CarExpert Africa.' : 'Try adjusting or clearing your filters'}
              </div>
              {listings.length === 0
                ? <Link to="/list-car" style={{ background: '#1565C0', color: '#fff', padding: '10px 24px', borderRadius: 8, fontSize: 13, fontWeight: 700, textDecoration: 'none', fontFamily: 'Outfit, sans-serif' }}>List a Car</Link>
                : <button onClick={clearAll} style={{ background: '#1565C0', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}>Clear All Filters</button>
              }
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {filtered.map(car => (
                <div key={car.id} style={{ background: '#fff', border: '1.5px solid #E8EDF3', borderRadius: 12, overflow: 'hidden', cursor: 'pointer', transition: 'all .2s' }}
                  onMouseOver={e => { e.currentTarget.style.borderColor='#1565C0'; e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 8px 24px rgba(21,101,192,.1)' }}
                  onMouseOut={e => { e.currentTarget.style.borderColor='#E8EDF3'; e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='none' }}>

                  {/* Photo */}
                  <div style={{ height: 180, background: '#EEF5FF', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                    {car.featured && (
                      <span style={{ position: 'absolute', top: 8, left: 8, background: '#1565C0', color: '#fff', fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 100, textTransform: 'uppercase', fontFamily: 'Outfit, sans-serif', zIndex: 1 }}>⭐ Featured</span>
                    )}
                    <button onClick={e => { e.stopPropagation(); setSaved(prev => { const n = new Set(prev); n.has(car.id) ? n.delete(car.id) : n.add(car.id); return n }) }}
                      style={{ position: 'absolute', top: 8, right: 8, width: 28, height: 28, background: 'rgba(255,255,255,.92)', borderRadius: '50%', border: 'none', cursor: 'pointer', fontSize: 14, color: saved.has(car.id) ? '#EF4444' : '#94A3B8', zIndex: 1 }}>
                      {saved.has(car.id) ? '♥' : '♡'}
                    </button>
                    {car.listing_photos?.[0]?.url
                      ? <img src={car.listing_photos[0].url} alt={`${car.year} ${car.make} ${car.model}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 40 }}>🚗</span>
                          <span style={{ fontSize: 11, color: '#94A3B8' }}>No photos yet</span>
                        </div>
                    }
                  </div>

                  <div style={{ padding: 12 }}>
                    <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 17, fontWeight: 800, color: '#0A2540', marginBottom: 2 }}>{fmt(car.price)}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#64748B', marginBottom: 8 }}>{car.year} {car.make} {car.model}</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
                      {[
                        car.mileage && `${Number(car.mileage).toLocaleString()} km`,
                        car.fuel_type,
                        car.transmission,
                        car.engine_cc && `${car.engine_cc}cc`,
                        car.body_type
                      ].filter(Boolean).map((s, i) => (
                        <span key={i} style={{ fontSize: 10, color: '#94A3B8', padding: '2px 6px', background: '#F8FAFC', borderRadius: 100, border: '1px solid #E8EDF3' }}>{s}</span>
                      ))}
                    </div>
                    <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 8 }}>📍 {car.location}</div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <a href={`https://wa.me/${(car.phone||'').replace(/\D/g,'')}?text=Hi, I'm interested in your ${car.year} ${car.make} ${car.model} on CarExpert Africa`}
                        target="_blank" rel="noopener noreferrer"
                        style={{ flex: 1, background: '#25D366', color: '#fff', border: 'none', padding: '7px 0', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'Outfit, sans-serif', textAlign: 'center', textDecoration: 'none' }}
                        onClick={e => e.stopPropagation()}>
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
          )}
        </main>
      </div>
    </div>
  )
}