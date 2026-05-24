import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import { signUp, signIn, supabase } from '../lib/supabase'
import { Link, useNavigate, useParams } from 'react-router-dom'
const fmt = (n) => 'KSH ' + Number(n).toLocaleString()

// ─────────────────────────────────────────────────────────────
// CAR DETAIL PAGE
// ─────────────────────────────────────────────────────────────
export function CarDetailPage({ user }) {
  const { id } = useParams()
  const [car, setCar] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saved, setSaved] = useState(false)
  const [deposit, setDeposit] = useState(0)
  const [term, setTerm] = useState(48)
  const [rate, setRate] = useState(14)

  useEffect(() => {
    if (!id) return
    supabase.from('listings').select('*, listing_photos(*)').eq('id', id).single()
      .then(({ data }) => {
        if (data) {
          setCar(data)
          setDeposit(Math.round(data.price * 0.2))
          // track recently viewed
          const ids = JSON.parse(localStorage.getItem('cea_recently_viewed') || '[]')
          const updated = [id, ...ids.filter(i => i !== id)].slice(0, 5)
          localStorage.setItem('cea_recently_viewed', JSON.stringify(updated))
          // check if saved
          supabase.auth.getUser().then(({ data: { user: u } }) => {
            if (!u) return
            supabase.from('saved_listings').select('id').eq('user_id', u.id).eq('listing_id', id).single()
              .then(({ data: s }) => { if (s) setSaved(true) })
          })
        }
        setLoading(false)
      })
  }, [id])
      // Save to recently viewed
  const ids = JSON.parse(localStorage.getItem('cea_recently_viewed') || '[]')
  const updated = [id, ...ids.filter(i => i !== id)].slice(0, 5)
  localStorage.setItem('cea_recently_viewed', JSON.stringify(updated))  
  const monthly = () => {
    if (!car) return 0
    const principal = car.price - deposit
    const r = rate / 100 / 12
    if (r === 0) return Math.round(principal / term)
    return Math.round(principal * r * Math.pow(1+r,term) / (Math.pow(1+r,term)-1))
  }

  const handleSave = async () => {
    const { data: { user: u } } = await supabase.auth.getUser()
    if (!u) { alert('Please log in to save cars'); return }
    if (saved) {
      await supabase.from('saved_listings').delete().eq('user_id', u.id).eq('listing_id', id)
      setSaved(false)
    } else {
      await supabase.from('saved_listings').insert({ user_id: u.id, listing_id: id, saved_price: car.price, last_price: car.price })
      setSaved(true)
    }
  }

  if (loading) return (
    <div style={{ fontFamily:'DM Sans,sans-serif', minHeight:'100vh', background:'#F7F9FC' }}>
      <Navbar user={user} />
      <div style={{ textAlign:'center', padding:80, color:'#94A3B8', fontFamily:'Outfit,sans-serif', fontSize:16, fontWeight:600 }}>Loading...</div>
    </div>
  )

  if (!car) return (
    <div style={{ fontFamily:'DM Sans,sans-serif', minHeight:'100vh', background:'#F7F9FC' }}>
      <Navbar user={user} />
      <div style={{ textAlign:'center', padding:80 }}>
        <div style={{ fontSize:40, marginBottom:16 }}>🔍</div>
        <div style={{ fontFamily:'Outfit,sans-serif', fontSize:20, fontWeight:800, color:'#0A2540', marginBottom:8 }}>Listing not found</div>
        <Link to="/listings" style={{ background:'#1565C0', color:'#fff', padding:'10px 24px', borderRadius:8, fontSize:13, fontWeight:700, textDecoration:'none', fontFamily:'Outfit,sans-serif' }}>Back to Listings</Link>
      </div>
    </div>
  )

  const waLink = `https://wa.me/${(car.phone||'').replace(/\D/g,'')}?text=Hi, I saw your ${car.year} ${car.make} ${car.model} on CarExpert Africa. Is it still available?`

  return (
    <div style={{ fontFamily:'DM Sans,sans-serif', background:'#F7F9FC', minHeight:'100vh' }}>
      <Navbar user={user} />
      <div style={{ background:'#fff', borderBottom:'1px solid #E8EDF3', padding:'10px 24px', fontSize:12, color:'#94A3B8' }}>
        <Link to="/" style={{ color:'#1565C0', textDecoration:'none' }}>Home</Link> / <Link to="/listings" style={{ color:'#1565C0', textDecoration:'none' }}>Listings</Link> / {car.year} {car.make} {car.model}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 300px', gap:20, padding:'20px 24px', maxWidth:1200, margin:'0 auto' }}>
        <div>
          {/* Photos */}
          <div style={{ borderRadius:14, overflow:'hidden', background:'#EEF5FF', height:320, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:10 }}>
            {car.listing_photos?.[0]?.url
              ? <img src={car.listing_photos[0].url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
              : <div style={{ textAlign:'center' }}><span style={{ fontSize:60 }}>🚗</span><div style={{ fontSize:13, color:'#94A3B8', marginTop:8 }}>No photos uploaded</div></div>
            }
          </div>
          {car.listing_photos?.length > 1 && (
            <div style={{ display:'grid', gridTemplateColumns:`repeat(${Math.min(car.listing_photos.length,5)},1fr)`, gap:8, marginBottom:16 }}>
              {car.listing_photos.slice(0,5).map((p,i) => (
                <div key={i} style={{ height:60, borderRadius:8, overflow:'hidden', border:`2px solid ${i===0?'#1565C0':'transparent'}` }}>
                  <img src={p.url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                </div>
              ))}
            </div>
          )}

          {/* Title + save */}
          <div style={{ background:'#fff', border:'1.5px solid #E8EDF3', borderRadius:14, padding:20, marginBottom:14 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
              <div>
                <div style={{ fontFamily:'Outfit,sans-serif', fontSize:22, fontWeight:800, color:'#0A2540', marginBottom:4 }}>{car.year} {car.make} {car.model}</div>
                <div style={{ fontSize:12, color:'#94A3B8', display:'flex', gap:10, flexWrap:'wrap' }}>
                  <span>📍 {car.location}</span>
                  {car.views > 0 && <><span>·</span><span style={{ color:'#1565C0', fontWeight:600 }}>{car.views} views</span></>}
                  <span>·</span><span>{new Date(car.created_at).toLocaleDateString('en-GB')}</span>
                </div>
              </div>
              <button onClick={handleSave} style={{ background: saved?'#EEF5FF':'none', border:'1.5px solid', borderColor: saved?'#1565C0':'#E2E8F0', borderRadius:8, padding:'8px 14px', fontSize:12, fontWeight:600, color: saved?'#1565C0':'#475569', cursor:'pointer' }}>
                {saved ? '♥ Saved' : '♡ Save'}
              </button>
            </div>
          </div>

          {/* Specs */}
          <div style={{ background:'#fff', border:'1.5px solid #E8EDF3', borderRadius:14, padding:20, marginBottom:14 }}>
            <div style={{ fontFamily:'Outfit,sans-serif', fontSize:15, fontWeight:700, color:'#0A2540', marginBottom:16, display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ width:3, height:15, background:'#1565C0', borderRadius:2, display:'inline-block' }}></span> Vehicle Specifications
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:0 }}>
              {[
                ['Make', car.make],
                ['Model', car.model],
                ['Year', car.year],
                ['Mileage', car.mileage ? `${Number(car.mileage).toLocaleString()} km` : '—'],
                ['Condition', car.condition || '—'],
                ['Body Type', car.body_type || '—'],
                ['Engine', car.engine_cc ? `${car.engine_cc} cc` : '—'],
                ['Fuel Type', car.fuel_type || '—'],
                ['Transmission', car.transmission || '—'],
                ['Drive Type', car.drive_type || '—'],
                ['Colour', car.colour || car.color || '—'],
                ['Negotiable', car.negotiable ? 'Yes' : 'No'],
              ].map(([k,v], i) => (
                <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'9px 12px', borderBottom:'1px solid #F0F4F8', borderRight: i%2===0?'1px solid #F0F4F8':'none' }}>
                  <span style={{ fontSize:12, color:'#94A3B8', fontWeight:500 }}>{k}</span>
                  <span style={{ fontSize:12, fontWeight:700, color:'#1a2332', fontFamily:'Outfit,sans-serif' }}>{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Description */}
          {car.description && (
            <div style={{ background:'#fff', border:'1.5px solid #E8EDF3', borderRadius:14, padding:20 }}>
              <div style={{ fontFamily:'Outfit,sans-serif', fontSize:15, fontWeight:700, color:'#0A2540', marginBottom:12, display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ width:3, height:15, background:'#1565C0', borderRadius:2, display:'inline-block' }}></span> Seller Description
              </div>
              <p style={{ fontSize:13, color:'#475569', lineHeight:1.7, margin:0 }}>{car.description}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div>
          <div style={{ background:'#0A2540', borderRadius:14, padding:20, marginBottom:14, color:'#fff' }}>
            <div style={{ fontSize:11, color:'rgba(255,255,255,.5)', fontWeight:700, textTransform:'uppercase', letterSpacing:'.8px', marginBottom:4 }}>Asking Price</div>
            <div style={{ fontFamily:'Outfit,sans-serif', fontSize:30, fontWeight:800, marginBottom:4 }}>KSH {Number(car.price).toLocaleString()}</div>
            {car.negotiable && <div style={{ fontSize:12, color:'#4DA6FF', fontWeight:600, marginBottom:16 }}>Price negotiable</div>}
            <a href={waLink} target="_blank" rel="noopener noreferrer"
              style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, width:'100%', background:'#25D366', color:'#fff', border:'none', padding:12, borderRadius:9, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'Outfit,sans-serif', textDecoration:'none', marginBottom:8 }}>
              📱 WhatsApp Seller
            </a>
            {car.phone && (
              <a href={`tel:${car.phone}`}
                style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, width:'100%', background:'rgba(255,255,255,.1)', color:'#fff', border:'1.5px solid rgba(255,255,255,.2)', padding:10, borderRadius:9, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'Outfit,sans-serif', textDecoration:'none', marginBottom:8 }}>
                📞 {car.phone}
              </a>
            )}
            {car.contact_name && (
              <>
                <div style={{ height:1, background:'rgba(255,255,255,.1)', margin:'14px 0' }}/>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{ width:36, height:36, borderRadius:'50%', background:'#1565C0', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:13, fontFamily:'Outfit,sans-serif' }}>
                    {car.contact_name[0].toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize:13, fontWeight:700 }}>{car.contact_name}</div>
                    <div style={{ fontSize:11, color:'rgba(255,255,255,.5)' }}>{car.location}</div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Finance calculator */}
          <div style={{ background:'#fff', border:'1.5px solid #E8EDF3', borderRadius:14, padding:18 }}>
            <div style={{ fontFamily:'Outfit,sans-serif', fontSize:14, fontWeight:700, color:'#0A2540', marginBottom:14, display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ width:3, height:14, background:'#1565C0', borderRadius:2, display:'inline-block' }}></span> Finance Calculator
            </div>
            {[
              { label:'Deposit', value:deposit, setValue:setDeposit, min:0, max:car.price*0.8, step:50000, display:`KSH ${Number(deposit).toLocaleString()}` },
              { label:'Loan Term', value:term, setValue:setTerm, min:12, max:72, step:6, display:`${term} months` },
              { label:'Interest Rate', value:rate, setValue:setRate, min:8, max:25, step:0.5, display:`${rate}%` },
            ].map(({ label, value, setValue, min, max, step, display }) => (
              <div key={label} style={{ marginBottom:12 }}>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, marginBottom:5 }}>
                  <span style={{ fontWeight:700, color:'#64748B', textTransform:'uppercase', letterSpacing:'.5px', fontSize:10 }}>{label}</span>
                  <span style={{ fontWeight:700, color:'#0A2540', fontFamily:'Outfit,sans-serif', fontSize:11 }}>{display}</span>
                </div>
                <input type="range" min={min} max={max} value={value} step={step} onChange={e => setValue(Number(e.target.value))} style={{ width:'100%', accentColor:'#1565C0' }}/>
              </div>
            ))}
            <div style={{ background:'#EEF5FF', borderRadius:9, padding:12, textAlign:'center', border:'1px solid #BDD5FF' }}>
              <div style={{ fontSize:11, color:'#64748B', marginBottom:3 }}>Estimated Monthly Payment</div>
              <div style={{ fontFamily:'Outfit,sans-serif', fontSize:22, fontWeight:800, color:'#1565C0' }}>KSH {Number(monthly()).toLocaleString()}</div>
              <div style={{ fontSize:10, color:'#94A3B8', marginTop:2 }}>Based on KSH {Number(car.price - deposit).toLocaleString()} financed</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// VALUATION PAGE
