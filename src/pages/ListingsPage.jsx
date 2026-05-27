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

const VARIANTS = {
  'Land Cruiser 300': ['GX','GXR','VX','VX.R','ZX','Sahara','Sahara ZX','Black Edition','GR Sport'],
  'Land Cruiser 200': ['GX','GXR','VX','VXR','VX Limited','ZX','Sahara','Heritage Edition'],
  'Land Cruiser Prado 150': ['GX','GXR','TX','TX-L','VX','VXL','TZ-G','Active','Kakadu'],
  'Land Cruiser Prado 120': ['GX','GXL','VX','VXL','Grande'],
  'Land Cruiser Prado 90': ['GX','VX','RV'],
  'Land Cruiser 100 Series': ['GX','VX','VX Limited','Sahara','Amazon'],
  'Land Cruiser 80 Series': ['GX','VX','GXL','VXL','Sahara'],
  'Land Cruiser 70 Series': ['Single Cab','Double Cab','Troop Carrier','VDJ76','VDJ78','VDJ79'],
  'Hilux': ['Single Cab 4x2','Single Cab 4x4','Extra Cab 4x2','Extra Cab 4x4','Double Cab 4x2','Double Cab 4x4','Raider','Revo','Legend 50','Legend RS'],
  'Fortuner': ['GX','GXR','VX','Legender','GR Sport'],
  'Harrier': ['Standard','Premium','Z','Z Leather'],
  'RAV4': ['XA','XLE','Adventure','TRD Off-Road','Limited','Hybrid XLE','Prime'],
  'Camry': ['LE','SE','XLE','XSE','TRD'],
  'Corolla': ['Base','LE','SE','XLE','XSE','ZR'],
  'Noah': ['S','G','Si','Gi'],
  'Voxy': ['V','ZS','ZR'],
  'Alphard': ['S','G','GF','SC','Executive Lounge'],
  'Vellfire': ['V','Z','ZG','Z G Edition','Executive Lounge'],
  'Crown': ['S','G','RS','Advance','RS Advance'],
  'Mark X': ['250G','350G','350S','Relax Selection'],
  'Hiace': ['Standard','High Roof','Super GL','Grand Cabin','KDH','LH'],
  'Patrol': ['DX','SGL','LE','SE','Titanium','Safari','Y61','Y62'],
  'X-Trail': ['LE','ST','ST-L','Ti','Ti-L'],
  'Navara': ['D40','D23','NP300','LE','SE','Calibre','King Cab','Double Cab'],
  'Elgrand': ['Standard','Rider','Highway Star','VIP','E51','E52'],
  'C-Class': ['C180','C200','C220d','C250','C300','C350','AMG C43','AMG C63'],
  'E-Class': ['E200','E220','E250','E300','E350','E400','AMG E43','AMG E63'],
  'S-Class': ['S300','S320','S350','S400','S450','S500','S600','AMG S63','Maybach S580'],
  'GLE': ['GLE 300d','GLE 350','GLE 400','GLE 450','AMG GLE 53','AMG GLE 63'],
  'GLC': ['GLC 200','GLC 220d','GLC 250','GLC 300','AMG GLC 43'],
  'GLS': ['GLS 350d','GLS 400','GLS 450','AMG GLS 63'],
  'G-Class': ['G 350d','G 500','G 550','AMG G 63'],
  'X5': ['xDrive 25d','xDrive 30d','xDrive 40i','M50i','xDrive 45e','M Competition'],
  'X3': ['xDrive 20i','xDrive 20d','xDrive 30i','xDrive 30d','M40i','M Competition'],
  'X6': ['xDrive 30d','xDrive 40i','M50i','M Competition'],
  '3 Series': ['316i','318i','320i','320d','325i','328i','330i','335i','M3'],
  '5 Series': ['518d','520i','520d','525d','528i','530i','535i','M5'],
  'Range Rover': ['Vogue','Vogue SE','Autobiography','SVAutobiography','Sport HSE','Sport HST'],
  'Range Rover Sport': ['SE','HSE','HSE Dynamic','Autobiography Dynamic','SVR','P400e'],
  'Range Rover Evoque': ['S','SE','HSE','R-Dynamic SE','First Edition'],
  'Discovery': ['S','SE','HSE','HSE Luxury','First Edition','HSE Si6'],
  'Defender 110': ['S','SE','HSE','X','X-Dynamic SE','Trophy Edition','Heritage'],
  'Defender 90': ['S','SE','HSE','X','X-Dynamic SE','Trophy Edition'],
  'Golf': ['Trendline','Comfortline','Highline','R-Line','GTI','Golf R','e-Golf'],
  'Tiguan': ['Trendline','Comfortline','Highline','R-Line','Allspace'],
  'Amarok': ['Trendline','Comfortline','Highline','V6 TDI','Aventura'],
  'Ranger': ['XL','XLS','XLT','Sport','Wildtrak','Raptor','Limited','FX4','Tremor'],
  'Everest': ['Ambiente','Trend','Sport','Titanium','Titanium Plus','Platinum'],
  'Pajero': ['GLX','GLS','Exceed','Dakar','Final Edition','Short Body','Long Body'],
  'Outlander': ['GLX','GLS','Exceed','GT','PHEV'],
  'L200': ['GL','GLX','GLS','Triton','Double Cab','Single Cab'],
  'Forester': ['2.0i','2.5i','XT','X20','Premium','Sport','Touring'],
  'Outback': ['2.5i','3.6R','Premium','Limited','Touring','XT'],
  'WRX': ['Base','Premium','Limited','STI','STI S209'],
  'CR-V': ['LX','EX','EX-L','Touring','Sport'],
  'LX': ['LX 450d','LX 570','LX 600 Luxury','LX 600 Ultra Luxury'],
  'GX': ['GX 400','GX 460','Luxury','Premium'],
  'RX': ['RX 200t','RX 300','RX 330','RX 350','RX 450h','F Sport'],
  'Cayenne': ['Base','S','GTS','Turbo','Turbo S','E-Hybrid','Coupe'],
  '911': ['Carrera','Carrera S','Carrera 4','Carrera 4S','Turbo','Turbo S','GT3'],
  'Santa Fe': ['GL','GLS','Executive','XL','Highlander','Calligraphy'],
  'Tucson': ['GL','GLS','Executive','Highlander','N Line'],
  'Sorento': ['LX','EX','SX','SX Prestige','Hybrid EX'],
  'Sportage': ['LX','EX','SX','GT Line','Hybrid'],
  'D-Max': ['Base','LS','V-Cross','X-Series','4x2','4x4','Single Cab','Spacecab','Double Cab'],
  'MU-X': ['LS-U','LS-T','X Series','Ultimate'],
  'H6': ['Classic','Premium','Supreme','Ultra','HEV'],
  'Jolion': ['Comfort','Premium','Lux','HEV'],
  'Tiggo 7 Pro': ['Comfort','Premium','Luxury'],
  'Tiggo 8': ['Comfort','Premium','Luxury','Sport','Pro'],
  'Q7': ['35 TDI','45 TFSI','55 TFSI','SQ7'],
  'Q5': ['35 TDI','40 TDI','40 TFSI','45 TFSI','SQ5'],
  'A4': ['35 TDI','40 TDI','40 TFSI','45 TFSI','S4','RS4'],
  'A6': ['40 TDI','45 TDI','45 TFSI','55 TFSI','S6','RS6'],
}

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
          style={{ position:'absolute', left:`${minPct}%`, top:'50%', transform:'translate(-50%,-50%)', width:22, height:22, borderRadius:'50%', background:'#1565C0', border:'2px solid #fff', boxShadow:'0 2px 6px rgba(21,101,192,.4)', cursor:'grab', zIndex:2 }}/>
        <div onMouseDown={onMouseDown('max')} onTouchStart={onMouseDown('max')}
          style={{ position:'absolute', left:`${maxPct}%`, top:'50%', transform:'translate(-50%,-50%)', width:22, height:22, borderRadius:'50%', background:'#1565C0', border:'2px solid #fff', boxShadow:'0 2px 6px rgba(21,101,192,.4)', cursor:'grab', zIndex:2 }}/>
      </div>
      <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:'#CBD5E1', marginTop:6 }}>
        <span>{formatLabel(absMin)}</span><span>{formatLabel(absMax)}</span>
      </div>
    </div>
  )
}

