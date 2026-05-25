import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import { signUp, signIn, supabase } from '../lib/supabase'
import { Link, useNavigate, useParams } from 'react-router-dom'
const fmt = (n) => 'KSH ' + Number(n).toLocaleString()

const MOBILE_CSS = `
  @media (max-width: 768px) {
    .detail-grid { grid-template-columns: 1fr !important; }
    .detail-sidebar { order: -1; }
    .detail-price-bar { position: fixed; bottom: 0; left: 0; right: 0; z-index: 50; border-radius: 0 !important; margin: 0 !important; }
    .detail-main-pad { padding-bottom: 160px !important; }
    .auth-grid { grid-template-columns: 1fr !important; }
    .auth-left { display: none !important; }
    .listcar-grid { grid-template-columns: 1fr !important; }
    .listcar-sidebar { display: none !important; }
    .listcar-steps { flex-wrap: wrap; gap: 8px !important; }
    .listcar-steps-label { display: none !important; }
    .listcar-form-grid { grid-template-columns: 1fr !important; }
    .dashboard-layout { grid-template-columns: 1fr !important; }
    .dashboard-sidebar { display: none !important; }
    .dashboard-mobile-tabs { display: flex !important; }
    .dashboard-stats { grid-template-columns: 1fr 1fr !important; }
    .dashboard-quick { grid-template-columns: 1fr !important; }
    .dashboard-saved-grid { grid-template-columns: 1fr 1fr !important; }
    .valuation-grid { grid-template-columns: 1fr !important; }
    .pricing-grid { grid-template-columns: 1fr !important; }
    .dealer-stats { grid-template-columns: 1fr 1fr !important; }
    .dealer-layout { grid-template-columns: 1fr !important; }
    .dealer-cars { grid-template-columns: 1fr 1fr !important; }
    .spec-grid { grid-template-columns: 1fr !important; }
    .spec-grid > div { border-right: none !important; }
  }
`

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
  const [activePhoto, setActivePhoto] = useState(0)

  useEffect(() => {
    if (!id) return
    supabase.from('listings').select('*, listing_photos(*)').eq('id', id).single()
      .then(({ data }) => {
        if (data) {
          setCar(data)
          setDeposit(Math.round(data.price * 0.2))
          const ids = JSON.parse(localStorage.getItem('cea_recently_viewed') || '[]')
          const updated = [id, ...ids.filter(i => i !== id)].slice(0, 5)
          localStorage.setItem('cea_recently_viewed', JSON.stringify(updated))
          supabase.auth.getUser().then(({ data: { user: u } }) => {
            if (!u) return
            supabase.from('saved_listings').select('id').eq('user_id', u.id).eq('listing_id', id).single()
              .then(({ data: s }) => { if (s) setSaved(true) })
          })
        }
        setLoading(false)
      })
  }, [id])

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
      <style>{MOBILE_CSS}</style>
      <Navbar user={user} />
      <div style={{ textAlign:'center', padding:80, color:'#94A3B8' }}>Loading...</div>
    </div>
  )

  if (!car) return (
    <div style={{ fontFamily:'DM Sans,sans-serif', minHeight:'100vh', background:'#F7F9FC' }}>
      <style>{MOBILE_CSS}</style>
      <Navbar user={user} />
      <div style={{ textAlign:'center', padding:80 }}>
        <div style={{ fontSize:40, marginBottom:16 }}>🔍</div>
        <div style={{ fontFamily:'Outfit,sans-serif', fontSize:20, fontWeight:800, color:'#0A2540', marginBottom:8 }}>Listing not found</div>
        <Link to="/listings" style={{ background:'#1565C0', color:'#fff', padding:'10px 24px', borderRadius:8, fontSize:13, fontWeight:700, textDecoration:'none', fontFamily:'Outfit,sans-serif' }}>Back to Listings</Link>
      </div>
    </div>
  )

  const waLink = `https://wa.me/${(car.phone||'').replace(/\D/g,'')}?text=Hi, I saw your ${car.year} ${car.make} ${car.model}${car.variant ? ` — ${car.variant}` : ''} on CarExpert Africa. Is it still available?`

  return (
    <div style={{ fontFamily:'DM Sans,sans-serif', background:'#F7F9FC', minHeight:'100vh' }}>
      <style>{MOBILE_CSS}</style>
      <Navbar user={user} />
      <div style={{ background:'#fff', borderBottom:'1px solid #E8EDF3', padding:'10px 16px', fontSize:12, color:'#94A3B8' }}>
        <Link to="/" style={{ color:'#1565C0', textDecoration:'none' }}>Home</Link> / <Link to="/listings" style={{ color:'#1565C0', textDecoration:'none' }}>Listings</Link> / {car.year} {car.make} {car.model}{car.variant ? ` — ${car.variant}` : ''}
      </div>

      <div className="detail-grid detail-main-pad" style={{ display:'grid', gridTemplateColumns:'1fr 300px', gap:16, padding:'16px', maxWidth:1200, margin:'0 auto' }}>
        {/* Main */}
        <div>
          {/* Photo */}
          <div style={{ borderRadius:12, overflow:'hidden', background:'#EEF5FF', height:280, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:8, position:'relative' }}>
            <button onClick={handleSave} style={{ position:'absolute', top:12, right:12, width:36, height:36, background: saved?'#EF4444':'rgba(255,255,255,.9)', borderRadius:'50%', border:'none', cursor:'pointer', fontSize:18, color: saved?'#fff':'#94A3B8', zIndex:1, display:'flex', alignItems:'center', justifyContent:'center' }}>
              {saved ? '♥' : '♡'}
            </button>
            {car.listing_photos?.[activePhoto]?.url
              ? <img src={car.listing_photos[activePhoto].url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
              : <div style={{ textAlign:'center' }}><span style={{ fontSize:56 }}>🚗</span><div style={{ fontSize:12, color:'#94A3B8', marginTop:8 }}>No photos</div></div>
            }
          </div>
          {car.listing_photos?.length > 1 && (
            <div style={{ display:'grid', gridTemplateColumns:`repeat(${Math.min(car.listing_photos.length,5)},1fr)`, gap:6, marginBottom:14 }}>
              {car.listing_photos.slice(0,5).map((p,i) => (
                <div key={i} onClick={() => setActivePhoto(i)} style={{ height:56, borderRadius:7, overflow:'hidden', border:`2px solid ${i===activePhoto?'#1565C0':'transparent'}`, cursor:'pointer' }}>
                  <img src={p.url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                </div>
              ))}
            </div>
          )}

          {/* Title */}
          <div style={{ background:'#fff', border:'1.5px solid #E8EDF3', borderRadius:12, padding:16, marginBottom:12 }}>
            <div style={{ fontFamily:'Outfit,sans-serif', fontSize:20, fontWeight:800, color:'#0A2540', marginBottom:4 }}>{car.year} {car.make} {car.model}{car.variant ? ` — ${car.variant}` : ''}</div>
            <div style={{ fontSize:12, color:'#94A3B8', display:'flex', gap:8, flexWrap:'wrap' }}>
              {car.location && <span>📍 {car.location}</span>}
              {car.views > 0 && <span style={{ color:'#1565C0', fontWeight:600 }}>{car.views} views</span>}
              <span>Listed {new Date(car.created_at).toLocaleDateString('en-GB')}</span>
              {car.updated_at && car.updated_at !== car.created_at && (
                <span>· Updated {new Date(car.updated_at).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })}</span>
              )}
            </div>
          </div>

          {/* Specs */}
          <div style={{ background:'#fff', border:'1.5px solid #E8EDF3', borderRadius:12, padding:16, marginBottom:12 }}>
            <div style={{ fontFamily:'Outfit,sans-serif', fontSize:14, fontWeight:700, color:'#0A2540', marginBottom:14, display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ width:3, height:14, background:'#1565C0', borderRadius:2, display:'inline-block' }}/>  Vehicle Specifications
            </div>
            <div className="spec-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr' }}>
              {[['Make',car.make],['Model',car.model],['Variant',car.variant||'—'],['Year',car.year],['Mileage',car.mileage?`${Number(car.mileage).toLocaleString()} km`:'—'],['Condition',car.condition||'—'],['Body Type',car.body_type||'—'],['Engine',car.engine_cc?`${car.engine_cc} cc`:'—'],['Fuel Type',car.fuel_type||'—'],['Transmission',car.transmission||'—'],['Drive Type',car.drive_type||'—'],['Colour',car.colour||car.color||'—'],['Negotiable',car.negotiable?'Yes':'No']].map(([k,v],i) => (
                <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'9px 10px', borderBottom:'1px solid #F0F4F8', borderRight: i%2===0?'1px solid #F0F4F8':'none' }}>
                  <span style={{ fontSize:12, color:'#94A3B8' }}>{k}</span>
                  <span style={{ fontSize:12, fontWeight:700, color:'#0A2540', fontFamily:'Outfit,sans-serif' }}>{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Description */}
          {car.description && (
            <div style={{ background:'#fff', border:'1.5px solid #E8EDF3', borderRadius:12, padding:16 }}>
              <div style={{ fontFamily:'Outfit,sans-serif', fontSize:14, fontWeight:700, color:'#0A2540', marginBottom:10, display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ width:3, height:14, background:'#1565C0', borderRadius:2, display:'inline-block' }}/> Seller Description
              </div>
              <p style={{ fontSize:13, color:'#475569', lineHeight:1.7, margin:0 }}>{car.description}</p>
            </div>
          )}
        </div>

        {/* Sidebar — fixed bar on mobile */}
        <div className="detail-sidebar">
          <div className="detail-price-bar" style={{ background:'#0A2540', borderRadius:12, padding:16, marginBottom:14, color:'#fff' }}>
            <div style={{ fontSize:10, color:'rgba(255,255,255,.5)', fontWeight:700, textTransform:'uppercase', letterSpacing:'.8px', marginBottom:2 }}>Asking Price</div>
            <div style={{ fontFamily:'Outfit,sans-serif', fontSize:26, fontWeight:800, marginBottom:car.negotiable?4:12 }}>KSH {Number(car.price).toLocaleString()}</div>
            {car.negotiable && <div style={{ fontSize:11, color:'#4DA6FF', fontWeight:600, marginBottom:12 }}>Price negotiable</div>}
            <div style={{ display:'flex', gap:8 }}>
              <a href={waLink} target="_blank" rel="noopener noreferrer"
                style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:6, background:'#25D366', color:'#fff', border:'none', padding:'11px 8px', borderRadius:8, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'Outfit,sans-serif', textDecoration:'none' }}>
                📱 WhatsApp
              </a>
              {car.phone && (
                <a href={`tel:${car.phone}`}
                  style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:6, background:'rgba(255,255,255,.12)', color:'#fff', border:'1.5px solid rgba(255,255,255,.2)', padding:'11px 8px', borderRadius:8, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'Outfit,sans-serif', textDecoration:'none' }}>
                  📞 Call
                </a>
              )}
            </div>
            {car.contact_name && (
              <>
                <div style={{ height:1, background:'rgba(255,255,255,.1)', margin:'12px 0' }}/>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{ width:34, height:34, borderRadius:'50%', background:'#1565C0', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:13, fontFamily:'Outfit,sans-serif', flexShrink:0 }}>
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
          <div style={{ background:'#fff', border:'1.5px solid #E8EDF3', borderRadius:12, padding:16 }}>
            <div style={{ fontFamily:'Outfit,sans-serif', fontSize:13, fontWeight:700, color:'#0A2540', marginBottom:14, display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ width:3, height:13, background:'#1565C0', borderRadius:2, display:'inline-block' }}/> Finance Calculator
            </div>
            {[
              { label:'Deposit', value:deposit, setValue:setDeposit, min:0, max:car.price*0.8, step:50000, display:`KSH ${Number(deposit).toLocaleString()}` },
              { label:'Loan Term', value:term, setValue:setTerm, min:12, max:72, step:6, display:`${term} months` },
              { label:'Interest Rate', value:rate, setValue:setRate, min:8, max:25, step:0.5, display:`${rate}%` },
            ].map(({ label, value, setValue, min, max, step, display }) => (
              <div key={label} style={{ marginBottom:12 }}>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, marginBottom:5 }}>
                  <span style={{ fontWeight:700, color:'#64748B', textTransform:'uppercase', fontSize:10 }}>{label}</span>
                  <span style={{ fontWeight:700, color:'#0A2540', fontFamily:'Outfit,sans-serif' }}>{display}</span>
                </div>
                <input type="range" min={min} max={max} value={value} step={step} onChange={e => setValue(Number(e.target.value))} style={{ width:'100%', accentColor:'#1565C0' }}/>
              </div>
            ))}
            <div style={{ background:'#EEF5FF', borderRadius:8, padding:12, textAlign:'center', border:'1px solid #BDD5FF' }}>
              <div style={{ fontSize:11, color:'#64748B', marginBottom:3 }}>Est. Monthly Payment</div>
              <div style={{ fontFamily:'Outfit,sans-serif', fontSize:20, fontWeight:800, color:'#1565C0' }}>KSH {Number(monthly()).toLocaleString()}</div>
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

  const inp = { width:'100%', padding:'11px 12px', border:'1.5px solid #E2E8F0', borderRadius:8, fontSize:14, fontFamily:'DM Sans,sans-serif', outline:'none', background:'#F8FAFC', boxSizing:'border-box' }
  const lbl = { display:'block', fontSize:10, fontWeight:700, color:'#64748B', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:5 }

  return (
    <div style={{ fontFamily:'DM Sans,sans-serif', background:'#F7F9FC', minHeight:'100vh' }}>
      <style>{MOBILE_CSS}</style>
      <Navbar user={user} />
      <div style={{ background:'linear-gradient(135deg,#0A2540,#0D3B6E)', padding:'36px 16px', textAlign:'center' }}>
        <div style={{ color:'#4DA6FF', fontSize:11, fontWeight:700, letterSpacing:'1.8px', textTransform:'uppercase', marginBottom:10 }}>Free Tool</div>
        <h1 style={{ fontFamily:'Outfit,sans-serif', fontSize:26, fontWeight:800, color:'#fff', marginBottom:8 }}>What Is Your Car Worth?</h1>
        <p style={{ color:'rgba(255,255,255,.55)', fontSize:14, maxWidth:400, margin:'0 auto' }}>Instant market valuation based on real Kenyan listings data.</p>
      </div>
      <div style={{ maxWidth:680, margin:'0 auto', padding:16 }}>
        <div style={{ background:'#fff', border:'1.5px solid #E8EDF3', borderRadius:14, padding:20, marginBottom:14 }}>
          <div style={{ fontFamily:'Outfit,sans-serif', fontSize:15, fontWeight:700, color:'#0A2540', marginBottom:16 }}>Tell us about your car</div>
          <div className="valuation-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div>
              <label style={lbl}>Make</label>
              <select value={make} onChange={e => setMake(e.target.value)} style={inp}>
                {Object.keys(BASE_PRICES).map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Model</label>
              <input value={model} onChange={e => setModel(e.target.value)} placeholder="e.g. Land Cruiser" style={inp}/>
            </div>
            <div>
              <label style={lbl}>Year</label>
              <select value={year} onChange={e => setYear(Number(e.target.value))} style={inp}>
                {Array.from({length:16},(_,i)=>2025-i).map(y => <option key={y}>{y}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Mileage (km)</label>
              <input type="number" value={km} onChange={e => setKm(Number(e.target.value))} placeholder="e.g. 60000" style={inp}/>
            </div>
          </div>
          <div style={{ marginTop:14 }}>
            <label style={lbl}>Condition</label>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8 }}>
              {['Excellent','Good','Fair','Poor'].map(c => (
                <div key={c} onClick={() => setCond(c)} style={{ border:`2px solid ${cond===c?'#1565C0':'#E2E8F0'}`, borderRadius:10, padding:'10px 6px', textAlign:'center', cursor:'pointer', background:cond===c?'#EEF5FF':'#fff' }}>
                  <div style={{ fontSize:18, marginBottom:4 }}>{c==='Excellent'?'★':c==='Good'?'✓':c==='Fair'?'~':'!'}</div>
                  <div style={{ fontSize:12, fontWeight:700, color:cond===c?'#1565C0':'#475569', fontFamily:'Outfit,sans-serif' }}>{c}</div>
                </div>
              ))}
            </div>
          </div>
          <button onClick={calculate} style={{ width:'100%', background:'#1565C0', color:'#fff', border:'none', padding:14, borderRadius:10, fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'Outfit,sans-serif', marginTop:18 }}>
            Get My Free Valuation →
          </button>
        </div>
        {result && (
          <div style={{ background:'#0A2540', borderRadius:14, padding:22, marginBottom:14 }}>
            <div style={{ fontSize:11, color:'rgba(255,255,255,.5)', fontWeight:700, textTransform:'uppercase', letterSpacing:'.8px', marginBottom:6, textAlign:'center' }}>Estimated Market Value</div>
            <div style={{ fontFamily:'Outfit,sans-serif', fontSize:26, fontWeight:800, color:'#fff', textAlign:'center', marginBottom:4 }}>{fmt(result.low)} – {fmt(result.high)}</div>
            <div style={{ fontSize:14, color:'#4DA6FF', textAlign:'center', fontWeight:600, marginBottom:18 }}>Best estimate: {fmt(result.mid)}</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
              {[['Low',result.low,'#475569'],['Mid',result.mid,'#4DA6FF'],['High',result.high,'#34D399']].map(([label,val,color]) => (
                <div key={label} style={{ background:'rgba(255,255,255,.06)', borderRadius:8, padding:12, textAlign:'center' }}>
                  <div style={{ fontSize:10, color:'rgba(255,255,255,.4)', fontWeight:700, textTransform:'uppercase', marginBottom:4 }}>{label}</div>
                  <div style={{ fontFamily:'Outfit,sans-serif', fontSize:13, fontWeight:800, color }}>{fmt(val)}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        <div style={{ background:'#fff', border:'1.5px solid #E8EDF3', borderRadius:14, padding:20 }}>
          <div style={{ fontFamily:'Outfit,sans-serif', fontSize:14, fontWeight:700, color:'#0A2540', marginBottom:12 }}>Want a More Accurate Valuation?</div>
          <div style={{ fontSize:13, color:'#64748B', lineHeight:1.6, marginBottom:14 }}>Upload photos and we'll connect you with certified valuers across Kenya for a professional report.</div>
          <Link to="/list-car" style={{ display:'block', background:'#1565C0', color:'#fff', padding:'12px', borderRadius:9, fontWeight:700, fontSize:13, textDecoration:'none', fontFamily:'Outfit,sans-serif', textAlign:'center' }}>List Your Car →</Link>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// PRICING PAGE
// ─────────────────────────────────────────────────────────────
export function PricingPage({ user }) {
  return (
    <div style={{ fontFamily:'DM Sans,sans-serif', background:'#F7F9FC', minHeight:'100vh' }}>
      <style>{MOBILE_CSS}</style>
      <Navbar user={user} />
      <div style={{ background:'linear-gradient(135deg,#0A2540,#1565C0)', padding:'44px 16px', textAlign:'center' }}>
        <div style={{ color:'#4DA6FF', fontSize:11, fontWeight:700, letterSpacing:'1.8px', textTransform:'uppercase', marginBottom:10 }}>Simple Pricing</div>
        <h1 style={{ fontFamily:'Outfit,sans-serif', fontSize:28, fontWeight:800, color:'#fff', marginBottom:8 }}>Choose Your Plan</h1>
        <p style={{ color:'rgba(255,255,255,.55)', fontSize:14 }}>Start free. Upgrade when you're ready to sell faster.</p>
      </div>
      <div style={{ maxWidth:900, margin:'0 auto', padding:16 }}>
        <div className="pricing-grid" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginTop:24 }}>
          {[
            { name:'Free', price:'KSH 0', period:'forever', color:'#475569', features:['1 active listing','5 photos','Standard placement','WhatsApp contact button'], cta:'Get Started', href:'/auth' },
            { name:'Standard', price:'KSH 1,500', period:'per month', color:'#1565C0', features:['5 active listings','20 photos per listing','Priority placement','Featured badge','Analytics dashboard'], cta:'Start Standard', href:'/auth', featured:true },
            { name:'Dealer Pro', price:'KSH 7,500', period:'per month', color:'#0A2540', features:['Unlimited listings','Unlimited photos','Top placement','Dealer profile page','Lead tracking','Verified dealer badge'], cta:'Contact Sales', href:'mailto:hello@carexpertafrica.com' },
          ].map(plan => (
            <div key={plan.name} style={{ background:'#fff', border:`2px solid ${plan.featured?'#1565C0':'#E8EDF3'}`, borderRadius:14, padding:20, position:'relative', boxShadow: plan.featured?'0 8px 32px rgba(21,101,192,.15)':'none' }}>
              {plan.featured && <div style={{ position:'absolute', top:-12, left:'50%', transform:'translateX(-50%)', background:'#1565C0', color:'#fff', fontSize:10, fontWeight:700, padding:'3px 14px', borderRadius:100, whiteSpace:'nowrap', fontFamily:'Outfit,sans-serif' }}>MOST POPULAR</div>}
              <div style={{ fontFamily:'Outfit,sans-serif', fontSize:16, fontWeight:800, color:'#0A2540', marginBottom:4 }}>{plan.name}</div>
              <div style={{ fontFamily:'Outfit,sans-serif', fontSize:24, fontWeight:800, color:plan.color, marginBottom:2 }}>{plan.price}</div>
              <div style={{ fontSize:11, color:'#94A3B8', marginBottom:18 }}>{plan.period}</div>
              {plan.features.map(f => (
                <div key={f} style={{ display:'flex', alignItems:'flex-start', gap:8, marginBottom:8 }}>
                  <span style={{ color:'#16A34A', fontWeight:700, fontSize:13, flexShrink:0 }}>✓</span>
                  <span style={{ fontSize:12, color:'#475569' }}>{f}</span>
                </div>
              ))}
              <a href={plan.href} style={{ display:'block', textAlign:'center', background:plan.featured?'#1565C0':'#F0F6FF', color:plan.featured?'#fff':'#1565C0', border:`1.5px solid ${plan.featured?'transparent':'#BDD5FF'}`, padding:'11px', borderRadius:8, fontSize:13, fontWeight:700, textDecoration:'none', fontFamily:'Outfit,sans-serif', marginTop:16 }}>{plan.cta}</a>
            </div>
          ))}
        </div>
        <div style={{ background:'#0A2540', borderRadius:14, padding:24, marginTop:24, textAlign:'center' }}>
          <div style={{ fontFamily:'Outfit,sans-serif', fontSize:18, fontWeight:800, color:'#fff', marginBottom:8 }}>Enterprise / Fleet Dealers</div>
          <div style={{ fontSize:13, color:'rgba(255,255,255,.55)', marginBottom:16 }}>Managing 50+ vehicles? Get custom pricing, dedicated support, and API access.</div>
          <a href="mailto:hello@carexpertafrica.com" style={{ background:'#4DA6FF', color:'#0A2540', padding:'12px 28px', borderRadius:9, fontWeight:800, fontSize:13, textDecoration:'none', fontFamily:'Outfit,sans-serif', display:'inline-block' }}>Contact Us →</a>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// AUTH PAGE
// ─────────────────────────────────────────────────────────────
export function AuthPage() {
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

  const inp = { width:'100%', padding:'12px 13px', border:'1.5px solid #E2E8F0', borderRadius:8, fontSize:14, fontFamily:'DM Sans,sans-serif', outline:'none', background:'#F8FAFC', boxSizing:'border-box' }
  const lbl = { display:'block', fontSize:11, fontWeight:700, color:'#64748B', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:5 }

  return (
    <div style={{ fontFamily:'DM Sans,sans-serif', background:'#F7F9FC', minHeight:'100vh' }}>
      <style>{MOBILE_CSS}</style>
      <nav style={{ background:'#0A2540', padding:'0 16px', height:56, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <Link to="/" style={{ fontFamily:'Outfit,sans-serif', fontSize:16, fontWeight:800, color:'#fff', textDecoration:'none' }}>CarExpert<span style={{ color:'#4DA6FF' }}>Africa</span>®</Link>
        <span style={{ fontSize:12, color:'rgba(255,255,255,.5)' }}>
          {tab === 'login' ? <span onClick={() => setTab('register')} style={{ color:'#4DA6FF', fontWeight:600, cursor:'pointer' }}>Create account →</span>
            : <span onClick={() => setTab('login')} style={{ color:'#4DA6FF', fontWeight:600, cursor:'pointer' }}>Sign in →</span>}
        </span>
      </nav>
      <div className="auth-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', minHeight:'calc(100vh - 56px)' }}>
        <div className="auth-left" style={{ background:'linear-gradient(160deg,#0A2540,#1565C0)', padding:40, display:'flex', flexDirection:'column', justifyContent:'center' }}>
          <div style={{ color:'#4DA6FF', fontSize:11, fontWeight:700, letterSpacing:'1.8px', textTransform:'uppercase', marginBottom:12 }}>Kenya's #1 Car Platform</div>
          <h1 style={{ fontFamily:'Outfit,sans-serif', fontSize:28, fontWeight:800, color:'#fff', lineHeight:1.15, marginBottom:14 }}>Buy, Sell &<br/><span style={{ color:'#4DA6FF' }}>List Cars</span><br/>With Ease</h1>
          <p style={{ color:'rgba(255,255,255,.55)', fontSize:14, marginBottom:24, lineHeight:1.6 }}>Join thousands of Kenyans buying and selling cars every day.</p>
          {[['✓','Save listings and get alerts'],['★','Reach thousands of active buyers'],['⚡','Instant valuation and market insights']].map(([icon,text]) => (
            <div key={text} style={{ display:'flex', alignItems:'flex-start', gap:10, marginBottom:12 }}>
              <div style={{ width:28, height:28, borderRadius:7, background:'rgba(77,166,255,.15)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:13 }}>{icon}</div>
              <div style={{ fontSize:13, color:'rgba(255,255,255,.7)', lineHeight:1.4 }}>{text}</div>
            </div>
          ))}
        </div>
        <div style={{ background:'#fff', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'32px 24px' }}>
          <div style={{ display:'flex', borderBottom:'2px solid #F0F4F8', marginBottom:24, width:'100%', maxWidth:360 }}>
            {['login','register'].map(t => (
              <div key={t} onClick={() => { setTab(t); setError(''); setSuccess('') }} style={{ flex:1, padding:'10px 0', textAlign:'center', fontFamily:'Outfit,sans-serif', fontSize:13, fontWeight:700, cursor:'pointer', color:tab===t?'#0A2540':'#94A3B8', borderBottom:`2px solid ${tab===t?'#1565C0':'transparent'}`, marginBottom:-2 }}>
                {t === 'login' ? 'Sign In' : 'Create Account'}
              </div>
            ))}
          </div>
          {error && <div style={{ width:'100%', maxWidth:360, background:'#FEE2E2', color:'#DC2626', borderRadius:8, padding:'10px 14px', fontSize:12, fontWeight:600, marginBottom:14 }}>{error}</div>}
          {success && <div style={{ width:'100%', maxWidth:360, background:'#DCFCE7', color:'#16A34A', borderRadius:8, padding:'10px 14px', fontSize:12, fontWeight:600, marginBottom:14 }}>{success}</div>}
          <div style={{ width:'100%', maxWidth:360 }}>
            {tab === 'login' ? (
              <>
                <div style={{ fontFamily:'Outfit,sans-serif', fontSize:20, fontWeight:800, color:'#0A2540', marginBottom:4 }}>Welcome back</div>
                <div style={{ fontSize:12, color:'#94A3B8', marginBottom:20 }}>Sign in to your CarExpert Africa account</div>
                <div style={{ marginBottom:14 }}>
                  <label style={lbl}>Email Address</label>
                  <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" style={inp}/>
                </div>
                <div style={{ marginBottom:8 }}>
                  <label style={lbl}>Password</label>
                  <input type="password" value={pass} onChange={e=>setPass(e.target.value)} placeholder="••••••••" style={inp}/>
                </div>
                <div onClick={async () => {
                  if (!email) { alert('Enter your email first'); return }
                  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: 'https://carexpert-africa.vercel.app/reset-password' })
                  if (error) alert('Error: ' + error.message)
                  else alert('Password reset email sent!')
                }} style={{ textAlign:'right', fontSize:12, color:'#1565C0', fontWeight:600, cursor:'pointer', marginBottom:18 }}>Forgot password?</div>
                <button onClick={handleLogin} disabled={loading} style={{ width:'100%', background:'#1565C0', color:'#fff', border:'none', padding:14, borderRadius:9, fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'Outfit,sans-serif', opacity:loading?0.7:1 }}>
                  {loading ? 'Signing in...' : 'Sign In →'}
                </button>
                <div style={{ textAlign:'center', marginTop:16, fontSize:13, color:'#94A3B8' }}>
                  No account? <span onClick={() => setTab('register')} style={{ color:'#1565C0', fontWeight:600, cursor:'pointer' }}>Create one →</span>
                </div>
              </>
            ) : (
              <>
                <div style={{ fontFamily:'Outfit,sans-serif', fontSize:20, fontWeight:800, color:'#0A2540', marginBottom:4 }}>Create your account</div>
                <div style={{ fontSize:12, color:'#94A3B8', marginBottom:14 }}>What brings you to CarExpert Africa?</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:16 }}>
                  {[['buyer','🚗','Buyer / Seller','Private individual'],['dealer','🏢','Dealer','Business / showroom']].map(([r,icon,label,sub]) => (
                    <div key={r} onClick={() => setRole(r)} style={{ border:`2px solid ${role===r?'#1565C0':'#E2E8F0'}`, borderRadius:10, padding:'12px 8px', textAlign:'center', cursor:'pointer', background:role===r?'#EEF5FF':'#fff' }}>
                      <div style={{ fontSize:22, marginBottom:4 }}>{icon}</div>
                      <div style={{ fontFamily:'Outfit,sans-serif', fontSize:12, fontWeight:700, color:role===r?'#1565C0':'#475569' }}>{label}</div>
                      <div style={{ fontSize:10, color:'#94A3B8' }}>{sub}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:12 }}>
                  <div><label style={lbl}>First Name</label><input value={firstName} onChange={e=>setFirstName(e.target.value)} placeholder="John" style={inp}/></div>
                  <div><label style={lbl}>Last Name</label><input value={lastName} onChange={e=>setLastName(e.target.value)} placeholder="Kamau" style={inp}/></div>
                </div>
                <div style={{ marginBottom:12 }}><label style={lbl}>Email Address</label><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" style={inp}/></div>
                <div style={{ marginBottom:12 }}><label style={lbl}>Password</label><input type="password" value={pass} onChange={e=>setPass(e.target.value)} placeholder="Min. 6 characters" style={inp}/></div>
                <div style={{ marginBottom:12 }}><label style={lbl}>Phone Number</label><input type="tel" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+254 7XX XXX XXX" style={inp}/></div>
                {role === 'dealer' && <div style={{ marginBottom:12 }}><label style={lbl}>Business Name</label><input value={business} onChange={e=>setBusiness(e.target.value)} placeholder="Your dealership name" style={inp}/></div>}
                <button onClick={handleRegister} disabled={loading} style={{ width:'100%', background:'#1565C0', color:'#fff', border:'none', padding:14, borderRadius:9, fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'Outfit,sans-serif', opacity:loading?0.7:1 }}>
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
  'Audi': ['A1','A3','A4','A5','A6','A7','A8','Q2','Q3','Q5','Q7','Q8','RS3','RS4','RS5','RS6','S3','S4','S5','S6','TT'],
  'BAIC': ['BJ20','BJ40','BJ80','D20','D50','X25','X35','X55','X65'],
  'BMW': ['1 Series','2 Series','3 Series','4 Series','5 Series','6 Series','7 Series','8 Series','M2','M3','M4','M5','X1','X2','X3','X4','X5','X6','X7','Z4'],
  'BYD': ['Atto 3','Dolphin','Han','Seal','Song','Tang'],
  'Bentley': ['Bentayga','Continental GT','Flying Spur','Mulsanne'],
  'Changan': ['CS15','CS35','CS55','CS75','CS95','Alsvin','Eado','Uni-K','Uni-T'],
  'Chery': ['Arrizo 5','Arrizo 6','Omoda 5','QQ','Tiggo 4','Tiggo 5X','Tiggo 7','Tiggo 7 Pro','Tiggo 8'],
  'Chrysler': ['300','300C','Pacifica','Sebring','Voyager'],
  'Citroën': ['Berlingo','C3','C4','C5','Dispatch','Jumpy','Picasso','SpaceTourer'],
  'DAF': ['CF','LF','XF'],
  'Daihatsu': ['Boon','Gran Max','Mira','Move','Rocky','Sirion','Terios'],
  'Datsun': ['1200','120Y','1600','Go','Go+','redi-GO'],
  'Dodge': ['Challenger','Charger','Durango','RAM 1500','Viper'],
  'Dongfeng': ['AX4','AX7','DF6','Sokon','T5'],
  'Ferrari': ['488','812 Superfast','California','F8 Tributo','Portofino','Roma'],
  'Fiat': ['500','Bravo','Doblo','Ducato','Freemont','Punto','Scudo','Tipo'],
  'Ford': ['Bronco','EcoSport','Edge','Everest','Explorer','F-150','Focus','Freestar','Fusion','Galaxy','Kuga','Mondeo','Mustang','Puma','Ranger','S-Max','Territory','Transit','Transit Connect'],
  'Foton': ['Auman','BJ','Commander','Gratour','Midi','Sauvana','Tunland','View'],
  'GAC': ['Emkoo','Empow','GS3','GS4','GS5','GS8','M6','M8'],
  'Geely': ['Azkarra','Boyue','Coolray','Emgrand','Okavango','Panda','Proton X50','Tugella'],
  'Haval': ['F7','H1','H2','H4','H5','H6','H9','Jolion','M6'],
  'Hino': ['300 Series','500 Series','700 Series','Dutro','Profia','Ranger'],
  'Honda': ['Accord','Airwave','Amaze','BR-V','CR-V','City','Civic','Element','Fit','Freed','HR-V','Jazz','Legend','Odyssey','Pilot','Ridgeline','Stream','StepWagon','Vezel','WR-V'],
  'Hyundai': ['Accent','Azera','Creta','Elantra','Equus','Genesis','H-1','H100','i10','i20','i30','ix35','Kona','Palisade','Santa Fe','Sonata','Starex','Tucson','Venue'],
  'Infiniti': ['FX35','FX37','G35','G37','Q50','Q60','Q70','QX50','QX56','QX60','QX80'],
  'Isuzu': ['D-Max','ELF','FRR','FTR','FVR','FVZ','MU-X','NKR','NMR','NPR','NQR','NRR','Trooper'],
  'Iveco': ['Daily','Eurocargo','Stralis','Trakker'],
  'JAC': ['J5','J7','S2','S3','S4','S5','T6','T8','X200'],
  'Jaguar': ['E-Pace','F-Pace','F-Type','I-Pace','S-Type','X-Type','XE','XF','XJ'],
  'Jeep': ['Cherokee','Compass','Grand Cherokee','Liberty','Patriot','Renegade','Wrangler'],
  'Kia': ['Carnival','Ceed','Cerato','EV6','Niro','Optima','Picanto','Rio','Seltos','Sorento','Soul','Sportage','Stinger','Telluride'],
  'King Long': ['XMQ','XMQ6'],
  'Land Rover': ['Defender 90','Defender 110','Discovery','Discovery Sport','Freelander','Range Rover','Range Rover Evoque','Range Rover Sport','Range Rover Velar'],
  'Lexus': ['CT200h','ES','GS','GS300','GS350','GX','GX460','IS','IS250','IS300','IS350','LC','LX','LX570','NX','RC','RX','RX330','RX350','UX'],
  'Lincoln': ['Aviator','Continental','MKC','MKX','MKZ','Navigator'],
  'MAN': ['TGA','TGE','TGL','TGM','TGS','TGX'],
  'MG': ['3','5','6','GS','HS','RX5','ZS','ZS EV'],
  'Mahindra': ['Bolero','KUV100','Marazzo','Scorpio','TUV300','Thar','XUV300','XUV500','XUV700'],
  'Maserati': ['Ghibli','GranTurismo','Levante','Quattroporte'],
  'Maxus': ['D60','D90','G10','T60','T90','V80','V90'],
  'Mazda': ['2','3','5','6','Atenza','Axela','BT-50','CX-3','CX-30','CX-5','CX-7','CX-8','CX-9','Demio','MPV','MX-5','Premacy','Tribute'],
  'Mercedes-Benz': ['A-Class','AMG GT','B-Class','C-Class','CLA','CLS','E-Class','G-Class','GLA','GLB','GLC','GLE','GLS','ML','S-Class','SLK','Sprinter','V-Class','Viano','Vito'],
  'Mitsubishi': ['Attrage','Colt','Eclipse Cross','Galant','L200','L300','Lancer','Montero','Outlander','Pajero','Pajero Mini','Pajero Sport','RVR','Space Wagon','Triton'],
  'Nissan': ['Almera','Armada','Caravan','Elgrand','Frontier','GT-R','Juke','Kicks','Leaf','March','Micra','Murano','Navara','Note','Patrol','Pathfinder','Pickup','Qashqai','Serena','Sylphy','Teana','Tiida','Urvan','X-Trail','350Z','370Z'],
  'Opel': ['Astra','Corsa','Insignia','Mokka','Movano','Vivaro','Zafira'],
  'Peugeot': ['2008','208','3008','308','4008','408','5008','508','Boxer','Expert','Partner'],
  'Porsche': ['718','911','Cayenne','Macan','Panamera','Taycan'],
  'Proton': ['Exora','Iriz','Persona','Preve','Saga','X50','X70'],
  'Renault': ['Captur','Clio','Duster','Kadjar','Koleos','Megane','Sandero','Scenic','Symbol','Trafic'],
  'Rolls-Royce': ['Cullinan','Dawn','Ghost','Phantom','Silver Shadow','Wraith'],
  'Saab': ['9-3','9-5'],
  'Scania': ['G Series','P Series','R Series','S Series'],
  'SsangYong': ['Actyon','Korando','Musso','Rexton','Tivoli','XLV'],
  'Subaru': ['Ascent','BRZ','Crosstrek','Forester','Impreza','Legacy','Levorg','Outback','Tribeca','WRX','XV'],
  'Suzuki': ['Alto','Baleno','Carry','Celerio','Dzire','Ertiga','Escudo','Grand Vitara','Ignis','Jimny','Kizashi','S-Cross','SX4','Swift','Vitara','Wagon R'],
  'Tata': ['Ace','Harrier','Nexon','Safari','Xenon','Yodha'],
  'Toyota': ['4Runner','Allion','Alphard','Auris','Avalon','Avanza','Avensis','Axio','Aygo','Camry','CH-R','Corolla','Crown','FJ Cruiser','Fielder','Fortuner','Harrier','Hiace','Hilux','Hilux Surf','Ipsum','Land Cruiser 70 Series','Land Cruiser 80 Series','Land Cruiser 100 Series','Land Cruiser 200','Land Cruiser 300','Land Cruiser Prado 90','Land Cruiser Prado 120','Land Cruiser Prado 150','Mark X','Noah','Premio','Probox','RAV4','Rush','Sequoia','Sienna','Spacio','Succeed','Supra','Tundra','Vanguard','Vellfire','Vitz','Voxy','Wish','Yaris'],
  'Volkswagen': ['Amarok','Arteon','Caddy','Caravelle','Golf','Jetta','Multivan','Passat','Phaeton','Polo','Sharan','T-Cross','T-Roc','Tiguan','Touareg','Touran','Transporter','Up'],
  'Volvo': ['C30','C40','S60','S90','V40','V60','V90','XC40','XC60','XC90'],
  'Yutong': ['E10','E12','TC9','ZK6'],
  'Other': ['Other'],
}
const LC_MAKES = Object.keys(CAR_DATA).sort()

const VARIANTS = {
  // Toyota
  'Land Cruiser 300': ['GX','GXR','VX','VX.R','ZX','Sahara','Sahara ZX','Black Edition','Gazoo Racing GR Sport'],
  'Land Cruiser 200': ['GX','GXR','VX','VXR','VX Limited','ZX','Sahara','Heritage Edition'],
  'Land Cruiser Prado 150': ['GX','GXR','TX','TX-L','VX','VXL','TZ-G','Active','Kakadu'],
  'Land Cruiser Prado 120': ['GX','GXL','VX','VXL','Grande'],
  'Land Cruiser Prado 90': ['GX','VX','RV'],
  'Land Cruiser 100 Series': ['GX','VX','VX Limited','Sahara','Amazon'],
  'Land Cruiser 80 Series': ['GX','VX','GXL','VXL','Sahara'],
  'Land Cruiser 70 Series': ['Single Cab','Double Cab','Troop Carrier','VDJ76','VDJ78','VDJ79'],
  'Hilux': ['Single Cab 4x2','Single Cab 4x4','Extra Cab 4x2','Extra Cab 4x4','Double Cab 4x2','Double Cab 4x4','GD-6','Raider','Revo','Legend 50','Legend RS'],
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
  'Fielder': ['Standard','G','S','Z','WXB'],
  'Allion': ['A15','A18','A20'],
  'Premio': ['F EX Package','G EX Package','X EX Package'],
  'Rush': ['G','S','Sport'],
  'Prado 90': ['GX','VX'],
  'Vanguard': ['Standard','S Premium'],

  // Nissan
  'Patrol': ['DX','SGL','LE','SE','Titanium','Safari','Y61','Y62'],
  'X-Trail': ['LE','ST','ST-L','Ti','Ti-L'],
  'Navara': ['D40','D23','NP300','LE','SE','Calibre','King Cab','Double Cab'],
  'Elgrand': ['Standard','Rider','Highway Star','VIP','E51','E52'],

  // Mercedes-Benz
  'C-Class': ['C180','C200','C220d','C250','C300','C350','AMG C43','AMG C63'],
  'E-Class': ['E200','E220','E250','E300','E350','E400','AMG E43','AMG E63','E220d'],
  'S-Class': ['S300','S320','S350','S400','S450','S500','S600','AMG S63','Maybach S580'],
  'GLE': ['GLE 300d','GLE 350','GLE 400','GLE 450','AMG GLE 53','AMG GLE 63','Coupe'],
  'GLC': ['GLC 200','GLC 220d','GLC 250','GLC 300','AMG GLC 43','Coupe'],
  'GLS': ['GLS 350d','GLS 400','GLS 450','AMG GLS 63'],
  'ML': ['ML 250','ML 320','ML 350','ML 400','AMG ML 63'],
  'G-Class': ['G 350d','G 500','G 550','AMG G 63'],
  'Sprinter': ['211 CDI','213 CDI','315 CDI','319 CDI','316 CDI'],
  'Vito': ['109 CDI','111 CDI','113 CDI','114 CDI','116 CDI'],

  // BMW
  'X5': ['xDrive 25d','xDrive 30d','xDrive 40i','M50i','xDrive 45e','M Competition'],
  'X3': ['xDrive 20i','xDrive 20d','xDrive 30i','xDrive 30d','M40i','M Competition'],
  'X6': ['xDrive 30d','xDrive 40i','M50i','M Competition'],
  '3 Series': ['316i','318i','320i','320d','325i','328i','330i','335i','M3'],
  '5 Series': ['518d','520i','520d','523i','525d','528i','530i','535i','M5'],
  'X1': ['sDrive 18i','xDrive 20i','xDrive 25i'],
  'X7': ['xDrive 30d','xDrive 40i','M50i'],

  // Land Rover
  'Range Rover': ['Vogue','Vogue SE','Autobiography','SVAutobiography','Sport','Sport HSE','Sport HST','Evoque','Velar'],
  'Range Rover Sport': ['SE','HSE','HSE Dynamic','Autobiography Dynamic','SVR','P400e'],
  'Range Rover Evoque': ['S','SE','HSE','R-Dynamic SE','First Edition'],
  'Discovery': ['S','SE','HSE','HSE Luxury','First Edition','HSE Si6','Metropolitan Edition'],
  'Defender 110': ['S','SE','HSE','X','X-Dynamic SE','Trophy Edition','Heritage'],
  'Defender 90': ['S','SE','HSE','X','X-Dynamic SE','Trophy Edition'],

  // Volkswagen
  'Golf': ['Trendline','Comfortline','Highline','R-Line','GTI','Golf R','e-Golf'],
  'Tiguan': ['Trendline','Comfortline','Highline','R-Line','Allspace'],
  'Amarok': ['Trendline','Comfortline','Highline','V6 TDI','Aventura'],
  'Touareg': ['SE','Elegance','R-Line','Atmosphere'],

  // Ford
  'Ranger': ['XL','XLS','XLT','Sport','Wildtrak','Raptor','Limited','FX4','Tremor'],
  'Everest': ['Ambiente','Trend','Sport','Titanium','Titanium Plus','Platinum'],
  'Explorer': ['Base','XLT','Limited','ST','Platinum','King Ranch'],

  // Mitsubishi
  'Pajero': ['GLX','GLS','Exceed','Dakar','Final Edition','4M41','V6','Short Body','Long Body'],
  'Outlander': ['GLX','GLS','Exceed','GT','PHEV'],
  'L200': ['GL','GLX','GLS','Triton','Double Cab','Single Cab'],
  'Montero': ['GLS','Sport','Limited'],

  // Subaru
  'Forester': ['2.0i','2.5i','XT','X20','Premium','Sport','Touring'],
  'Outback': ['2.5i','3.6R','Premium','Limited','Touring','XT'],
  'Impreza': ['Base','Premium','Sport','Limited'],
  'WRX': ['Base','Premium','Limited','STI','STI S209'],

  // Honda
  'CR-V': ['LX','EX','EX-L','Touring','Sport'],
  'Pilot': ['LX','EX','EX-L','Touring','Elite','Black Edition'],
  'HR-V': ['LX','EX','EX-L','Sport','Touring'],

  // Lexus
  'LX': ['LX 450d','LX 570','LX 600 Luxury','LX 600 Ultra Luxury'],
  'GX': ['GX 400','GX 460','Luxury','Premium'],
  'RX': ['RX 200t','RX 300','RX 330','RX 350','RX 450h','F Sport','NX 200t'],
  'IS': ['IS 200','IS 250','IS 300','IS 350','F Sport'],
  'GS': ['GS 250','GS 300','GS 350','GS 450h','F Sport'],

  // Haval
  'H6': ['Classic','Premium','Supreme','Ultra','HEV'],
  'H9': ['Ultra','Supreme'],
  'Jolion': ['Comfort','Premium','Lux','HEV'],
  'F7': ['Comfort','Premium','Luxury','Sport'],

  // Chery
  'Tiggo 7 Pro': ['Comfort','Premium','Luxury'],
  'Tiggo 8': ['Comfort','Premium','Luxury','Sport','Pro'],

  // Audi
  'Q7': ['35 TDI','45 TFSI','55 TFSI','S7','SQ7'],
  'Q5': ['35 TDI','40 TDI','40 TFSI','45 TFSI','SQ5'],
  'A4': ['35 TDI','40 TDI','40 TFSI','45 TFSI','S4','RS4'],
  'A6': ['40 TDI','45 TDI','45 TFSI','55 TFSI','S6','RS6'],

  // Porsche
  'Cayenne': ['Base','S','GTS','Turbo','Turbo S','E-Hybrid','Coupe'],
  'Macan': ['Base','S','GTS','Turbo'],
  '911': ['Carrera','Carrera S','Carrera 4','Carrera 4S','Turbo','Turbo S','GT3'],

  // Hyundai
  'Santa Fe': ['GL','GLS','Executive','XL','Highlander','Calligraphy'],
  'Tucson': ['GL','GLS','Executive','Highlander','N Line'],
  'Starex': ['GL','GLS','Executive','Limousine','Urban'],
  'H-1': ['GL','GLS','Executive'],

  // Kia
  'Sorento': ['LX','EX','SX','SX Prestige','Hybrid EX'],
  'Sportage': ['LX','EX','SX','GT Line','Hybrid'],

  // Isuzu
  'D-Max': ['Base','LS','V-Cross','X-Series','4x2','4x4','Single Cab','Spacecab','Double Cab'],
  'MU-X': ['LS-U','LS-T','X Series','Ultimate'],

  // Commercial
  'Hino 300 Series': ['714','916','921'],
  'Hino 500 Series': ['1322','1527','1726','2626'],
}

const FEATURES_LIST = ['Sunroof','Leather Seats','Reverse Camera','Navigation','Cruise Control','Alloy Wheels','Push Start','Heated Seats','360 Camera','Parking Sensors','Apple CarPlay','Tow Bar','Roof Rack','Bull Bar','Window Tint']

export function ListCarPage({ user }) {
  const [step, setStep] = useState(1)
  const [make, setMake] = useState('Toyota')
  const [model, setModel] = useState('')
  const [variant, setVariant] = useState('')
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
  const [contactName, setContactName] = useState('')
  const [phone, setPhone] = useState('')
  const [location, setLocation] = useState('Nairobi — Westlands')
  const [description, setDescription] = useState('')

  const toggleFeat = f => setSelFeats(prev => { const n=new Set(prev); n.has(f)?n.delete(f):n.add(f); return n })

  const handleSubmit = async () => {
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    if (!currentUser) { alert('Please log in first'); return }
    const { error } = await supabase.from('listings').insert({
      user_id: currentUser.id, make, model, variant: variant || null, year, mileage: km,
      engine_cc: engineCc, body_type: bodyType, fuel_type: fuel,
      transmission, drive_type: drive, colour, condition, price,
      negotiable: nego, status: 'pending', contact_name: contactName,
      phone, location, description
    })
    if (error) alert('Error: ' + error.message)
    else setStep(5)
  }

  const inp = { width:'100%', padding:'12px', border:'1.5px solid #E2E8F0', borderRadius:8, fontSize:14, fontFamily:'DM Sans,sans-serif', outline:'none', background:'#F8FAFC', boxSizing:'border-box' }
  const lbl = { display:'block', fontSize:10, fontWeight:700, color:'#64748B', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:5 }
  const stepCircle = (n) => ({
    width:30, height:30, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center',
    fontFamily:'Outfit,sans-serif', fontSize:12, fontWeight:700, border:'2px solid', flexShrink:0,
    ...(n < step ? { background:'#1565C0', borderColor:'#1565C0', color:'#fff' } :
        n === step ? { background:'#0A2540', borderColor:'#0A2540', color:'#fff' } :
                    { background:'#fff', borderColor:'#E2E8F0', color:'#94A3B8' })
  })

  const STEPS = ['Vehicle Info','Photos','Price & Details','Review']

  return (
    <div style={{ fontFamily:'DM Sans,sans-serif', background:'#F7F9FC', minHeight:'100vh' }}>
      <style>{MOBILE_CSS}</style>
      <nav style={{ background:'#0A2540', padding:'0 16px', height:56, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <Link to="/" style={{ fontFamily:'Outfit,sans-serif', fontSize:16, fontWeight:800, color:'#fff', textDecoration:'none' }}>CarExpert<span style={{ color:'#4DA6FF' }}>Africa</span>®</Link>
        <div style={{ fontSize:12, color:'rgba(255,255,255,.5)', fontFamily:'Outfit,sans-serif', fontWeight:600 }}>Step {step} of 4</div>
      </nav>

      {/* Step indicator */}
      <div style={{ background:'linear-gradient(135deg,#0A2540,#0D3B6E)', padding:'20px 16px' }}>
        <div style={{ color:'#4DA6FF', fontSize:10, fontWeight:700, letterSpacing:'1.8px', textTransform:'uppercase', marginBottom:12 }}>Sell Your Car</div>
        <div className="listcar-steps" style={{ display:'flex', alignItems:'center', gap:0 }}>
          {STEPS.map((label, i) => (
            <div key={label} style={{ display:'flex', alignItems:'center' }}>
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3, cursor:'pointer' }} onClick={() => i+1 < step && setStep(i+1)}>
                <div style={stepCircle(i+1)}>{i+1 < step ? '✓' : i+1}</div>
                <div className="listcar-steps-label" style={{ fontSize:9, fontWeight:600, color: i+1===step?'rgba(255,255,255,.8)':'rgba(255,255,255,.35)', textTransform:'uppercase', letterSpacing:'.5px', whiteSpace:'nowrap' }}>{label}</div>
              </div>
              {i < 3 && <div style={{ width:24, height:2, background: i+1<step?'#4DA6FF':'rgba(255,255,255,.15)', margin:'0 4px 14px' }}/>}
            </div>
          ))}
        </div>
      </div>

      <div className="listcar-grid" style={{ display:'grid', gridTemplateColumns:'1fr 260px', gap:16, padding:'16px', maxWidth:1100, margin:'0 auto' }}>
        <div>
          {step === 1 && (
            <div style={{ background:'#fff', border:'1.5px solid #E8EDF3', borderRadius:14, padding:18 }}>
              <div style={{ fontFamily:'Outfit,sans-serif', fontSize:15, fontWeight:700, color:'#0A2540', marginBottom:16, display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ width:3, height:15, background:'#1565C0', borderRadius:2, display:'inline-block' }}/> Vehicle Information
              </div>
              <div className="listcar-form-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div><label style={lbl}>Make</label><select value={make} onChange={e => { setMake(e.target.value); setModel(''); setVariant('') }} style={inp}>{LC_MAKES.map(m => <option key={m}>{m}</option>)}</select></div>
                <div><label style={lbl}>Model</label><select value={model} onChange={e => { setModel(e.target.value); setVariant('') }} style={inp}><option value="">Select model...</option>{(CAR_DATA[make] || []).map(m => <option key={m}>{m}</option>)}</select></div>
                {model && VARIANTS[model] && (
                  <div style={{ gridColumn:'1/-1' }}>
                    <label style={lbl}>Variant / Trim <span style={{ color:'#94A3B8', fontWeight:400, textTransform:'none', letterSpacing:0 }}>(optional)</span></label>
                    <select value={variant} onChange={e => setVariant(e.target.value)} style={inp}>
                      <option value="">Select variant...</option>
                      {VARIANTS[model].map(v => <option key={v}>{v}</option>)}
                    </select>
                  </div>
                )}
                <div><label style={lbl}>Year</label><select value={year} onChange={e => setYear(e.target.value)} style={inp}>{Array.from({length:20},(_,i)=>`${2025-i}`).map(y => <option key={y}>{y}</option>)}</select></div>
                <div><label style={lbl}>Mileage (km)</label><input type="number" value={km} onChange={e => setKm(e.target.value)} placeholder="e.g. 62000" style={inp}/></div>
                <div><label style={lbl}>Engine (cc)</label><input type="number" value={engineCc} onChange={e => setEngineCc(e.target.value)} placeholder="e.g. 2000" style={inp}/></div>
                <div><label style={lbl}>Body Type</label><select value={bodyType} onChange={e => setBodyType(e.target.value)} style={inp}>{['SUV','Sedan','Hatchback','Pickup','Minivan','Coupe','Wagon','Bus','Truck'].map(o => <option key={o}>{o}</option>)}</select></div>
                <div><label style={lbl}>Fuel Type</label><select value={fuel} onChange={e => setFuel(e.target.value)} style={inp}>{['Petrol','Diesel','Hybrid','Electric','LPG'].map(o => <option key={o}>{o}</option>)}</select></div>
                <div><label style={lbl}>Transmission</label><select value={transmission} onChange={e => setTx(e.target.value)} style={inp}>{['Automatic','Manual','CVT','Semi-Automatic'].map(o => <option key={o}>{o}</option>)}</select></div>
                <div><label style={lbl}>Drive Type</label><select value={drive} onChange={e => setDrive(e.target.value)} style={inp}>{['AWD','4WD','FWD','RWD','4x4'].map(o => <option key={o}>{o}</option>)}</select></div>
                <div><label style={lbl}>Colour</label><select value={colour} onChange={e => setColour(e.target.value)} style={inp}><option value="">Select colour...</option>{['Pearl White','White','Black','Silver','Grey','Blue','Red','Brown','Beige','Gold','Green','Orange','Maroon','Navy Blue','Champagne'].map(o => <option key={o}>{o}</option>)}</select></div>
                <div style={{ gridColumn:'1/-1' }}><label style={lbl}>Condition</label><select value={condition} onChange={e => setCondition(e.target.value)} style={inp}>{['Used — Excellent','Used — Good','Used — Fair','New','Foreign Used — Excellent','Foreign Used — Good'].map(o => <option key={o}>{o}</option>)}</select></div>
              </div>
              <div style={{ display:'flex', justifyContent:'flex-end', marginTop:16 }}>
                <button onClick={() => setStep(2)} style={{ background:'#1565C0', color:'#fff', border:'none', padding:'12px 24px', borderRadius:8, fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'Outfit,sans-serif' }}>Next: Add Photos →</button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div style={{ background:'#fff', border:'1.5px solid #E8EDF3', borderRadius:14, padding:18 }}>
              <div style={{ fontFamily:'Outfit,sans-serif', fontSize:15, fontWeight:700, color:'#0A2540', marginBottom:16, display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ width:3, height:15, background:'#1565C0', borderRadius:2, display:'inline-block' }}/> Upload Photos
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:8, marginBottom:12 }}>
                {photos.map((filled, i) => (
                  <div key={i} onClick={() => setPhotos(prev => prev.map((p,idx) => idx===i?true:p))}
                    style={{ aspectRatio:'4/3', border:`2px dashed ${filled?'#1565C0':'#E2E8F0'}`, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', background:filled?'#EEF5FF':'#F8FAFC', fontSize:filled?22:18, color:filled?'#1565C0':'#CBD5E1' }}>
                    {filled ? '📷' : '+'}
                  </div>
                ))}
              </div>
              <div style={{ background:'#FEF3C7', border:'1px solid #FCD34D', borderRadius:8, padding:'10px 12px', fontSize:12, color:'#92400E', marginBottom:16 }}>
                💡 Tap photos to mark as uploaded. Real upload coming soon — send photos via WhatsApp after listing.
              </div>
              <div style={{ marginBottom:14 }}>
                <label style={lbl}>Description</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe your car — service history, condition, features, reason for selling..." rows={4} style={{ ...inp, resize:'vertical' }}/>
              </div>
              <div style={{ marginBottom:16 }}>
                <label style={lbl}>Features</label>
                <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                  {FEATURES_LIST.map(f => (
                    <div key={f} onClick={() => toggleFeat(f)} style={{ padding:'6px 12px', border:`1.5px solid ${selFeats.has(f)?'#1565C0':'#E2E8F0'}`, borderRadius:100, fontSize:12, cursor:'pointer', background:selFeats.has(f)?'#EEF5FF':'#fff', color:selFeats.has(f)?'#1565C0':'#475569', fontWeight:selFeats.has(f)?700:400 }}>{f}</div>
                  ))}
                </div>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between' }}>
                <button onClick={() => setStep(1)} style={{ background:'#fff', color:'#475569', border:'1.5px solid #E2E8F0', padding:'11px 20px', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'Outfit,sans-serif' }}>← Back</button>
                <button onClick={() => setStep(3)} style={{ background:'#1565C0', color:'#fff', border:'none', padding:'11px 24px', borderRadius:8, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'Outfit,sans-serif' }}>Next: Price & Details →</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div style={{ background:'#fff', border:'1.5px solid #E8EDF3', borderRadius:14, padding:18 }}>
              <div style={{ fontFamily:'Outfit,sans-serif', fontSize:15, fontWeight:700, color:'#0A2540', marginBottom:16, display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ width:3, height:15, background:'#1565C0', borderRadius:2, display:'inline-block' }}/> Price & Contact Details
              </div>
              <div style={{ marginBottom:12 }}>
                <label style={lbl}>Asking Price (KSH)</label>
                <input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="e.g. 3500000" style={inp}/>
              </div>
              <div onClick={() => setNego(!nego)} style={{ display:'flex', alignItems:'center', gap:10, padding:'12px', border:`1.5px solid ${nego?'#1565C0':'#E2E8F0'}`, borderRadius:8, cursor:'pointer', marginBottom:16, background:nego?'#EEF5FF':'#fff' }}>
                <div style={{ width:20, height:20, borderRadius:4, border:`2px solid ${nego?'#1565C0':'#CBD5E1'}`, background:nego?'#1565C0':'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, color:'#fff', flexShrink:0 }}>{nego?'✓':''}</div>
                <span style={{ fontSize:13, color:nego?'#1565C0':'#475569', fontWeight:nego?600:400 }}>Price is negotiable</span>
              </div>
              <div className="listcar-form-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
                <div><label style={lbl}>Your Name</label><input value={contactName} onChange={e => setContactName(e.target.value)} placeholder="John Kamau" style={inp}/></div>
                <div><label style={lbl}>Phone / WhatsApp</label><input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+254 7XX XXX XXX" style={inp}/></div>
              </div>
              <div style={{ marginBottom:16 }}>
                <label style={lbl}>Location</label>
                <select value={location} onChange={e => setLocation(e.target.value)} style={inp}>
                  {['Nairobi — Westlands','Nairobi — CBD','Nairobi — Karen','Nairobi — Langata','Nairobi — Eastlands','Mombasa','Kisumu','Nakuru','Eldoret','Thika','Meru','Nyeri'].map(l=><option key={l}>{l}</option>)}
                </select>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between' }}>
                <button onClick={() => setStep(2)} style={{ background:'#fff', color:'#475569', border:'1.5px solid #E2E8F0', padding:'11px 20px', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'Outfit,sans-serif' }}>← Back</button>
                <button onClick={() => setStep(4)} style={{ background:'#1565C0', color:'#fff', border:'none', padding:'11px 24px', borderRadius:8, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'Outfit,sans-serif' }}>Next: Review →</button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <div style={{ background:'#fff', border:'1.5px solid #E8EDF3', borderRadius:14, padding:18, marginBottom:12 }}>
                <div style={{ fontFamily:'Outfit,sans-serif', fontSize:15, fontWeight:700, color:'#0A2540', marginBottom:14, display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ width:3, height:15, background:'#1565C0', borderRadius:2, display:'inline-block' }}/> Review Your Listing
                </div>
                <div style={{ background:'#EEF5FF', border:'1px solid #BDD5FF', borderRadius:8, padding:12, marginBottom:14, fontSize:13, color:'#1565C0', fontWeight:600 }}>
                  ✓ Review the details below before submitting.
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, fontSize:13 }}>
                  <div><span style={{ color:'#94A3B8', fontSize:11 }}>Make / Model</span><br/><strong>{make} {model||'—'}{variant ? ` — ${variant}` : ''}</strong></div>
                  <div><span style={{ color:'#94A3B8', fontSize:11 }}>Asking Price</span><br/><strong style={{ color:'#1565C0' }}>{price ? fmt(price) : '—'}</strong></div>
                  <div><span style={{ color:'#94A3B8', fontSize:11 }}>Year</span><br/><strong>{year}</strong></div>
                  <div><span style={{ color:'#94A3B8', fontSize:11 }}>Mileage</span><br/><strong>{km ? `${Number(km).toLocaleString()} km` : '—'}</strong></div>
                </div>
              </div>
              <div style={{ background:'#F0FDF4', border:'1.5px solid #86EFAC', borderRadius:14, padding:18, marginBottom:12 }}>
                <div style={{ fontFamily:'Outfit,sans-serif', fontSize:14, fontWeight:700, color:'#16A34A', marginBottom:6 }}>🎉 Free Listing Active</div>
                <div style={{ fontSize:13, color:'#475569', lineHeight:1.6 }}>Your listing will be reviewed and go live within <strong>1–2 hours</strong>.</div>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between' }}>
                <button onClick={() => setStep(3)} style={{ background:'#fff', color:'#475569', border:'1.5px solid #E2E8F0', padding:'11px 20px', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'Outfit,sans-serif' }}>← Back</button>
                <button onClick={handleSubmit} style={{ background:'#16A34A', color:'#fff', border:'none', padding:'11px 24px', borderRadius:8, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'Outfit,sans-serif' }}>Submit Listing ✓</button>
              </div>
            </div>
          )}

          {step === 5 && (
            <div style={{ background:'#fff', border:'1.5px solid #E8EDF3', borderRadius:14, padding:48, textAlign:'center' }}>
              <div style={{ fontSize:48, marginBottom:16 }}>🎉</div>
              <div style={{ fontFamily:'Outfit,sans-serif', fontSize:22, fontWeight:800, color:'#0A2540', marginBottom:8 }}>Listing Submitted!</div>
              <div style={{ fontSize:14, color:'#64748B', marginBottom:24, lineHeight:1.6 }}>Your listing is under review and will go live within 1–2 hours.</div>
              <Link to="/listings" style={{ background:'#1565C0', color:'#fff', padding:'12px 28px', borderRadius:9, fontWeight:700, fontSize:14, textDecoration:'none', fontFamily:'Outfit,sans-serif' }}>Browse All Listings →</Link>
            </div>
          )}
        </div>

        {/* Preview sidebar - hidden on mobile */}
        <div className="listcar-sidebar">
          <div style={{ fontSize:11, fontWeight:700, color:'#94A3B8', textTransform:'uppercase', letterSpacing:'.6px', marginBottom:10, fontFamily:'Outfit,sans-serif' }}>Live Preview</div>
          <div style={{ background:'#fff', border:'1.5px solid #E8EDF3', borderRadius:14, overflow:'hidden' }}>
            <div style={{ height:130, background:'#C8DCF0', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, color:'#94A3B8' }}>
              {photos.some(Boolean) ? '📸 Photos added' : 'Add photos to preview'}
            </div>
            <div style={{ padding:14 }}>
              <div style={{ fontFamily:'Outfit,sans-serif', fontSize:17, fontWeight:800, color:'#0A2540', marginBottom:2 }}>{price ? fmt(price) : 'KSH —'}</div>
              <div style={{ fontSize:12, fontWeight:600, color:'#64748B', marginBottom:8 }}>{year} {make} {model || 'Your Model'}{variant ? ` — ${variant}` : ''}</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
                {[year, km ? `${Number(km).toLocaleString()} km` : 'Mileage', transmission, bodyType].map((s,i) => (
                  <span key={i} style={{ fontSize:10, color:'#94A3B8', padding:'2px 6px', background:'#F8FAFC', borderRadius:100, border:'1px solid #E8EDF3' }}>{s}</span>
                ))}
              </div>
            </div>
          </div>
          <div style={{ background:'#EEF5FF', border:'1px solid #BDD5FF', borderRadius:12, padding:14, marginTop:12 }}>
            <div style={{ fontFamily:'Outfit,sans-serif', fontSize:12, fontWeight:700, color:'#1565C0', marginBottom:8 }}>Tips for a great listing</div>
            {[['📸','Add at least 8 high-quality photos'],['💰','Check similar listings to price competitively'],['✍️','Write a detailed description'],['📍','Include your exact location']].map(([icon,tip]) => (
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
    supabase.from('saved_searches').select('*').eq('user_id', user.id)
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
    <div style={{ textAlign:'center', padding:40, background:'#fff', borderRadius:12, border:'1.5px solid #E8EDF3' }}>
      <div style={{ fontSize:32, marginBottom:12 }}>🔖</div>
      <div style={{ fontFamily:'Outfit,sans-serif', fontSize:15, fontWeight:700, color:'#0A2540', marginBottom:6 }}>No saved searches yet</div>
      <div style={{ fontSize:13, color:'#94A3B8', marginBottom:16 }}>Use the Save Search button on the listings page.</div>
      <Link to="/listings" style={{ background:'#1565C0', color:'#fff', padding:'10px 24px', borderRadius:8, fontSize:13, fontWeight:700, textDecoration:'none', fontFamily:'Outfit,sans-serif' }}>Browse Listings</Link>
    </div>
  )

  return searches.map(s => (
    <div key={s.id} style={{ background:'#fff', border:'1.5px solid #E8EDF3', borderRadius:12, padding:14, marginBottom:10 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8, flexWrap:'wrap' }}>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontFamily:'Outfit,sans-serif', fontSize:14, fontWeight:700, color:'#0A2540', marginBottom:6 }}>🔖 {s.name}</div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:4, marginBottom:4 }}>
            {s.filters.make && <span style={{ fontSize:10, color:'#1565C0', padding:'2px 8px', background:'#EEF5FF', borderRadius:100, border:'1px solid #BDD5FF' }}>{s.filters.make}</span>}
            {s.filters.model && <span style={{ fontSize:10, color:'#1565C0', padding:'2px 8px', background:'#EEF5FF', borderRadius:100, border:'1px solid #BDD5FF' }}>{s.filters.model}</span>}
            {s.filters.maxPrice < 30000000 && <span style={{ fontSize:10, color:'#1565C0', padding:'2px 8px', background:'#EEF5FF', borderRadius:100, border:'1px solid #BDD5FF' }}>Up to KSH {(s.filters.maxPrice/1e6).toFixed(1)}M</span>}
          </div>
          <div style={{ fontSize:10, color:'#94A3B8' }}>Saved {new Date(s.created_at).toLocaleDateString('en-GB')}</div>
        </div>
        <div style={{ display:'flex', gap:8, flexShrink:0 }}>
          <button onClick={() => runSearch(s.filters)} style={{ background:'#1565C0', color:'#fff', border:'none', padding:'8px 14px', borderRadius:7, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'Outfit,sans-serif' }}>Run →</button>
          <button onClick={async () => { await supabase.from('saved_searches').delete().eq('id', s.id); setSearches(prev => prev.filter(x => x.id !== s.id)) }}
            style={{ background:'#FEE2E2', color:'#DC2626', border:'none', padding:'8px 10px', borderRadius:7, fontSize:12, cursor:'pointer' }}>✕</button>
        </div>
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
    supabase.from('listings').select('*, listing_photos(*)').eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => { setMyListings(data || []); setLoadingListings(false) })
    supabase.from('saved_listings').select('*, listings(*, listing_photos(*))').eq('user_id', user.id)
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
      <style>{MOBILE_CSS}</style>
      <Navbar user={user} />

      {/* Mobile tab bar */}
      <div className="dashboard-mobile-tabs" style={{ display:'none', overflowX:'auto', background:'#fff', borderBottom:'1px solid #E8EDF3', padding:'0 4px' }}>
        {NAV_ITEMS.map(item => (
          <button key={item.id} onClick={() => setTab(item.id)}
            style={{ flexShrink:0, padding:'12px 12px', border:'none', background:'none', fontSize:11, fontWeight:tab===item.id?700:500, color:tab===item.id?'#1565C0':'#64748B', cursor:'pointer', borderBottom:`2px solid ${tab===item.id?'#1565C0':'transparent'}`, fontFamily:'DM Sans,sans-serif', display:'flex', flexDirection:'column', alignItems:'center', gap:2 }}>
            <span style={{ fontSize:16 }}>{item.icon}</span>
            {item.label.split(' ')[0]}
            {item.badge > 0 && <span style={{ background:'#1565C0', color:'#fff', borderRadius:100, padding:'1px 5px', fontSize:8, fontWeight:700 }}>{item.badge}</span>}
          </button>
        ))}
      </div>

      <div className="dashboard-layout" style={{ display:'grid', gridTemplateColumns:'200px 1fr', minHeight:'calc(100vh - 56px)' }}>
        {/* Desktop sidebar */}
        <aside className="dashboard-sidebar" style={{ background:'#fff', borderRight:'1px solid #E8EDF3', padding:'20px 0' }}>
          <div style={{ padding:'0 16px 16px', borderBottom:'1px solid #F0F4F8', marginBottom:8, textAlign:'center' }}>
            <div style={{ width:48, height:48, borderRadius:'50%', background:'#1565C0', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Outfit,sans-serif', fontSize:16, fontWeight:700, color:'#fff', margin:'0 auto 8px' }}>
              {(user?.user_metadata?.full_name || user?.email || 'U')[0].toUpperCase()}
            </div>
            <div style={{ fontFamily:'Outfit,sans-serif', fontSize:12, fontWeight:700, color:'#0A2540' }}>{user?.user_metadata?.full_name || user?.email}</div>
            <div style={{ background:'#EEF5FF', color:'#1565C0', border:'1px solid #BDD5FF', borderRadius:100, padding:'2px 10px', fontSize:9, fontWeight:700, display:'inline-block', marginTop:4, fontFamily:'Outfit,sans-serif' }}>Free Plan</div>
          </div>
          {NAV_ITEMS.map(item => (
            <div key={item.id} onClick={() => setTab(item.id)} style={{ display:'flex', alignItems:'center', gap:9, padding:'9px 16px', fontSize:13, fontWeight:tab===item.id?600:500, color:tab===item.id?'#1565C0':'#64748B', cursor:'pointer', background:tab===item.id?'#EEF5FF':'transparent', borderLeft:`3px solid ${tab===item.id?'#1565C0':'transparent'}` }}>
              <span style={{ fontSize:14 }}>{item.icon}</span>
              {item.label}
              {item.badge > 0 && <span style={{ background:'#1565C0', color:'#fff', borderRadius:100, padding:'1px 6px', fontSize:9, fontWeight:700, marginLeft:'auto', fontFamily:'Outfit,sans-serif' }}>{item.badge}</span>}
            </div>
          ))}
          <div style={{ margin:'8px 12px 0' }}>
            <button onClick={() => navigate('/pricing')} style={{ width:'100%', background:'#1565C0', color:'#fff', border:'none', padding:9, borderRadius:8, fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:'Outfit,sans-serif' }}>⚡ Upgrade to Pro →</button>
            <button onClick={async () => { await supabase.auth.signOut(); window.location.href = '/' }}
              style={{ width:'100%', background:'#FEE2E2', color:'#DC2626', border:'1px solid #FECACA', padding:9, borderRadius:8, fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:'Outfit,sans-serif', marginTop:8 }}>Log Out</button>
          </div>
        </aside>

        <main style={{ padding:16 }}>
          {tab === 'overview' && (
            <div>
              <div style={{ fontFamily:'Outfit,sans-serif', fontSize:17, fontWeight:800, color:'#0A2540', marginBottom:14 }}>
                Welcome back, {user?.user_metadata?.full_name?.split(' ')[0] || 'there'} 👋
              </div>
              <div className="dashboard-stats" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:16 }}>
                {[['👁',totalViews,'Total Views','#EEF5FF'],['🚗',myListings.length,'My Listings','#DCFCE7'],['✓',approvedListings.length,'Live Now','#EEF5FF'],['❤️',savedCars.length,'Saved Cars','#FEF3C7']].map(([icon,n,l,bg]) => (
                  <div key={l} style={{ background:'#fff', border:'1.5px solid #E8EDF3', borderRadius:12, padding:12 }}>
                    <div style={{ width:30, height:30, borderRadius:7, background:bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, marginBottom:8 }}>{icon}</div>
                    <div style={{ fontFamily:'Outfit,sans-serif', fontSize:20, fontWeight:800, color:'#0A2540', marginBottom:2 }}>{n}</div>
                    <div style={{ fontSize:10, color:'#94A3B8' }}>{l}</div>
                  </div>
                ))}
              </div>
              <div className="dashboard-quick" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div style={{ background:'#fff', border:'1.5px solid #E8EDF3', borderRadius:12, padding:14 }}>
                  <div style={{ fontFamily:'Outfit,sans-serif', fontSize:13, fontWeight:700, color:'#0A2540', marginBottom:10 }}>Recent Listings</div>
                  {loadingListings ? <div style={{ color:'#94A3B8', fontSize:12 }}>Loading...</div>
                  : myListings.length === 0 ? (
                    <div style={{ textAlign:'center', padding:16 }}>
                      <div style={{ fontSize:11, color:'#94A3B8', marginBottom:10 }}>No listings yet.</div>
                      <Link to="/list-car" style={{ background:'#1565C0', color:'#fff', padding:'8px 16px', borderRadius:7, fontSize:12, fontWeight:700, textDecoration:'none', fontFamily:'Outfit,sans-serif' }}>+ List a Car</Link>
                    </div>
                  ) : myListings.slice(0,3).map(l => (
                    <div key={l.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'7px 0', borderBottom:'1px solid #F5F7FA', fontSize:12 }}>
                      <div>
                        <div style={{ fontWeight:600, color:'#0A2540', fontSize:12 }}>{l.year} {l.make} {l.model}</div>
                        <div style={{ color:'#94A3B8', fontSize:11 }}>KSH {Number(l.price).toLocaleString()}</div>
                      </div>
                      <span style={{ fontSize:9, fontWeight:700, padding:'3px 8px', borderRadius:100, background:l.status==='approved'?'#DCFCE7':l.status==='pending'?'#FEF3C7':'#FEE2E2', color:l.status==='approved'?'#16A34A':l.status==='pending'?'#D97706':'#EF4444', fontFamily:'Outfit,sans-serif' }}>{l.status}</span>
                    </div>
                  ))}
                </div>
                <div style={{ background:'#fff', border:'1.5px solid #E8EDF3', borderRadius:12, padding:14 }}>
                  <div style={{ fontFamily:'Outfit,sans-serif', fontSize:13, fontWeight:700, color:'#0A2540', marginBottom:10 }}>Quick Actions</div>
                  {[['#1565C0','#fff','+ List a New Car','/list-car'],['#F0F6FF','#1565C0','Browse Listings','/listings'],['#F8FAFC','#475569','Get Valuation','/valuation'],['#F8FAFC','#475569','View Pricing','/pricing']].map(([bg,color,label,href]) => (
                    <Link key={label} to={href} style={{ display:'block', background:bg, color, border:`1.5px solid ${bg==='#1565C0'?'transparent':'#E2E8F0'}`, padding:10, borderRadius:8, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'Outfit,sans-serif', textAlign:'left', textDecoration:'none', marginBottom:7 }}>{label}</Link>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === 'listings' && (
            <div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14, flexWrap:'wrap', gap:8 }}>
                <div style={{ fontFamily:'Outfit,sans-serif', fontSize:16, fontWeight:800, color:'#0A2540' }}>My Listings</div>
                <Link to="/list-car" style={{ background:'#1565C0', color:'#fff', border:'none', padding:'9px 16px', borderRadius:7, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'Outfit,sans-serif', textDecoration:'none' }}>+ Add Listing</Link>
              </div>
              {loadingListings ? <div style={{ textAlign:'center', padding:40, color:'#94A3B8' }}>Loading...</div>
              : myListings.length === 0 ? (
                <div style={{ textAlign:'center', padding:48, background:'#fff', borderRadius:12, border:'1.5px solid #E8EDF3' }}>
                  <div style={{ fontSize:32, marginBottom:12 }}>🚗</div>
                  <div style={{ fontFamily:'Outfit,sans-serif', fontSize:15, fontWeight:700, color:'#0A2540', marginBottom:6 }}>No listings yet</div>
                  <Link to="/list-car" style={{ background:'#1565C0', color:'#fff', padding:'10px 24px', borderRadius:8, fontSize:13, fontWeight:700, textDecoration:'none', fontFamily:'Outfit,sans-serif' }}>+ List a Car</Link>
                </div>
              ) : myListings.map(l => (
                <div key={l.id} style={{ background:'#fff', border:'1.5px solid #E8EDF3', borderRadius:12, padding:14, marginBottom:10, display:'grid', gridTemplateColumns:'72px 1fr auto', gap:12, alignItems:'center' }}>
                  <div style={{ width:72, height:52, borderRadius:7, background:'#EEF5FF', overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    {l.listing_photos?.[0]?.url ? <img src={l.listing_photos[0].url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/> : <span style={{ fontSize:10, color:'#94A3B8' }}>No photo</span>}
                  </div>
                  <div>
                    <div style={{ fontFamily:'Outfit,sans-serif', fontSize:13, fontWeight:700, color:'#0A2540', marginBottom:2 }}>{l.year} {l.make} {l.model}</div>
                    <div style={{ fontSize:11, color:'#94A3B8' }}>KSH {Number(l.price).toLocaleString()} · {Number(l.mileage).toLocaleString()} km · {l.fuel_type}</div>
                    <div style={{ fontSize:11, color:'#64748B', marginTop:2 }}>{l.views || 0} views</div>
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', gap:6, alignItems:'flex-end' }}>
                    <span style={{ fontSize:9, fontWeight:700, padding:'3px 8px', borderRadius:100, background:l.status==='approved'?'#DCFCE7':l.status==='pending'?'#FEF3C7':'#FEE2E2', color:l.status==='approved'?'#16A34A':l.status==='pending'?'#D97706':'#EF4444', fontFamily:'Outfit,sans-serif' }}>
                      {l.status==='approved'?'● Live':l.status==='pending'?'● Pending':'● Declined'}
                    </span>
                    <Link to={`/edit-listing/${l.id}`} style={{ background:'#F0F6FF', color:'#1565C0', border:'1.5px solid #BDD5FF', padding:'5px 10px', borderRadius:6, fontSize:11, fontWeight:700, fontFamily:'Outfit,sans-serif', textDecoration:'none' }}>Edit</Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'saved' && (
            <div>
              <div style={{ fontFamily:'Outfit,sans-serif', fontSize:16, fontWeight:800, color:'#0A2540', marginBottom:14 }}>Saved Cars <span style={{ color:'#94A3B8', fontWeight:400, fontSize:13 }}>({savedCars.length})</span></div>
              {loadingSaved ? <div style={{ textAlign:'center', padding:40, color:'#94A3B8' }}>Loading...</div>
              : savedCars.length === 0 ? (
                <div style={{ textAlign:'center', padding:48, background:'#fff', borderRadius:12, border:'1.5px solid #E8EDF3' }}>
                  <div style={{ fontSize:32, marginBottom:12 }}>❤️</div>
                  <div style={{ fontFamily:'Outfit,sans-serif', fontSize:15, fontWeight:700, color:'#0A2540', marginBottom:6 }}>No saved cars yet</div>
                  <Link to="/listings" style={{ background:'#1565C0', color:'#fff', padding:'10px 24px', borderRadius:8, fontSize:13, fontWeight:700, textDecoration:'none', fontFamily:'Outfit,sans-serif' }}>Browse Cars</Link>
                </div>
              ) : (
                <div className="dashboard-saved-grid" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
                  {savedCars.map(c => (
                    <div key={c.id} style={{ background:'#fff', border:'1.5px solid #E8EDF3', borderRadius:10, overflow:'hidden' }}>
                      <div style={{ height:110, background:'#EEF5FF', overflow:'hidden' }}>
                        {c.listing_photos?.[0]?.url ? <img src={c.listing_photos[0].url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/> : <div style={{ height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24 }}>🚗</div>}
                      </div>
                      <div style={{ padding:'10px 10px 0' }}>
                        <div style={{ fontFamily:'Outfit,sans-serif', fontSize:13, fontWeight:800, color:'#0A2540' }}>KSH {Number(c.price).toLocaleString()}</div>
                        <div style={{ fontSize:11, color:'#64748B', marginTop:1 }}>{c.year} {c.make} {c.model}</div>
                      </div>
                      <Link to={`/listings/${c.id}`} style={{ display:'block', background:'#F0F6FF', color:'#1565C0', border:'none', borderTop:'1px solid #E8EDF3', padding:8, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'Outfit,sans-serif', marginTop:8, textAlign:'center', textDecoration:'none' }}>View →</Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'searches' && (
            <div>
              <div style={{ fontFamily:'Outfit,sans-serif', fontSize:16, fontWeight:800, color:'#0A2540', marginBottom:14 }}>Saved Searches</div>
              <SavedSearchesList user={user} />
            </div>
          )}

          {tab === 'leads' && (
            <div style={{ textAlign:'center', padding:48, background:'#fff', borderRadius:12, border:'1.5px solid #E8EDF3' }}>
              <div style={{ fontSize:32, marginBottom:12 }}>💬</div>
              <div style={{ fontFamily:'Outfit,sans-serif', fontSize:15, fontWeight:700, color:'#0A2540', marginBottom:6 }}>Leads coming soon</div>
              <div style={{ fontSize:13, color:'#94A3B8' }}>Buyer enquiries via WhatsApp will appear here.</div>
            </div>
          )}

          {tab === 'alerts' && (
            <div style={{ textAlign:'center', padding:48, background:'#fff', borderRadius:12, border:'1.5px solid #E8EDF3' }}>
              <div style={{ fontSize:32, marginBottom:12 }}>🔔</div>
              <div style={{ fontFamily:'Outfit,sans-serif', fontSize:15, fontWeight:700, color:'#0A2540', marginBottom:6 }}>Alerts coming soon</div>
              <div style={{ fontSize:13, color:'#94A3B8' }}>Get notified on price drops, sold listings, and new matches for your saved searches.</div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// NEWS PAGE
// ─────────────────────────────────────────────────────────────
export function NewsReviewsPage({ user }) {
  const ARTICLES = [
    { title:'Top 5 Family Cars Under KSH 3M in Kenya 2025', category:'Buying Guide', date:'May 2025', read:'5 min', emoji:'🚗' },
    { title:'Toyota Land Cruiser 300: Is It Worth the Price?', category:'Review', date:'Apr 2025', read:'7 min', emoji:'⭐' },
    { title:'How to Spot a Flood-Damaged Car at Import Auctions', category:'Tips', date:'Apr 2025', read:'4 min', emoji:'🔍' },
    { title:'Electric Cars in Kenya: What You Need to Know', category:'Market Insight', date:'Mar 2025', read:'6 min', emoji:'⚡' },
    { title:'Negotiating Car Prices in Kenya: Expert Tips', category:'Tips', date:'Mar 2025', read:'3 min', emoji:'💡' },
    { title:'2025 Kenya Car Market Report: Prices & Trends', category:'Market Insight', date:'Feb 2025', read:'8 min', emoji:'📊' },
  ]
  return (
    <div style={{ fontFamily:'DM Sans,sans-serif', background:'#F7F9FC', minHeight:'100vh' }}>
      <style>{MOBILE_CSS}</style>
      <Navbar user={user} />
      <div style={{ background:'linear-gradient(135deg,#0A2540,#1565C0)', padding:'36px 16px', textAlign:'center' }}>
        <h1 style={{ fontFamily:'Outfit,sans-serif', fontSize:26, fontWeight:800, color:'#fff', marginBottom:8 }}>News & Reviews</h1>
        <p style={{ color:'rgba(255,255,255,.55)', fontSize:14 }}>Kenya car market insights, buying guides, and expert reviews</p>
      </div>
      <div style={{ maxWidth:900, margin:'0 auto', padding:16 }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:14, marginTop:8 }}>
          {ARTICLES.map(a => (
            <div key={a.title} style={{ background:'#fff', border:'1.5px solid #E8EDF3', borderRadius:12, overflow:'hidden', cursor:'pointer' }}
              onMouseOver={e => { e.currentTarget.style.borderColor='#1565C0'; e.currentTarget.style.transform='translateY(-2px)' }}
              onMouseOut={e => { e.currentTarget.style.borderColor='#E8EDF3'; e.currentTarget.style.transform='none' }}>
              <div style={{ height:100, background:'linear-gradient(135deg,#EEF5FF,#DBEAFE)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:40 }}>{a.emoji}</div>
              <div style={{ padding:14 }}>
                <div style={{ display:'flex', gap:6, marginBottom:8 }}>
                  <span style={{ background:'#EEF5FF', color:'#1565C0', border:'1px solid #BDD5FF', borderRadius:100, padding:'2px 8px', fontSize:10, fontWeight:700 }}>{a.category}</span>
                </div>
                <div style={{ fontFamily:'Outfit,sans-serif', fontSize:14, fontWeight:700, color:'#0A2540', marginBottom:8, lineHeight:1.4 }}>{a.title}</div>
                <div style={{ fontSize:11, color:'#94A3B8' }}>{a.date} · {a.read} read</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ textAlign:'center', padding:40, color:'#94A3B8' }}>
          <div style={{ fontSize:13 }}>More articles coming soon. <Link to="/list-car" style={{ color:'#1565C0', fontWeight:600, textDecoration:'none' }}>List your car →</Link></div>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// DEALER PROFILE PAGE
// ─────────────────────────────────────────────────────────────
const DEALER_LISTINGS = [
  { id:1, make:'Toyota', model:'Prado 150', year:2019, price:6200000, km:62200, fuel:'Petrol', badge:'Featured' },
  { id:2, make:'Toyota', model:'RAV4 LE', year:2018, price:4650000, km:96000, fuel:'Petrol', badge:null },
  { id:3, make:'Toyota', model:'Harrier 2.0', year:2017, price:3800000, km:74000, fuel:'Petrol', badge:null },
  { id:4, make:'Toyota', model:'Hilux D/Cab', year:2020, price:5400000, km:48000, fuel:'Diesel', badge:'New' },
  { id:5, make:'Toyota', model:'Vanguard', year:2016, price:2900000, km:112000, fuel:'Petrol', badge:null },
  { id:6, make:'Toyota', model:'Fortuner 2.7', year:2019, price:5800000, km:55000, fuel:'Petrol', badge:'Hot' },
]

export function DealerProfilePage({ user }) {
  return (
    <div style={{ fontFamily:'DM Sans,sans-serif', background:'#F7F9FC', minHeight:'100vh' }}>
      <style>{MOBILE_CSS}</style>
      <Navbar user={user} />
      <div style={{ background:'linear-gradient(135deg,#0A2540,#1565C0)', padding:'16px' }}>
        <div style={{ background:'#fff', borderRadius:14, padding:16, maxWidth:1200, margin:'0 auto' }}>
          <div style={{ display:'flex', alignItems:'center', gap:14, flexWrap:'wrap' }}>
            <div style={{ width:56, height:56, borderRadius:12, background:'#0A2540', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Outfit,sans-serif', fontSize:18, fontWeight:800, color:'#fff', flexShrink:0 }}>NK</div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontFamily:'Outfit,sans-serif', fontSize:18, fontWeight:800, color:'#0A2540', marginBottom:6 }}>Nairobi Kars Ltd</div>
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                {[['Verified Dealer','green'],['4.8 / 5','blue'],['Westlands, Nairobi','blue'],['Since 2023','blue']].map(([label,color]) => (
                  <span key={label} style={{ background:color==='green'?'#DCFCE7':'#EEF5FF', color:color==='green'?'#16A34A':'#1565C0', border:`1px solid ${color==='green'?'#86EFAC':'#BDD5FF'}`, borderRadius:100, padding:'2px 8px', fontSize:11, fontWeight:700, fontFamily:'Outfit,sans-serif' }}>{label}</span>
                ))}
              </div>
            </div>
            <a href="https://wa.me/" target="_blank" rel="noopener noreferrer" style={{ background:'#25D366', color:'#fff', border:'none', padding:'9px 16px', borderRadius:8, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'Outfit,sans-serif', textDecoration:'none' }}>WhatsApp</a>
          </div>
        </div>
      </div>
      <div className="dealer-stats" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, padding:'14px 16px', maxWidth:1200, margin:'0 auto' }}>
        {[['31','Active Listings'],['4.8','Avg. Rating'],['124','Reviews'],['2 yrs','On Platform']].map(([n,l]) => (
          <div key={l} style={{ background:'#fff', border:'1.5px solid #E8EDF3', borderRadius:12, padding:12, textAlign:'center' }}>
            <div style={{ fontFamily:'Outfit,sans-serif', fontSize:20, fontWeight:800, color:'#0A2540' }}>{n}</div>
            <div style={{ fontSize:11, color:'#94A3B8', marginTop:2 }}>{l}</div>
          </div>
        ))}
      </div>
      <div className="dealer-layout" style={{ display:'grid', gridTemplateColumns:'1fr 260px', gap:14, padding:'0 16px 24px', maxWidth:1200, margin:'0 auto' }}>
        <div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
            <div style={{ fontFamily:'Outfit,sans-serif', fontSize:15, fontWeight:700, color:'#0A2540' }}>Dealer Inventory <span style={{ color:'#94A3B8', fontWeight:400, fontSize:13 }}>(31 cars)</span></div>
          </div>
          <div className="dealer-cars" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
            {DEALER_LISTINGS.map(c => (
              <div key={c.id} style={{ background:'#fff', border:'1.5px solid #E8EDF3', borderRadius:12, overflow:'hidden', cursor:'pointer' }}>
                <div style={{ height:100, background:'#EEF5FF', display:'flex', alignItems:'center', justifyContent:'center', position:'relative' }}>
                  {c.badge && <span style={{ position:'absolute', top:7, left:7, background:'#1565C0', color:'#fff', fontSize:9, fontWeight:700, padding:'2px 7px', borderRadius:100, textTransform:'uppercase', fontFamily:'Outfit,sans-serif' }}>{c.badge}</span>}
                  <span style={{ fontSize:32 }}>🚗</span>
                </div>
                <div style={{ padding:10 }}>
                  <div style={{ fontFamily:'Outfit,sans-serif', fontSize:13, fontWeight:800, color:'#0A2540', marginBottom:1 }}>{fmt(c.price)}</div>
                  <div style={{ fontSize:11, fontWeight:600, color:'#64748B', marginBottom:5 }}>{c.year} {c.make} {c.model}</div>
                  <div style={{ display:'flex', gap:3, flexWrap:'wrap' }}>
                    {[`${c.km.toLocaleString()}km`, c.fuel].map((s,i)=><span key={i} style={{ fontSize:9, color:'#94A3B8', padding:'2px 5px', background:'#F8FAFC', borderRadius:100, border:'1px solid #E8EDF3' }}>{s}</span>)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <div style={{ background:'#fff', border:'1.5px solid #E8EDF3', borderRadius:12, padding:14 }}>
            <div style={{ fontFamily:'Outfit,sans-serif', fontSize:13, fontWeight:700, color:'#0A2540', marginBottom:10 }}>Contact</div>
            {[['📍','Westlands Road, Nairobi'],['📞','+254 700 000 000'],['✉️','info@nairobikars.co.ke']].map(([icon,text]) => (
              <div key={text} style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 0', borderBottom:'1px solid #F5F7FA', fontSize:12, color:'#475569' }}><span>{icon}</span>{text}</div>
            ))}
          </div>
          <div style={{ background:'#fff', border:'1.5px solid #E8EDF3', borderRadius:12, padding:14 }}>
            <div style={{ fontFamily:'Outfit,sans-serif', fontSize:13, fontWeight:700, color:'#0A2540', marginBottom:10 }}>Opening Hours</div>
            {[['Mon – Fri','8am – 6pm'],['Saturday','8am – 5pm'],['Sunday','10am – 3pm']].map(([day,hrs]) => (
              <div key={day} style={{ display:'flex', justifyContent:'space-between', padding:'5px 0', borderBottom:'1px solid #F5F7FA', fontSize:12 }}><span style={{ color:'#64748B' }}>{day}</span><span style={{ fontWeight:600 }}>{hrs}</span></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
