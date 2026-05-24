import { Link, useNavigate } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import Navbar from '../components/Navbar'
import { getFeaturedListings, supabase } from '../lib/supabase'

const MAKES = ['Toyota','Mercedes-Benz','Mazda','Audi','Volkswagen','Subaru','BMW','Lexus','Nissan','Mitsubishi','Porsche','Suzuki','Honda','Isuzu']
const BODY_TYPES = [{ t:'SUV' },{ t:'Sedan' },{ t:'Hatchback' },{ t:'Minivan' },{ t:'Pickup' },{ t:'Coupe' }]

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
  Lexus: ['GS','GX','IS','LS','LX','NX','RX','UX'],
  Isuzu: ['D-Max','MU-X','Trooper'],
  Suzuki: ['Alto','Baleno','Ertiga','Escudo','Grand Vitara','Jimny','Swift','Vitara'],
  Porsche: ['911','Cayenne','Macan','Panamera'],
}

function DualSlider({ minVal, maxVal, absMin, absMax, step, setMin, setMax, formatLabel }) {
  const trackRef = useRef(null)
  const dragging = useRef(null)

  const toPercent = v => ((v - absMin) / (absMax - absMin)) * 100
  const fromPercent = pct => Math.round((absMin + (pct / 100) * (absMax - absMin)) / step) * step

  const getPercFromEvent = e => {
    const track = trackRef.current
    if (!track) return 0
    const rect = track.getBoundingClientRect()
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    return Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100))
  }

  const onMouseDown = handle => e => {
    e.preventDefault()
    dragging.current = handle
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    window.addEventListener('touchmove', onMove, { passive: false })
    window.addEventListener('touchend', onUp)
  }

  const onMove = e => {
    if (e.cancelable) e.preventDefault()
    const val = fromPercent(getPercFromEvent(e))
    if (dragging.current === 'min') setMin(Math.min(val, maxVal - step))
    if (dragging.current === 'max') setMax(Math.max(val, minVal + step))
  }

  const onUp = () => {
    dragging.current = null
    window.removeEventListener('mousemove', onMove)
    window.removeEventListener('mouseup', onUp)
    window.removeEventListener('touchmove', onMove)
    window.removeEventListener('touchend', onUp)
  }

  const minPct = toPercent(minVal)
  const maxPct = toPercent(maxVal)

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
        <span style={{ fontSize:11, fontWeight:700, color:'#1565C0' }}>{formatLabel(minVal)}</span>
        <span style={{ fontSize:11, fontWeight:700, color:'#1565C0' }}>{formatLabel(maxVal)}</span>
      </div>
      <div ref={trackRef} style={{ position:'relative', height:6, background:'#E2E8F0', borderRadius:100, cursor:'pointer', userSelect:'none', margin:'0 9px' }}>
        <div style={{ position:'absolute', left:`${minPct}%`, right:`${100-maxPct}%`, top:0, height:'100%', background:'#1565C0', borderRadius:100 }}/>
        <div onMouseDown={onMouseDown('min')} onTouchStart={onMouseDown('min')}
          style={{ position:'absolute', left:`${minPct}%`, top:'50%', transform:'translate(-50%,-50%)', width:18, height:18, borderRadius:'50%', background:'#1565C0', border:'2px solid #fff', boxShadow:'0 2px 6px rgba(21,101,192,.4)', cursor:'grab', zIndex:2 }}/>
        <div onMouseDown={onMouseDown('max')} onTouchStart={onMouseDown('max')}
          style={{ position:'absolute', left:`${maxPct}%`, top:'50%', transform:'translate(-50%,-50%)', width:18, height:18, borderRadius:'50%', background:'#1565C0', border:'2px solid #fff', boxShadow:'0 2px 6px rgba(21,101,192,.4)', cursor:'grab', zIndex:2 }}/>
      </div>
      <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:'#CBD5E1', marginTop:6 }}>
        <span>{formatLabel(absMin)}</span><span>{formatLabel(absMax)}</span>
      </div>
    </div>
  )
}
function DealersBar() {
  const [dealers, setDealers] = useState([])

  useEffect(() => {
    supabase
      .from('dealers')
      .select('name, location')
      .order('created_at', { ascending: true })
      .then(({ data }) => setDealers(data || []))
  }, [])

  if (dealers.length === 0) return null

  const items = [...dealers, ...dealers, ...dealers]

  return (
    <div style={{ background: '#0A2540', padding: '20px 0', overflow: 'hidden', marginTop: 48 }}>
      <div style={{ textAlign: 'center', fontFamily: 'Outfit, sans-serif', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,.35)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 14 }}>
        Dealers We Work With
      </div>
      <div style={{ overflow: 'hidden', position: 'relative' }}>
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 80, background: 'linear-gradient(to right, #0A2540, transparent)', zIndex: 2 }}/>
        <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 80, background: 'linear-gradient(to left, #0A2540, transparent)', zIndex: 2 }}/>
        <div style={{ display: 'flex', animation: 'scroll-dealers 30s linear infinite', width: 'max-content' }}>
          {items.map((d, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 32px', borderRight: '1px solid rgba(255,255,255,.08)', whiteSpace: 'nowrap' }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(77,166,255,.15)', border: '1px solid rgba(77,166,255,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Outfit, sans-serif', fontSize: 10, fontWeight: 800, color: '#4DA6FF', flexShrink: 0 }}>
                {d.name[0]}
              </div>
              <div>
                <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 12, fontWeight: 700, color: '#fff' }}>{d.name}</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,.4)' }}>📍 {d.location}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <style>{`
        @keyframes scroll-dealers {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.333%); }
        }
      `}</style>
    </div>
  )
}
  // Duplicate for seamless loop
  const items = [...displayDealers, ...displayDealers, ...displayDealers]

  return (
    <div style={{ background: '#0A2540', padding: '20px 0', overflow: 'hidden', marginTop: 48 }}>
      <div style={{ textAlign: 'center', fontFamily: 'Outfit, sans-serif', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,.35)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 14 }}>
        Dealers We Work With
      </div>
      <div style={{ overflow: 'hidden', position: 'relative' }}>
        {/* Fade edges */}
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 80, background: 'linear-gradient(to right, #0A2540, transparent)', zIndex: 2 }}/>
        <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 80, background: 'linear-gradient(to left, #0A2540, transparent)', zIndex: 2 }}/>
        <div style={{
          display: 'flex', gap: 0,
          animation: 'scroll-dealers 30s linear infinite',
          width: 'max-content'
        }}>
          {items.map((d, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 32, padding: '0 32px', borderRight: '1px solid rgba(255,255,255,.08)', whiteSpace: 'nowrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(77,166,255,.15)', border: '1px solid rgba(77,166,255,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Outfit, sans-serif', fontSize: 10, fontWeight: 800, color: '#4DA6FF', flexShrink: 0 }}>
                  {d.name[0]}
                </div>
                <div>
                  <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 12, fontWeight: 700, color: '#fff' }}>{d.name}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,.4)' }}>📍 {d.location}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <style>{`
        @keyframes scroll-dealers {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.333%); }
        }
      `}</style>
    </div>
  )
}
export default function HomePage({ user }) {
  const navigate = useNavigate()
  const [make, setMake]                 = useState('')
  const [model, setModel]               = useState('')
  const [body, setBody]                 = useState('')
  const [showMore, setShowMore]         = useState(false)
  const [transmission, setTransmission] = useState('')
  const [fuel, setFuel]                 = useState('')
  const [minPrice, setMinPrice]         = useState(0)
  const [maxPrice, setMaxPrice]         = useState(30000000)
  const [minYear, setMinYear]           = useState(1970)
  const [maxYear, setMaxYear]           = useState(2025)
  const [minKm, setMinKm]               = useState(0)
  const [maxKm, setMaxKm]               = useState(300000)
  const [featured, setFeatured]         = useState([])
  const [allListings, setAllListings]   = useState([])
  const [makeCounts, setMakeCounts]     = useState({})
  const [modelCounts, setModelCounts]   = useState({})

  useEffect(() => {
    getFeaturedListings().then(({ data }) => setFeatured(data || []))
    supabase.from('listings').select('make,model,body_type,fuel_type,transmission,price,year,mileage').eq('status','approved').then(({ data }) => {
      if (!data) return
      setAllListings(data)
      const mc = {}, mdc = {}
      data.forEach(l => {
        mc[l.make] = (mc[l.make] || 0) + 1
        if (l.make && l.model) {
          if (!mdc[l.make]) mdc[l.make] = {}
          mdc[l.make][l.model] = (mdc[l.make][l.model] || 0) + 1
        }
      })
      setMakeCounts(mc)
      setModelCounts(mdc)
    })
  }, [])

  // Live count of listings matching current filters
  const matchingCount = allListings.filter(l => {
    if (make && l.make !== make) return false
    if (model && l.model !== model) return false
    if (body && l.body_type !== body) return false
    if (transmission && l.transmission !== transmission) return false
    if (fuel && l.fuel_type !== fuel) return false
    if (l.price < minPrice || l.price > maxPrice) return false
    if (l.year < minYear || l.year > maxYear) return false
    if (l.mileage < minKm || l.mileage > maxKm) return false
    return true
  }).length

  const filtersActive = make || model || body || transmission || fuel || minPrice > 0 || maxPrice < 20000000 || minYear > 2000 || maxYear < 2025 || minKm > 0 || maxKm < 300000

  const search = () => {
    const p = new URLSearchParams()
    if (make)                p.set('make', make)
    if (model)               p.set('model', model)
    if (body)                p.set('body', body)
    if (transmission)        p.set('transmission', transmission)
    if (fuel)                p.set('fuel', fuel)
    if (minPrice > 0)        p.set('minPrice', minPrice)
    if (maxPrice < 30000000) p.set('maxPrice', maxPrice)
    if (minYear > 1970)      p.set('minYear', minYear)
    if (maxYear < 2025)      p.set('maxYear', maxYear)
    if (minKm > 0)           p.set('minKm', minKm)
    if (maxKm < 300000)      p.set('maxKm', maxKm)
    navigate(`/listings?${p.toString()}`)
  }

  const models = make && CAR_MODELS[make] ? CAR_MODELS[make] : []
  const inp = { width:'100%', padding:'10px 12px', border:'1.5px solid #E2E8F0', borderRadius:8, fontSize:13, fontFamily:'DM Sans, sans-serif', outline:'none', background:'#F8FAFC' }
  const lbl = { display:'block', fontSize:10, fontWeight:700, color:'#94A3B8', textTransform:'uppercase', letterSpacing:'.6px', marginBottom:5 }

  return (
    <div style={{ fontFamily:'DM Sans, sans-serif', background:'#F7F9FC', minHeight:'100vh' }}>
      <Navbar user={user} />

      {/* Hero */}
      <div style={{
        backgroundImage:'linear-gradient(rgba(10,37,64,0.7), rgba(10,37,64,0.85)), url(/hero.jpg)',
        backgroundSize:'cover', backgroundPosition:'center', backgroundRepeat:'no-repeat',
        padding:'80px 24px 0'
      }}>
        <div style={{ maxWidth:960, margin:'0 auto' }}>
          <div style={{ color:'#4DA6FF', fontSize:11, fontWeight:700, letterSpacing:'1.8px', textTransform:'uppercase', marginBottom:12 }}>Kenya's #1 Car Platform</div>
          <h1 style={{ fontFamily:'Outfit, sans-serif', fontSize:52, fontWeight:800, color:'#fff', lineHeight:1.08, marginBottom:14, letterSpacing:-1 }}>
            Find Your <span style={{ color:'#4DA6FF' }}>Perfect</span><br />Car in Kenya
          </h1>
          <p style={{ color:'rgba(255,255,255,0.55)', fontSize:16, marginBottom:36, maxWidth:480 }}>
            Browse verified listings from trusted dealers and private sellers across Kenya.
          </p>

          {/* Search box */}
          <div style={{ background:'#fff', borderRadius:'14px 14px 0 0', padding:24 }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1.4fr auto', gap:12, alignItems:'end' }}>

              {/* Make */}
              <div>
                <label style={lbl}>Make</label>
                <select value={make} onChange={e => { setMake(e.target.value); setModel('') }} style={inp}>
                  <option value="">Any Make ({allListings.length})</option>
                  {MAKES.map(m => (
                    <option key={m} value={m}>{m}{makeCounts[m] ? ` (${makeCounts[m]})` : ''}</option>
                  ))}
                </select>
              </div>

              {/* Model */}
              <div>
                <label style={lbl}>Model</label>
                <select value={model} onChange={e => setModel(e.target.value)} style={{ ...inp, color: make ? '#0A2540' : '#94A3B8' }} disabled={!make}>
                  <option value="">{make ? `All ${make} (${makeCounts[make] || 0})` : 'Select make first'}</option>
                  {models.map(m => {
                    const count = modelCounts[make]?.[m] || 0
                    return <option key={m} value={m}>{m}{count > 0 ? ` (${count})` : ''}</option>
                  })}
                </select>
              </div>

              {/* Body */}
              <div>
                <label style={lbl}>Body Style</label>
                <select value={body} onChange={e => setBody(e.target.value)} style={inp}>
                  <option value="">Any Body</option>
                  {BODY_TYPES.map(b => {
                    const count = allListings.filter(l => l.body_type === b.t).length
                    return <option key={b.t} value={b.t}>{b.t}{count > 0 ? ` (${count})` : ''}</option>
                  })}
                </select>
              </div>

              {/* Price */}
              <div>
                <label style={lbl}>Price Range (KSH)</label>
                <DualSlider
                  minVal={minPrice} maxVal={maxPrice}
                  absMin={0} absMax={30000000} step={500000}
                  setMin={setMinPrice} setMax={setMaxPrice}
                  formatLabel={n => `${(n/1e6).toFixed(1)}M`}
                />
              </div>

              {/* Search button */}
              <button onClick={search} style={{ background:'#1565C0', color:'#fff', border:'none', padding:'11px 20px', borderRadius:8, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'Outfit, sans-serif', whiteSpace:'nowrap' }}>
                {filtersActive
                  ? `Search ${matchingCount} Cars →`
                  : `Search ${allListings.length} Cars →`
                }
              </button>
            </div>

            {/* More filters toggle */}
            <div onClick={() => setShowMore(!showMore)}
              style={{ marginTop:14, display:'flex', alignItems:'center', gap:6, cursor:'pointer', width:'fit-content' }}>
              <span style={{ fontSize:12, fontWeight:600, color:'#1565C0' }}>{showMore ? '▲ Hide filters' : '▼ More filters (year, mileage, fuel, transmission)'}</span>
            </div>

            {showMore && (
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:20, marginTop:14, paddingTop:14, borderTop:'1px solid #F0F4F8' }}>
                <div>
                  <label style={lbl}>Transmission</label>
                  <select value={transmission} onChange={e => setTransmission(e.target.value)} style={inp}>
                    <option value="">Any</option>
                    {['Automatic','Manual','CVT'].map(t => {
                      const count = allListings.filter(l => l.transmission === t).length
                      return <option key={t} value={t}>{t}{count > 0 ? ` (${count})` : ''}</option>
                    })}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Fuel Type</label>
                  <select value={fuel} onChange={e => setFuel(e.target.value)} style={inp}>
                    <option value="">Any</option>
                    {['Petrol','Diesel','Hybrid','Electric'].map(f => {
                      const count = allListings.filter(l => l.fuel_type === f).length
                      return <option key={f} value={f}>{f}{count > 0 ? ` (${count})` : ''}</option>
                    })}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Year</label>
                  <DualSlider
                    minVal={minYear} maxVal={maxYear}
                    absMin={1970} absMax={2025} step={1}
                    setMin={setMinYear} setMax={setMaxYear}
                    formatLabel={n => `${n}`}
                  />
                </div>
                <div>
                  <label style={lbl}>Mileage (km)</label>
                  <DualSlider
                    minVal={minKm} maxVal={maxKm}
                    absMin={0} absMax={300000} step={5000}
                    setMin={setMinKm} setMax={setMaxKm}
                    formatLabel={n => `${(n/1000).toFixed(0)}k`}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div style={{ background:'#EEF5FF', borderBottom:'1px solid #D9E8FA', padding:'14px 24px', display:'flex', gap:40 }}>
        {[
          [allListings.length > 0 ? `${allListings.length}+` : '0', 'Active Listings'],
          [Object.keys(makeCounts).length || '14', 'Car Makes'],
          ['100%', 'Verified Sellers'],
          ['7 Days', 'Support']
        ].map(([n,l]) => (
          <div key={l}>
            <div style={{ fontFamily:'Outfit, sans-serif', fontSize:20, fontWeight:700, color:'#1565C0' }}>{n}</div>
            <div style={{ fontSize:11, color:'#64748B' }}>{l}</div>
          </div>
        ))}
      </div>

      {/* Featured Listings */}
      {featured.length > 0 && (
        <section style={{ padding:'60px 24px', background:'#f8faff' }}>
          <div style={{ maxWidth:1200, margin:'0 auto' }}>
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:32 }}>
              <span style={{ fontSize:24 }}>⭐</span>
              <h2 style={{ fontFamily:'Outfit, sans-serif', fontSize:28, fontWeight:700, color:'#0A2540', margin:0 }}>Featured Listings</h2>
              <span style={{ background:'#1565C0', color:'white', fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:20, letterSpacing:1 }}>PROMOTED</span>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:24 }}>
              {featured.map(car => (
                <div key={car.id} style={{ background:'white', borderRadius:12, overflow:'hidden', boxShadow:'0 4px 20px rgba(21,101,192,0.15)', border:'2px solid #1565C0', position:'relative' }}>
                  <div style={{ position:'absolute', top:12, left:12, background:'#1565C0', color:'white', fontSize:11, fontWeight:700, padding:'4px 10px', borderRadius:20, zIndex:1 }}>⭐ FEATURED</div>
                  <div style={{ height:200, background:'#e8f0fe', overflow:'hidden' }}>
                    {car.listing_photos?.[0]
                      ? <img src={car.listing_photos[0].url} alt={car.title} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                      : <div style={{ height:'100%', display:'flex', alignItems:'center', justifyContent:'center', color:'#1565C0', fontSize:40 }}>🚗</div>
                    }
                  </div>
                  <div style={{ padding:16 }}>
                    <h3 style={{ margin:'0 0 4px', fontSize:16, fontWeight:700, color:'#0A2540' }}>{car.year} {car.make} {car.model}</h3>
                    <p style={{ margin:'0 0 12px', fontSize:20, fontWeight:800, color:'#1565C0' }}>KSH {car.price?.toLocaleString()}</p>
                    <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:12 }}>
                      {[car.mileage && `${car.mileage?.toLocaleString()} km`, car.fuel_type, car.transmission].filter(Boolean).map((tag, i) => (
                        <span key={i} style={{ background:'#f0f4ff', color:'#1565C0', fontSize:12, padding:'3px 8px', borderRadius:6 }}>{tag}</span>
                      ))}
                    </div>
                    <a href={`/listings/${car.id}`} style={{ display:'block', textAlign:'center', background:'#1565C0', color:'white', padding:'10px', borderRadius:8, textDecoration:'none', fontWeight:600, fontSize:14 }}>View Listing</a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Browse by Make */}
      <div style={{ maxWidth:1200, margin:'0 auto', padding:'48px 24px 0' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:20 }}>
          <div>
            <div style={{ fontFamily:'Outfit, sans-serif', fontSize:24, fontWeight:700, color:'#0A2540' }}>Browse by Make</div>
            <div style={{ fontSize:13, color:'#94A3B8', marginTop:4 }}>Find your preferred brand</div>
          </div>
          <Link to="/listings" style={{ fontSize:13, fontWeight:600, color:'#1565C0', textDecoration:'none' }}>View all →</Link>
        </div>
        <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
          {MAKES.map(m => (
            <button key={m} onClick={() => navigate(`/listings?make=${m}`)}
              style={{ padding:'8px 16px', border:'1.5px solid #E2E8F0', borderRadius:100, fontSize:13, fontWeight:600, color:'#475569', cursor:'pointer', background:'#fff', fontFamily:'DM Sans, sans-serif' }}
              onMouseOver={e => { e.currentTarget.style.background='#0A2540'; e.currentTarget.style.color='#fff'; e.currentTarget.style.borderColor='#0A2540' }}
              onMouseOut={e => { e.currentTarget.style.background='#fff'; e.currentTarget.style.color='#475569'; e.currentTarget.style.borderColor='#E2E8F0' }}>
              {m}{makeCounts[m] ? <span style={{ fontSize:11, color:'#94A3B8', marginLeft:4 }}>({makeCounts[m]})</span> : ''}
            </button>
          ))}
        </div>
      </div>

      {/* Body Types */}
      <div style={{ maxWidth:1200, margin:'0 auto', padding:'48px 24px 0' }}>
        <div style={{ fontFamily:'Outfit, sans-serif', fontSize:24, fontWeight:700, color:'#0A2540', marginBottom:20 }}>Browse by Body Style</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(6, 1fr)', gap:12 }}>
          {BODY_TYPES.map(b => (
            <div key={b.t} onClick={() => navigate(`/listings?body=${b.t}`)}
              style={{ background:'#fff', border:'1.5px solid #E8EDF3', borderRadius:12, padding:'18px 12px', textAlign:'center', cursor:'pointer' }}>
              <div style={{ fontFamily:'Outfit, sans-serif', fontSize:13, fontWeight:700, color:'#0A2540', marginBottom:3 }}>{b.t}</div>
              {allListings.filter(l => l.body_type === b.t).length > 0 &&
                <div style={{ fontSize:11, color:'#94A3B8' }}>{allListings.filter(l => l.body_type === b.t).length} cars</div>
              }
            </div>
          ))}
        </div>
      </div>
{/* Revolving Dealers Bar */}
<DealersBar />

      {/* Dealer CTA */}
      <div style={{ maxWidth:1200, margin:'48px auto', padding:'0 24px' }}>
        <div style={{ background:'#0A2540', borderRadius:16, padding:'48px', display:'grid', gridTemplateColumns:'1fr auto', alignItems:'center', gap:32 }}>
          <div>
            <div style={{ fontFamily:'Outfit, sans-serif', fontSize:28, fontWeight:800, color:'#fff', marginBottom:10 }}>Are You a Dealer?<br />List Your Inventory Free</div>
            <div style={{ color:'rgba(255,255,255,0.55)', fontSize:14, lineHeight:1.6 }}>Join Kenya's fastest-growing car platform. Reach thousands of active buyers with zero listing fees for a limited time.</div>
          </div>
          <Link to="/pricing" style={{ background:'#4DA6FF', color:'#0A2540', padding:'14px 28px', borderRadius:10, fontWeight:800, fontSize:14, textDecoration:'none', fontFamily:'Outfit, sans-serif', whiteSpace:'nowrap' }}>Become a Dealer →</Link>
        </div>
      </div>

      {/* Footer */}
      <footer style={{ background:'#060F1A', padding:'28px 24px', textAlign:'center' }}>
        <div style={{ fontFamily:'Outfit, sans-serif', fontSize:16, fontWeight:800, color:'#fff', marginBottom:6 }}>CarExpert<span style={{ color:'#4DA6FF' }}>Africa</span>®</div>
        <div style={{ fontSize:11, color:'rgba(255,255,255,0.35)' }}>Kenya's Ultimate Car Listing Platform · Westlands, Nairobi · © 2025</div>
      </footer>
    </div>
  )
}
