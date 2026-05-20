import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { signUp, signIn } from '../lib/supabase'

const fmt = (n) => 'KSH ' + Number(n).toLocaleString()

// ─────────────────────────────────────────────────────────────
// CAR DETAIL PAGE
// ─────────────────────────────────────────────────────────────
const SAMPLE_CAR = { id:1, make:'Toyota', model:'Land Cruiser Prado 150', year:2019, price:6200000, km:62200, fuel:'Petrol', tx:'Automatic', body:'SUV', cc:2700, drive:'4WD', colour:'Pearl White', condition:'Used — Excellent', location:'Westlands, Nairobi', phone:'+254712345678', dealer:'Nairobi Kars Ltd', desc:'Well maintained Prado with full service history. Sunroof, leather interior, reverse camera, cruise control, and factory navigation. All systems fully functional. Price negotiable for serious buyers.', features:['Sunroof','Leather Seats','Reverse Camera','Navigation','Cruise Control','Alloy Wheels','Push Start','4WD','Parking Sensors','Apple CarPlay'], bg:'#C8DCF0', fg:'#0D3B6E' }

export function CarDetailPage({ user }) {
  const [deposit, setDeposit] = useState(1240000)
  const [term, setTerm] = useState(48)
  const [rate, setRate] = useState(14)
  const [saved, setSaved] = useState(false)
  const c = SAMPLE_CAR

  const monthly = () => {
    const principal = c.price - deposit
    const r = rate / 100 / 12
    if (r === 0) return Math.round(principal / term)
    return Math.round(principal * r * Math.pow(1+r,term) / (Math.pow(1+r,term)-1))
  }

  const waLink = `https://wa.me/${c.phone.replace(/\D/g,'')}?text=Hi, I saw your ${c.year} ${c.make} ${c.model} on CarExpert Africa. Is it still available?`

  return (
    <div style={{ fontFamily:'DM Sans,sans-serif', background:'#F7F9FC', minHeight:'100vh' }}>
      <Navbar user={user} />
      <div style={{ background:'#fff', borderBottom:'1px solid #E8EDF3', padding:'10px 24px', fontSize:12, color:'#94A3B8' }}>
        <Link to="/" style={{ color:'#1565C0', textDecoration:'none' }}>Home</Link> / <Link to="/listings" style={{ color:'#1565C0', textDecoration:'none' }}>Listings</Link> / {c.year} {c.make} {c.model}
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 300px', gap:20, padding:'20px 24px', maxWidth:1200, margin:'0 auto' }}>
        <div>
          <div style={{ borderRadius:14, overflow:'hidden', background:c.bg, height:320, display:'flex', alignItems:'center', justifyContent:'center', position:'relative', marginBottom:10 }}>
            <span style={{ position:'absolute', top:12, left:12, background:'#1565C0', color:'#fff', fontSize:10, fontWeight:700, padding:'3px 10px', borderRadius:100, textTransform:'uppercase', fontFamily:'Outfit,sans-serif' }}>Featured</span>
            <span style={{ position:'absolute', bottom:12, right:12, background:'rgba(0,0,0,.5)', color:'#fff', fontSize:11, padding:'4px 10px', borderRadius:100 }}>1 / 12 photos</span>
            <svg width="220" height="120" viewBox="0 0 220 120" fill="none">
              <rect x="20" y="42" width="180" height="52" rx="10" fill={c.fg} opacity=".18"/>
              <path d="M40 42 L62 10 H158 L180 42" fill={c.fg} opacity=".14"/>
              <circle cx="55" cy="96" r="18" fill={c.fg} opacity=".28"/>
              <circle cx="165" cy="96" r="18" fill={c.fg} opacity=".28"/>
              <circle cx="55" cy="96" r="7" fill={c.fg} opacity=".5"/>
              <circle cx="165" cy="96" r="7" fill={c.fg} opacity=".5"/>
            </svg>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:8, marginBottom:16 }}>
            {[c.bg,'#B8D0E8','#D0E4F4','#C0D8EC','#BCD0E8'].map((bg,i) => (
              <div key={i} style={{ height:60, borderRadius:8, background:bg, border:`2px solid ${i===0?'#1565C0':'transparent'}`, cursor:'pointer' }}/>
            ))}
          </div>
          <div style={{ background:'#fff', border:'1.5px solid #E8EDF3', borderRadius:14, padding:20, marginBottom:14 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
              <div>
                <div style={{ fontFamily:'Outfit,sans-serif', fontSize:22, fontWeight:800, color:'#0A2540', marginBottom:4 }}>{c.year} {c.make} {c.model}</div>
                <div style={{ fontSize:12, color:'#94A3B8', display:'flex', gap:10 }}>
                  <span>Listed 2 days ago</span><span>·</span><span>{c.location}</span><span>·</span><span style={{ color:'#1565C0', fontWeight:600 }}>342 views</span>
                </div>
              </div>
              <button onClick={() => setSaved(!saved)} style={{ background:'none', border:'1.5px solid #E2E8F0', borderRadius:8, padding:'8px 14px', fontSize:12, fontWeight:600, color: saved?'#1565C0':'#475569', cursor:'pointer', borderColor: saved?'#1565C0':'#E2E8F0' }}>
                {saved ? '♥ Saved' : '♡ Save'}
              </button>
            </div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:7 }}>
              {c.features.map(f => (
                <span key={f} style={{ background:'#EEF4FF', color:'#1565C0', border:'1px solid #BDD5FF', borderRadius:100, padding:'4px 12px', fontSize:11, fontWeight:600 }}>{f}</span>
              ))}
            </div>
          </div>
          <div style={{ background:'#fff', border:'1.5px solid #E8EDF3', borderRadius:14, padding:20, marginBottom:14 }}>
            <div style={{ fontFamily:'Outfit,sans-serif', fontSize:15, fontWeight:700, color:'#0A2540', marginBottom:16, display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ width:3, height:15, background:'#1565C0', borderRadius:2, display:'inline-block' }}></span> Vehicle Specifications
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:0 }}>
              {[['Make',c.make],['Model',c.model],['Year',c.year],['Mileage',`${c.km.toLocaleString()} km`],['Condition',c.condition],['Body Type',c.body],['Engine',`${c.cc} cc`],['Fuel Type',c.fuel],['Transmission',c.tx],['Drive Type',c.drive]].map(([k,v],i) => (
                <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'9px 12px', borderBottom:'1px solid #F0F4F8', borderRight: i%2===0?'1px solid #F0F4F8':'none' }}>
                  <span style={{ fontSize:12, color:'#94A3B8', fontWeight:500 }}>{k}</span>
                  <span style={{ fontSize:12, fontWeight:700, color:'#1a2332', fontFamily:'Outfit,sans-serif' }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ background:'#fff', border:'1.5px solid #E8EDF3', borderRadius:14, padding:20 }}>
            <div style={{ fontFamily:'Outfit,sans-serif', fontSize:15, fontWeight:700, color:'#0A2540', marginBottom:12, display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ width:3, height:15, background:'#1565C0', borderRadius:2, display:'inline-block' }}></span> Seller Description
            </div>
            <p style={{ fontSize:13, color:'#475569', lineHeight:1.7 }}>{c.desc}</p>
          </div>
        </div>
        <div>
          <div style={{ background:'#0A2540', borderRadius:14, padding:20, marginBottom:14, color:'#fff' }}>
            <div style={{ fontSize:11, color:'rgba(255,255,255,.5)', fontWeight:700, textTransform:'uppercase', letterSpacing:'.8px', marginBottom:4 }}>Asking Price</div>
            <div style={{ fontFamily:'Outfit,sans-serif', fontSize:30, fontWeight:800, marginBottom:4 }}>{fmt(c.price)}</div>
            <div style={{ fontSize:12, color:'#4DA6FF', fontWeight:600, cursor:'pointer', marginBottom:16 }}>Price negotiable · Make an offer</div>
            <a href={waLink} target="_blank" rel="noopener noreferrer" style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, width:'100%', background:'#25D366', color:'#fff', border:'none', padding:12, borderRadius:9, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'Outfit,sans-serif', textDecoration:'none', marginBottom:8 }}>
              📱 Contact via WhatsApp
            </a>
            <button style={{ width:'100%', background:'rgba(255,255,255,.1)', color:'#fff', border:'1.5px solid rgba(255,255,255,.2)', padding:10, borderRadius:9, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'Outfit,sans-serif', marginBottom:8 }}>📞 Call Seller</button>
            <button style={{ width:'100%', background:'transparent', color:'#4DA6FF', border:'1.5px solid rgba(77,166,255,.3)', padding:10, borderRadius:9, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'Outfit,sans-serif' }}>🚗 Request Test Drive</button>
            <div style={{ height:1, background:'rgba(255,255,255,.1)', margin:'14px 0' }}/>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:36, height:36, borderRadius:'50%', background:'#1565C0', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:13, fontFamily:'Outfit,sans-serif' }}>NK</div>
              <div><div style={{ fontSize:13, fontWeight:700 }}>{c.dealer}</div><div style={{ fontSize:11, color:'rgba(255,255,255,.5)' }}>Verified Dealer · {c.location}</div></div>
            </div>
          </div>
          <div style={{ background:'#fff', border:'1.5px solid #E8EDF3', borderRadius:14, padding:18 }}>
            <div style={{ fontFamily:'Outfit,sans-serif', fontSize:14, fontWeight:700, color:'#0A2540', marginBottom:14, display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ width:3, height:14, background:'#1565C0', borderRadius:2, display:'inline-block' }}></span> Finance Calculator
            </div>
            {[
              { label:'Deposit', value:deposit, setValue:setDeposit, min:0, max:c.price*0.8, step:50000, display:fmt(deposit) },
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
              <div style={{ fontFamily:'Outfit,sans-serif', fontSize:22, fontWeight:800, color:'#1565C0' }}>{fmt(monthly())}</div>
              <div style={{ fontSize:10, color:'#94A3B8', marginTop:2 }}>Based on {fmt(c.price - deposit)} financed</div>
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
                <div style={{ textAlign:'right', fontSize:11, color:'#1565C0', fontWeight:600, cursor:'pointer', marginTop:-8, marginBottom:14 }}>Forgot password?</div>
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
                <button onClick={() => setStep(5)} style={{ background:'#16A34A', color:'#fff', border:'none', padding:'10px 24px', borderRadius:8, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'Outfit,sans-serif' }}>Submit Listing ✓</button>
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
const MY_LISTINGS = [
  { id:1, name:'2019 Toyota Land Cruiser Prado 150', price:6200000, km:62200, fuel:'Petrol', tx:'Automatic', status:'approved', views:342, saves:27, leads:8, bg:'#C8DCF0', fg:'#0D3B6E' },
  { id:2, name:'2018 Toyota RAV4 LE', price:3900000, km:88000, fuel:'Petrol', tx:'Automatic', status:'pending', views:118, saves:9, leads:4, bg:'#E0D0F0', fg:'#4A235A' },
]
const SAVED_CARS = [
  { id:1, make:'BMW', model:'X5 3.0d', year:2017, price:6800000, bg:'#C8E0F0' },
  { id:2, make:'