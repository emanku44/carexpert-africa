import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { supabase } from '../lib/supabase'

const MAKES = ['Toyota','Mercedes-Benz','Mazda','Audi','Volkswagen','Subaru','BMW','Lexus','Nissan','Mitsubishi','Porsche','Land Rover','Suzuki','Honda','Hyundai','Kia','Ford','Isuzu']
const BODIES = ['SUV','Sedan','Hatchback','Minivan','Pickup','Coupe','Wagon','Truck','Bus']
const FUELS = ['Petrol','Diesel','Hybrid','Electric','LPG']
const TRANS = ['Automatic','Manual','CVT','Semi-Automatic']
const DRIVES = ['AWD','4WD','FWD','RWD','4x4']
const CONDITIONS = ['New','Used — Excellent','Used — Good','Used — Fair','Foreign Used — Excellent','Foreign Used — Good']
const LOCATIONS = ['Nairobi — Westlands','Nairobi — CBD','Nairobi — Karen','Nairobi — Langata','Nairobi — Eastlands','Mombasa','Kisumu','Nakuru','Eldoret','Thika','Meru','Nyeri','Machakos','Kitale','Malindi']

const CAR_MODELS = {
  Toyota: ['Allion','Alphard','Camry','Corolla','Crown','Fielder','Fortuner','Harrier','Hiace','Hilux','Land Cruiser 70 Series','Land Cruiser 80 Series','Land Cruiser 100 Series','Land Cruiser 200','Land Cruiser 300','Land Cruiser Prado 90','Land Cruiser Prado 120','Land Cruiser Prado 150','Mark X','Noah','Premio','Probox','RAV4','Rush','Succeed','Vanguard','Vellfire','Voxy','Wish'],
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

const fmt = (n) => 'KSH ' + Number(n).toLocaleString()

function DualSlider({ minVal, maxVal, absMin, absMax, step, setMin, setMax, formatLabel }) {
  const trackRef = useRef(null)
  const dragging = useRef(null)
  const minValRef = useRef(minVal)
  const maxValRef = useRef(maxVal)

  useEffect(() => { minValRef.current = minVal }, [minVal])
  useEffect(() => { maxValRef.current = maxVal }, [maxVal])

  const toPercent = v => ((v - absMin) / (absMax - absMin)) * 100
  const fromPercent = pct => Math.round((absMin + (pct / 100) * (absMax - absMin)) / step) * step

  const getPercFromEvent = e => {
    const track = trackRef.current
    if (!track) return 0
    const rect = track.getBoundingClientRect()
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    return Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100))
  }

  const onMoveRef = useRef(null)
  onMoveRef.current = e => {
    if (e.cancelable) e.preventDefault()
    const val = fromPercent(getPercFromEvent(e))
    if (dragging.current === 'min') setMin(Math.min(val, maxValRef.current - step))
    if (dragging.current === 'max') setMax(Math.max(val, minValRef.current + step))
  }

  const stableOnMove = useRef(e => onMoveRef.current(e)).current
  const stableOnUp = useRef(() => {
    dragging.current = null
    window.removeEventListener('mousemove', stableOnMove)
    window.removeEventListener('mouseup', stableOnUp)
    window.removeEventListener('touchmove', stableOnMove)
    window.removeEventListener('touchend', stableOnUp)
  }).current

  const onMouseDown = handle => e => {
    e.preventDefault()
    dragging.current = handle
    window.addEventListener('mousemove', stableOnMove)
    window.addEventListener('mouseup', stableOnUp)
    window.addEventListener('touchmove', stableOnMove, { passive: false })
    window.addEventListener('touchend', stableOnUp)
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

function FilterSection({ title, activeCount, children }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ borderTop: '1px solid #F5F7FA' }}>
      <div onClick={() => setOpen(!open)}
        style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '.8px', fontFamily: 'Outfit, sans-serif' }}>{title}</span>
          {activeCount > 0 && <span style={{ background: '#1565C0', color: '#fff', borderRadius: 100, padding: '1px 6px', fontSize: 9, fontWeight: 700 }}>{activeCount}</span>}
        </div>
        <span style={{ color: '#94A3B8', fontSize: 12, display: 'inline-block', transform: open ? 'rotate(180deg)' : 'none' }}>▾</span>
      </div>
      {open && <div style={{ padding: '0 16px 12px' }}>{children}</div>}
    </div>
  )
}