// ─────────────────────────────────────────────────────────────
const BASE_PRICES = { Toyota:4500000, 'Mercedes-Benz':5500000, BMW:4200000, Audi:4800000, Mazda:2800000, Subaru:2200000, Nissan:2000000 }
const COND_MULT = { Excellent:1.08, Good:1.0, Fair:0.88, Poor:0.72 }
const kmMult = km => km<50000?1.08:km<80000?1.0:km<120000?0.92:0.82
const yrMult = y => { const a=2025-y; return a<=2?1.12:a<=4?1.05:a<=6?0.95:a<=8?0.85:0.72 }

export function ValuationPage({ user }) {
  const [make, setMake] = useState('Toyota')
  const [model, setModel] = useState('')
  const [year, setYear] = useState(2019)
  const [km, setKm] = useState(60000)
  const [cond, setCond] = useState('Excellent')
  const [result, setResult] = useState(null)

  const calculate = () => {
    const base = BASE_PRICES[make] || 3000000
    const mid = Math.round(base * COND_MULT[cond] * kmMult(km) * yrMult(year) / 50000) * 50000
    setResult({ low: Math.round(mid*.88/50000)*50000, mid, high: Math.round(mid*1.12/50000)*50000 })
  }

  return (
    <div style={{ fontFamily:'DM Sans,sans-serif', background:'#F7F9FC', minHeight:'100vh' }}>
      <Navbar user={user} />
      <div style={{ background:'linear-gradient(135deg,#0A2540,#0D3B6E)', padding:'44px 24px', textAlign:'center' }}>
        <div style={{ color:'#4DA6FF', fontSize:11, fontWeight:700, letterSpacing:'1.8px', textTransform:'uppercase', marginBottom:10 }}>Free Tool</div>
        <h1 style={{ fontFamily:'Outfit,sans-serif', fontSize:32, fontWeight:800, color:'#fff', marginBottom:8 }}>What Is Your Car Worth?</h1>
        <p style={{ color:'rgba(255,255,255,.55)', fontSize:14, maxWidth:420, margin:'0 auto' }}>Get an instant market valuation based on real Kenyan listings data in under 60 seconds.</p>
      </div>
      <div style={{ maxWidth:680, margin:'0 auto', padding:24 }}>
        <div style={{ background:'#fff', border:'1.5px solid #E8EDF3', borderRadius:16, padding:24, marginBottom:16 }}>
          <div style={{ fontFamily:'Outfit,sans-serif', fontSize:16, fontWeight:700, color:'#0A2540', marginBottom:20 }}>Tell us about your car</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            {[
              { label:'Make', type:'select', value:make, set:setMake, opts:Object.keys(BASE_PRICES) },
              { label:'Model', type:'text', value:model, set:setModel, placeholder:'e.g. Land Cruiser' },
              { label:'Year', type:'select', value:year, set:e=>setYear(Number(e)), opts:Array.from({length:16},(_,i)=>2025-i) },
              { label:'Mileage (km)', type:'number', value:km, set:e=>setKm(Number(e)), placeholder:'e.g. 60000' },
            ].map(f => (
              <div key={f.label}>
                <label style={{ display:'block', fontSize:10, fontWeight:700, color:'#64748B', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:5 }}>{f.label}</label>
                {f.type === 'select'
                  ? <select value={f.value} onChange={e => f.set(e.target.value)} style={{ width:'100%', padding:'10px 12px', border:'1.5px solid #E2E8F0', borderRadius:8, fontSize:13, fontFamily:'DM Sans,sans-serif', outline:'none', background:'#F8FAFC' }}>
                      {f.opts.map(o => <option key={o}>{o}</option>)}
                    </select>
                  : <input type={f.type} value={f.value} onChange={e => f.set(e.target.value)} placeholder={f.placeholder} style={{ width:'100%', padding:'10px 12px', border:'1.5px solid #E2E8F0', borderRadius:8, fontSize:13, fontFamily:'DM Sans,sans-serif', outline:'none', background:'#F8FAFC' }}/>
                }
              </div>
            ))}
          </div>
          <div style={{ marginTop:16 }}>
            <label style={{ display:'block', fontSize:10, fontWeight:700, color:'#64748B', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:8 }}>Condition</label>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8 }}>
              {['Excellent','Good','Fair','Poor'].map(c => (
                <div key={c} onClick={() => setCond(c)} style={{ border:`2px solid ${cond===c?'#1565C0':'#E2E8F0'}`, borderRadius:10, padding:'10px 8px', textAlign:'center', cursor:'pointer', background:cond===c?'#EEF5FF':'#fff' }}>
                  <div style={{ fontSize:16, marginBottom:4 }}>{c==='Excellent'?'★':c==='Good'?'✓':c==='Fair'?'~':'!'}</div>
                  <div style={{ fontSize:12, fontWeight:700, color:cond===c?'#1565C0':'#475569', fontFamily:'Outfit,sans-serif' }}>{c}</div>
                </div>
              ))}
            </div>
          </div>
          <button onClick={calculate} style={{ width:'100%', background:'#1565C0', color:'#fff', border:'none', padding:13, borderRadius:10, fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'Outfit,sans-serif', marginTop:20 }}>
            Get My Free Valuation →
          </button>
        </div>
        {result && (
          <div style={{ background:'#0A2540', borderRadius:16, padding:24 }}>
            <div style={{ fontSize:11, color:'rgba(255,255,255,.5)', fontWeight:700, textTransform:'uppercase', letterSpacing:'.8px', marginBottom:6, textAlign:'center' }}>Estimated Market Value</div>
            <div style={{ fontFamily:'Outfit,sans-serif', fontSize:32, fontWeight:800, color:'#fff', textAlign:'center', marginBottom:4 }}>{fmt(result.low)} – {fmt(result.high)}</div>
            <div style={{ fontSize:14, color:'#4DA6FF', textAlign:'center', fontWeight:600, marginBottom:20 }}>Best estimate: {fmt(result.mid)}</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:16 }}>
              {[['Year premium', yrMult(year)>=1?`+${Math.round((yrMult(year)-1)*100)}%`:`${Math.round((yrMult(year)-1)*100)}%`, yrMult(year)>=1],['Mileage impact', km<60000?'Below avg':km<100000?'Average':'Above avg', km<100000],['Condition',cond==='Excellent'?'+8%':cond==='Good'?'Average':'-12%', cond==='Excellent'||cond==='Good'],['Market demand','High ↑',true]].map(([l,v,positive]) => (
                <div key={l} style={{ background:'rgba(255,255,255,.06)', borderRadius:8, padding:'10px 12px', display:'flex', justifyContent:'space-between' }}>
                  <span style={{ fontSize:11, color:'rgba(255,255,255,.6)' }}>{l}</span>
                  <span style={{ fontSize:12, fontWeight:700, fontFamily:'Outfit,sans-serif', color:positive?'#4ADE80':'#FB7185' }}>{v}</span>
                </div>
              ))}
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              <Link to="/list-car" style={{ padding:11, borderRadius:9, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'Outfit,sans-serif', textAlign:'center', background:'#1565C0', color:'#fff', textDecoration:'none' }}>List My Car Now</Link>
              <Link to="/listings" style={{ padding:11, borderRadius:9, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'Outfit,sans-serif', textAlign:'center', background:'rgba(255,255,255,.08)', color:'#fff', textDecoration:'none', border:'1.5px solid rgba(255,255,255,.15)' }}>Browse Listings</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// PRICING PAGE
// ─────────────────────────────────────────────────────────────
const PLANS = [
  { name:'Free', desc:'For private sellers listing one car at a time', monthly:0, annual:0, cta:'Get Started', features:['1 active listing','Basic listing page','WhatsApp contact button','5 photos per listing'], missing:['Featured placement','Leads dashboard','Analytics'] },
  { name:'Standard', desc:'For active sellers with a small inventory', monthly:1500, annual:1200, cta:'Start Standard', features:['5 active listings','20 photos per listing','WhatsApp + call button','Basic analytics','Search result boost'], missing:['Featured placement','Dealer profile page'] },
  { name:'Dealer Pro', desc:'For established dealers and showrooms', monthly:7500, annual:6000, cta:'Start Dealer Pro', popular:true, features:['Unlimited listings','50 photos per listing','Featured placement','Dedicated dealer page','Full leads dashboard','Advanced analytics','Priority support'], missing:[] },
  { name:'Enterprise', desc:'For large dealer groups and importers', monthly:null, annual:null, cta:'Contact Sales', features:['Everything in Dealer Pro','Multiple locations','API / CSV import','Homepage banner ads','Dedicated account manager','Custom integrations','SLA guarantee'], missing:[] },
]

export function PricingPage({ user }) {
  const [annual, setAnnual] = useState(false)
  const [openFaq, setOpenFaq] = useState(null)
  const FAQS = [
    ['Can I upgrade or downgrade at any time?','Yes. You can change your plan at any time from your account dashboard. Changes take effect at the start of your next billing cycle.'],
    ['Is M-Pesa supported?','Yes — we support M-Pesa, debit/credit cards, and bank transfer. M-Pesa is the preferred method for most Kenyan customers.'],
    ['Is the free listing really free?','Absolutely. The Free plan requires no payment details. Just create an account and list your car in minutes.'],
    ['How long does it take for a listing to go live?','Listings are reviewed within 1–2 hours during business hours. Paid plan listings are prioritised and typically go live within 30 minutes.'],
  ]
  return (
    <div style={{ fontFamily:'DM Sans,sans-serif', background:'#F7F9FC', minHeight:'100vh' }}>
      <Navbar user={user} />
      <div style={{ background:'linear-gradient(135deg,#0A2540,#1565C0)', padding:'48px 24px 40px', textAlign:'center' }}>
        <div style={{ color:'#4DA6FF', fontSize:11, fontWeight:700, letterSpacing:'1.8px', textTransform:'uppercase', marginBottom:10 }}>Transparent Pricing</div>
        <h1 style={{ fontFamily:'Outfit,sans-serif', fontSize:34, fontWeight:800, color:'#fff', marginBottom:8 }}>Simple Plans, Real Results</h1>
        <p style={{ color:'rgba(255,255,255,.55)', fontSize:14, maxWidth:420, margin:'0 auto 24px' }}>Reach thousands of active car buyers in Kenya. Start free, upgrade when you're ready.</p>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:10 }}>
          <span style={{ fontSize:13, fontWeight:600, color: annual?'rgba(255,255,255,.45)':'#fff', cursor:'pointer' }} onClick={() => setAnnual(false)}>Monthly</span>
          <div onClick={() => setAnnual(!annual)} style={{ width:40, height:22, borderRadius:100, background: annual?'#4DA6FF':'#1565C0', border:'2px solid rgba(255,255,255,.2)', cursor:'pointer', position:'relative' }}>
            <div style={{ position:'absolute', top:2, left: annual?20:2, width:14, height:14, borderRadius:'50%', background:'#fff', transition:'left .2s' }}/>
          </div>
          <span style={{ fontSize:13, fontWeight:600, color: annual?'#fff':'rgba(255,255,255,.45)', cursor:'pointer' }} onClick={() => setAnnual(true)}>Annual</span>
          <span style={{ background:'#4DA6FF', color:'#0A2540', fontSize:10, fontWeight:800, padding:'2px 8px', borderRadius:100, fontFamily:'Outfit,sans-serif' }}>Save 20%</span>
        </div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, padding:24, maxWidth:1200, margin:'0 auto' }}>
        {PLANS.map(p => (
          <div key={p.name} style={{ background:'#fff', border:`2px solid ${p.popular?'#1565C0':'#E8EDF3'}`, borderRadius:16, padding:20, position:'relative', boxShadow: p.popular?'0 8px 32px rgba(21,101,192,.15)':'none' }}>
            {p.popular && <div style={{ position:'absolute', top:-12, left:'50%', transform:'translateX(-50%)', background:'#1565C0', color:'#fff', fontSize:10, fontWeight:800, padding:'3px 14px', borderRadius:100, whiteSpace:'nowrap', fontFamily:'Outfit,sans-serif' }}>Most Popular</div>}
            <div style={{ fontFamily:'Outfit,sans-serif', fontSize:15, fontWeight:700, color:'#0A2540', marginBottom:4 }}>{p.name}</div>
            <div style={{ fontSize:11, color:'#94A3B8', marginBottom:16, lineHeight:1.4 }}>{p.desc}</div>
            <div style={{ marginBottom:16 }}>
              {p.monthly === null
                ? <div style={{ fontFamily:'Outfit,sans-serif', fontSize:28, fontWeight:800, color:'#0A2540' }}>Custom</div>
                : <><div style={{ fontFamily:'Outfit,sans-serif', fontSize:28, fontWeight:800, color:'#0A2540' }}>KSH {(annual?p.annual:p.monthly).toLocaleString()} <span style={{ fontSize:13, fontWeight:400, color:'#94A3B8' }}>/ mo</span></div>
                  <div style={{ fontSize:11, color:'#94A3B8' }}>{annual?'Billed annually':'Billed monthly'}</div></>
              }
            </div>
            <button style={{ width:'100%', padding:9, borderRadius:8, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'Outfit,sans-serif', marginBottom:16, background: p.popular?'#1565C0':'#fff', color: p.popular?'#fff':'#475569', border: p.popular?'none':'2px solid #E2E8F0' }}>
              {p.cta}
            </button>
            <div style={{ height:1, background:'#F0F4F8', marginBottom:14 }}/>
            {p.features.map(f => <div key={f} style={{ display:'flex', alignItems:'flex-start', gap:7, marginBottom:7, fontSize:11, color:'#475569' }}><span style={{ color:'#16A34A', flexShrink:0 }}>✓</span>{f}</div>)}
            {p.missing.map(f => <div key={f} style={{ display:'flex', alignItems:'flex-start', gap:7, marginBottom:7, fontSize:11, color:'#CBD5E1' }}><span style={{ flexShrink:0 }}>✕</span>{f}</div>)}
          </div>
        ))}
      </div>
      <div style={{ maxWidth:700, margin:'0 auto', padding:'0 24px 40px' }}>
        <h2 style={{ fontFamily:'Outfit,sans-serif', fontSize:22, fontWeight:700, color:'#0A2540', textAlign:'center', marginBottom:18 }}>Frequently Asked Questions</h2>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          {FAQS.map(([q,a],i) => (
            <div key={i} onClick={() => setOpenFaq(openFaq===i?null:i)} style={{ background:'#fff', border:'1.5px solid #E8EDF3', borderRadius:12, padding:16, cursor:'pointer' }}>
              <div style={{ fontFamily:'Outfit,sans-serif', fontSize:13, fontWeight:700, color:'#0A2540', marginBottom: openFaq===i?8:0, display:'flex', justifyContent:'space-between', gap:8 }}>
                {q} <span style={{ color:'#94A3B8', flexShrink:0 }}>▾</span>
              </div>
              {openFaq===i && <div style={{ fontSize:12, color:'#64748B', lineHeight:1.6 }}>{a}</div>}
            </div>
          ))}
        </div>
      </div>
      <footer style={{ background:'#060F1A', padding:'28px 24px', textAlign:'center' }}>
        <div style={{ fontFamily:'Outfit,sans-serif', fontSize:16, fontWeight:800, color:'#fff', marginBottom:6 }}>CarExpert<span style={{ color:'#4DA6FF' }}>Africa</span>®</div>
        <div style={{ fontSize:11, color:'rgba(255,255,255,.35)' }}>Kenya's Ultimate Car Listing Platform · © 2025</div>
      </footer>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// AUTH PAGE