function FilterSection({ title, activeCount, children }) {
  const [open, setOpen] = useState(activeCount > 0)

  useEffect(() => {
    if (activeCount > 0) setOpen(true)
  }, [activeCount])
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
        style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, cursor: 'pointer', padding: '2px 0' }}>
        <div style={{ width: 16, height: 16, border: `1.5px solid ${isChecked ? '#1565C0' : '#CBD5E1'}`, borderRadius: 3, background: isChecked ? '#1565C0' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 10, color: '#fff' }}>
          {isChecked ? '✓' : ''}
        </div>
        <span style={{ fontSize: 13, color: isChecked ? '#1565C0' : '#475569', fontWeight: isChecked ? 600 : 500, flex: 1 }}>{item}</span>
        {count > 0 && <span style={{ fontSize: 11, color: '#94A3B8' }}>({count})</span>}
      </div>
    )
  })
}

function Tag({ label, onClear }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#EEF4FF', border: '1px solid #BDD5FF', borderRadius: 100, padding: '4px 12px', fontSize: 12, fontWeight: 600, color: '#1565C0' }}>
      {label} <span onClick={onClear} style={{ cursor: 'pointer', fontSize: 16, lineHeight: 1 }}>×</span>
    </div>
  )
}

function SavedSearchesQuickList({ user, onApply }) {
  const [searches, setSearches] = useState([])
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!user) return
    supabase.from('saved_searches').select('*').eq('user_id', user.id)
      .order('created_at', { ascending: false }).limit(5)
      .then(({ data }) => setSearches(data || []))
  }, [user])

  if (searches.length === 0) return null

  return (
    <div style={{ borderTop: '1px solid #F5F7FA' }}>
      <div onClick={() => setOpen(!open)}
        style={{ padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', background: '#FFFBEB' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 13 }}>🔖</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#92400E', fontFamily: 'Outfit, sans-serif' }}>Saved Searches</span>
          <span style={{ background: '#F59E0B', color: '#fff', borderRadius: 100, padding: '1px 6px', fontSize: 9, fontWeight: 700 }}>{searches.length}</span>
        </div>
        <span style={{ color: '#94A3B8', fontSize: 12, transform: open ? 'rotate(180deg)' : 'none', display: 'inline-block' }}>▾</span>
      </div>
      {open && (
        <div style={{ padding: '4px 10px 10px' }}>
          {searches.map(s => (
            <button key={s.id} onClick={() => { onApply(s.filters); setOpen(false) }}
              style={{ width: '100%', textAlign: 'left', background: '#fff', border: '1.5px solid #E2E8F0', borderRadius: 7, padding: '9px 12px', marginBottom: 6, cursor: 'pointer', fontSize: 12, fontFamily: 'DM Sans, sans-serif' }}>
              <div style={{ fontWeight: 700, color: '#0A2540', marginBottom: 2 }}>{s.name}</div>
              <div style={{ color: '#94A3B8', fontSize: 11 }}>
                {[s.filters.make, s.filters.model, s.filters.maxPrice < 30000000 && `Up to ${(s.filters.maxPrice/1e6).toFixed(1)}M`].filter(Boolean).join(' · ')}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
const fmt = (n) => 'KSH ' + Number(n).toLocaleString()
export default function ListingsPage({ user }) {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [saved, setSaved] = useState(new Set())
  const [saveSearchOpen, setSaveSearchOpen] = useState(false)
  const [searchName, setSearchName] = useState('')
  const [saveMsg, setSaveMsg] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false) // mobile sidebar

  const [search, setSearch] = useState(searchParams.get('q') || '')
  const [selectedMake, setSelectedMake] = useState(searchParams.get('make') || '')
  const [selectedModel, setSelectedModel] = useState(searchParams.get('model') || '')
  const [selectedVariant, setSelectedVariant] = useState('')
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

  useEffect(() => { fetchListings() }, [])

  const fetchListings = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('listings').select('*, listing_photos(*)')
      .eq('status', 'approved')
      .order('featured', { ascending: false })
      .order('created_at', { ascending: false })
    if (!error) setListings(data || [])
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
    setSearch(''); setSelectedMake(''); setSelectedModel(''); setSelectedVariant(''); setSelectedLocation('')
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
      search, make: selectedMake, model: selectedModel, variant: selectedVariant, location: selectedLocation,
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
    if (selectedVariant && c.variant !== selectedVariant)      return false
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
    search, selectedMake, selectedModel, selectedVariant, selectedLocation,
    ...bodies, ...fuels, ...trans, ...drives, ...conditions,
    minPrice > 0, maxPrice < 30000000, minYear > 1970, maxYear < 2025, minKm > 0, maxKm < 300000
  ].filter(Boolean).length

  const applySearch = (filters) => {
    if (filters.make) setSelectedMake(filters.make)
    if (filters.model) setSelectedModel(filters.model)
    if (filters.variant) setSelectedVariant(filters.variant)
    if (filters.search) setSearch(filters.search)
    if (filters.location) setSelectedLocation(filters.location)
    if (filters.minPrice) setMinPrice(filters.minPrice)
    if (filters.maxPrice) setMaxPrice(filters.maxPrice)
    if (filters.minYear) setMinYear(filters.minYear)
    if (filters.maxYear) setMaxYear(filters.maxYear)
    if (filters.minKm) setMinKm(filters.minKm)
    if (filters.maxKm) setMaxKm(filters.maxKm)
    if (filters.bodies?.length) setBodies(new Set(filters.bodies))
    if (filters.fuels?.length) setFuels(new Set(filters.fuels))
    if (filters.trans?.length) setTrans(new Set(filters.trans))
  }

  const SidebarContent = () => (
    <>
      <div style={{ padding: '14px 16px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F0F4F8', position: 'sticky', top: 0, background: '#fff', zIndex: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: 13, fontWeight: 700, color: '#0A2540' }}>Filters</span>
          {activeFiltersCount > 0 && <span style={{ background: '#1565C0', color: '#fff', borderRadius: 100, padding: '1px 7px', fontSize: 9, fontWeight: 700 }}>{activeFiltersCount}</span>}
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button onClick={clearAll} style={{ fontSize: 12, color: '#EF4444', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>✕ Clear all</button>
          <button onClick={() => setSidebarOpen(false)} style={{ display: 'none', fontSize: 20, color: '#64748B', background: 'none', border: 'none', cursor: 'pointer', lineHeight: 1 }} className="sidebar-close">×</button>
        </div>
      </div>

      <div style={{ padding: '10px 16px', background: '#F8FAFC', borderBottom: '1px solid #F0F4F8', textAlign: 'center' }}>
        <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: 14, fontWeight: 800, color: '#1565C0' }}>{loading ? '...' : filtered.length}</span>
        <span style={{ fontSize: 11, color: '#94A3B8', marginLeft: 4 }}>cars match</span>
      </div>

      <SavedSearchesQuickList user={user} onApply={filters => { applySearch(filters); setSidebarOpen(false) }} />

      {/* Search */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid #F5F7FA' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '.8px', fontFamily: 'Outfit, sans-serif', marginBottom: 8 }}>Search</div>
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: '#94A3B8' }}>🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder='e.g. "Land Cruiser 100"'
            style={{ width: '100%', padding: '10px 10px 10px 32px', border: '1.5px solid #E2E8F0', borderRadius: 7, fontSize: 13, fontFamily: 'DM Sans, sans-serif', outline: 'none', background: '#F8FAFC', boxSizing: 'border-box' }} />
          {search && <span onClick={() => setSearch('')} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: '#94A3B8', fontSize: 18 }}>×</span>}
        </div>
      </div>

      <FilterSection title="Make" activeCount={selectedMake ? 1 : 0}>
        <select value={selectedMake} onChange={e => { setSelectedMake(e.target.value); setSelectedModel('') }}
          style={{ width: '100%', padding: '10px', border: '1.5px solid #E2E8F0', borderRadius: 7, fontSize: 13, fontFamily: 'DM Sans, sans-serif', outline: 'none', background: '#F8FAFC', marginBottom: 8 }}>
          <option value="">Any Make ({listings.length})</option>
          {MAKES.map(m => <option key={m} value={m}>{m}{makeCounts[m] > 0 ? ` (${makeCounts[m]})` : ''}</option>)}
        </select>
        {selectedMake && availableModels.length > 0 && (
          <>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '.8px', fontFamily: 'Outfit, sans-serif', marginBottom: 6 }}>Model</div>
            <select value={selectedModel} onChange={e => { setSelectedModel(e.target.value); setSelectedVariant('') }}
              style={{ width: '100%', padding: '10px', border: '1.5px solid #E2E8F0', borderRadius: 7, fontSize: 13, fontFamily: 'DM Sans, sans-serif', outline: 'none', background: '#F8FAFC' }}>
              <option value="">All {selectedMake} ({listings.filter(l => l.make === selectedMake).length})</option>
              {availableModels.map(m => <option key={m} value={m}>{m}{modelCounts[m] > 0 ? ` (${modelCounts[m]})` : ''}</option>)}
            </select>
            {selectedModel && VARIANTS[selectedModel] && (
              <>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '.8px', fontFamily: 'Outfit, sans-serif', marginBottom: 6, marginTop: 10 }}>Variant / Trim</div>
                <select value={selectedVariant} onChange={e => setSelectedVariant(e.target.value)}
                  style={{ width: '100%', padding: '10px', border: '1.5px solid #E2E8F0', borderRadius: 7, fontSize: 13, fontFamily: 'DM Sans, sans-serif', outline: 'none', background: '#F8FAFC' }}>
                  <option value="">All Variants</option>
                  {VARIANTS[selectedModel].map(v => {
                    const count = listings.filter(l => l.model === selectedModel && l.variant === v).length
                    return <option key={v} value={v}>{v}{count > 0 ? ` (${count})` : ''}</option>
                  })}
                </select>
              </>
            )}
          </>
        )}
      </FilterSection>

      <FilterSection title="Location" activeCount={selectedLocation ? 1 : 0}>
        <select value={selectedLocation} onChange={e => setSelectedLocation(e.target.value)}
          style={{ width: '100%', padding: '10px', border: '1.5px solid #E2E8F0', borderRadius: 7, fontSize: 13, fontFamily: 'DM Sans, sans-serif', outline: 'none', background: '#F8FAFC' }}>
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

      <div style={{ height: 32 }} />
    </>
  )

  return (
    <div style={{ fontFamily: 'DM Sans, sans-serif', background: '#F7F9FC', minHeight: '100vh' }}>
      <style>{`
        .listings-layout { display: grid; grid-template-columns: 268px 1fr; min-height: calc(100vh - 96px); }
        .listings-sidebar { background: #fff; border-right: 1px solid #E8EDF3; overflow-y: auto; }
        .listings-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px; }
        .mobile-filter-btn { display: none !important; }
        .mobile-sidebar-overlay { display: none; }
        @media (max-width: 768px) {
          .listings-layout { grid-template-columns: 1fr; }
          .listings-sidebar { display: none; }
          .listings-grid { grid-template-columns: 1fr; gap: 12px; }
          .mobile-filter-btn { display: flex !important; }
          .mobile-sidebar-overlay { display: block; position: fixed; inset: 0; background: rgba(0,0,0,.5); z-index: 200; }
          .mobile-sidebar-drawer { display: block; position: fixed; left: 0; top: 0; bottom: 0; width: 85%; max-width: 340px; background: #fff; z-index: 201; overflow-y: auto; }
          .sidebar-close { display: flex !important; }
        }
      `}</style>

      <Navbar user={user} />

      <div style={{ background: '#fff', borderBottom: '1px solid #E8EDF3', padding: '10px 16px', fontSize: 12, color: '#94A3B8', display: 'flex', alignItems: 'center', gap: 6 }}>
        <Link to="/" style={{ color: '#1565C0', textDecoration: 'none' }}>Home</Link>
        <span>/</span>
        <span>All Listings</span>
      </div>

      <div className="listings-layout">

        {/* Desktop sidebar */}
        <aside className="listings-sidebar">
          <SidebarContent />
        </aside>

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <>
            <div className="mobile-sidebar-overlay" onClick={() => setSidebarOpen(false)} />
            <div className="mobile-sidebar-drawer">
              <SidebarContent />
            </div>
          </>
        )}

        {/* Main */}
        <main style={{ padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, gap: 8, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {/* Mobile filter button */}
              <button className="mobile-filter-btn"
                onClick={() => setSidebarOpen(true)}
                style={{ background: '#0A2540', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'Outfit, sans-serif', alignItems: 'center', gap: 6 }}>
                ⚙ Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}
              </button>
              <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 16, fontWeight: 700, color: '#0A2540' }}>
                {loading ? 'Loading...' : (
                  <><span style={{ color: '#1565C0' }}>{filtered.length}</span> Cars
                    {activeFiltersCount > 0 && listings.length > 0 && <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 400, marginLeft: 6 }}>of {listings.length}</span>}
                  </>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {user && (
                <button onClick={() => setSaveSearchOpen(true)}
                  style={{ background: '#EEF5FF', color: '#1565C0', border: '1.5px solid #BDD5FF', padding: '7px 12px', borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Outfit, sans-serif', whiteSpace: 'nowrap' }}>
                  🔖 Save
                </button>
              )}
              <select value={sort} onChange={e => setSort(e.target.value)} style={{ padding: '7px 10px', border: '1.5px solid #E2E8F0', borderRadius: 7, fontSize: 12, fontFamily: 'DM Sans, sans-serif', outline: 'none', background: '#fff' }}>
                <option value="newest">Newest</option>
                <option value="price_asc">Price ↑</option>
                <option value="price_desc">Price ↓</option>
                <option value="mileage">Mileage ↑</option>
                <option value="year">Year ↓</option>
              </select>
            </div>
          </div>

          {/* Active tags */}
          {activeFiltersCount > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
              {search && <Tag label={`"${search}"`} onClear={() => setSearch('')} />}
              {selectedMake && <Tag label={selectedMake} onClear={() => { setSelectedMake(''); setSelectedModel('') }} />}
              {selectedModel && <Tag label={selectedModel} onClear={() => { setSelectedModel(''); setSelectedVariant('') }} />}
              {selectedVariant && <Tag label={selectedVariant} onClear={() => setSelectedVariant('')} />}
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
            <div style={{ textAlign: 'center', padding: 48, color: '#94A3B8' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>🔍</div>
              <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 16, fontWeight: 700, color: '#0A2540', marginBottom: 6 }}>
                {listings.length === 0 ? 'No listings yet' : 'No cars match your filters'}
              </div>
              <div style={{ fontSize: 13, marginBottom: 16 }}>
                {listings.length === 0 ? 'Be the first to list a car.' : 'Try adjusting your filters'}
              </div>
              {listings.length === 0
                ? <Link to="/list-car" style={{ background: '#1565C0', color: '#fff', padding: '10px 24px', borderRadius: 8, fontSize: 13, fontWeight: 700, textDecoration: 'none', fontFamily: 'Outfit, sans-serif' }}>List a Car</Link>
                : <button onClick={clearAll} style={{ background: '#1565C0', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}>Clear Filters</button>
              }
            </div>
          ) : (
            <div className="listings-grid">
              {filtered.map(car => (
                <div key={car.id} style={{ background: '#fff', border: '1.5px solid #E8EDF3', borderRadius: 12, overflow: 'hidden', cursor: 'pointer', transition: 'all .2s' }}
                  onMouseOver={e => { e.currentTarget.style.borderColor='#1565C0'; e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 8px 24px rgba(21,101,192,.1)' }}
                  onMouseOut={e => { e.currentTarget.style.borderColor='#E8EDF3'; e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='none' }}>
                  <div style={{ height: 180, background: '#EEF5FF', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                    {car.featured && <span style={{ position: 'absolute', top: 8, left: 8, background: '#1565C0', color: '#fff', fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 100, textTransform: 'uppercase', fontFamily: 'Outfit, sans-serif', zIndex: 1 }}>⭐ Featured</span>}
                    <button onClick={e => handleSaveCar(e, car)}
                      style={{ position: 'absolute', top: 8, right: 8, width: 34, height: 34, background: saved.has(car.id) ? '#EF4444' : 'rgba(255,255,255,.92)', borderRadius: '50%', border: 'none', cursor: 'pointer', fontSize: 18, color: saved.has(car.id) ? '#fff' : '#94A3B8', zIndex: 1, display:'flex', alignItems:'center', justifyContent:'center' }}>
                      {saved.has(car.id) ? '♥' : '♡'}
                    </button>
                    {car.listing_photos?.[0]?.url
                      ? <img src={car.listing_photos[0].url} alt={`${car.year} ${car.make} ${car.model}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}><span style={{ fontSize: 40 }}>🚗</span><span style={{ fontSize: 11, color: '#94A3B8' }}>No photos</span></div>
                    }
                  </div>
                  <div style={{ padding: 12 }}>
                    <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 16, fontWeight: 800, color: '#0A2540', marginBottom: 2 }}>{fmt(car.price)}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#64748B', marginBottom: 8 }}>{car.year} {car.make} {car.model}{car.variant ? ` — ${car.variant}` : ''}</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
                      {[car.mileage && `${Number(car.mileage).toLocaleString()} km`, car.fuel_type, car.transmission, car.body_type].filter(Boolean).map((s, i) => (
                        <span key={i} style={{ fontSize: 10, color: '#94A3B8', padding: '2px 6px', background: '#F8FAFC', borderRadius: 100, border: '1px solid #E8EDF3' }}>{s}</span>
                      ))}
                    </div>
                    {car.location && <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 8 }}>📍 {car.location}</div>}
                    <div style={{ display: 'flex', gap: 6 }}>
                      <a href={`https://wa.me/${(car.phone||'').replace(/\D/g,'')}?text=Hi, I'm interested in your ${car.year} ${car.make} ${car.model} on CarExpert Africa`}
                        target="_blank" rel="noopener noreferrer"
                        style={{ flex: 1, background: '#25D366', color: '#fff', border: 'none', padding: '9px 0', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Outfit, sans-serif', textAlign: 'center', textDecoration: 'none' }}
                        onClick={e => e.stopPropagation()}>WhatsApp</a>
                      <Link to={`/listings/${car.id}`} style={{ flex: 1, background: '#F0F6FF', color: '#1565C0', border: '1.5px solid #BDD5FF', padding: '9px 0', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Outfit, sans-serif', textAlign: 'center', textDecoration: 'none' }}>View →</Link>
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
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 24, width: '100%', maxWidth: 400, boxShadow: '0 20px 60px rgba(0,0,0,.2)' }}>
            <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 18, fontWeight: 800, color: '#0A2540', marginBottom: 6 }}>🔖 Save This Search</div>
            <div style={{ fontSize: 12, color: '#94A3B8', marginBottom: 16 }}>Give this search a name to re-run it from your dashboard.</div>
            {activeFiltersCount > 0 && (
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: '8px 12px', marginBottom: 14, fontSize: 11, color: '#64748B' }}>
                {activeFiltersCount} filter{activeFiltersCount > 1 ? 's' : ''} will be saved
                {selectedMake && ` · ${selectedMake}`}{selectedModel && ` ${selectedModel}`}
              </div>
            )}
            <input value={searchName} onChange={e => setSearchName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSaveSearch()}
              placeholder="e.g. Toyota SUVs under 5M" autoFocus
              style={{ width: '100%', padding: '12px', border: '1.5px solid #E2E8F0', borderRadius: 8, fontSize: 14, fontFamily: 'DM Sans, sans-serif', outline: 'none', marginBottom: 14, boxSizing: 'border-box' }} />
            {saveMsg && <div style={{ background: '#DCFCE7', color: '#16A34A', borderRadius: 8, padding: '8px 12px', fontSize: 13, fontWeight: 600, marginBottom: 12, textAlign: 'center' }}>{saveMsg}</div>}
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => { setSaveSearchOpen(false); setSearchName(''); setSaveMsg('') }}
                style={{ flex: 1, background: '#F8FAFC', color: '#64748B', border: '1.5px solid #E2E8F0', padding: '11px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}>Cancel</button>
              <button onClick={handleSaveSearch} disabled={!searchName.trim()}
                style={{ flex: 1, background: searchName.trim() ? '#1565C0' : '#94A3B8', color: '#fff', border: 'none', padding: '11px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: searchName.trim() ? 'pointer' : 'default', fontFamily: 'Outfit, sans-serif' }}>
                Save Search
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