function CheckList({ items, selected, onToggle, counts }) {
  return items.map(item => {
    const count = counts?.[item] || 0
    const isChecked = selected.has(item)
    return (
      <div key={item} onClick={() => onToggle(item)}
        style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7, cursor: 'pointer' }}>
        <div style={{ width: 14, height: 14, border: `1.5px solid ${isChecked ? '#1565C0' : '#CBD5E1'}`, borderRadius: 3, background: isChecked ? '#1565C0' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 9, color: '#fff' }}>
          {isChecked ? '✓' : ''}
        </div>
        <span style={{ fontSize: 12, color: isChecked ? '#1565C0' : '#475569', fontWeight: isChecked ? 600 : 500, flex: 1 }}>{item}</span>
        {count > 0 && <span style={{ fontSize: 10, color: '#94A3B8' }}>({count})</span>}
      </div>
    )
  })
}

function Tag({ label, onClear }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#EEF4FF', border: '1px solid #BDD5FF', borderRadius: 100, padding: '3px 10px', fontSize: 11, fontWeight: 600, color: '#1565C0' }}>
      {label} <span onClick={onClear} style={{ cursor: 'pointer', fontSize: 14 }}>×</span>
    </div>
  )
}

export default function ListingsPage({ user }) {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [saved, setSaved] = useState(new Set())
  const [saveSearchOpen, setSaveSearchOpen] = useState(false)
  const [searchName, setSearchName] = useState('')
  const [saveMsg, setSaveMsg] = useState('')

  // Filters
  const [search, setSearch] = useState(searchParams.get('q') || '')
  const [selectedMake, setSelectedMake] = useState(searchParams.get('make') || '')
  const [selectedModel, setSelectedModel] = useState(searchParams.get('model') || '')
  const [selectedLocation, setSelectedLocation] = useState('')
  const [bodies, setBodies]       = useState(new Set())
  const [fuels, setFuels]         = useState(new Set())
  const [trans, setTrans]         = useState(new Set())
  const [drives, setDrives]       = useState(new Set())
  const [conditions, setConditions] = useState(new Set())
  const [minPrice, setMinPrice]   = useState(0)
  const [maxPrice, setMaxPrice]   = useState(30000000)
  const [minYear, setMinYear]     = useState(1970)
  const [maxYear, setMaxYear]     = useState(2025)
  const [minKm, setMinKm]         = useState(0)
  const [maxKm, setMaxKm]         = useState(300000)
  const [sort, setSort]           = useState('newest')

  useEffect(() => {
    fetchListings()
  }, [])

  const fetchListings = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('listings').select('*, listing_photos(*)')
      .eq('status', 'approved')
      .order('featured', { ascending: false })
      .order('created_at', { ascending: false })
    if (!error) setListings(data || [])

    // load saved listings for logged in user
    const { data: { user: u } } = await supabase.auth.getUser()
    if (u) {
      const { data: savedData } = await supabase.from('saved_listings').select('listing_id').eq('user_id', u.id)
      if (savedData) setSaved(new Set(savedData.map(s => s.listing_id)))
    }
    setLoading(false)
  }

  const toggle = (setter) => (val) => setter(prev => {
    const next = new Set(prev)
    next.has(val) ? next.delete(val) : next.add(val)
    return next
  })

  const clearAll = () => {
    setSearch(''); setSelectedMake(''); setSelectedModel(''); setSelectedLocation('')
    setBodies(new Set()); setFuels(new Set()); setTrans(new Set())
    setDrives(new Set()); setConditions(new Set())
    setMinPrice(0); setMaxPrice(30000000)
    setMinYear(1970); setMaxYear(2025)
    setMinKm(0); setMaxKm(300000)
  }

  const handleSaveCar = async (e, car) => {
    e.stopPropagation()
    const { data: { user: u } } = await supabase.auth.getUser()
    if (!u) { alert('Please log in to save cars'); return }
    if (saved.has(car.id)) {
      await supabase.from('saved_listings').delete().eq('user_id', u.id).eq('listing_id', car.id)
      setSaved(prev => { const n = new Set(prev); n.delete(car.id); return n })
    } else {
      await supabase.from('saved_listings').insert({ user_id: u.id, listing_id: car.id, saved_price: car.price, last_price: car.price })
      setSaved(prev => new Set([...prev, car.id]))
    }
  }

  const handleSaveSearch = async () => {
    if (!searchName.trim()) return
    const { data: { user: u } } = await supabase.auth.getUser()
    if (!u) { alert('Please log in to save searches'); return }
    const filters = {
      search, make: selectedMake, model: selectedModel, location: selectedLocation,
      bodies: [...bodies], fuels: [...fuels], trans: [...trans], drives: [...drives], conditions: [...conditions],
      minPrice, maxPrice, minYear, maxYear, minKm, maxKm
    }
    const { error } = await supabase.from('saved_searches').insert({ user_id: u.id, name: searchName.trim(), filters })
    if (error) { setSaveMsg('Error saving search'); return }
    setSaveMsg('✓ Search saved!')
    setTimeout(() => { setSaveSearchOpen(false); setSaveMsg(''); setSearchName('') }, 1500)
  }

  const matchesSearch = (car) => {
    if (!search.trim()) return true
    const tokens = search.toLowerCase().split(/\s+/).filter(Boolean)
    const haystack = [car.make, car.model, car.body_type, car.fuel_type, car.transmission, car.location, car.description, String(car.year), String(car.engine_cc)].filter(Boolean).join(' ').toLowerCase()
    return tokens.every(t => haystack.includes(t))
  }

  const filtered = listings.filter(c => {
    if (!matchesSearch(c))                                     return false
    if (selectedMake && c.make !== selectedMake)               return false
    if (selectedModel && c.model !== selectedModel)            return false
    if (selectedLocation && c.location !== selectedLocation)   return false
    if (bodies.size && !bodies.has(c.body_type))               return false
    if (fuels.size && !fuels.has(c.fuel_type))                 return false
    if (trans.size && !trans.has(c.transmission))              return false
    if (drives.size && !drives.has(c.drive_type))              return false
    if (conditions.size && !conditions.has(c.condition))       return false
    if (c.price < minPrice || c.price > maxPrice)              return false
    if (c.year < minYear   || c.year > maxYear)                return false
    if (c.mileage < minKm  || c.mileage > maxKm)               return false
    return true
  }).sort((a, b) => {
    if (sort === 'price_asc')  return a.price - b.price
    if (sort === 'price_desc') return b.price - a.price
    if (sort === 'mileage')    return a.mileage - b.mileage
    if (sort === 'year')       return b.year - a.year
    return new Date(b.created_at) - new Date(a.created_at)
  })

  const cnt = (field, val) => listings.filter(l => l[field] === val).length
  const makeCounts    = Object.fromEntries(MAKES.map(m => [m, listings.filter(l => l.make === m).length]))
  const modelCounts   = Object.fromEntries((CAR_MODELS[selectedMake] || []).map(m => [m, listings.filter(l => l.make === selectedMake && l.model === m).length]))
  const bodyCounts    = Object.fromEntries(BODIES.map(b => [b, cnt('body_type', b)]))
  const fuelCounts    = Object.fromEntries(FUELS.map(f => [f, cnt('fuel_type', f)]))
  const transCounts   = Object.fromEntries(TRANS.map(t => [t, cnt('transmission', t)]))
  const driveCounts   = Object.fromEntries(DRIVES.map(d => [d, cnt('drive_type', d)]))
  const condCounts    = Object.fromEntries(CONDITIONS.map(c => [c, cnt('condition', c)]))
  const locCounts     = Object.fromEntries(LOCATIONS.map(l => [l, cnt('location', l)]))
  const availableModels = selectedMake && CAR_MODELS[selectedMake] ? CAR_MODELS[selectedMake] : []

  const activeFiltersCount = [
    search, selectedMake, selectedModel, selectedLocation,
    ...bodies, ...fuels, ...trans, ...drives, ...conditions,
    minPrice > 0, maxPrice < 30000000, minYear > 1970, maxYear < 2025, minKm > 0, maxKm < 300000
  ].filter(Boolean).length

  return (
    <div style={{ fontFamily: 'DM Sans, sans-serif', background: '#F7F9FC', minHeight: '100vh' }}>
      <Navbar user={user} />
      <div style={{ background: '#fff', borderBottom: '1px solid #E8EDF3', padding: '10px 24px', fontSize: 12, color: '#94A3B8' }}>
        <Link to="/" style={{ color: '#1565C0', textDecoration: 'none' }}>Home</Link> / All Listings
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '268px 1fr', minHeight: 'calc(100vh - 96px)' }}>

        {/* SIDEBAR */}
        <aside style={{ background: '#fff', borderRight: '1px solid #E8EDF3', overflowY: 'auto' }}>
          <div style={{ padding: '14px 16px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F0F4F8', position: 'sticky', top: 0, background: '#fff', zIndex: 2 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: 13, fontWeight: 700, color: '#0A2540' }}>Filters</span>
              {activeFiltersCount > 0 && <span style={{ background: '#1565C0', color: '#fff', borderRadius: 100, padding: '1px 7px', fontSize: 9, fontWeight: 700 }}>{activeFiltersCount}</span>}
            </div>
            <button onClick={clearAll} style={{ fontSize: 11, color: '#EF4444', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>✕ Clear all</button>
          </div>

          <div style={{ padding: '10px 16px', background: '#F8FAFC', borderBottom: '1px solid #F0F4F8', textAlign: 'center' }}>
            <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: 14, fontWeight: 800, color: '#1565C0' }}>{loading ? '...' : filtered.length}</span>
            <span style={{ fontSize: 11, color: '#94A3B8', marginLeft: 4 }}>cars match</span>
          </div>

          {/* Search */}
          <div style={{ padding: '12px 16px', borderTop: '1px solid #F5F7FA' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '.8px', fontFamily: 'Outfit, sans-serif', marginBottom: 8 }}>Search</div>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: '#94A3B8' }}>🔍</span>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder='e.g. "Land Cruiser 100"'
                style={{ width: '100%', padding: '8px 10px 8px 30px', border: '1.5px solid #E2E8F0', borderRadius: 7, fontSize: 12, fontFamily: 'DM Sans, sans-serif', outline: 'none', background: '#F8FAFC' }} />
              {search && <span onClick={() => setSearch('')} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: '#94A3B8', fontSize: 14 }}>×</span>}
            </div>
          </div>

          {/* Make + Model */}
          <FilterSection title="Make" activeCount={selectedMake ? 1 : 0}>
            <select value={selectedMake} onChange={e => { setSelectedMake(e.target.value); setSelectedModel('') }}
              style={{ width: '100%', padding: '8px 10px', border: '1.5px solid #E2E8F0', borderRadius: 7, fontSize: 12, fontFamily: 'DM Sans, sans-serif', outline: 'none', background: '#F8FAFC', marginBottom: 8 }}>
              <option value="">Any Make ({listings.length})</option>
              {MAKES.map(m => <option key={m} value={m}>{m}{makeCounts[m] > 0 ? ` (${makeCounts[m]})` : ''}</option>)}
            </select>
            {selectedMake && availableModels.length > 0 && (
              <>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '.8px', fontFamily: 'Outfit, sans-serif', marginBottom: 6, marginTop: 4 }}>Model</div>
                <select value={selectedModel} onChange={e => setSelectedModel(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', border: '1.5px solid #E2E8F0', borderRadius: 7, fontSize: 12, fontFamily: 'DM Sans, sans-serif', outline: 'none', background: '#F8FAFC' }}>
                  <option value="">All {selectedMake} ({listings.filter(l => l.make === selectedMake).length})</option>
                  {availableModels.map(m => <option key={m} value={m}>{m}{modelCounts[m] > 0 ? ` (${modelCounts[m]})` : ''}</option>)}
                </select>
              </>
            )}
          </FilterSection>

          <FilterSection title="Location" activeCount={selectedLocation ? 1 : 0}>
            <select value={selectedLocation} onChange={e => setSelectedLocation(e.target.value)}
              style={{ width: '100%', padding: '8px 10px', border: '1.5px solid #E2E8F0', borderRadius: 7, fontSize: 12, fontFamily: 'DM Sans, sans-serif', outline: 'none', background: '#F8FAFC' }}>
              <option value="">Any Location</option>
              {LOCATIONS.map(l => <option key={l} value={l}>{l}{locCounts[l] > 0 ? ` (${locCounts[l]})` : ''}</option>)}
            </select>
          </FilterSection>

          <FilterSection title="Price (KSH)" activeCount={minPrice > 0 || maxPrice < 30000000 ? 1 : 0}>
            <DualSlider minVal={minPrice} maxVal={maxPrice} absMin={0} absMax={30000000} step={500000} setMin={setMinPrice} setMax={setMaxPrice} formatLabel={n => `${(n/1e6).toFixed(1)}M`} />
          </FilterSection>

          <FilterSection title="Year" activeCount={minYear > 1970 || maxYear < 2025 ? 1 : 0}>
            <DualSlider minVal={minYear} maxVal={maxYear} absMin={1970} absMax={2025} step={1} setMin={setMinYear} setMax={setMaxYear} formatLabel={n => `${n}`} />
          </FilterSection>

          <FilterSection title="Odometer (km)" activeCount={minKm > 0 || maxKm < 300000 ? 1 : 0}>
            <DualSlider minVal={minKm} maxVal={maxKm} absMin={0} absMax={300000} step={5000} setMin={setMinKm} setMax={setMaxKm} formatLabel={n => `${(n/1000).toFixed(0)}k`} />
          </FilterSection>

          <FilterSection title="Transmission" activeCount={trans.size}>
            <CheckList items={TRANS} selected={trans} onToggle={toggle(setTrans)} counts={transCounts} />
          </FilterSection>

          <FilterSection title="Body Type" activeCount={bodies.size}>
            <CheckList items={BODIES} selected={bodies} onToggle={toggle(setBodies)} counts={bodyCounts} />
          </FilterSection>

          <FilterSection title="Condition" activeCount={conditions.size}>
            <CheckList items={CONDITIONS} selected={conditions} onToggle={toggle(setConditions)} counts={condCounts} />
          </FilterSection>

          <FilterSection title="Fuel Type" activeCount={fuels.size}>
            <CheckList items={FUELS} selected={fuels} onToggle={toggle(setFuels)} counts={fuelCounts} />
          </FilterSection>

          <FilterSection title="Drive Type" activeCount={drives.size}>
            <CheckList items={DRIVES} selected={drives} onToggle={toggle(setDrives)} counts={driveCounts} />
          </FilterSection>

          <div style={{ height: 24 }} />
        </aside>

        {/* MAIN */}
        <main style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 18, fontWeight: 700, color: '#0A2540' }}>
              {loading ? 'Loading...' : (
                <><span style={{ color: '#1565C0' }}>{filtered.length}</span> Cars
                  {activeFiltersCount > 0 && listings.length > 0 && <span style={{ fontSize: 12, color: '#94A3B8', fontWeight: 400, marginLeft: 8 }}>of {listings.length} total</span>}
                </>
              )}
              <span style={{ color: '#94A3B8', fontSize: 13, fontWeight: 400, fontFamily: 'DM Sans, sans-serif', marginLeft: 6 }}>in Kenya</span>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {user && (
                <button onClick={() => setSaveSearchOpen(true)}
                  style={{ background: '#EEF5FF', color: '#1565C0', border: '1.5px solid #BDD5FF', padding: '7px 14px', borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}>
                  🔖 Save Search
                </button>
              )}
              <select value={sort} onChange={e => setSort(e.target.value)} style={{ padding: '7px 12px', border: '1.5px solid #E2E8F0', borderRadius: 7, fontSize: 12, fontFamily: 'DM Sans, sans-serif', outline: 'none', background: '#fff' }}>
                <option value="newest">Newest First</option>
                <option value="price_asc">Price: Low → High</option>
                <option value="price_desc">Price: High → Low</option>
                <option value="mileage">Lowest Mileage</option>
                <option value="year">Newest Year</option>
              </select>
            </div>
          </div>

          {/* Active tags */}
          {activeFiltersCount > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
              {search && <Tag label={`"${search}"`} onClear={() => setSearch('')} />}
              {selectedMake && <Tag label={selectedMake} onClear={() => { setSelectedMake(''); setSelectedModel('') }} />}
              {selectedModel && <Tag label={selectedModel} onClear={() => setSelectedModel('')} />}
              {selectedLocation && <Tag label={selectedLocation} onClear={() => setSelectedLocation('')} />}
              {[...bodies].map(v => <Tag key={v} label={v} onClear={() => toggle(setBodies)(v)} />)}
              {[...fuels].map(v => <Tag key={v} label={v} onClear={() => toggle(setFuels)(v)} />)}
              {[...trans].map(v => <Tag key={v} label={v} onClear={() => toggle(setTrans)(v)} />)}
              {[...drives].map(v => <Tag key={v} label={v} onClear={() => toggle(setDrives)(v)} />)}
              {[...conditions].map(v => <Tag key={v} label={v} onClear={() => toggle(setConditions)(v)} />)}
              {(minPrice > 0 || maxPrice < 30000000) && <Tag label={`KSH ${(minPrice/1e6).toFixed(1)}M–${(maxPrice/1e6).toFixed(1)}M`} onClear={() => { setMinPrice(0); setMaxPrice(30000000) }} />}
              {(minYear > 1970 || maxYear < 2025) && <Tag label={`${minYear}–${maxYear}`} onClear={() => { setMinYear(1970); setMaxYear(2025) }} />}
              {(minKm > 0 || maxKm < 300000) && <Tag label={`${(minKm/1000).toFixed(0)}k–${(maxKm/1000).toFixed(0)}k km`} onClear={() => { setMinKm(0); setMaxKm(300000) }} />}
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
                  <div style={{ height: 180, background: '#EEF5FF', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                    {car.featured && <span style={{ position: 'absolute', top: 8, left: 8, background: '#1565C0', color: '#fff', fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 100, textTransform: 'uppercase', fontFamily: 'Outfit, sans-serif', zIndex: 1 }}>⭐ Featured</span>}
                    <button onClick={e => handleSaveCar(e, car)}
                      style={{ position: 'absolute', top: 8, right: 8, width: 32, height: 32, background: saved.has(car.id) ? '#EF4444' : 'rgba(255,255,255,.92)', borderRadius: '50%', border: 'none', cursor: 'pointer', fontSize: 16, color: saved.has(car.id) ? '#fff' : '#94A3B8', zIndex: 1, display:'flex', alignItems:'center', justifyContent:'center' }}>
                      {saved.has(car.id) ? '♥' : '♡'}
                    </button>
                    {car.listing_photos?.[0]?.url
                      ? <img src={car.listing_photos[0].url} alt={`${car.year} ${car.make} ${car.model}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}><span style={{ fontSize: 40 }}>🚗</span><span style={{ fontSize: 11, color: '#94A3B8' }}>No photos yet</span></div>
                    }
                  </div>
                  <div style={{ padding: 12 }}>
                    <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 17, fontWeight: 800, color: '#0A2540', marginBottom: 2 }}>{fmt(car.price)}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#64748B', marginBottom: 8 }}>{car.year} {car.make} {car.model}</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
                      {[car.mileage && `${Number(car.mileage).toLocaleString()} km`, car.fuel_type, car.transmission, car.engine_cc && `${car.engine_cc}cc`, car.body_type, car.condition].filter(Boolean).map((s, i) => (
                        <span key={i} style={{ fontSize: 10, color: '#94A3B8', padding: '2px 6px', background: '#F8FAFC', borderRadius: 100, border: '1px solid #E8EDF3' }}>{s}</span>
                      ))}
                    </div>
                    <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 8 }}>📍 {car.location}</div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <a href={`https://wa.me/${(car.phone||'').replace(/\D/g,'')}?text=Hi, I'm interested in your ${car.year} ${car.make} ${car.model} on CarExpert Africa`}
                        target="_blank" rel="noopener noreferrer"
                        style={{ flex: 1, background: '#25D366', color: '#fff', border: 'none', padding: '7px 0', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'Outfit, sans-serif', textAlign: 'center', textDecoration: 'none' }}
                        onClick={e => e.stopPropagation()}>WhatsApp</a>
                      <Link to={`/listings/${car.id}`} style={{ flex: 1, background: '#F0F6FF', color: '#1565C0', border: '1.5px solid #BDD5FF', padding: '7px 0', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'Outfit, sans-serif', textAlign: 'center', textDecoration: 'none' }}>View Details</Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Save Search Modal */}
      {saveSearchOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 28, width: 400, boxShadow: '0 20px 60px rgba(0,0,0,.2)' }}>
            <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 18, fontWeight: 800, color: '#0A2540', marginBottom: 6 }}>🔖 Save This Search</div>
            <div style={{ fontSize: 12, color: '#94A3B8', marginBottom: 18 }}>
              Give this search a name. You can re-run it anytime from your dashboard.
            </div>
            {activeFiltersCount > 0 && (
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: '8px 12px', marginBottom: 14, fontSize: 11, color: '#64748B' }}>
                {activeFiltersCount} filter{activeFiltersCount > 1 ? 's' : ''} will be saved
                {selectedMake && ` · ${selectedMake}`}
                {selectedModel && ` ${selectedModel}`}
                {(minPrice > 0 || maxPrice < 30000000) && ` · KSH ${(minPrice/1e6).toFixed(1)}M–${(maxPrice/1e6).toFixed(1)}M`}
              </div>
            )}
            <input
              value={searchName}
              onChange={e => setSearchName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSaveSearch()}
              placeholder="e.g. Toyota SUVs under 5M"
              autoFocus
              style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #E2E8F0', borderRadius: 8, fontSize: 13, fontFamily: 'DM Sans, sans-serif', outline: 'none', marginBottom: 16 }}
            />
            {saveMsg && (
              <div style={{ background: '#DCFCE7', color: '#16A34A', borderRadius: 8, padding: '8px 12px', fontSize: 13, fontWeight: 600, marginBottom: 12, textAlign: 'center' }}>{saveMsg}</div>
            )}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => { setSaveSearchOpen(false); setSearchName(''); setSaveMsg('') }}
                style={{ background: '#F8FAFC', color: '#64748B', border: '1.5px solid #E2E8F0', padding: '9px 18px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}>Cancel</button>
              <button onClick={handleSaveSearch} disabled={!searchName.trim()}
                style={{ background: searchName.trim() ? '#1565C0' : '#94A3B8', color: '#fff', border: 'none', padding: '9px 20px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: searchName.trim() ? 'pointer' : 'default', fontFamily: 'Outfit, sans-serif' }}>
                Save Search
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