// ─────────────────────────────────────────────────────────────
export function AuthPage({ user }) {
  const [tab, setTab] = useState('login')
  const [role, setRole] = useState('buyer')
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [business, setBusiness] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleLogin = async () => {
    setLoading(true); setError('')
    const { error } = await signIn(email, pass)
    if (error) setError(error.message)
    else window.location.href = '/dashboard'
    setLoading(false)
  }

  const handleRegister = async () => {
    setLoading(true); setError('')
    const { error } = await signUp(email, pass, { full_name: `${firstName} ${lastName}`, phone, role, business_name: business })
    if (error) setError(error.message)
    else setSuccess('Account created! Check your email to confirm.')
    setLoading(false)
  }

  return (
    <div style={{ fontFamily:'DM Sans,sans-serif', background:'#F7F9FC', minHeight:'100vh' }}>
      <nav style={{ background:'#0A2540', padding:'0 24px', height:56, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <Link to="/" style={{ fontFamily:'Outfit,sans-serif', fontSize:16, fontWeight:800, color:'#fff', textDecoration:'none' }}>CarExpert<span style={{ color:'#4DA6FF' }}>Africa</span>®</Link>
        <span style={{ fontSize:12, color:'rgba(255,255,255,.5)' }}>Already have an account? <span onClick={() => setTab('login')} style={{ color:'#4DA6FF', fontWeight:600, cursor:'pointer' }}>Sign in →</span></span>
      </nav>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', minHeight:'calc(100vh - 56px)' }}>
        <div style={{ background:'linear-gradient(160deg,#0A2540,#1565C0)', padding:48, display:'flex', flexDirection:'column', justifyContent:'center' }}>
          <div style={{ color:'#4DA6FF', fontSize:11, fontWeight:700, letterSpacing:'1.8px', textTransform:'uppercase', marginBottom:12 }}>Kenya's #1 Car Platform</div>
          <h1 style={{ fontFamily:'Outfit,sans-serif', fontSize:32, fontWeight:800, color:'#fff', lineHeight:1.15, marginBottom:14 }}>Buy, Sell &<br/><span style={{ color:'#4DA6FF' }}>List Cars</span><br/>With Ease</h1>
          <p style={{ color:'rgba(255,255,255,.55)', fontSize:14, marginBottom:28, lineHeight:1.6 }}>Join thousands of Kenyans buying and selling cars on CarExpert Africa every day.</p>
          {[['✓','Save listings and get alerts when matching cars are listed'],['★','List your car and reach thousands of active buyers'],['⚡','Instant valuation and market insights for your vehicle']].map(([icon,text]) => (
            <div key={text} style={{ display:'flex', alignItems:'flex-start', gap:10, marginBottom:12 }}>
              <div style={{ width:28, height:28, borderRadius:7, background:'rgba(77,166,255,.15)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:13 }}>{icon}</div>
              <div style={{ fontSize:13, color:'rgba(255,255,255,.7)', lineHeight:1.4 }}>{text}</div>
            </div>
          ))}
        </div>
        <div style={{ background:'#fff', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'40px 56px' }}>
          <div style={{ display:'flex', borderBottom:'2px solid #F0F4F8', marginBottom:28, width:'100%', maxWidth:340 }}>
            {['login','register'].map(t => (
              <div key={t} onClick={() => { setTab(t); setError(''); setSuccess('') }} style={{ flex:1, padding:'10px 0', textAlign:'center', fontFamily:'Outfit,sans-serif', fontSize:13, fontWeight:700, cursor:'pointer', color:tab===t?'#0A2540':'#94A3B8', borderBottom:`2px solid ${tab===t?'#1565C0':'transparent'}`, marginBottom:-2 }}>
                {t === 'login' ? 'Sign In' : 'Create Account'}
              </div>
            ))}
          </div>
          {error && <div style={{ width:'100%', maxWidth:340, background:'#FEE2E2', color:'#DC2626', borderRadius:8, padding:'10px 14px', fontSize:12, fontWeight:600, marginBottom:14 }}>{error}</div>}
          {success && <div style={{ width:'100%', maxWidth:340, background:'#DCFCE7', color:'#16A34A', borderRadius:8, padding:'10px 14px', fontSize:12, fontWeight:600, marginBottom:14 }}>{success}</div>}
          <div style={{ width:'100%', maxWidth:340 }}>
            {tab === 'login' ? (
              <>
                <div style={{ fontFamily:'Outfit,sans-serif', fontSize:20, fontWeight:800, color:'#0A2540', marginBottom:4 }}>Welcome back</div>
                <div style={{ fontSize:12, color:'#94A3B8', marginBottom:22 }}>Sign in to your CarExpert Africa account</div>
                {[['Email Address','email',email,setEmail,'you@example.com'],['Password','password',pass,setPass,'••••••••']].map(([label,type,val,set,ph]) => (
                  <div key={label} style={{ marginBottom:14 }}>
                    <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#64748B', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:5 }}>{label}</label>
                    <input type={type} value={val} onChange={e=>set(e.target.value)} placeholder={ph} style={{ width:'100%', padding:'10px 13px', border:'1.5px solid #E2E8F0', borderRadius:8, fontSize:13, fontFamily:'DM Sans,sans-serif', outline:'none', background:'#F8FAFC' }}/>
                  </div>
                ))}
                <div
  onClick={async () => {
    if (!email) { alert('Enter your email address first'); return }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://carexpert-africa.vercel.app/reset-password'
    })
    if (error) alert('Error: ' + error.message)
    else alert('Password reset email sent! Check your inbox.')
  }}
  style={{ textAlign:'right', fontSize:11, color:'#1565C0', fontWeight:600, cursor:'pointer', marginTop:-8, marginBottom:14 }}>
  Forgot password?
</div>
                <button onClick={handleLogin} disabled={loading} style={{ width:'100%', background:'#1565C0', color:'#fff', border:'none', padding:12, borderRadius:9, fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'Outfit,sans-serif', opacity:loading?0.7:1 }}>
                  {loading ? 'Signing in...' : 'Sign In →'}
                </button>
              </>
            ) : (
              <>
                <div style={{ fontFamily:'Outfit,sans-serif', fontSize:20, fontWeight:800, color:'#0A2540', marginBottom:4 }}>Create your account</div>
                <div style={{ fontSize:12, color:'#94A3B8', marginBottom:16 }}>What brings you to CarExpert Africa?</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:16 }}>
                  {[['buyer','🚗','Buyer / Seller','Private individual'],['dealer','🏢','Dealer','Business / showroom']].map(([r,icon,label,sub]) => (
                    <div key={r} onClick={() => setRole(r)} style={{ border:`2px solid ${role===r?'#1565C0':'#E2E8F0'}`, borderRadius:10, padding:'12px 8px', textAlign:'center', cursor:'pointer', background:role===r?'#EEF5FF':'#fff' }}>
                      <div style={{ fontSize:20, marginBottom:4 }}>{icon}</div>
                      <div style={{ fontFamily:'Outfit,sans-serif', fontSize:12, fontWeight:700, color:role===r?'#1565C0':'#475569' }}>{label}</div>
                      <div style={{ fontSize:10, color:'#94A3B8', marginTop:1 }}>{sub}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:14 }}>
                  <div>
                    <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#64748B', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:5 }}>First Name</label>
                    <input value={firstName} onChange={e=>setFirstName(e.target.value)} placeholder="John" style={{ width:'100%', padding:'10px 13px', border:'1.5px solid #E2E8F0', borderRadius:8, fontSize:13, fontFamily:'DM Sans,sans-serif', outline:'none', background:'#F8FAFC' }}/>
                  </div>
                  <div>
                    <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#64748B', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:5 }}>Last Name</label>
                    <input value={lastName} onChange={e=>setLastName(e.target.value)} placeholder="Kamau" style={{ width:'100%', padding:'10px 13px', border:'1.5px solid #E2E8F0', borderRadius:8, fontSize:13, fontFamily:'DM Sans,sans-serif', outline:'none', background:'#F8FAFC' }}/>
                  </div>
                </div>
                <div style={{ marginBottom:14 }}>
                  <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#64748B', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:5 }}>Email Address</label>
                  <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" style={{ width:'100%', padding:'10px 13px', border:'1.5px solid #E2E8F0', borderRadius:8, fontSize:13, fontFamily:'DM Sans,sans-serif', outline:'none', background:'#F8FAFC' }}/>
                </div>
                <div style={{ marginBottom:14 }}>
                  <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#64748B', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:5 }}>Password</label>
                  <input type="password" value={pass} onChange={e=>setPass(e.target.value)} placeholder="Min. 6 characters" style={{ width:'100%', padding:'10px 13px', border:'1.5px solid #E2E8F0', borderRadius:8, fontSize:13, fontFamily:'DM Sans,sans-serif', outline:'none', background:'#F8FAFC' }}/>
                </div>
                <div style={{ marginBottom:14 }}>
                  <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#64748B', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:5 }}>Phone Number</label>
                  <input type="tel" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+254 7XX XXX XXX" style={{ width:'100%', padding:'10px 13px', border:'1.5px solid #E2E8F0', borderRadius:8, fontSize:13, fontFamily:'DM Sans,sans-serif', outline:'none', background:'#F8FAFC' }}/>
                </div>
                {role === 'dealer' && (
                  <div style={{ marginBottom:14 }}>
                    <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#64748B', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:5 }}>Business Name</label>
                    <input value={business} onChange={e=>setBusiness(e.target.value)} placeholder="Your dealership name" style={{ width:'100%', padding:'10px 13px', border:'1.5px solid #E2E8F0', borderRadius:8, fontSize:13, fontFamily:'DM Sans,sans-serif', outline:'none', background:'#F8FAFC' }}/>
                  </div>
                )}
                <button onClick={handleRegister} disabled={loading} style={{ width:'100%', background:'#1565C0', color:'#fff', border:'none', padding:12, borderRadius:9, fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'Outfit,sans-serif', marginTop:4, opacity:loading?0.7:1 }}>
                  {loading ? 'Creating account...' : 'Create Account →'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// LIST A CAR PAGE
// ─────────────────────────────────────────────────────────────
const CAR_DATA = {
  Toyota: ['Land Cruiser 200','Land Cruiser 300','Land Cruiser Prado 150','Land Cruiser Prado 120','Hilux','Harrier','RAV4','Vanguard','Fortuner','Rush','Fielder','Corolla','Camry','Crown','Mark X','Allion','Premio','Wish','Noah','Voxy','Alphard','Vellfire','Hiace','Probox','Succeed'],
  Nissan: ['X-Trail','Patrol','Juke','Note','March','Tiida','Sylphy','Teana','Murano','Qashqai','Navara','Urvan','Caravan','Serena','Elgrand'],
  Mazda: ['CX-5','CX-3','CX-7','CX-9','Demio','Axela','Atenza','BT-50','MPV'],
  Subaru: ['Forester','Outback','Legacy','Impreza','XV','Tribeca','WRX'],
  Mitsubishi: ['Pajero','Pajero Mini','Outlander','Eclipse Cross','Montero','L200','Colt','Galant','Lancer'],
  BMW: ['X1','X3','X5','X6','3 Series','5 Series','7 Series','1 Series','2 Series'],
  'Mercedes-Benz': ['C-Class','E-Class','S-Class','GLC','GLE','GLS','A-Class','B-Class','ML','GL'],
  Audi: ['A3','A4','A6','Q3','Q5','Q7','TT'],
  Volkswagen: ['Golf','Polo','Passat','Tiguan','Touareg','Amarok','Transporter'],
  Honda: ['CR-V','HR-V','Fit','Jazz','Civic','Accord','Pilot','Freed','Stream','Odyssey','StepWagon'],
  Hyundai: ['Tucson','Santa Fe','Elantra','i10','i20','ix35','Creta'],
  Kia: ['Sportage','Sorento','Picanto','Rio','Cerato','Carnival'],
  Ford: ['Ranger','Everest','Explorer','EcoSport','Fusion','Mustang'],
  'Land Rover': ['Defender','Discovery','Discovery Sport','Range Rover','Range Rover Sport','Range Rover Evoque','Freelander'],
  Jeep: ['Wrangler','Grand Cherokee','Cherokee','Renegade','Compass'],
  Isuzu: ['D-Max','MU-X','Trooper'],
  Suzuki: ['Vitara','Jimny','Swift','Alto','Baleno','Ertiga','Grand Vitara','Escudo'],
  Lexus: ['LX','GX','RX','NX','IS','GS','LS','UX'],
  Porsche: ['Cayenne','Macan','Panamera','911'],
  Volvo: ['XC90','XC60','XC40','S60','V60'],
  Other: ['Other'],
}
const MAKES = Object.keys(CAR_DATA)
const FEATURES_LIST = ['Sunroof','Leather Seats','Reverse Camera','Navigation','Cruise Control','Alloy Wheels','Push Start','Heated Seats','360 Camera','Parking Sensors','Apple CarPlay','Tow Bar','Roof Rack','Bull Bar','Window Tint']

export function ListCarPage({ user }) {
  const [step, setStep] = useState(1)
  const [make, setMake] = useState('Toyota')
  const [model, setModel] = useState('')
  const [year, setYear] = useState('2020')
  const [km, setKm] = useState('')
  const [engineCc, setEngineCc] = useState('')
  const [bodyType, setBodyType] = useState('SUV')
  const [fuel, setFuel] = useState('Petrol')
  const [transmission, setTx] = useState('Automatic')
  const [drive, setDrive] = useState('AWD')
  const [colour, setColour] = useState('')
  const [condition, setCondition] = useState('Used — Excellent')
  const [price, setPrice] = useState('')
  const [nego, setNego] = useState(false)
  const [selFeats, setSelFeats] = useState(new Set())
  const [photos, setPhotos] = useState(Array(10).fill(false))

  const toggleFeat = f => setSelFeats(prev => { const n=new Set(prev); n.has(f)?n.delete(f):n.add(f); return n })
  const fillPhoto = i => setPhotos(prev => prev.map((p,idx) => idx===i?true:p))

  const stepCircle = (n) => ({
    width:30, height:30, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center',
    fontFamily:'Outfit,sans-serif', fontSize:12, fontWeight:700, border:'2px solid',
    ...(n < step  ? { background:'#1565C0', borderColor:'#1565C0', color:'#fff' } :
        n === step ? { background:'#0A2540', borderColor:'#0A2540', color:'#fff' } :
                    { background:'#fff', borderColor:'#E2E8F0', color:'#94A3B8' })
  })

  const inp = { width:'100%', padding:'10px 12px', border:'1.5px solid #E2E8F0', borderRadius:7, fontSize:13, fontFamily:'DM Sans,sans-serif', outline:'none', background:'#F8FAFC' }
  const lbl = { display:'block', fontSize:10, fontWeight:700, color:'#64748B', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:5 }
const handleSubmit = async () => {
  const { data: { user: currentUser } } = await supabase.auth.getUser()
  if (!currentUser) { alert('Please log in first'); return }

  const { error } = await supabase.from('listings').insert({
    user_id: currentUser.id,
    make, model, year, mileage: km,
    engine_cc: engineCc,
    body_type: bodyType,
    fuel_type: fuel,
    transmission,
    drive_type: drive,
    colour, condition, price,
    negotiable: nego,
    status: 'pending',
  })

  if (error) {
    alert('Error submitting listing: ' + error.message)
  } else {
    setStep(5)
  }
}
  return (
    <div style={{ fontFamily:'DM Sans,sans-serif', background:'#F7F9FC', minHeight:'100vh' }}>
      <nav style={{ background:'#0A2540', padding:'0 24px', height:56, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <Link to="/" style={{ fontFamily:'Outfit,sans-serif', fontSize:16, fontWeight:800, color:'#fff', textDecoration:'none' }}>CarExpert<span style={{ color:'#4DA6FF' }}>Africa</span>®</Link>
        <button style={{ background:'rgba(255,255,255,.1)', color:'#fff', border:'1.5px solid rgba(255,255,255,.2)', padding:'6px 14px', borderRadius:7, fontSize:12, fontWeight:600, cursor:'pointer' }}>Save Draft</button>
      </nav>

      <div style={{ background:'linear-gradient(135deg,#0A2540,#0D3B6E)', padding:'24px', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:16 }}>
        <div>
          <div style={{ color:'#4DA6FF', fontSize:10, fontWeight:700, letterSpacing:'1.8px', textTransform:'uppercase', marginBottom:6 }}>Sell Your Car</div>
          <div style={{ fontFamily:'Outfit,sans-serif', fontSize:20, fontWeight:800, color:'#fff' }}>List Your Car on CarExpert Africa</div>
          <div style={{ color:'rgba(255,255,255,.5)', fontSize:12, marginTop:4 }}>Reach thousands of active buyers across Kenya</div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:0 }}>
          {['Vehicle Info','Photos','Price & Details','Review'].map((label, i) => (
            <div key={label} style={{ display:'flex', alignItems:'center' }}>
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3, cursor:'pointer' }} onClick={() => i+1 < step && setStep(i+1)}>
                <div style={stepCircle(i+1)}>{i+1 < step ? '✓' : i+1}</div>
                <div style={{ fontSize:9, fontWeight:600, color: i+1===step?'rgba(255,255,255,.8)':'rgba(255,255,255,.35)', textTransform:'uppercase', letterSpacing:'.5px', whiteSpace:'nowrap' }}>{label}</div>
              </div>
              {i < 3 && <div style={{ width:32, height:2, background: i+1<step?'#4DA6FF':'rgba(255,255,255,.15)', margin:'0 4px 14px' }}/>}
            </div>
          ))}
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 260px', gap:20, padding:'20px 24px', maxWidth:1100, margin:'0 auto' }}>
        <div>
          {step === 1 && (
            <div style={{ background:'#fff', border:'1.5px solid #E8EDF3', borderRadius:14, padding:22 }}>
              <div style={{ fontFamily:'Outfit,sans-serif', fontSize:15, fontWeight:700, color:'#0A2540', marginBottom:18, display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ width:3, height:15, background:'#1565C0', borderRadius:2, display:'inline-block' }}></span> Vehicle Information
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                <div>
                  <label style={lbl}>Make</label>
                  <select value={make} onChange={e => { setMake(e.target.value); setModel('') }} style={inp}>
                    {MAKES.map(m => <option key={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Model</label>
                  <select value={model} onChange={e => setModel(e.target.value)} style={inp}>
                    <option value="">Select model...</option>
                    {(CAR_DATA[make] || []).map(m => <option key={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Year</label>
                  <select value={year} onChange={e => setYear(e.target.value)} style={inp}>
                    {Array.from({length:20},(_,i)=>`${2025-i}`).map(y => <option key={y}>{y}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Mileage (km)</label>
                  <input type="number" value={km} onChange={e => setKm(e.target.value)} placeholder="e.g. 62000" style={inp}/>
                </div>
                <div>
                  <label style={lbl}>Engine (cc)</label>
                  <input type="number" value={engineCc} onChange={e => setEngineCc(e.target.value)} placeholder="e.g. 2000" style={inp}/>
                </div>
                <div>
                  <label style={lbl}>Body Type</label>
                  <select value={bodyType} onChange={e => setBodyType(e.target.value)} style={inp}>
                    {['SUV','Sedan','Hatchback','Pickup','Minivan','Coupe','Wagon','Bus','Truck'].map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Fuel Type</label>
                  <select value={fuel} onChange={e => setFuel(e.target.value)} style={inp}>
                    {['Petrol','Diesel','Hybrid','Electric','LPG'].map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Transmission</label>
                  <select value={transmission} onChange={e => setTx(e.target.value)} style={inp}>
                    {['Automatic','Manual','CVT','Semi-Automatic'].map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Drive Type</label>
                  <select value={drive} onChange={e => setDrive(e.target.value)} style={inp}>
                    {['AWD','4WD','FWD','RWD','4x4'].map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Colour</label>
                  <select value={colour} onChange={e => setColour(e.target.value)} style={inp}>
                    <option value="">Select colour...</option>
                    {['Pearl White','White','Black','Silver','Grey','Blue','Red','Brown','Beige','Gold','Green','Orange','Maroon','Navy Blue','Champagne'].map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
                <div style={{ gridColumn:'1/-1' }}>
                  <label style={lbl}>Condition</label>
                  <select value={condition} onChange={e => setCondition(e.target.value)} style={inp}>
                    {['Used — Excellent','Used — Good','Used — Fair','New','Foreign Used — Excellent','Foreign Used — Good'].map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display:'flex', justifyContent:'flex-end', marginTop:18 }}>
                <button onClick={() => setStep(2)} style={{ background:'#1565C0', color:'#fff', border:'none', padding:'10px 24px', borderRadius:8, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'Outfit,sans-serif' }}>Next: Add Photos →</button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div style={{ background:'#fff', border:'1.5px solid #E8EDF3', borderRadius:14, padding:22 }}>
              <div style={{ fontFamily:'Outfit,sans-serif', fontSize:15, fontWeight:700, color:'#0A2540', marginBottom:18, display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ width:3, height:15, background:'#1565C0', borderRadius:2, display:'inline-block' }}></span> Upload Photos
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:8, marginBottom:12 }}>
                {photos.map((filled, i) => (
                  <div key={i} onClick={() => fillPhoto(i)} style={{ aspectRatio:1, border:`2px ${filled?'solid':'dashed'} #E2E8F0`, borderRadius:9, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', cursor:'pointer', background: filled?`hsl(${i*40},40%,85%)`:'#F8FAFC' }}>
                    {filled ? <span style={{ fontSize:10, fontWeight:700, color:'#0A2540', fontFamily:'Outfit,sans-serif' }}>{i===0?'MAIN':`#${i+1}`}</span>
                    : <><span style={{ fontSize:20, color:'#CBD5E1' }}>+</span><span style={{ fontSize:9, color:'#94A3B8', fontWeight:600 }}>Add Photo</span></>}
                  </div>
                ))}
              </div>
              <div style={{ fontSize:11, color:'#94A3B8', lineHeight:1.5 }}>Upload up to 20 photos. First photo becomes the main listing image.</div>
              <div style={{ display:'flex', justifyContent:'space-between', marginTop:18 }}>
                <button onClick={() => setStep(1)} style={{ background:'#fff', color:'#475569', border:'1.5px solid #E2E8F0', padding:'10px 20px', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'Outfit,sans-serif' }}>← Back</button>
                <button onClick={() => setStep(3)} style={{ background:'#1565C0', color:'#fff', border:'none', padding:'10px 24px', borderRadius:8, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'Outfit,sans-serif' }}>Next: Price & Details →</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <div style={{ background:'#fff', border:'1.5px solid #E8EDF3', borderRadius:14, padding:22, marginBottom:14 }}>
                <div style={{ fontFamily:'Outfit,sans-serif', fontSize:15, fontWeight:700, color:'#0A2540', marginBottom:16, display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ width:3, height:15, background:'#1565C0', borderRadius:2, display:'inline-block' }}></span> Pricing
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:12, alignItems:'end' }}>
                  <div>
                    <label style={lbl}>Asking Price (KSH)</label>
                    <input type="number" value={price} onChange={e=>setPrice(e.target.value)} placeholder="e.g. 4500000" style={inp}/>
                  </div>
                  <div onClick={() => setNego(!nego)} style={{ display:'flex', alignItems:'center', gap:8, paddingBottom:10, cursor:'pointer' }}>
                    <div style={{ width:32, height:18, borderRadius:100, background:nego?'#1565C0':'#E2E8F0', position:'relative' }}>
                      <div style={{ position:'absolute', top:2, left:nego?16:2, width:14, height:14, borderRadius:'50%', background:'#fff', transition:'left .2s' }}/>
                    </div>
                    <span style={{ fontSize:12, fontWeight:600, color:'#475569' }}>Negotiable</span>
                  </div>
                </div>
              </div>
              <div style={{ background:'#fff', border:'1.5px solid #E8EDF3', borderRadius:14, padding:22, marginBottom:14 }}>
                <div style={{ fontFamily:'Outfit,sans-serif', fontSize:15, fontWeight:700, color:'#0A2540', marginBottom:14, display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ width:3, height:15, background:'#1565C0', borderRadius:2, display:'inline-block' }}></span> Features & Extras
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:7 }}>
                  {FEATURES_LIST.map(f => (
                    <div key={f} onClick={() => toggleFeat(f)} style={{ border:`1.5px solid ${selFeats.has(f)?'#1565C0':'#E2E8F0'}`, borderRadius:8, padding:'8px 10px', fontSize:11, fontWeight:600, cursor:'pointer', background:selFeats.has(f)?'#EEF5FF':'#fff', color:selFeats.has(f)?'#1565C0':'#475569', textAlign:'center' }}>{f}</div>
                  ))}
                </div>
              </div>
              <div style={{ background:'#fff', border:'1.5px solid #E8EDF3', borderRadius:14, padding:22, marginBottom:14 }}>
                <div style={{ fontFamily:'Outfit,sans-serif', fontSize:15, fontWeight:700, color:'#0A2540', marginBottom:12, display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ width:3, height:15, background:'#1565C0', borderRadius:2, display:'inline-block' }}></span> Description
                </div>
                <textarea placeholder="Describe the car's condition, history, modifications, and why you are selling..." rows={4} style={{ width:'100%', padding:'10px 12px', border:'1.5px solid #E2E8F0', borderRadius:8, fontSize:13, fontFamily:'DM Sans,sans-serif', outline:'none', background:'#F8FAFC', resize:'vertical', lineHeight:1.5 }}/>
              </div>
              <div style={{ background:'#fff', border:'1.5px solid #E8EDF3', borderRadius:14, padding:22 }}>
                <div style={{ fontFamily:'Outfit,sans-serif', fontSize:15, fontWeight:700, color:'#0A2540', marginBottom:14, display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ width:3, height:15, background:'#1565C0', borderRadius:2, display:'inline-block' }}></span> Contact Details
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
                  <div><label style={lbl}>Contact Name</label><input placeholder="Your name" style={inp}/></div>
                  <div><label style={lbl}>Phone / WhatsApp</label><input placeholder="+254 7XX XXX XXX" style={inp}/></div>
                </div>
                <div>
                  <label style={lbl}>Location</label>
                  <select style={inp}>
                    {['Nairobi — Westlands','Nairobi — CBD','Nairobi — Karen','Nairobi — Langata','Mombasa','Kisumu','Nakuru','Eldoret'].map(l=><option key={l}>{l}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', marginTop:14 }}>
                <button onClick={() => setStep(2)} style={{ background:'#fff', color:'#475569', border:'1.5px solid #E2E8F0', padding:'10px 20px', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'Outfit,sans-serif' }}>← Back</button>
                <button onClick={() => setStep(4)} style={{ background:'#1565C0', color:'#fff', border:'none', padding:'10px 24px', borderRadius:8, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'Outfit,sans-serif' }}>Next: Review Listing →</button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <div style={{ background:'#fff', border:'1.5px solid #E8EDF3', borderRadius:14, padding:22, marginBottom:14 }}>
                <div style={{ fontFamily:'Outfit,sans-serif', fontSize:15, fontWeight:700, color:'#0A2540', marginBottom:14, display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ width:3, height:15, background:'#1565C0', borderRadius:2, display:'inline-block' }}></span> Review Your Listing
                </div>
                <div style={{ background:'#EEF5FF', border:'1px solid #BDD5FF', borderRadius:10, padding:14, marginBottom:14, fontSize:12, color:'#1565C0', fontWeight:600, display:'flex', gap:8 }}>
                  <span>✓</span> Your listing looks great! Review the details below before submitting.
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, fontSize:13 }}>
                  <div><span style={{ color:'#94A3B8', fontSize:11 }}>Make / Model</span><br/><strong>{make} {model||'—'}</strong></div>
                  <div><span style={{ color:'#94A3B8', fontSize:11 }}>Asking Price</span><br/><strong style={{ color:'#1565C0' }}>{price ? fmt(price) : '—'}</strong></div>
                  <div><span style={{ color:'#94A3B8', fontSize:11 }}>Year</span><br/><strong>{year}</strong></div>
                  <div><span style={{ color:'#94A3B8', fontSize:11 }}>Mileage</span><br/><strong>{km ? `${Number(km).toLocaleString()} km` : '—'}</strong></div>
                </div>
              </div>
              <div style={{ background:'#F0FDF4', border:'1.5px solid #86EFAC', borderRadius:14, padding:20, marginBottom:14 }}>
                <div style={{ fontFamily:'Outfit,sans-serif', fontSize:14, fontWeight:700, color:'#16A34A', marginBottom:8 }}>🎉 Free Listing Active</div>
                <div style={{ fontSize:12, color:'#475569', lineHeight:1.6 }}>Your listing will be reviewed and go live within <strong>1–2 hours</strong> after submission.</div>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between' }}>
                <button onClick={() => setStep(3)} style={{ background:'#fff', color:'#475569', border:'1.5px solid #E2E8F0', padding:'10px 20px', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'Outfit,sans-serif' }}>← Back</button>
                <button onClick={handleSubmit} style={{ background:'#16A34A', color:'#fff', border:'none', padding:'10px 24px', borderRadius:8, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'Outfit,sans-serif' }}>Submit Listing ✓</button>
              </div>
            </div>
          )}

          {step === 5 && (
            <div style={{ background:'#fff', border:'1.5px solid #E8EDF3', borderRadius:14, padding:48, textAlign:'center' }}>
              <div style={{ fontSize:48, marginBottom:16 }}>🎉</div>
              <div style={{ fontFamily:'Outfit,sans-serif', fontSize:24, fontWeight:800, color:'#0A2540', marginBottom:8 }}>Listing Submitted!</div>
              <div style={{ fontSize:14, color:'#64748B', marginBottom:24, lineHeight:1.6 }}>Your listing is under review and will go live within 1–2 hours. We'll notify you when it's approved.</div>
              <Link to="/listings" style={{ background:'#1565C0', color:'#fff', padding:'12px 28px', borderRadius:9, fontWeight:700, fontSize:14, textDecoration:'none', fontFamily:'Outfit,sans-serif' }}>Browse All Listings →</Link>
            </div>
          )}
        </div>

        {/* Preview sidebar */}
        <div>
          <div style={{ fontSize:12, fontWeight:700, color:'#94A3B8', textTransform:'uppercase', letterSpacing:'.6px', marginBottom:10, fontFamily:'Outfit,sans-serif' }}>Live Preview</div>
          <div style={{ background:'#fff', border:'1.5px solid #E8EDF3', borderRadius:14, overflow:'hidden' }}>
            <div style={{ height:140, background:'#C8DCF0', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, color:'#94A3B8' }}>
              {photos.some(Boolean) ? '📸 Photos added' : 'Add photos to preview'}
            </div>
            <div style={{ padding:14 }}>
              <div style={{ fontFamily:'Outfit,sans-serif', fontSize:18, fontWeight:800, color:'#0A2540', marginBottom:2 }}>{price ? fmt(price) : 'KSH —'}</div>
              <div style={{ fontSize:12, fontWeight:600, color:'#64748B', marginBottom:8 }}>{year} {make} {model || 'Your Model'}</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
                {[year, km ? `${Number(km).toLocaleString()} km` : 'Mileage', transmission, bodyType].map((s,i) => (
                  <span key={i} style={{ fontSize:10, color:'#94A3B8', padding:'2px 6px', background:'#F8FAFC', borderRadius:100, border:'1px solid #E8EDF3' }}>{s}</span>
                ))}
              </div>
            </div>
          </div>
          <div style={{ background:'#EEF5FF', border:'1px solid #BDD5FF', borderRadius:12, padding:14, marginTop:12 }}>
            <div style={{ fontFamily:'Outfit,sans-serif', fontSize:12, fontWeight:700, color:'#1565C0', marginBottom:8 }}>Tips for a great listing</div>
            {[['📸','Add at least 8 high-quality photos'],['💰','Check similar listings to price competitively'],['✍️','Write a detailed description with service history'],['📍','Include your exact location']].map(([icon,tip]) => (
              <div key={tip} style={{ fontSize:11, color:'#475569', marginBottom:5, display:'flex', gap:6 }}><span>{icon}</span>{tip}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// DASHBOARD PAGE
// ─────────────────────────────────────────────────────────────
function SavedSearchesList({ user }) {
  const [searches, setSearches] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    if (!user) return
    supabase.from('saved_searches').select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => { setSearches(data || []); setLoading(false) })
  }, [user])

  const runSearch = (filters) => {
    const p = new URLSearchParams()
    if (filters.make) p.set('make', filters.make)
    if (filters.model) p.set('model', filters.model)
    if (filters.search) p.set('q', filters.search)
    if (filters.location) p.set('location', filters.location)
    if (filters.minPrice > 0) p.set('minPrice', filters.minPrice)
    if (filters.maxPrice < 30000000) p.set('maxPrice', filters.maxPrice)
    if (filters.minYear > 1970) p.set('minYear', filters.minYear)
    if (filters.maxYear < 2025) p.set('maxYear', filters.maxYear)
    if (filters.bodies?.length) p.set('body', filters.bodies[0])
    navigate(`/listings?${p.toString()}`)
  }

  if (loading) return <div style={{ textAlign:'center', padding:40, color:'#94A3B8' }}>Loading...</div>

  if (searches.length === 0) return (
    <div style={{ textAlign:'center', padding:48, background:'#fff', borderRadius:12, border:'1.5px solid #E8EDF3' }}>
      <div style={{ fontSize:32, marginBottom:12 }}>🔖</div>
      <div style={{ fontFamily:'Outfit,sans-serif', fontSize:16, fontWeight:700, color:'#0A2540', marginBottom:6 }}>No saved searches yet</div>
      <div style={{ fontSize:13, color:'#94A3B8', marginBottom:16 }}>Use the Save Search button on the listings page to save your filters.</div>
      <Link to="/listings" style={{ background:'#1565C0', color:'#fff', padding:'10px 24px', borderRadius:8, fontSize:13, fontWeight:700, textDecoration:'none', fontFamily:'Outfit,sans-serif' }}>Browse Listings</Link>
    </div>
  )

  return searches.map(s => (
    <div key={s.id} style={{ background:'#fff', border:'1.5px solid #E8EDF3', borderRadius:12, padding:16, marginBottom:10, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
      <div>
        <div style={{ fontFamily:'Outfit,sans-serif', fontSize:14, fontWeight:700, color:'#0A2540', marginBottom:6 }}>🔖 {s.name}</div>
        <div style={{ display:'flex', flexWrap:'wrap', gap:4, marginBottom:4 }}>
          {s.filters.make && <span style={{ fontSize:10, color:'#1565C0', padding:'2px 8px', background:'#EEF5FF', borderRadius:100, border:'1px solid #BDD5FF' }}>{s.filters.make}</span>}
          {s.filters.model && <span style={{ fontSize:10, color:'#1565C0', padding:'2px 8px', background:'#EEF5FF', borderRadius:100, border:'1px solid #BDD5FF' }}>{s.filters.model}</span>}
          {s.filters.minPrice > 0 && <span style={{ fontSize:10, color:'#1565C0', padding:'2px 8px', background:'#EEF5FF', borderRadius:100, border:'1px solid #BDD5FF' }}>From KSH {(s.filters.minPrice/1e6).toFixed(1)}M</span>}
          {s.filters.maxPrice < 30000000 && <span style={{ fontSize:10, color:'#1565C0', padding:'2px 8px', background:'#EEF5FF', borderRadius:100, border:'1px solid #BDD5FF' }}>Up to KSH {(s.filters.maxPrice/1e6).toFixed(1)}M</span>}
          {s.filters.bodies?.map(b => <span key={b} style={{ fontSize:10, color:'#1565C0', padding:'2px 8px', background:'#EEF5FF', borderRadius:100, border:'1px solid #BDD5FF' }}>{b}</span>)}
          {s.filters.search && <span style={{ fontSize:10, color:'#1565C0', padding:'2px 8px', background:'#EEF5FF', borderRadius:100, border:'1px solid #BDD5FF' }}>"{s.filters.search}"</span>}
        </div>
        <div style={{ fontSize:10, color:'#94A3B8' }}>Saved {new Date(s.created_at).toLocaleDateString('en-GB')}</div>
      </div>
      <div style={{ display:'flex', gap:8, flexShrink:0 }}>
        <button onClick={() => runSearch(s.filters)}
          style={{ background:'#1565C0', color:'#fff', border:'none', padding:'8px 16px', borderRadius:7, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'Outfit,sans-serif' }}>
          Run Search →
        </button>
        <button onClick={async () => {
          await supabase.from('saved_searches').delete().eq('id', s.id)
          setSearches(prev => prev.filter(x => x.id !== s.id))
        }} style={{ background:'#FEE2E2', color:'#DC2626', border:'none', padding:'8px 12px', borderRadius:7, fontSize:12, cursor:'pointer' }}>✕</button>
      </div>
    </div>
  ))
}

export function DashboardPage({ user }) {
  const [tab, setTab] = useState('overview')
  const [myListings, setMyListings] = useState([])
  const [savedCars, setSavedCars] = useState([])
  const [loadingListings, setLoadingListings] = useState(true)
  const [loadingSaved, setLoadingSaved] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    if (!user) return
    // Fetch user's own listings
    supabase
      .from('listings')
      .select('*, listing_photos(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => { setMyListings(data || []); setLoadingListings(false) })

    // Fetch saved listings
    supabase
      .from('saved_listings')
      .select('*, listings(*, listing_photos(*))')
      .eq('user_id', user.id)
      .then(({ data }) => { setSavedCars((data || []).map(s => s.listings).filter(Boolean)); setLoadingSaved(false) })
 

    }, [user])

  const NAV_ITEMS = [
  { id:'overview', label:'Overview', icon:'⊞' },
  { id:'listings', label:'My Listings', icon:'🚗', badge: myListings.length },
  { id:'saved', label:'Saved Cars', icon:'❤️', badge: savedCars.length },
  { id:'searches', label:'Saved Searches', icon:'🔖' },
  { id:'leads', label:'Leads', icon:'💬' },
  { id:'alerts', label:'Alerts', icon:'🔔' },
]

  const approvedListings = myListings.filter(l => l.status === 'approved')
  const totalViews = myListings.reduce((a, l) => a + (l.views || 0), 0)

  return (
    <div style={{ fontFamily:'DM Sans,sans-serif', background:'#F7F9FC', minHeight:'100vh' }}>
      <Navbar user={user} />
      <div style={{ display:'grid', gridTemplateColumns:'200px 1fr', minHeight:'calc(100vh - 56px)' }}>
        <aside style={{ background:'#fff', borderRight:'1px solid #E8EDF3', padding:'20px 0' }}>
          <div style={{ padding:'0 16px 16px', borderBottom:'1px solid #F0F4F8', marginBottom:8, textAlign:'center' }}>
            <div style={{ width:52, height:52, borderRadius:'50%', background:'#1565C0', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Outfit,sans-serif', fontSize:18, fontWeight:700, color:'#fff', margin:'0 auto 8px' }}>
              {(user?.user_metadata?.full_name || user?.email || 'U')[0].toUpperCase()}
            </div>
            <div style={{ fontFamily:'Outfit,sans-serif', fontSize:13, fontWeight:700, color:'#0A2540' }}>
              {user?.user_metadata?.full_name || user?.email}
            </div>
            <div style={{ background:'#EEF5FF', color:'#1565C0', border:'1px solid #BDD5FF', borderRadius:100, padding:'2px 10px', fontSize:10, fontWeight:700, display:'inline-block', marginTop:4, fontFamily:'Outfit,sans-serif' }}>Free Plan</div>
          </div>
          {NAV_ITEMS.map(item => (
            <div key={item.id} onClick={() => setTab(item.id)} style={{ display:'flex', alignItems:'center', gap:9, padding:'9px 16px', fontSize:13, fontWeight:tab===item.id?600:500, color:tab===item.id?'#1565C0':'#64748B', cursor:'pointer', background:tab===item.id?'#EEF5FF':'transparent', borderLeft:`3px solid ${tab===item.id?'#1565C0':'transparent'}` }}>
              <span style={{ fontSize:14 }}>{item.icon}</span>
              {item.label}
              {item.badge > 0 && <span style={{ background:item.badgeRed?'#EF4444':'#1565C0', color:'#fff', borderRadius:100, padding:'1px 6px', fontSize:9, fontWeight:700, marginLeft:'auto', fontFamily:'Outfit,sans-serif' }}>{item.badge}</span>}
            </div>
          ))}
          <div style={{ margin:'8px 12px 0' }}>
            <button onClick={() => navigate('/pricing')} style={{ width:'100%', background:'#1565C0', color:'#fff', border:'none', padding:9, borderRadius:8, fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:'Outfit,sans-serif' }}>⚡ Upgrade to Pro →</button>
            <button
              onClick={async () => { await supabase.auth.signOut(); window.location.href = '/' }}
              style={{ width:'100%', background:'#FEE2E2', color:'#DC2626', border:'1px solid #FECACA', padding:9, borderRadius:8, fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:'Outfit,sans-serif', marginTop:8 }}>
              Log Out
            </button>
          </div>
        </aside>

        <main style={{ padding:20 }}>
          {tab === 'overview' && (
            <div>
              <div style={{ fontFamily:'Outfit,sans-serif', fontSize:18, fontWeight:800, color:'#0A2540', marginBottom:16 }}>
                Welcome back, {user?.user_metadata?.full_name?.split(' ')[0] || 'there'} 👋
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 }}>
                {[
                  ['👁', totalViews, 'Total Views', '#EEF5FF'],
                  ['🚗', myListings.length, 'My Listings', '#DCFCE7'],
                  ['✓', approvedListings.length, 'Live Now', '#EEF5FF'],
                  ['❤️', savedCars.length, 'Saved Cars', '#FEF3C7'],
                ].map(([icon,n,l,bg]) => (
                  <div key={l} style={{ background:'#fff', border:'1.5px solid #E8EDF3', borderRadius:12, padding:14 }}>
                    <div style={{ width:32, height:32, borderRadius:8, background:bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, marginBottom:10 }}>{icon}</div>
                    <div style={{ fontFamily:'Outfit,sans-serif', fontSize:22, fontWeight:800, color:'#0A2540', marginBottom:2 }}>{n}</div>
                    <div style={{ fontSize:11, color:'#94A3B8' }}>{l}</div>
                  </div>
                ))}
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                <div style={{ background:'#fff', border:'1.5px solid #E8EDF3', borderRadius:12, padding:16 }}>
                  <div style={{ fontFamily:'Outfit,sans-serif', fontSize:13, fontWeight:700, color:'#0A2540', marginBottom:12 }}>My Recent Listings</div>
                  {loadingListings ? <div style={{ color:'#94A3B8', fontSize:12 }}>Loading...</div>
                  : myListings.length === 0 ? (
                    <div style={{ textAlign:'center', padding:20 }}>
                      <div style={{ fontSize:11, color:'#94A3B8', marginBottom:10 }}>You have no listings yet.</div>
                      <Link to="/list-car" style={{ background:'#1565C0', color:'#fff', padding:'8px 16px', borderRadius:7, fontSize:12, fontWeight:700, textDecoration:'none', fontFamily:'Outfit,sans-serif' }}>+ List a Car</Link>
                    </div>
                  ) : myListings.slice(0,3).map(l => (
                    <div key={l.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', borderBottom:'1px solid #F5F7FA', fontSize:12 }}>
                      <div>
                        <div style={{ fontWeight:600, color:'#0A2540' }}>{l.year} {l.make} {l.model}</div>
                        <div style={{ color:'#94A3B8', fontSize:11 }}>KSH {Number(l.price).toLocaleString()}</div>
                      </div>
                      <span style={{ fontSize:10, fontWeight:700, padding:'3px 10px', borderRadius:100, background:l.status==='approved'?'#DCFCE7':l.status==='pending'?'#FEF3C7':'#FEE2E2', color:l.status==='approved'?'#16A34A':l.status==='pending'?'#D97706':'#EF4444', fontFamily:'Outfit,sans-serif' }}>
                        {l.status}
                      </span>
                    </div>
                  ))}
                </div>
                <div style={{ background:'#fff', border:'1.5px solid #E8EDF3', borderRadius:12, padding:16 }}>
                  <div style={{ fontFamily:'Outfit,sans-serif', fontSize:13, fontWeight:700, color:'#0A2540', marginBottom:12 }}>Quick Actions</div>
                  {[['#1565C0','#fff','+ List a New Car','/list-car'],['#F0F6FF','#1565C0','Browse Listings','/listings'],['#F8FAFC','#475569','Get Car Valuation','/valuation'],['#F8FAFC','#475569','View Pricing','/pricing']].map(([bg,color,label,href]) => (
                    <Link key={label} to={href} style={{ display:'block', background:bg, color, border:`1.5px solid ${bg==='#1565C0'?'transparent':'#E2E8F0'}`, padding:10, borderRadius:8, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'Outfit,sans-serif', textAlign:'left', textDecoration:'none', marginBottom:8 }}>{label}</Link>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === 'listings' && (
            <div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
                <div style={{ fontFamily:'Outfit,sans-serif', fontSize:17, fontWeight:800, color:'#0A2540' }}>My Listings</div>
                <Link to="/list-car" style={{ background:'#1565C0', color:'#fff', border:'none', padding:'8px 16px', borderRadius:7, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'Outfit,sans-serif', textDecoration:'none' }}>+ Add New Listing</Link>
              </div>
              {loadingListings ? <div style={{ textAlign:'center', padding:40, color:'#94A3B8' }}>Loading...</div>
              : myListings.length === 0 ? (
                <div style={{ textAlign:'center', padding:48, background:'#fff', borderRadius:12, border:'1.5px solid #E8EDF3' }}>
                  <div style={{ fontSize:32, marginBottom:12 }}>🚗</div>
                  <div style={{ fontFamily:'Outfit,sans-serif', fontSize:16, fontWeight:700, color:'#0A2540', marginBottom:6 }}>No listings yet</div>
                  <div style={{ fontSize:13, color:'#94A3B8', marginBottom:16 }}>List your first car and reach thousands of buyers.</div>
                  <Link to="/list-car" style={{ background:'#1565C0', color:'#fff', padding:'10px 24px', borderRadius:8, fontSize:13, fontWeight:700, textDecoration:'none', fontFamily:'Outfit,sans-serif' }}>+ List a Car</Link>
                </div>
              ) : myListings.map(l => (
                <div key={l.id} style={{ background:'#fff', border:'1.5px solid #E8EDF3', borderRadius:12, padding:14, marginBottom:10, display:'grid', gridTemplateColumns:'80px 1fr auto', gap:14, alignItems:'center' }}>
                  <div style={{ width:80, height:56, borderRadius:8, background:'#EEF5FF', overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    {l.listing_photos?.[0]?.url
                      ? <img src={l.listing_photos[0].url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                      : <span style={{ fontSize:11, color:'#94A3B8' }}>No photo</span>}
                  </div>
                  <div>
                    <div style={{ fontFamily:'Outfit,sans-serif', fontSize:13, fontWeight:700, color:'#0A2540', marginBottom:3 }}>{l.year} {l.make} {l.model}</div>
                    <div style={{ fontSize:11, color:'#94A3B8', display:'flex', gap:10, marginBottom:5 }}>
                      <span>KSH {Number(l.price).toLocaleString()}</span>
                      <span>·</span>
                      <span>{Number(l.mileage).toLocaleString()} km</span>
                      <span>·</span>
                      <span>{l.fuel_type}</span>
                    </div>
                    <div style={{ fontSize:11, color:'#64748B' }}>{l.views || 0} views</div>
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', gap:6, alignItems:'flex-end' }}>
                    <span style={{ fontSize:10, fontWeight:700, padding:'3px 10px', borderRadius:100, background:l.status==='approved'?'#DCFCE7':l.status==='pending'?'#FEF3C7':'#FEE2E2', color:l.status==='approved'?'#16A34A':l.status==='pending'?'#D97706':'#EF4444', fontFamily:'Outfit,sans-serif' }}>
                      {l.status==='approved'?'● Live':l.status==='pending'?'● Pending Review':'● Declined'}
                    </span>
                    <Link to={`/edit-listing/${l.id}`} style={{ background:'#F0F6FF', color:'#1565C0', border:'1.5px solid #BDD5FF', padding:'5px 12px', borderRadius:6, fontSize:11, fontWeight:700, fontFamily:'Outfit,sans-serif', textDecoration:'none' }}>Edit</Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'saved' && (
            <div>
              <div style={{ fontFamily:'Outfit,sans-serif', fontSize:17, fontWeight:800, color:'#0A2540', marginBottom:16 }}>Saved Cars <span style={{ color:'#94A3B8', fontWeight:400, fontSize:13 }}>({savedCars.length})</span></div>
              {loadingSaved ? <div style={{ textAlign:'center', padding:40, color:'#94A3B8' }}>Loading...</div>
              : savedCars.length === 0 ? (
                <div style={{ textAlign:'center', padding:48, background:'#fff', borderRadius:12, border:'1.5px solid #E8EDF3' }}>
                  <div style={{ fontSize:32, marginBottom:12 }}>❤️</div>
                  <div style={{ fontFamily:'Outfit,sans-serif', fontSize:16, fontWeight:700, color:'#0A2540', marginBottom:6 }}>No saved cars yet</div>
                  <div style={{ fontSize:13, color:'#94A3B8', marginBottom:16 }}>Browse listings and save cars you like.</div>
                  <Link to="/listings" style={{ background:'#1565C0', color:'#fff', padding:'10px 24px', borderRadius:8, fontSize:13, fontWeight:700, textDecoration:'none', fontFamily:'Outfit,sans-serif' }}>Browse Cars</Link>
                </div>
              ) : (
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
                  {savedCars.map(c => (
                    <div key={c.id} style={{ background:'#fff', border:'1.5px solid #E8EDF3', borderRadius:10, overflow:'hidden' }}>
                      <div style={{ height:120, background:'#EEF5FF', overflow:'hidden' }}>
                        {c.listing_photos?.[0]?.url
                          ? <img src={c.listing_photos[0].url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                          : <div style={{ height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24 }}>🚗</div>}
                      </div>
                      <div style={{ padding:'10px 10px 0' }}>
                        <div style={{ fontFamily:'Outfit,sans-serif', fontSize:14, fontWeight:800, color:'#0A2540' }}>KSH {Number(c.price).toLocaleString()}</div>
                        <div style={{ fontSize:11, color:'#64748B', marginTop:1 }}>{c.year} {c.make} {c.model}</div>
                      </div>
                      <Link to={`/listings/${c.id}`} style={{ display:'block', width:'100%', background:'#F0F6FF', color:'#1565C0', border:'none', borderTop:'1px solid #E8EDF3', padding:7, fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:'Outfit,sans-serif', marginTop:8, textAlign:'center', textDecoration:'none' }}>View Listing →</Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'leads' && (
            <div style={{ textAlign:'center', padding:48, background:'#fff', borderRadius:12, border:'1.5px solid #E8EDF3' }}>
              <div style={{ fontSize:32, marginBottom:12 }}>💬</div>
              <div style={{ fontFamily:'Outfit,sans-serif', fontSize:16, fontWeight:700, color:'#0A2540', marginBottom:6 }}>Leads coming soon</div>
              <div style={{ fontSize:13, color:'#94A3B8' }}>When buyers contact you via WhatsApp, their enquiries will appear here.</div>
            </div>
          )}

          {tab === 'searches' && (
  <div>
    <div style={{ fontFamily:'Outfit,sans-serif', fontSize:17, fontWeight:800, color:'#0A2540', marginBottom:16 }}>
      Saved Searches
    </div>
    <SavedSearchesList user={user} />
  </div>
)}
{tab === 'alerts' && (
  <div style={{ textAlign:'center', padding:48, background:'#fff', borderRadius:12, border:'1.5px solid #E8EDF3' }}>
    <div style={{ fontSize:32, marginBottom:12 }}>🔔</div>
    <div style={{ fontFamily:'Outfit,sans-serif', fontSize:16, fontWeight:700, color:'#0A2540', marginBottom:6 }}>Alerts coming soon</div>
    <div style={{ fontSize:13, color:'#94A3B8' }}>Get notified on price drops, sold listings, and new matches for your saved searches.</div>
  </div>
)}
        </main>
      </div>
    </div>
  )
}

// NEWS & REVIEWS PAGE
const ARTICLES = [
  { id:1, title:'2024 Toyota Land Cruiser 300: A Thorough Test After 3,000km on Kenyan Roads', cat:'Review', author:'James Mwangi', date:'May 14, 2025', read:'8 min', excerpt:'We put the LC300 through its paces on everything from Nairobi pothole-ridden streets to off-road trails in the Maasai Mara.', bg:'#C8DCF0', wide:true },
  { id:2, title:'Japan Import Prices Drop 12% Is Now the Best Time to Buy?', cat:'News', author:'Faith Odhiambo', date:'May 11, 2025', read:'4 min', excerpt:'KRA duty adjustments and a stronger KES are making Japanese imports more affordable than they have been in two years.', bg:'#C8E6C9' },
  { id:3, title:'10 Things to Always Check Before Buying a Used Car in Kenya', cat:'Guide', author:'Brian Kariuki', date:'May 8, 2025', read:'6 min', excerpt:'A practical checklist from our team that could save you from an expensive mistake.', bg:'#F5E0C8' },
  { id:4, title:'How to Import a Car from Japan to Kenya in 2025: Full Step-by-Step', cat:'Import', author:'Peter Njoroge', date:'May 5, 2025', read:'10 min', excerpt:'The complete guide to sourcing, shipping, clearing customs, and registering a Japanese import in Kenya.', bg:'#E0D0F0' },
]
const CAT_COLORS = { Review:'#0A2540', News:'#1565C0', Guide:'#16A34A', Import:'#7C3AED' }

export function NewsReviewsPage({ user }) {
  const [tab, setTab] = useState('all')
  const TABS = ['all','news','reviews','guides','import']
  const filtered = tab === 'all' ? ARTICLES : ARTICLES.filter(a => a.cat.toLowerCase() === tab.replace('s',''))
  return (
    <div style={{ fontFamily:'DM Sans,sans-serif', background:'#F7F9FC', minHeight:'100vh' }}>
      <Navbar user={user} />
      <div style={{ background:'#0A2540', padding:'32px 24px 0', overflow:'hidden' }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, maxWidth:1200, margin:'0 auto' }}>
          <div style={{ borderRadius:'14px 14px 0 0', height:280, display:'flex', alignItems:'flex-end', position:'relative', overflow:'hidden', cursor:'pointer' }}>
            <div style={{ position:'absolute', inset:0, background:'linear-gradient(135deg,#1a3a5c,#2563a8)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <svg width="120" height="68" viewBox="0 0 120 68" fill="none" opacity=".3"><rect x="10" y="22" width="100" height="26" rx="6" fill="#fff"/><path d="M20 22 L32 5 H88 L100 22" fill="#fff" opacity=".7"/><circle cx="28" cy="52" r="12" fill="#4DA6FF"/><circle cx="92" cy="52" r="12" fill="#4DA6FF"/><circle cx="28" cy="52" r="5" fill="#fff"/><circle cx="92" cy="52" r="5" fill="#fff"/></svg>
            </div>
            <div style={{ padding:18, position:'relative', zIndex:1 }}>
              <span style={{ background:'#1565C0', color:'#fff', fontSize:9, fontWeight:700, padding:'2px 8px', borderRadius:100, textTransform:'uppercase', fontFamily:'Outfit,sans-serif', display:'inline-block', marginBottom:7 }}>Full Review</span>
              <div style={{ fontFamily:'Outfit,sans-serif', fontSize:18, fontWeight:800, color:'#fff', lineHeight:1.2, marginBottom:6 }}>2024 Toyota Land Cruiser 300: Is It Still Kenya's Best SUV?</div>
              <div style={{ fontSize:11, color:'rgba(255,255,255,.6)' }}>James Mwangi · May 14, 2025 · 8 min read</div>
            </div>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {[['news','Japan Import Prices Drop 12%','3 days ago'],['guide','Kenya EV Charging Network Launches in Nairobi','1 week ago'],['guide','10 Things to Check Before Buying a Used Car','2 weeks ago'],['import','How to Import a Car from Japan to Kenya in 2025','3 weeks ago']].map(([cat,title,time]) => (
              <div key={title} style={{ background:'rgba(255,255,255,.06)', border:'1px solid rgba(255,255,255,.08)', borderRadius:10, padding:12, cursor:'pointer' }}>
                <div style={{ fontSize:9, fontWeight:700, color:'#4DA6FF', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:3, fontFamily:'Outfit,sans-serif' }}>{cat}</div>
                <div style={{ fontSize:12, fontWeight:600, color:'#fff', lineHeight:1.3 }}>{title}</div>
                <div style={{ fontSize:10, color:'rgba(255,255,255,.4)', marginTop:3 }}>{time}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={{ display:'flex', gap:0, background:'#fff', borderBottom:'2px solid #E8EDF3', padding:'0 24px' }}>
        {TABS.map(t => (
          <div key={t} onClick={() => setTab(t)} style={{ padding:'10px 18px', fontFamily:'Outfit,sans-serif', fontSize:13, fontWeight:700, cursor:'pointer', color:tab===t?'#0A2540':'#94A3B8', borderBottom:`2px solid ${tab===t?'#1565C0':'transparent'}`, marginBottom:-2, textTransform:'capitalize' }}>{t}</div>
        ))}
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 260px', gap:20, padding:'20px 24px', maxWidth:1200, margin:'0 auto' }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
          {filtered.map(a => (
            <div key={a.id} style={{ background:'#fff', border:'1.5px solid #E8EDF3', borderRadius:12, overflow:'hidden', cursor:'pointer', gridColumn: a.wide?'1/-1':'auto', display: a.wide?'grid':'block', gridTemplateColumns: a.wide?'220px 1fr':'none' }}>
              <div style={{ height: a.wide?'100%':160, minHeight: a.wide?140:0, background:a.bg, display:'flex', alignItems:'center', justifyContent:'center', position:'relative' }}>
                <span style={{ position:'absolute', top:10, left:10, fontSize:9, fontWeight:700, padding:'2px 8px', borderRadius:100, textTransform:'uppercase', fontFamily:'Outfit,sans-serif', background:CAT_COLORS[a.cat]||'#1565C0', color:'#fff' }}>{a.cat}</span>
                <span style={{ fontSize:32 }}>📰</span>
              </div>
              <div style={{ padding:16 }}>
                <div style={{ fontFamily:'Outfit,sans-serif', fontSize: a.wide?16:14, fontWeight:700, color:'#0A2540', marginBottom:6, lineHeight:1.3 }}>{a.title}</div>
                <div style={{ fontSize:11, color:'#64748B', lineHeight:1.6, marginBottom:10 }}>{a.excerpt}</div>
                <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:11, color:'#94A3B8' }}>
                  <div style={{ width:20, height:20, borderRadius:'50%', background:'#1565C0', display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:700, color:'#fff', fontFamily:'Outfit,sans-serif' }}>{a.author[0]}</div>
                  <span>{a.author}</span><span>·</span><span>{a.date}</span><span>·</span><span>{a.read}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div>
          <div style={{ background:'#fff', border:'1.5px solid #E8EDF3', borderRadius:12, padding:16, marginBottom:14 }}>
            <div style={{ fontFamily:'Outfit,sans-serif', fontSize:13, fontWeight:700, color:'#0A2540', marginBottom:12 }}>Trending This Week</div>
            {[['Best SUVs Under KSH 3M in Kenya 2025','4.2k views'],['Toyota vs Mazda: Which Holds Value Better?','3.8k views'],['Japan Import Prices Drop 12%','3.1k views'],['How to Inspect a Car Before Buying','2.7k views'],['2025 Subaru Forester Kenya Road Test','2.2k views']].map(([title,views],i) => (
              <div key={title} style={{ display:'flex', gap:10, alignItems:'flex-start', padding:'8px 0', borderBottom:'1px solid #F5F7FA', cursor:'pointer' }}>
                <span style={{ fontFamily:'Outfit,sans-serif', fontSize:16, fontWeight:800, color:'#E2E8F0', minWidth:20 }}>{String(i+1).padStart(2,'0')}</span>
                <div><div style={{ fontSize:12, fontWeight:600, color:'#334155', lineHeight:1.3 }}>{title}</div><div style={{ fontSize:10, color:'#94A3B8', marginTop:2 }}>{views}</div></div>
              </div>
            ))}
          </div>
          <div style={{ background:'#0A2540', borderRadius:12, padding:16 }}>
            <div style={{ fontFamily:'Outfit,sans-serif', fontSize:13, fontWeight:700, color:'#fff', marginBottom:6 }}>Newsletter</div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,.55)', marginBottom:12, lineHeight:1.5 }}>Get the latest car news, reviews, and deals weekly.</div>
            <input placeholder="your@email.com" style={{ width:'100%', padding:'8px 12px', border:'1.5px solid rgba(255,255,255,.15)', borderRadius:7, fontSize:12, color:'#fff', background:'rgba(255,255,255,.08)', outline:'none', fontFamily:'DM Sans,sans-serif', marginBottom:8 }}/>
            <button style={{ width:'100%', background:'#4DA6FF', color:'#0A2540', border:'none', padding:9, borderRadius:7, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'Outfit,sans-serif' }}>Subscribe</button>
          </div>
        </div>
      </div>
      <footer style={{ background:'#060F1A', padding:'28px 24px', textAlign:'center' }}>
        <div style={{ fontFamily:'Outfit,sans-serif', fontSize:16, fontWeight:800, color:'#fff', marginBottom:6 }}>CarExpert<span style={{ color:'#4DA6FF' }}>Africa</span></div>
        <div style={{ fontSize:11, color:'rgba(255,255,255,.35)' }}>Kenya's Ultimate Car Listing Platform · © 2025</div>
      </footer>
    </div>
  )
}

// DEALER PROFILE PAGE
const DEALER_LISTINGS = [
  { id:1, make:'Toyota', model:'Prado 150', year:2019, price:6200000, km:62200, fuel:'Petrol', badge:'Featured', bg:'#C8DCF0', fg:'#0D3B6E' },
  { id:2, make:'Toyota', model:'RAV4 LE', year:2018, price:4650000, km:96000, fuel:'Petrol', badge:null, bg:'#D0E4F4', fg:'#0D3B6E' },
  { id:3, make:'Toyota', model:'Harrier 2.0', year:2017, price:3800000, km:74000, fuel:'Petrol', badge:null, bg:'#E0EAF8', fg:'#0D3B6E' },
  { id:4, make:'Toyota', model:'Hilux D/Cab', year:2020, price:5400000, km:48000, fuel:'Diesel', badge:'New Arrival', bg:'#C8E0D4', fg:'#0D4A20' },
  { id:5, make:'Toyota', model:'Vanguard', year:2016, price:2900000, km:112000, fuel:'Petrol', badge:null, bg:'#EAE4D8', fg:'#4A3800' },
  { id:6, make:'Toyota', model:'Fortuner 2.7', year:2019, price:5800000, km:55000, fuel:'Petrol', badge:'Hot', bg:'#F0D8D8', fg:'#6D0000' },
]

export function DealerProfilePage({ user }) {
  return (
    <div style={{ fontFamily:'DM Sans,sans-serif', background:'#F7F9FC', minHeight:'100vh' }}>
      <Navbar user={user} />
      <div style={{ background:'linear-gradient(135deg,#0A2540,#1565C0)', padding:'32px 24px' }}>
        <div style={{ background:'#fff', borderRadius:16, padding:20, display:'grid', gridTemplateColumns:'auto 1fr auto', gap:16, alignItems:'center', maxWidth:1200, margin:'0 auto' }}>
          <div style={{ width:64, height:64, borderRadius:12, background:'#0A2540', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Outfit,sans-serif', fontSize:20, fontWeight:800, color:'#fff' }}>NK</div>
          <div>
            <div style={{ fontFamily:'Outfit,sans-serif', fontSize:20, fontWeight:800, color:'#0A2540', marginBottom:6 }}>Nairobi Kars Ltd</div>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              {[['Verified Dealer','green'],['4.8 / 5 (124 reviews)','blue'],['Westlands, Nairobi','blue'],['Member since 2023','blue']].map(([label,color]) => (
                <span key={label} style={{ background:color==='green'?'#DCFCE7':'#EEF5FF', color:color==='green'?'#16A34A':'#1565C0', border:`1px solid ${color==='green'?'#86EFAC':'#BDD5FF'}`, borderRadius:100, padding:'3px 10px', fontSize:11, fontWeight:700, fontFamily:'Outfit,sans-serif' }}>{label}</span>
              ))}
            </div>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            <a href="https://wa.me/" target="_blank" rel="noopener noreferrer" style={{ background:'#25D366', color:'#fff', border:'none', padding:'8px 16px', borderRadius:8, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'Outfit,sans-serif', textDecoration:'none', display:'flex', alignItems:'center', gap:6 }}>WhatsApp</a>
           <Link to={`/edit-listing/${l.id}`} style={{ background:'#F0F6FF', color:'#1565C0', border:'1.5px solid #BDD5FF', padding:'5px 12px', borderRadius:6, fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:'Outfit,sans-serif', textDecoration:'none' }}>Edit</Link>
          </div>
        </div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, padding:'16px 24px', maxWidth:1200, margin:'0 auto' }}>
        {[['31','Active Listings'],['4.8','Avg. Rating'],['124','Total Reviews'],['2 yrs','On Platform']].map(([n,l]) => (
          <div key={l} style={{ background:'#fff', border:'1.5px solid #E8EDF3', borderRadius:12, padding:14, textAlign:'center' }}>
            <div style={{ fontFamily:'Outfit,sans-serif', fontSize:22, fontWeight:800, color:'#0A2540' }}>{n}</div>
            <div style={{ fontSize:11, color:'#94A3B8', marginTop:2 }}>{l}</div>
          </div>
        ))}
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 280px', gap:16, padding:'0 24px 24px', maxWidth:1200, margin:'0 auto' }}>
        <div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
            <div style={{ fontFamily:'Outfit,sans-serif', fontSize:16, fontWeight:700, color:'#0A2540' }}>Dealer Inventory <span style={{ color:'#94A3B8', fontWeight:400, fontSize:13 }}>(31 cars)</span></div>
            <select style={{ padding:'6px 12px', border:'1.5px solid #E2E8F0', borderRadius:7, fontSize:12, fontFamily:'DM Sans,sans-serif', outline:'none', background:'#fff' }}><option>Newest First</option><option>Price: Low</option><option>Price: High</option></select>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
            {DEALER_LISTINGS.map(c => (
              <div key={c.id} style={{ background:'#fff', border:'1.5px solid #E8EDF3', borderRadius:12, overflow:'hidden', cursor:'pointer' }}>
                <div style={{ height:110, background:c.bg, display:'flex', alignItems:'center', justifyContent:'center', position:'relative' }}>
                  {c.badge && <span style={{ position:'absolute', top:7, left:7, background:'#1565C0', color:'#fff', fontSize:9, fontWeight:700, padding:'2px 7px', borderRadius:100, textTransform:'uppercase', fontFamily:'Outfit,sans-serif' }}>{c.badge}</span>}
                  <svg width="80" height="48" viewBox="0 0 80 48" fill="none"><rect x="6" y="17" width="68" height="19" rx="4" fill={c.fg} opacity=".18"/><path d="M13 17 L20 5 H60 L67 17" fill={c.fg} opacity=".14"/><circle cx="18" cy="38" r="8" fill={c.fg} opacity=".25"/><circle cx="62" cy="38" r="8" fill={c.fg} opacity=".25"/></svg>
                </div>
                <div style={{ padding:10 }}>
                  <div style={{ fontFamily:'Outfit,sans-serif', fontSize:14, fontWeight:800, color:'#0A2540', marginBottom:1 }}>{fmt(c.price)}</div>
                  <div style={{ fontSize:11, fontWeight:600, color:'#64748B', marginBottom:6 }}>{c.year} {c.make} {c.model}</div>
                  <div style={{ display:'flex', gap:3 }}>
                    {[`${c.km.toLocaleString()}km`, c.fuel, String(c.year)].map((s,i)=><span key={i} style={{ fontSize:9, color:'#94A3B8', padding:'2px 5px', background:'#F8FAFC', borderRadius:100, border:'1px solid #E8EDF3' }}>{s}</span>)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <div style={{ background:'#fff', border:'1.5px solid #E8EDF3', borderRadius:12, padding:16 }}>
            <div style={{ fontFamily:'Outfit,sans-serif', fontSize:13, fontWeight:700, color:'#0A2540', marginBottom:12 }}>Contact and Location</div>
            {[['📍','Westlands Road, Nairobi'],['📞','+254 700 000 000'],['📱','+254 700 000 001'],['✉️','info@nairobikars.co.ke'],['🌐','www.nairobikars.co.ke']].map(([icon,text]) => (
              <div key={text} style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 0', borderBottom:'1px solid #F5F7FA', fontSize:12, color:'#475569' }}><span>{icon}</span>{text}</div>
            ))}
          </div>
          <div style={{ background:'#fff', border:'1.5px solid #E8EDF3', borderRadius:12, padding:16 }}>
            <div style={{ fontFamily:'Outfit,sans-serif', fontSize:13, fontWeight:700, color:'#0A2540', marginBottom:12 }}>Opening Hours</div>
            {[['Mon – Fri','8:00 AM – 6:00 PM'],['Saturday','8:00 AM – 5:00 PM'],['Sunday','10:00 AM – 3:00 PM']].map(([day,hrs]) => (
              <div key={day} style={{ display:'flex', justifyContent:'space-between', padding:'5px 0', borderBottom:'1px solid #F5F7FA', fontSize:12 }}><span style={{ color:'#64748B' }}>{day}</span><span style={{ fontWeight:600, fontFamily:'Outfit,sans-serif' }}>{hrs}</span></div>
            ))}
          </div>
          <div style={{ background:'#fff', border:'1.5px solid #E8EDF3', borderRadius:12, padding:16 }}>
            <div style={{ fontFamily:'Outfit,sans-serif', fontSize:13, fontWeight:700, color:'#0A2540', marginBottom:10 }}>Specialities</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
              {['Japanese Imports','SUVs','Toyota','Financing','Trade-ins'].map(s => (
                <span key={s} style={{ background:'#EEF5FF', color:'#1565C0', border:'1px solid #BDD5FF', borderRadius:100, padding:'3px 10px', fontSize:11, fontWeight:600 }}>{s}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
