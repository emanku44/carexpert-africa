import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import { signUp, signIn, supabase } from '../lib/supabase'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import useSEO from './useSEO'
const fmt = (n) => 'KSH ' + Number(n).toLocaleString()

const MOBILE_CSS = `
  @media (max-width: 768px) {
    .detail-grid { grid-template-columns: 1fr !important; }
    .detail-sidebar { order: -1; }
    .detail-price-bar { position: fixed; bottom: 0; left: 0; right: 0; z-index: 50; border-radius: 0 !important; margin: 0 !important; }
    .detail-main-pad { padding-bottom: 160px !important; }
    .detail-finance-desktop { display: none !important; }
    .detail-finance-mobile { display: block !important; }
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
// NTSA PLATE CHECK
// ─────────────────────────────────────────────────────────────
function NTSACheck() {
  const [plate, setPlate] = useState('')
  const [result, setResult] = useState(null)

  const formatPlate = (raw) => {
    // Kenya plate formats: KAA 000A, KBZ 123X, GOVT 001 etc
    const clean = raw.toUpperCase().replace(/[^A-Z0-9]/g, '')
    if (clean.length <= 3) return clean
    if (clean.length <= 6) return clean.slice(0,3) + ' ' + clean.slice(3)
    return clean.slice(0,3) + ' ' + clean.slice(3,6) + clean.slice(6)
  }

  const check = () => {
    const clean = plate.replace(/\s/g, '').toUpperCase()
    // Validate Kenya plate format
    const isPrivate = /^K[A-Z]{2}\d{3}[A-Z]$/.test(clean)
    const isGovt = /^GK\d{3}[A-Z]$/.test(clean) || /^GOVT\d+$/.test(clean)
    const isPersonalized = /^[A-Z]{4,8}$/.test(clean)
    const isDiplomatic = /^CD\d+$/.test(clean)

    if (!clean || clean.length < 6) { setResult({ error: 'Please enter a valid plate number' }); return }

    setResult({
      plate: formatPlate(clean),
      type: isGovt ? 'Government Vehicle' : isDiplomatic ? 'Diplomatic' : isPersonalized ? 'Personalized' : isPrivate ? 'Private Vehicle' : 'Commercial/Other',
      region: clean.startsWith('KA') ? 'Nairobi' : clean.startsWith('KB') ? 'Central' : clean.startsWith('KC') ? 'Coast' : clean.startsWith('KD') ? 'Nyanza' : clean.startsWith('KE') ? 'Rift Valley' : clean.startsWith('KF') ? 'Eastern' : clean.startsWith('KG') ? 'North Eastern' : clean.startsWith('KH') ? 'Western' : 'Kenya',
      valid: isPrivate || isGovt || isPersonalized || isDiplomatic,
      note: 'For full NTSA vehicle history including ownership and fines, visit ntsa.go.ke or use the NTSA portal with the official plate number.'
    })
  }

  return (
    <div style={{ background:'#fff', border:'1.5px solid #E8EDF3', borderRadius:12, padding:16, marginBottom:12 }}>
      <div style={{ fontFamily:'Outfit,sans-serif', fontSize:14, fontWeight:700, color:'#0A2540', marginBottom:12, display:'flex', alignItems:'center', gap:8 }}>
        <span style={{ width:3, height:14, background:'#1565C0', borderRadius:2, display:'inline-block' }}/> 🔍 NTSA Plate Check
      </div>
      <div style={{ fontSize:12, color:'#64748B', marginBottom:12 }}>Verify the vehicle registration plate before buying</div>
      <div style={{ display:'flex', gap:8 }}>
        <input value={plate} onChange={e => setPlate(formatPlate(e.target.value))} placeholder="e.g. KDG 123A" maxLength={10}
          style={{ flex:1, padding:'10px 12px', border:'1.5px solid #E2E8F0', borderRadius:8, fontSize:14, fontFamily:'DM Sans,sans-serif', outline:'none', textTransform:'uppercase', letterSpacing:2, fontWeight:700 }}
          onKeyDown={e => e.key === 'Enter' && check()}/>
        <button onClick={check} style={{ background:'#1565C0', color:'#fff', border:'none', padding:'10px 20px', borderRadius:8, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'Outfit,sans-serif' }}>Check</button>
      </div>
      {result && (
        <div style={{ marginTop:12, background: result.error ? '#FEE2E2' : result.valid ? '#F0FDF4' : '#FFFBEB', borderRadius:8, padding:'12px 14px', border:`1px solid ${result.error ? '#FECACA' : result.valid ? '#86EFAC' : '#FCD34D'}` }}>
          {result.error ? (
            <div style={{ fontSize:13, color:'#DC2626' }}>{result.error}</div>
          ) : (
            <>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                <div style={{ fontFamily:'Outfit,sans-serif', fontSize:18, fontWeight:900, color:'#0A2540', letterSpacing:3 }}>{result.plate}</div>
                <span style={{ fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:100, background: result.valid ? '#DCFCE7' : '#FEE2E2', color: result.valid ? '#16A34A' : '#DC2626' }}>
                  {result.valid ? '✓ Valid Format' : '⚠ Unusual Format'}
                </span>
              </div>
              <div style={{ display:'flex', gap:16, fontSize:12, color:'#475569', marginBottom:6 }}>
                <span>Type: <strong>{result.type}</strong></span>
                <span>Region: <strong>{result.region}</strong></span>
              </div>
              <div style={{ fontSize:11, color:'#64748B', lineHeight:1.5 }}>{result.note}</div>
              <a href={`https://www.ntsa.go.ke`} target="_blank" rel="noopener noreferrer"
                style={{ display:'inline-block', marginTop:8, fontSize:11, fontWeight:700, color:'#1565C0', textDecoration:'none' }}>
                Full check on NTSA portal →
              </a>
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// SELLER RATINGS
// ─────────────────────────────────────────────────────────────
function SellerRatings({ listingId, sellerId, sellerName }) {
  const [ratings, setRatings] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    if (!sellerId) return
    supabase.from('seller_ratings').select('*').eq('seller_id', sellerId).order('created_at', { ascending: false }).limit(10)
      .then(({ data }) => setRatings(data || []))
  }, [sellerId])

  const avgRating = ratings.length > 0 ? (ratings.reduce((a, r) => a + r.rating, 0) / ratings.length).toFixed(1) : null

  const submit = async () => {
    if (!rating || !name.trim()) return
    await supabase.from('seller_ratings').insert({ seller_id: sellerId, reviewer_name: name.trim(), rating, comment: comment.trim() || null, listing_id: listingId })
    setSubmitted(true)
    setRatings(prev => [{ id: Date.now(), reviewer_name: name, rating, comment, created_at: new Date().toISOString() }, ...prev])
  }

  const stars = (n, size = 14) => '★'.repeat(n) + '☆'.repeat(5 - n)

  return (
    <div style={{ background:'#fff', border:'1.5px solid #E8EDF3', borderRadius:12, padding:16, marginBottom:12 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
        <div style={{ fontFamily:'Outfit,sans-serif', fontSize:14, fontWeight:700, color:'#0A2540', display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ width:3, height:14, background:'#1565C0', borderRadius:2, display:'inline-block' }}/>
          ⭐ Seller Ratings {avgRating && <span style={{ fontSize:12, color:'#D97706' }}>{avgRating}/5</span>}
          <span style={{ fontSize:11, color:'#94A3B8', fontWeight:400 }}>({ratings.length})</span>
        </div>
        {!showForm && !submitted && (
          <button onClick={() => setShowForm(true)} style={{ background:'#EEF5FF', color:'#1565C0', border:'1.5px solid #BDD5FF', padding:'5px 12px', borderRadius:7, fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:'Outfit,sans-serif' }}>+ Rate Seller</button>
        )}
      </div>

      {showForm && !submitted && (
        <div style={{ background:'#F8FAFC', borderRadius:10, padding:14, marginBottom:14, border:'1.5px solid #E8EDF3' }}>
          <div style={{ fontSize:12, fontWeight:700, color:'#0A2540', marginBottom:10 }}>Rate {sellerName || 'this seller'}</div>
          <div style={{ display:'flex', gap:4, marginBottom:12 }}>
            {[1,2,3,4,5].map(n => (
              <button key={n} onClick={() => setRating(n)}
                style={{ fontSize:28, background:'none', border:'none', cursor:'pointer', color: n <= rating ? '#F59E0B' : '#E2E8F0', padding:0 }}>★</button>
            ))}
          </div>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name"
            style={{ width:'100%', padding:'9px 12px', border:'1.5px solid #E2E8F0', borderRadius:7, fontSize:13, fontFamily:'DM Sans,sans-serif', outline:'none', marginBottom:8, boxSizing:'border-box' }}/>
          <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Share your experience with this seller (optional)" rows={2}
            style={{ width:'100%', padding:'9px 12px', border:'1.5px solid #E2E8F0', borderRadius:7, fontSize:13, fontFamily:'DM Sans,sans-serif', outline:'none', resize:'none', marginBottom:10, boxSizing:'border-box' }}/>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={() => setShowForm(false)} style={{ flex:1, background:'#F0F4F8', color:'#64748B', border:'none', padding:'9px', borderRadius:7, fontSize:12, fontWeight:600, cursor:'pointer' }}>Cancel</button>
            <button onClick={submit} disabled={!rating || !name.trim()} style={{ flex:2, background: rating && name.trim() ? '#1565C0' : '#94A3B8', color:'#fff', border:'none', padding:'9px', borderRadius:7, fontSize:12, fontWeight:700, cursor: rating && name.trim() ? 'pointer' : 'default', fontFamily:'Outfit,sans-serif' }}>Submit Rating</button>
          </div>
        </div>
      )}
      {submitted && <div style={{ background:'#DCFCE7', color:'#16A34A', borderRadius:8, padding:'10px 14px', fontSize:13, fontWeight:600, marginBottom:12 }}>✓ Thanks for your rating!</div>}

      {ratings.length === 0 ? (
        <div style={{ textAlign:'center', padding:'20px 0', color:'#94A3B8', fontSize:12 }}>No ratings yet. Be the first to rate this seller.</div>
      ) : ratings.slice(0, 3).map(r => (
        <div key={r.id} style={{ borderBottom:'1px solid #F0F4F8', paddingBottom:10, marginBottom:10 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
            <div style={{ fontFamily:'Outfit,sans-serif', fontSize:12, fontWeight:700, color:'#0A2540' }}>{r.reviewer_name}</div>
            <div style={{ color:'#F59E0B', fontSize:13 }}>{stars(r.rating)}</div>
          </div>
          {r.comment && <div style={{ fontSize:12, color:'#64748B', lineHeight:1.5 }}>{r.comment}</div>}
          <div style={{ fontSize:10, color:'#94A3B8', marginTop:4 }}>{new Date(r.created_at).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' })}</div>
        </div>
      ))}
    </div>
  )
}

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
  const [similarCars, setSimilarCars] = useState([])
  const [offerOpen, setOfferOpen] = useState(false)
  const [offerAmount, setOfferAmount] = useState('')
  const [offerMsg, setOfferMsg] = useState('')
  const [offerName, setOfferName] = useState('')
  const [offerPhone, setOfferPhone] = useState('')
  const [offerSubmitted, setOfferSubmitted] = useState(false)
  const [copyMsg, setCopyMsg] = useState('')
  const [driveOpen, setDriveOpen] = useState(false)
  const [contactOpen, setContactOpen] = useState(true)
  const [reportOpen, setReportOpen] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [reportName, setReportName] = useState('')
  const [reportEmail, setReportEmail] = useState('')
  const [reportDetails, setReportDetails] = useState('')
  const [reportDone, setReportDone] = useState(false)
  const [driveDate, setDriveDate] = useState(null)
  const [driveTime, setDriveTime] = useState('')
  const [driveName, setDriveName] = useState('')
  const [drivePhone, setDrivePhone] = useState('')
  const [driveMsg, setDriveMsg] = useState('')
  const [driveSubmitted, setDriveSubmitted] = useState(false)
  const [calMonth, setCalMonth] = useState(new Date())

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
          supabase.from('listings')
            .select('id, make, model, variant, year, price, mileage, fuel_type, transmission, body_type, engine_cc, drive_type, colour, condition, location, listing_photos(*)')
            .eq('status', 'approved').eq('make', data.make).eq('model', data.model).neq('id', id).limit(3)
            .then(({ data: similar }) => setSimilarCars(similar || []))
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

  const handleOffer = async () => {
    if (!offerAmount || !offerName || !offerPhone) { alert('Please fill in all fields'); return }
    const { data: { user: u } } = await supabase.auth.getUser()
    const { error } = await supabase.from('offers').insert({
      listing_id: id, buyer_id: u?.id || null, buyer_name: offerName,
      buyer_phone: offerPhone, offer_amount: Number(offerAmount), message: offerMsg, status: 'pending'
    })
    if (error) { alert('Error: ' + error.message); return }
    supabase.from('listing_leads').insert({ listing_id: id, lead_type: 'offer' })
    setOfferSubmitted(true)
  }

  const handleShare = (type) => {
    const url = window.location.href
    const text = `Check out this ${car.year} ${car.make} ${car.model}${car.variant ? ` — ${car.variant}` : ''} for KSH ${Number(car.price).toLocaleString()} on CarExpert Africa`
    if (type === 'whatsapp') window.open(`https://wa.me/?text=${encodeURIComponent(text + '\n' + url)}`, '_blank')
    else if (type === 'copy') { navigator.clipboard.writeText(url); setCopyMsg('Copied!'); setTimeout(() => setCopyMsg(''), 2000) }
  }

  const handleReport = async () => {
    if (!reportReason) return
    await supabase.from('listing_reports').insert({ listing_id: id, reporter_name: reportName||null, reporter_email: reportEmail||null, reason: reportReason, details: reportDetails||null })
    setReportDone(true)
  }

  const handleTestDrive = async () => {
    if (!driveDate || !driveTime || !driveName || !drivePhone) { alert('Please fill in all fields'); return }
    const { data: { user: u } } = await supabase.auth.getUser()
    const { error } = await supabase.from('test_drives').insert({
      listing_id: id, buyer_id: u?.id || null, buyer_name: driveName, buyer_phone: drivePhone,
      preferred_date: driveDate.toISOString().split('T')[0],
      preferred_time: driveTime, message: driveMsg, status: 'pending'
    })
    if (error) { alert('Error: ' + error.message); return }
    supabase.from('listing_leads').insert({ listing_id: id, lead_type: 'test_drive' })
    setDriveSubmitted(true)
  }

  if (loading) return (
    <div style={{ fontFamily:'DM Sans,sans-serif', minHeight:'100vh', background:'#F7F9FC' }}>
      <style>{MOBILE_CSS}</style><Navbar user={user} />
      <div style={{ textAlign:'center', padding:80, color:'#94A3B8' }}>Loading...</div>
    </div>
  )

  if (!car) return (
    <div style={{ fontFamily:'DM Sans,sans-serif', minHeight:'100vh', background:'#F7F9FC' }}>
      <style>{MOBILE_CSS}</style><Navbar user={user} />
      <div style={{ textAlign:'center', padding:80 }}>
        <div style={{ fontSize:40, marginBottom:16 }}>🔍</div>
        <div style={{ fontFamily:'Outfit,sans-serif', fontSize:20, fontWeight:800, color:'#0A2540', marginBottom:8 }}>Listing not found</div>
        <Link to="/listings" style={{ background:'#1565C0', color:'#fff', padding:'10px 24px', borderRadius:8, fontSize:13, fontWeight:700, textDecoration:'none', fontFamily:'Outfit,sans-serif' }}>Back to Listings</Link>
      </div>
    </div>
  )

  const waLink = `https://wa.me/${(car.phone||'').replace(/\D/g,'')}?text=Hi, I saw your ${car.year} ${car.make} ${car.model}${car.variant ? ` — ${car.variant}` : ''} on CarExpert Africa. Is it still available?`

  useSEO({
    title: `${car.year} ${car.make} ${car.model}${car.variant ? ` — ${car.variant}` : ''} for KSH ${Number(car.price).toLocaleString()}`,
    description: `${car.year} ${car.make} ${car.model}${car.variant ? ` ${car.variant}` : ''}, ${car.mileage ? Number(car.mileage).toLocaleString() + 'km' : ''}, ${car.condition || ''}, ${car.location || 'Kenya'}. KSH ${Number(car.price).toLocaleString()}${car.negotiable ? ' negotiable' : ''}. ${car.description || ''}`.slice(0, 160),
    image: car.listing_photos?.[0]?.url,
    url: window.location.href,
    type: 'product',
  })
  const SPEC_FIELDS = [
    ['Make',car.make],['Model',car.model],['Variant',car.variant||'—'],['Year',car.year],
    ['Mileage',car.mileage?`${Number(car.mileage).toLocaleString()} km`:'—'],['Condition',car.condition||'—'],
    ['Body Type',car.body_type||'—'],['Engine',car.engine_cc?`${car.engine_cc} cc`:'—'],
    ['Fuel Type',car.fuel_type||'—'],['Transmission',car.transmission||'—'],
    ['Drive Type',car.drive_type||'—'],['Colour',car.colour||car.color||'—'],['Negotiable',car.negotiable?'Yes':'No'],
  ]

  return (
    <div style={{ fontFamily:'DM Sans,sans-serif', background:'#F7F9FC', minHeight:'100vh' }}>
      <style>{MOBILE_CSS}</style>
      <Navbar user={user} />
      <div style={{ background:'#fff', borderBottom:'1px solid #E8EDF3', padding:'10px 16px', fontSize:12, color:'#94A3B8' }}>
        <Link to="/" style={{ color:'#1565C0', textDecoration:'none' }}>Home</Link> / <Link to="/listings" style={{ color:'#1565C0', textDecoration:'none' }}>Listings</Link> / {car.year} {car.make} {car.model}{car.variant ? ` — ${car.variant}` : ''}
      </div>

      <div className="detail-grid detail-main-pad" style={{ display:'grid', gridTemplateColumns:'1fr 300px', gap:16, padding:'16px', maxWidth:1200, margin:'0 auto' }}>
        <div>
          {/* Photos */}
          <div style={{ borderRadius:12, overflow:'hidden', background:'#EEF5FF', height:280, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:8, position:'relative' }}>
            <button onClick={handleSave} style={{ position:'absolute', top:12, right:12, width:36, height:36, background:saved?'#EF4444':'rgba(255,255,255,.9)', borderRadius:'50%', border:'none', cursor:'pointer', fontSize:18, color:saved?'#fff':'#94A3B8', zIndex:1, display:'flex', alignItems:'center', justifyContent:'center' }}>
              {saved ? '♥' : '♡'}
            </button>
            {car.listing_photos?.[activePhoto]?.url
              ? <img src={car.listing_photos[activePhoto].url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
              : <div style={{ textAlign:'center' }}><span style={{ fontSize:56 }}>🚗</span><div style={{ fontSize:12, color:'#94A3B8', marginTop:8 }}>No photos</div></div>}
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

          {/* Title + share */}
          <div style={{ background:'#fff', border:'1.5px solid #E8EDF3', borderRadius:12, padding:16, marginBottom:12 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:10 }}>
              <div>
                <div style={{ fontFamily:'Outfit,sans-serif', fontSize:20, fontWeight:800, color:'#0A2540', marginBottom:4 }}>{car.year} {car.make} {car.model}{car.variant ? ` — ${car.variant}` : ''}</div>
                <div style={{ fontSize:12, color:'#94A3B8', display:'flex', gap:8, flexWrap:'wrap' }}>
                  {car.location && <span>📍 {car.location}</span>}
                  {car.views > 0 && <span style={{ color:'#1565C0', fontWeight:600 }}>{car.views} views</span>}
                  <span>Listed {new Date(car.created_at).toLocaleDateString('en-GB')}</span>
                  {car.updated_at && car.updated_at !== car.created_at && <span>· Updated {new Date(car.updated_at).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' })}</span>}
                </div>
              </div>
              <div style={{ display:'flex', gap:8, flexShrink:0 }}>
                <button onClick={() => handleShare('whatsapp')} style={{ background:'#25D366', color:'#fff', border:'none', padding:'7px 12px', borderRadius:7, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'Outfit,sans-serif' }}>📱 Share</button>
                <button onClick={() => handleShare('copy')} style={{ background:'#F0F6FF', color:'#1565C0', border:'1.5px solid #BDD5FF', padding:'7px 12px', borderRadius:7, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'Outfit,sans-serif' }}>{copyMsg || '🔗 Copy Link'}</button>
                <Link to={`/compare?ids=${id}`} style={{ background:'#F8FAFC', color:'#475569', border:'1.5px solid #E2E8F0', padding:'7px 10px', borderRadius:7, fontSize:12, fontWeight:700, cursor:'pointer', textDecoration:'none' }} title="Compare">🔄</Link>
                <button onClick={() => setReportOpen(true)} style={{ background:'#FEE2E2', color:'#DC2626', border:'none', padding:'7px 10px', borderRadius:7, fontSize:12, fontWeight:700, cursor:'pointer' }} title="Report listing">🚩</button>
              </div>
            </div>
          </div>

          {/* Specs */}
          <div style={{ background:'#fff', border:'1.5px solid #E8EDF3', borderRadius:12, padding:16, marginBottom:12 }}>
            <div style={{ fontFamily:'Outfit,sans-serif', fontSize:14, fontWeight:700, color:'#0A2540', marginBottom:14, display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ width:3, height:14, background:'#1565C0', borderRadius:2, display:'inline-block' }}/> Vehicle Specifications
            </div>
            <div className="spec-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr' }}>
              {SPEC_FIELDS.map(([k,v],i) => (
                <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'9px 10px', borderBottom:'1px solid #F0F4F8', borderRight:i%2===0?'1px solid #F0F4F8':'none' }}>
                  <span style={{ fontSize:12, color:'#94A3B8' }}>{k}</span>
                  <span style={{ fontSize:12, fontWeight:700, color:'#0A2540', fontFamily:'Outfit,sans-serif' }}>{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* NTSA Plate Check */}
          <NTSACheck />

          {/* Description */}
          {car.description && (
            <div style={{ background:'#fff', border:'1.5px solid #E8EDF3', borderRadius:12, padding:16, marginBottom:12 }}>
              <div style={{ fontFamily:'Outfit,sans-serif', fontSize:14, fontWeight:700, color:'#0A2540', marginBottom:10, display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ width:3, height:14, background:'#1565C0', borderRadius:2, display:'inline-block' }}/> Seller Description
              </div>
              <p style={{ fontSize:13, color:'#475569', lineHeight:1.7, margin:0 }}>{car.description}</p>
            </div>
          )}

          {/* Seller Ratings */}
          <SellerRatings listingId={id} sellerId={car.user_id} sellerName={car.contact_name} />

          {/* Map */}
          {car.location && (
            <div style={{ background:'#fff', border:'1.5px solid #E8EDF3', borderRadius:12, padding:16, marginBottom:12 }}>
              <div style={{ fontFamily:'Outfit,sans-serif', fontSize:14, fontWeight:700, color:'#0A2540', marginBottom:12, display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ width:3, height:14, background:'#1565C0', borderRadius:2, display:'inline-block' }}/> 📍 Location — {car.location}
              </div>
              <div style={{ borderRadius:10, overflow:'hidden', border:'1px solid #E8EDF3' }}>
                <iframe title="location" width="100%" height="220" style={{ border:0, display:'block' }} loading="lazy"
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(car.location + ', Kenya')}&output=embed&z=13`}/>
              </div>
            </div>
          )}

          {/* Compare */}
          {similarCars.length > 0 && (
            <div style={{ background:'#fff', border:'1.5px solid #E8EDF3', borderRadius:12, padding:16, marginBottom:12 }}>
              <div style={{ fontFamily:'Outfit,sans-serif', fontSize:14, fontWeight:700, color:'#0A2540', marginBottom:14, display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ width:3, height:14, background:'#1565C0', borderRadius:2, display:'inline-block' }}/> 🔄 Compare Similar {car.make} {car.model}s
              </div>
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12, minWidth:480 }}>
                  <thead>
                    <tr style={{ background:'#F8FAFC' }}>
                      <th style={{ padding:'10px 12px', textAlign:'left', fontSize:10, fontWeight:700, color:'#94A3B8', textTransform:'uppercase', borderBottom:'2px solid #E8EDF3' }}>Spec</th>
                      <th style={{ padding:'10px 12px', textAlign:'center', fontSize:11, fontWeight:700, color:'#1565C0', borderBottom:'2px solid #1565C0', background:'#EEF5FF' }}>This Car</th>
                      {similarCars.map(c => (
                        <th key={c.id} style={{ padding:'10px 12px', textAlign:'center', fontSize:11, fontWeight:700, color:'#475569', borderBottom:'2px solid #E8EDF3' }}>
                          <Link to={`/listings/${c.id}`} style={{ color:'#1565C0', textDecoration:'none' }}>{c.year} {c.variant || c.model}</Link>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['Price', c => `KSH ${Number(c.price).toLocaleString()}`],
                      ['Variant', c => c.variant || '—'],
                      ['Year', c => c.year],
                      ['Mileage', c => c.mileage ? `${Number(c.mileage).toLocaleString()} km` : '—'],
                      ['Fuel', c => c.fuel_type || '—'],
                      ['Transmission', c => c.transmission || '—'],
                      ['Engine', c => c.engine_cc ? `${c.engine_cc}cc` : '—'],
                      ['Drive', c => c.drive_type || '—'],
                      ['Condition', c => c.condition || '—'],
                      ['Location', c => c.location || '—'],
                    ].map(([label, getter], i) => (
                      <tr key={label} style={{ background:i%2===0?'#fff':'#FAFBFC' }}>
                        <td style={{ padding:'9px 12px', fontWeight:700, color:'#64748B', fontSize:11, textTransform:'uppercase', letterSpacing:'.3px', borderBottom:'1px solid #F0F4F8' }}>{label}</td>
                        <td style={{ padding:'9px 12px', textAlign:'center', fontWeight:600, color:'#0A2540', borderBottom:'1px solid #F0F4F8', background:'#F8FBFF' }}>{getter(car)}</td>
                        {similarCars.map(c => (
                          <td key={c.id} style={{ padding:'9px 12px', textAlign:'center', color:'#475569', borderBottom:'1px solid #F0F4F8' }}>{getter(c)}</td>
                        ))}
                      </tr>
                    ))}
                    <tr>
                      <td style={{ padding:'10px 12px' }}></td>
                      <td style={{ padding:'10px 12px', textAlign:'center', background:'#F8FBFF' }}>
                        <span style={{ fontSize:10, fontWeight:700, color:'#1565C0', background:'#EEF5FF', padding:'3px 10px', borderRadius:100 }}>Viewing</span>
                      </td>
                      {similarCars.map(c => (
                        <td key={c.id} style={{ padding:'10px 12px', textAlign:'center' }}>
                          <Link to={`/listings/${c.id}`} style={{ fontSize:11, fontWeight:700, color:'#1565C0', background:'#F0F6FF', padding:'5px 12px', borderRadius:6, textDecoration:'none', border:'1.5px solid #BDD5FF' }}>View →</Link>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="detail-sidebar">
          <div className="detail-price-bar" style={{ background:'#0A2540', borderRadius:12, padding:16, marginBottom:14, color:'#fff' }}>
            {/* Collapsible header */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: contactOpen ? 12 : 0, cursor:'pointer' }} onClick={() => setContactOpen(o => !o)}>
              <div>
                <div style={{ fontSize:10, color:'rgba(255,255,255,.5)', fontWeight:700, textTransform:'uppercase', letterSpacing:'.8px', marginBottom:2 }}>Asking Price</div>
                <div style={{ fontFamily:'Outfit,sans-serif', fontSize:26, fontWeight:800 }}>KSH {Number(car.price).toLocaleString()}</div>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                {car.negotiable && <span style={{ fontSize:10, color:'#4DA6FF', fontWeight:700, background:'rgba(77,166,255,.15)', padding:'3px 8px', borderRadius:100 }}>Negotiable</span>}
                <span style={{ fontSize:18, color:'rgba(255,255,255,.5)', transform: contactOpen ? 'rotate(180deg)' : 'none', transition:'transform .2s', display:'block' }}>⌄</span>
              </div>
            </div>
            {contactOpen && (
              <>
                <div style={{ display:'flex', gap:8, marginBottom:8 }}>
                  <a href={waLink} target="_blank" rel="noopener noreferrer"
                    style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:6, background:'#25D366', color:'#fff', border:'none', padding:'11px 8px', borderRadius:8, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'Outfit,sans-serif', textDecoration:'none' }}
                    onClick={() => supabase.from('listing_leads').insert({ listing_id: id, lead_type: 'whatsapp' })}>
                    📱 WhatsApp
                  </a>
                  {car.phone && (
                    <a href={`tel:${car.phone}`}
                      style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:6, background:'rgba(255,255,255,.12)', color:'#fff', border:'1.5px solid rgba(255,255,255,.2)', padding:'11px 8px', borderRadius:8, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'Outfit,sans-serif', textDecoration:'none' }}
                      onClick={() => supabase.from('listing_leads').insert({ listing_id: id, lead_type: 'call' })}>
                      📞 Call
                    </a>
                  )}
                </div>
                <button onClick={() => setOfferOpen(true)}
                  style={{ width:'100%', background:'rgba(255,255,255,.1)', color:'#fff', border:'1.5px solid rgba(255,255,255,.25)', padding:'10px', borderRadius:8, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'Outfit,sans-serif', marginBottom:8 }}>
                  🤝 Make an Offer
                </button>
                <button onClick={() => setDriveOpen(true)}
                  style={{ width:'100%', background:'rgba(255,255,255,.1)', color:'#fff', border:'1.5px solid rgba(255,255,255,.25)', padding:'10px', borderRadius:8, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'Outfit,sans-serif', marginBottom:8 }}>
                  📅 Book a Test Drive
                </button>
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
              </>
            )}
          </div>

          {/* Finance calculator — hidden on mobile, shown at bottom instead */}
          <div className="detail-finance-desktop" style={{ background:'#fff', border:'1.5px solid #E8EDF3', borderRadius:12, padding:16 }}>
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

      {/* Finance calculator — mobile only, shown at bottom */}
      <div className="detail-finance-mobile" style={{ display:'none', maxWidth:1200, margin:'0 16px 80px', background:'#fff', border:'1.5px solid #E8EDF3', borderRadius:12, padding:16 }}>
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

      {/* Offer Modal */}
      {offerOpen && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
          <div style={{ background:'#fff', borderRadius:16, padding:24, width:'100%', maxWidth:420, boxShadow:'0 20px 60px rgba(0,0,0,.2)' }}>
            {offerSubmitted ? (
              <div style={{ textAlign:'center', padding:'20px 0' }}>
                <div style={{ fontSize:48, marginBottom:12 }}>🤝</div>
                <div style={{ fontFamily:'Outfit,sans-serif', fontSize:18, fontWeight:800, color:'#0A2540', marginBottom:8 }}>Offer Submitted!</div>
                <div style={{ fontSize:13, color:'#64748B', marginBottom:20, lineHeight:1.6 }}>The seller will review your offer of <strong>KSH {Number(offerAmount).toLocaleString()}</strong> and contact you.</div>
                <button onClick={() => { setOfferOpen(false); setOfferSubmitted(false) }}
                  style={{ background:'#1565C0', color:'#fff', border:'none', padding:'11px 28px', borderRadius:8, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'Outfit,sans-serif' }}>Done</button>
              </div>
            ) : (
              <>
                <div style={{ fontFamily:'Outfit,sans-serif', fontSize:18, fontWeight:800, color:'#0A2540', marginBottom:4 }}>🤝 Make an Offer</div>
                <div style={{ fontSize:12, color:'#94A3B8', marginBottom:16 }}>Asking price: <strong style={{ color:'#1565C0' }}>KSH {Number(car.price).toLocaleString()}</strong></div>
                {[
                  { label:'Your Offer (KSH)', value:offerAmount, set:setOfferAmount, type:'number', placeholder:`e.g. ${Math.round(car.price*0.9/1000)*1000}` },
                  { label:'Your Name', value:offerName, set:setOfferName, type:'text', placeholder:'John Kamau' },
                  { label:'Phone / WhatsApp', value:offerPhone, set:setOfferPhone, type:'tel', placeholder:'+254 7XX XXX XXX' },
                ].map(f => (
                  <div key={f.label} style={{ marginBottom:12 }}>
                    <label style={{ display:'block', fontSize:10, fontWeight:700, color:'#64748B', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:5 }}>{f.label}</label>
                    <input type={f.type} value={f.value} onChange={e => f.set(e.target.value)} placeholder={f.placeholder}
                      style={{ width:'100%', padding:'11px 12px', border:'1.5px solid #E2E8F0', borderRadius:8, fontSize:13, fontFamily:'DM Sans,sans-serif', outline:'none', boxSizing:'border-box' }}/>
                    {f.label.includes('Offer') && offerAmount && Number(offerAmount) < car.price && (
                      <div style={{ fontSize:11, color:'#F59E0B', marginTop:4 }}>{Math.round((1-Number(offerAmount)/car.price)*100)}% below asking price</div>
                    )}
                  </div>
                ))}
                <div style={{ marginBottom:16 }}>
                  <label style={{ display:'block', fontSize:10, fontWeight:700, color:'#64748B', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:5 }}>Message (optional)</label>
                  <textarea value={offerMsg} onChange={e => setOfferMsg(e.target.value)} placeholder="e.g. I can pay cash and collect this week..." rows={3}
                    style={{ width:'100%', padding:'11px 12px', border:'1.5px solid #E2E8F0', borderRadius:8, fontSize:13, fontFamily:'DM Sans,sans-serif', outline:'none', resize:'vertical', boxSizing:'border-box' }}/>
                </div>
                <div style={{ display:'flex', gap:8 }}>
                  <button onClick={() => setOfferOpen(false)}
                    style={{ flex:1, background:'#F8FAFC', color:'#64748B', border:'1.5px solid #E2E8F0', padding:'11px', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'Outfit,sans-serif' }}>Cancel</button>
                  <button onClick={handleOffer} disabled={!offerAmount||!offerName||!offerPhone}
                    style={{ flex:1, background:offerAmount&&offerName&&offerPhone?'#1565C0':'#94A3B8', color:'#fff', border:'none', padding:'11px', borderRadius:8, fontSize:13, fontWeight:700, cursor:offerAmount&&offerName&&offerPhone?'pointer':'default', fontFamily:'Outfit,sans-serif' }}>
                    Submit Offer →
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Report Modal */}
      {reportOpen && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
          <div style={{ background:'#fff', borderRadius:16, padding:24, width:'100%', maxWidth:400, boxShadow:'0 20px 60px rgba(0,0,0,.2)' }}>
            {reportDone ? (
              <div style={{ textAlign:'center', padding:'16px 0' }}>
                <div style={{ fontSize:40, marginBottom:12 }}>✅</div>
                <div style={{ fontFamily:'Outfit,sans-serif', fontSize:16, fontWeight:800, color:'#0A2540', marginBottom:8 }}>Report Submitted</div>
                <div style={{ fontSize:13, color:'#64748B', marginBottom:20 }}>Our team will review this listing within 24 hours.</div>
                <button onClick={() => { setReportOpen(false); setReportDone(false) }} style={{ background:'#1565C0', color:'#fff', border:'none', padding:'10px 24px', borderRadius:8, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'Outfit,sans-serif' }}>Done</button>
              </div>
            ) : (
              <>
                <div style={{ fontFamily:'Outfit,sans-serif', fontSize:16, fontWeight:800, color:'#0A2540', marginBottom:4 }}>🚩 Report Listing</div>
                <div style={{ fontSize:12, color:'#94A3B8', marginBottom:16 }}>Help keep CarExpert Africa trustworthy</div>
                <div style={{ marginBottom:12 }}>
                  <label style={{ display:'block', fontSize:10, fontWeight:700, color:'#64748B', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:5 }}>Reason *</label>
                  <select value={reportReason} onChange={e => setReportReason(e.target.value)}
                    style={{ width:'100%', padding:'10px 12px', border:'1.5px solid #E2E8F0', borderRadius:8, fontSize:13, fontFamily:'DM Sans,sans-serif', outline:'none', boxSizing:'border-box' }}>
                    <option value="">Select a reason...</option>
                    {['Fraudulent listing','Wrong price or specs','Car already sold','Duplicate listing','Stolen vehicle','Misleading photos','Spam or scam','Other'].map(r => <option key={r}>{r}</option>)}
                  </select>
                </div>
                <div style={{ marginBottom:12 }}>
                  <label style={{ display:'block', fontSize:10, fontWeight:700, color:'#64748B', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:5 }}>Additional Details</label>
                  <textarea value={reportDetails} onChange={e => setReportDetails(e.target.value)} placeholder="Tell us more..." rows={3}
                    style={{ width:'100%', padding:'10px 12px', border:'1.5px solid #E2E8F0', borderRadius:8, fontSize:13, fontFamily:'DM Sans,sans-serif', outline:'none', resize:'none', boxSizing:'border-box' }}/>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:12 }}>
                  <div>
                    <label style={{ display:'block', fontSize:10, fontWeight:700, color:'#64748B', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:5 }}>Your Name</label>
                    <input value={reportName} onChange={e => setReportName(e.target.value)} placeholder="Optional"
                      style={{ width:'100%', padding:'9px 12px', border:'1.5px solid #E2E8F0', borderRadius:8, fontSize:12, fontFamily:'DM Sans,sans-serif', outline:'none', boxSizing:'border-box' }}/>
                  </div>
                  <div>
                    <label style={{ display:'block', fontSize:10, fontWeight:700, color:'#64748B', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:5 }}>Email</label>
                    <input type="email" value={reportEmail} onChange={e => setReportEmail(e.target.value)} placeholder="Optional"
                      style={{ width:'100%', padding:'9px 12px', border:'1.5px solid #E2E8F0', borderRadius:8, fontSize:12, fontFamily:'DM Sans,sans-serif', outline:'none', boxSizing:'border-box' }}/>
                  </div>
                </div>
                <div style={{ display:'flex', gap:8 }}>
                  <button onClick={() => setReportOpen(false)} style={{ flex:1, background:'#F8FAFC', color:'#64748B', border:'1.5px solid #E2E8F0', padding:'10px', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'Outfit,sans-serif' }}>Cancel</button>
                  <button onClick={handleReport} disabled={!reportReason} style={{ flex:1, background: reportReason ? '#DC2626' : '#94A3B8', color:'#fff', border:'none', padding:'10px', borderRadius:8, fontSize:13, fontWeight:700, cursor: reportReason ? 'pointer' : 'default', fontFamily:'Outfit,sans-serif' }}>Submit Report</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Test Drive Modal */}
      {driveOpen && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
          <div style={{ background:'#fff', borderRadius:16, padding:24, width:'100%', maxWidth:460, boxShadow:'0 20px 60px rgba(0,0,0,.2)', maxHeight:'90vh', overflowY:'auto' }}>
            {driveSubmitted ? (
              <div style={{ textAlign:'center', padding:'20px 0' }}>
                <div style={{ fontSize:48, marginBottom:12 }}>📅</div>
                <div style={{ fontFamily:'Outfit,sans-serif', fontSize:18, fontWeight:800, color:'#0A2540', marginBottom:8 }}>Test Drive Booked!</div>
                <div style={{ fontSize:13, color:'#64748B', marginBottom:8, lineHeight:1.6 }}>
                  <strong>{driveDate?.toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}</strong> at <strong>{driveTime}</strong>
                </div>
                <div style={{ fontSize:13, color:'#64748B', marginBottom:20 }}>The seller will confirm via WhatsApp or phone.</div>
                <button onClick={() => { setDriveOpen(false); setDriveSubmitted(false); setDriveDate(null); setDriveTime('') }}
                  style={{ background:'#1565C0', color:'#fff', border:'none', padding:'11px 28px', borderRadius:8, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'Outfit,sans-serif' }}>Done</button>
              </div>
            ) : (
              <>
                <div style={{ fontFamily:'Outfit,sans-serif', fontSize:18, fontWeight:800, color:'#0A2540', marginBottom:4 }}>📅 Book a Test Drive</div>
                <div style={{ fontSize:12, color:'#94A3B8', marginBottom:16 }}>{car.year} {car.make} {car.model}{car.variant ? ` — ${car.variant}` : ''}</div>
                <div style={{ border:'1.5px solid #E2E8F0', borderRadius:10, overflow:'hidden', marginBottom:16 }}>
                  <div style={{ background:'#0A2540', padding:'12px 16px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <button onClick={() => setCalMonth(m => new Date(m.getFullYear(), m.getMonth()-1, 1))}
                      style={{ background:'rgba(255,255,255,.15)', border:'none', color:'#fff', width:28, height:28, borderRadius:6, cursor:'pointer', fontSize:16, display:'flex', alignItems:'center', justifyContent:'center' }}>‹</button>
                    <div style={{ fontFamily:'Outfit,sans-serif', fontSize:14, fontWeight:700, color:'#fff' }}>
                      {calMonth.toLocaleDateString('en-GB', { month:'long', year:'numeric' })}
                    </div>
                    <button onClick={() => setCalMonth(m => new Date(m.getFullYear(), m.getMonth()+1, 1))}
                      style={{ background:'rgba(255,255,255,.15)', border:'none', color:'#fff', width:28, height:28, borderRadius:6, cursor:'pointer', fontSize:16, display:'flex', alignItems:'center', justifyContent:'center' }}>›</button>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', background:'#F8FAFC', borderBottom:'1px solid #E8EDF3' }}>
                    {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
                      <div key={d} style={{ textAlign:'center', padding:'8px 0', fontSize:10, fontWeight:700, color:'#94A3B8', textTransform:'uppercase' }}>{d}</div>
                    ))}
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', padding:'8px' }}>
                    {(() => {
                      const year = calMonth.getFullYear()
                      const month = calMonth.getMonth()
                      const firstDay = new Date(year, month, 1).getDay()
                      const daysInMonth = new Date(year, month+1, 0).getDate()
                      const today = new Date(); today.setHours(0,0,0,0)
                      const cells = []
                      for (let i = 0; i < firstDay; i++) cells.push(<div key={`e${i}`}/>)
                      for (let d = 1; d <= daysInMonth; d++) {
                        const date = new Date(year, month, d)
                        const isPast = date < today
                        const isToday = date.toDateString() === today.toDateString()
                        const isSelected = driveDate?.toDateString() === date.toDateString()
                        const isSunday = date.getDay() === 0
                        cells.push(
                          <div key={d} onClick={() => !isPast && !isSunday && setDriveDate(date)}
                            style={{ textAlign:'center', padding:'7px 0', borderRadius:7, fontSize:13, fontWeight:isSelected||isToday?700:400, margin:'1px',
                              background:isSelected?'#1565C0':isToday?'#EEF5FF':'transparent',
                              color:isSelected?'#fff':isPast||isSunday?'#CBD5E1':isToday?'#1565C0':'#0A2540',
                              cursor:isPast||isSunday?'not-allowed':'pointer',
                              border:isToday&&!isSelected?'1.5px solid #BDD5FF':'1.5px solid transparent' }}>
                            {d}
                          </div>
                        )
                      }
                      return cells
                    })()}
                  </div>
                  {driveDate && (
                    <div style={{ padding:'8px 12px', borderTop:'1px solid #E8EDF3', background:'#F8FAFC', fontSize:12, fontWeight:600, color:'#1565C0', textAlign:'center' }}>
                      📅 {driveDate.toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'long' })}
                    </div>
                  )}
                </div>
                {driveDate && (
                  <div style={{ marginBottom:16 }}>
                    <div style={{ fontSize:10, fontWeight:700, color:'#64748B', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:8 }}>Preferred Time</div>
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:6 }}>
                      {['8:00 AM','9:00 AM','10:00 AM','11:00 AM','12:00 PM','1:00 PM','2:00 PM','3:00 PM','4:00 PM','5:00 PM'].map(t => (
                        <button key={t} onClick={() => setDriveTime(t)}
                          style={{ padding:'8px 4px', border:`1.5px solid ${driveTime===t?'#1565C0':'#E2E8F0'}`, borderRadius:7, fontSize:12, fontWeight:driveTime===t?700:400, color:driveTime===t?'#1565C0':'#475569', background:driveTime===t?'#EEF5FF':'#fff', cursor:'pointer', fontFamily:'DM Sans,sans-serif' }}>
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {driveDate && driveTime && (
                  <>
                    {[
                      { label:'Your Name', value:driveName, set:setDriveName, type:'text', placeholder:'John Kamau' },
                      { label:'Phone / WhatsApp', value:drivePhone, set:setDrivePhone, type:'tel', placeholder:'+254 7XX XXX XXX' },
                    ].map(f => (
                      <div key={f.label} style={{ marginBottom:12 }}>
                        <label style={{ display:'block', fontSize:10, fontWeight:700, color:'#64748B', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:5 }}>{f.label}</label>
                        <input type={f.type} value={f.value} onChange={e => f.set(e.target.value)} placeholder={f.placeholder}
                          style={{ width:'100%', padding:'11px 12px', border:'1.5px solid #E2E8F0', borderRadius:8, fontSize:13, fontFamily:'DM Sans,sans-serif', outline:'none', boxSizing:'border-box' }}/>
                      </div>
                    ))}
                    <div style={{ marginBottom:16 }}>
                      <label style={{ display:'block', fontSize:10, fontWeight:700, color:'#64748B', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:5 }}>Message (optional)</label>
                      <textarea value={driveMsg} onChange={e => setDriveMsg(e.target.value)} placeholder="Any specific requests..." rows={2}
                        style={{ width:'100%', padding:'11px 12px', border:'1.5px solid #E2E8F0', borderRadius:8, fontSize:13, fontFamily:'DM Sans,sans-serif', outline:'none', resize:'none', boxSizing:'border-box' }}/>
                    </div>
                  </>
                )}
                <div style={{ display:'flex', gap:8 }}>
                  <button onClick={() => setDriveOpen(false)}
                    style={{ flex:1, background:'#F8FAFC', color:'#64748B', border:'1.5px solid #E2E8F0', padding:'11px', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'Outfit,sans-serif' }}>Cancel</button>
                  <button onClick={handleTestDrive} disabled={!driveDate||!driveTime||!driveName||!drivePhone}
                    style={{ flex:2, background:driveDate&&driveTime&&driveName&&drivePhone?'#1565C0':'#94A3B8', color:'#fff', border:'none', padding:'11px', borderRadius:8, fontSize:13, fontWeight:700, cursor:driveDate&&driveTime&&driveName&&drivePhone?'pointer':'default', fontFamily:'Outfit,sans-serif' }}>
                    {driveDate && driveTime ? `Book for ${driveDate.toLocaleDateString('en-GB', { day:'numeric', month:'short' })} at ${driveTime}` : 'Select a date and time'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}


// ─────────────────────────────────────────────────────────────
// VALUATION PAGE
// ─────────────────────────────────────────────────────────────

// Base market prices (KSH) — Kenya market averages by make
const VAL_BASE = {
  Toyota: { default:3500000, 'Land Cruiser 300':18000000, 'Land Cruiser 200':9000000, 'Land Cruiser Prado 150':6500000, 'Land Cruiser Prado 120':3800000, 'Land Cruiser 100 Series':3200000, 'Hilux':3200000, 'Fortuner':4200000, 'Harrier':3800000, 'Alphard':5500000, 'Vellfire':5200000, 'Crown':3200000, 'Camry':2600000, 'RAV4':2800000, 'Noah':1800000, 'Voxy':1900000, 'Fielder':1400000, 'Corolla':1600000 },
  Nissan: { default:1800000, 'Patrol':4500000, 'Navara':2800000, 'X-Trail':2200000, 'Elgrand':3200000, 'Serena':2000000 },
  'Mercedes-Benz': { default:4500000, 'S-Class':9000000, 'GLS':8500000, 'GLE':6500000, 'E-Class':4500000, 'C-Class':3200000, 'G-Class':12000000, 'Sprinter':3500000 },
  BMW: { default:3500000, 'X7':9000000, 'X5':5500000, 'X6':5000000, 'X3':3800000, '7 Series':6500000, '5 Series':3500000, '3 Series':2800000 },
  Subaru: { default:2000000, 'Forester':2200000, 'Outback':2500000, 'WRX':3200000 },
  Mazda: { default:2000000, 'CX-5':2800000, 'CX-7':2200000, 'CX-9':3500000 },
  Audi: { default:3800000, 'Q7':5500000, 'Q5':4200000, 'A6':3800000, 'A4':3000000 },
  Volkswagen: { default:2200000, 'Touareg':4500000, 'Tiguan':2800000, 'Amarok':3200000 },
  Honda: { default:1800000, 'Pilot':3200000, 'CR-V':2400000 },
  Mitsubishi: { default:2200000, 'Pajero':3500000, 'Outlander':2600000, 'L200':2800000 },
  'Land Rover': { default:6500000, 'Range Rover':9500000, 'Range Rover Sport':7500000, 'Defender 110':8500000, 'Discovery':5500000 },
  Lexus: { default:4500000, 'LX':9500000, 'GX':6000000, 'RX':4500000 },
  Porsche: { default:7500000, 'Cayenne':7500000, 'Macan':5500000 },
  Haval: { default:2800000, 'H6':2800000, 'H9':4200000 },
  Isuzu: { default:2500000, 'D-Max':3200000, 'MU-X':3800000 },
  Ford: { default:2200000, 'Ranger':2800000, 'Everest':3500000 },
  Hyundai: { default:1600000, 'Santa Fe':2800000, 'Tucson':2200000 },
  Kia: { default:1600000, 'Sorento':2600000, 'Sportage':2200000 },
  Suzuki: { default:1200000, 'Jimny':2200000, 'Grand Vitara':1800000 },
}

const getBase = (make, model) => {
  const makeData = VAL_BASE[make]
  if (!makeData) return 2000000
  return makeData[model] || makeData.default
}

const condMult = { 'Excellent':1.10, 'Good':1.0, 'Fair':0.85, 'Poor':0.68 }

const kmMult = (km) => {
  if (km < 20000) return 1.15
  if (km < 40000) return 1.08
  if (km < 60000) return 1.03
  if (km < 80000) return 1.0
  if (km < 100000) return 0.94
  if (km < 130000) return 0.87
  if (km < 160000) return 0.79
  if (km < 200000) return 0.70
  return 0.60
}

const yearMult = (yr) => {
  const age = 2025 - yr
  if (age <= 1) return 1.15
  if (age <= 2) return 1.08
  if (age <= 3) return 1.02
  if (age <= 4) return 0.97
  if (age <= 5) return 0.92
  if (age <= 6) return 0.86
  if (age <= 7) return 0.80
  if (age <= 8) return 0.74
  if (age <= 10) return 0.65
  if (age <= 12) return 0.55
  if (age <= 15) return 0.44
  return 0.35
}

const txMult = (tx) => tx === 'Automatic' ? 1.05 : tx === 'CVT' ? 1.03 : 1.0
const fuelMult = (f) => f === 'Hybrid' ? 1.08 : f === 'Electric' ? 1.12 : f === 'Diesel' ? 1.03 : 1.0

const VAL_MAKES = Object.keys(VAL_BASE).sort()
const VAL_MODELS = {
  Toyota: ['Land Cruiser 300','Land Cruiser 200','Land Cruiser Prado 150','Land Cruiser Prado 120','Land Cruiser 100 Series','Hilux','Fortuner','Harrier','RAV4','Alphard','Vellfire','Crown','Camry','Noah','Voxy','Fielder','Corolla','Probox'],
  Nissan: ['Patrol','Navara','X-Trail','Elgrand','Serena','Note','March'],
  'Mercedes-Benz': ['S-Class','GLS','GLE','GLC','E-Class','C-Class','G-Class','ML','Sprinter','Vito'],
  BMW: ['X7','X5','X6','X3','X1','7 Series','5 Series','3 Series'],
  Subaru: ['Forester','Outback','Legacy','WRX','XV'],
  Mazda: ['CX-5','CX-7','CX-9','CX-3','Demio','Axela'],
  Audi: ['Q7','Q5','Q3','A6','A4','A3'],
  Volkswagen: ['Touareg','Tiguan','Amarok','Golf','Passat'],
  Honda: ['Pilot','CR-V','HR-V','Fit','Accord'],
  Mitsubishi: ['Pajero','Outlander','L200','Eclipse Cross'],
  'Land Rover': ['Range Rover','Range Rover Sport','Defender 110','Defender 90','Discovery','Discovery Sport'],
  Lexus: ['LX','GX','RX','NX','IS','GS'],
  Porsche: ['Cayenne','Macan','Panamera'],
  Haval: ['H9','H6','Jolion'],
  Isuzu: ['D-Max','MU-X'],
  Ford: ['Everest','Ranger','Explorer'],
  Hyundai: ['Santa Fe','Tucson','Palisade'],
  Kia: ['Sorento','Sportage','Carnival'],
  Suzuki: ['Jimny','Grand Vitara','Vitara'],
}

export function ValuationPage({ user }) {
  const navigate = useNavigate()
  const [step, setStep] = useState(1) // 1=form, 2=result, 3=dealer-offer
  const [make, setMake] = useState('Toyota')
  const [model, setModel] = useState('Land Cruiser Prado 150')
  const [variant, setVariant] = useState('')
  const [year, setYear] = useState(2019)
  const [km, setKm] = useState(60000)
  const [cond, setCond] = useState('Good')
  const [transmission, setTransmission] = useState('Automatic')
  const [fuel, setFuel] = useState('Petrol')
  const [colour, setColour] = useState('')
  const [engineCc, setEngineCc] = useState('')
  const [location, setLocation] = useState('Nairobi — Westlands')
  const [result, setResult] = useState(null)
  // Dealer offer form
  const [offerName, setOfferName] = useState('')
  const [offerPhone, setOfferPhone] = useState('')
  const [offerEmail, setOfferEmail] = useState('')
  const [offerNotes, setOfferNotes] = useState('')
  const [offerSubmitted, setOfferSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const calculate = () => {
    const base = getBase(make, model)
    const raw = base * condMult[cond] * kmMult(km) * yearMult(year) * txMult(transmission) * fuelMult(fuel)
    const mid = Math.round(raw / 50000) * 50000
    const low = Math.round(mid * 0.88 / 50000) * 50000
    const high = Math.round(mid * 1.12 / 50000) * 50000
    const dealerOffer = Math.round(mid * 0.78 / 50000) * 50000
    const privateSale = Math.round(mid * 1.05 / 50000) * 50000
    setResult({ low, mid, high, dealerOffer, privateSale })
    setStep(2)
  }

  const handleDealerOffer = async () => {
    if (!offerName.trim() || !offerPhone.trim()) return
    setSubmitting(true)
    await supabase.from('dealer_offer_requests').insert({
      make, model, year, mileage: km, condition: cond,
      colour: colour || null, engine_cc: engineCc ? Number(engineCc) : null,
      transmission, fuel_type: fuel, location,
      estimated_low: result.low, estimated_mid: result.mid, estimated_high: result.high,
      contact_name: offerName.trim(), contact_phone: offerPhone.trim(),
      contact_email: offerEmail.trim() || null, notes: offerNotes.trim() || null
    })
    setSubmitting(false)
    setOfferSubmitted(true)
  }

  const goListCar = () => {
    const p = new URLSearchParams({ make, model, variant, year, km, transmission, fuel, colour, engine_cc: engineCc, condition: cond, location })
    navigate(`/list-car?${p.toString()}`)
  }

  const inp = { width:'100%', padding:'11px 12px', border:'1.5px solid #E2E8F0', borderRadius:8, fontSize:13, fontFamily:'DM Sans,sans-serif', outline:'none', background:'#F8FAFC', boxSizing:'border-box' }
  const lbl = { display:'block', fontSize:10, fontWeight:700, color:'#64748B', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:5 }
  const fmtV = n => 'KSH ' + Number(n).toLocaleString()

  return (
    <div style={{ fontFamily:'DM Sans,sans-serif', background:'#F7F9FC', minHeight:'100vh' }}>
      <style>{MOBILE_CSS}</style>
      <Navbar user={user} />
      <div style={{ background:'linear-gradient(135deg,#0A2540,#0D3B6E)', padding:'36px 16px', textAlign:'center' }}>
        <div style={{ color:'#4DA6FF', fontSize:11, fontWeight:700, letterSpacing:'1.8px', textTransform:'uppercase', marginBottom:10 }}>Free Tool</div>
        <h1 style={{ fontFamily:'Outfit,sans-serif', fontSize:26, fontWeight:800, color:'#fff', marginBottom:8 }}>What Is Your Car Worth?</h1>
        <p style={{ color:'rgba(255,255,255,.55)', fontSize:14, maxWidth:440, margin:'0 auto' }}>
          Instant market valuation based on real Kenyan listings data. Get a dealer cash offer or list it yourself.
        </p>
      </div>

      <div style={{ maxWidth:720, margin:'0 auto', padding:16 }}>

        {step === 1 && (
          <div style={{ background:'#fff', border:'1.5px solid #E8EDF3', borderRadius:14, padding:20 }}>
            <div style={{ fontFamily:'Outfit,sans-serif', fontSize:15, fontWeight:700, color:'#0A2540', marginBottom:16, display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ width:3, height:15, background:'#1565C0', borderRadius:2, display:'inline-block' }}/> Tell us about your car
            </div>
            <div className="valuation-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
              <div>
                <label style={lbl}>Make</label>
                <select value={make} onChange={e => { setMake(e.target.value); setModel('') }} style={inp}>
                  {VAL_MAKES.map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Model</label>
                <select value={model} onChange={e => setModel(e.target.value)} style={inp}>
                  <option value="">Select model...</option>
                  {(VAL_MODELS[make] || []).map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Variant / Trim <span style={{ fontWeight:400, textTransform:'none' }}>(optional)</span></label>
                <input value={variant} onChange={e => setVariant(e.target.value)} placeholder="e.g. VX, Sahara, ZX" style={inp}/>
              </div>
              <div>
                <label style={lbl}>Year</label>
                <select value={year} onChange={e => setYear(Number(e.target.value))} style={inp}>
                  {Array.from({length:26},(_,i) => 2025-i).map(y => <option key={y}>{y}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Mileage (km)</label>
                <input type="number" value={km} onChange={e => setKm(Number(e.target.value))} placeholder="e.g. 60000" style={inp}/>
              </div>
              <div>
                <label style={lbl}>Engine (cc) <span style={{ fontWeight:400, textTransform:'none' }}>(optional)</span></label>
                <input type="number" value={engineCc} onChange={e => setEngineCc(e.target.value)} placeholder="e.g. 2700" style={inp}/>
              </div>
              <div>
                <label style={lbl}>Transmission</label>
                <select value={transmission} onChange={e => setTransmission(e.target.value)} style={inp}>
                  {['Automatic','Manual','CVT','Semi-Automatic'].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Fuel Type</label>
                <select value={fuel} onChange={e => setFuel(e.target.value)} style={inp}>
                  {['Petrol','Diesel','Hybrid','Electric'].map(f => <option key={f}>{f}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Colour <span style={{ fontWeight:400, textTransform:'none' }}>(optional)</span></label>
                <select value={colour} onChange={e => setColour(e.target.value)} style={inp}>
                  <option value="">Select colour...</option>
                  {['Pearl White','White','Black','Silver','Grey','Blue','Red','Brown','Beige','Gold','Maroon','Green','Orange'].map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Location</label>
                <select value={location} onChange={e => setLocation(e.target.value)} style={inp}>
                  {['Nairobi — Westlands','Nairobi — CBD','Nairobi — Karen','Mombasa','Kisumu','Nakuru','Eldoret','Thika'].map(l => <option key={l}>{l}</option>)}
                </select>
              </div>
            </div>

            <div style={{ marginBottom:18 }}>
              <label style={lbl}>Condition</label>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8 }}>
                {[['Excellent','★','Showroom-like, full service history, no issues'],['Good','✓','Well maintained, minor wear, all systems work'],['Fair','~','Visible wear, some repairs needed'],['Poor','!','Major issues, accident damage, high repair cost']].map(([c,icon,desc]) => (
                  <div key={c} onClick={() => setCond(c)} style={{ border:`2px solid ${cond===c?'#1565C0':'#E2E8F0'}`, borderRadius:10, padding:'12px 8px', textAlign:'center', cursor:'pointer', background:cond===c?'#EEF5FF':'#fff' }}>
                    <div style={{ fontSize:20, marginBottom:4 }}>{icon}</div>
                    <div style={{ fontSize:12, fontWeight:700, color:cond===c?'#1565C0':'#0A2540', fontFamily:'Outfit,sans-serif', marginBottom:4 }}>{c}</div>
                    <div style={{ fontSize:9, color:'#94A3B8', lineHeight:1.3 }}>{desc}</div>
                  </div>
                ))}
              </div>
            </div>

            <button onClick={calculate} disabled={!model}
              style={{ width:'100%', background: model ? '#1565C0' : '#94A3B8', color:'#fff', border:'none', padding:14, borderRadius:10, fontSize:14, fontWeight:700, cursor: model ? 'pointer' : 'default', fontFamily:'Outfit,sans-serif' }}>
              Get My Free Valuation →
            </button>
          </div>
        )}

        {step === 2 && result && (
          <>
            {/* Main result */}
            <div style={{ background:'#0A2540', borderRadius:14, padding:24, marginBottom:14 }}>
              <div style={{ textAlign:'center', marginBottom:20 }}>
                <div style={{ fontSize:11, color:'rgba(255,255,255,.5)', fontWeight:700, textTransform:'uppercase', letterSpacing:'.8px', marginBottom:6 }}>
                  {year} {make} {model}{variant ? ` — ${variant}` : ''} · {Number(km).toLocaleString()} km · {cond}
                </div>
                <div style={{ fontFamily:'Outfit,sans-serif', fontSize:14, color:'rgba(255,255,255,.5)', marginBottom:4 }}>Estimated Market Value Range</div>
                <div style={{ fontFamily:'Outfit,sans-serif', fontSize:30, fontWeight:900, color:'#fff', marginBottom:6 }}>{fmtV(result.low)} – {fmtV(result.high)}</div>
                <div style={{ fontSize:14, color:'#4DA6FF', fontWeight:700 }}>Best estimate: {fmtV(result.mid)}</div>
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:20 }}>
                {[['Low',result.low,'#94A3B8','Conservative'],['Mid',result.mid,'#4DA6FF','Most Likely'],['High',result.high,'#34D399','Optimistic']].map(([label,val,color,sub]) => (
                  <div key={label} style={{ background:'rgba(255,255,255,.06)', borderRadius:10, padding:'12px 8px', textAlign:'center', border:`1px solid ${label==='Mid'?'rgba(77,166,255,.4)':'rgba(255,255,255,.1)'}` }}>
                    <div style={{ fontSize:9, color:'rgba(255,255,255,.4)', fontWeight:700, textTransform:'uppercase', marginBottom:2 }}>{label}</div>
                    <div style={{ fontFamily:'Outfit,sans-serif', fontSize:13, fontWeight:800, color, marginBottom:2 }}>{fmtV(val)}</div>
                    <div style={{ fontSize:9, color:'rgba(255,255,255,.35)' }}>{sub}</div>
                  </div>
                ))}
              </div>

              {/* Private vs dealer */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                <div style={{ background:'rgba(255,255,255,.06)', borderRadius:10, padding:14, border:'1px solid rgba(255,255,255,.1)' }}>
                  <div style={{ fontSize:10, color:'rgba(255,255,255,.4)', fontWeight:700, textTransform:'uppercase', marginBottom:4 }}>Private Sale</div>
                  <div style={{ fontFamily:'Outfit,sans-serif', fontSize:16, fontWeight:800, color:'#34D399' }}>{fmtV(result.privateSale)}</div>
                  <div style={{ fontSize:10, color:'rgba(255,255,255,.4)', marginTop:3 }}>Best price, takes longer</div>
                </div>
                <div style={{ background:'rgba(255,255,255,.06)', borderRadius:10, padding:14, border:'1px solid rgba(255,255,255,.1)' }}>
                  <div style={{ fontSize:10, color:'rgba(255,255,255,.4)', fontWeight:700, textTransform:'uppercase', marginBottom:4 }}>Dealer Cash Offer</div>
                  <div style={{ fontFamily:'Outfit,sans-serif', fontSize:16, fontWeight:800, color:'#F59E0B' }}>{fmtV(result.dealerOffer)}</div>
                  <div style={{ fontSize:10, color:'rgba(255,255,255,.4)', marginTop:3 }}>Fast sale, lower price</div>
                </div>
              </div>
            </div>

            {/* Factors */}
            <div style={{ background:'#fff', border:'1.5px solid #E8EDF3', borderRadius:14, padding:18, marginBottom:14 }}>
              <div style={{ fontFamily:'Outfit,sans-serif', fontSize:14, fontWeight:700, color:'#0A2540', marginBottom:12, display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ width:3, height:14, background:'#1565C0', borderRadius:2, display:'inline-block' }}/> What Affects This Value
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                {[
                  ['Age', `${2025-year} years old`, yearMult(year) >= 1 ? '✅ Adds value' : yearMult(year) >= 0.85 ? '⚠️ Moderate impact' : '📉 Significant depreciation'],
                  ['Mileage', `${Number(km).toLocaleString()} km`, kmMult(km) >= 1 ? '✅ Low mileage premium' : kmMult(km) >= 0.87 ? '⚠️ Average mileage' : '📉 High mileage discount'],
                  ['Condition', cond, condMult[cond] >= 1.05 ? '✅ Top condition' : condMult[cond] >= 0.95 ? '⚠️ Average condition' : '📉 Reduces value'],
                  ['Transmission', transmission, txMult(transmission) > 1 ? '✅ Automatic premium' : '— No premium'],
                  ['Fuel Type', fuel, fuelMult(fuel) > 1 ? '✅ Fuel type premium' : '— Standard'],
                  ['Make/Model', make, getBase(make, model) > 3000000 ? '✅ High-demand model' : '— Standard demand'],
                ].map(([label, value, impact]) => (
                  <div key={label} style={{ background:'#F8FAFC', borderRadius:8, padding:'10px 12px' }}>
                    <div style={{ fontSize:10, fontWeight:700, color:'#94A3B8', textTransform:'uppercase', marginBottom:3 }}>{label}</div>
                    <div style={{ fontSize:12, fontWeight:700, color:'#0A2540', marginBottom:2 }}>{value}</div>
                    <div style={{ fontSize:11, color:'#64748B' }}>{impact}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginBottom:14 }}>
              <button onClick={() => setStep(1)}
                style={{ background:'#fff', color:'#475569', border:'1.5px solid #E2E8F0', padding:'14px 8px', borderRadius:10, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'Outfit,sans-serif', textAlign:'center' }}>
                🔄 Recalculate
              </button>
              <button onClick={goListCar}
                style={{ background:'#1565C0', color:'#fff', border:'none', padding:'14px 8px', borderRadius:10, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'Outfit,sans-serif', textAlign:'center' }}>
                🚗 List This Car
              </button>
              <button onClick={() => setStep(3)}
                style={{ background:'#F59E0B', color:'#fff', border:'none', padding:'14px 8px', borderRadius:10, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'Outfit,sans-serif', textAlign:'center' }}>
                💰 Get Dealer Offer
              </button>
            </div>

            <div style={{ background:'#EEF5FF', border:'1px solid #BDD5FF', borderRadius:10, padding:'12px 14px', fontSize:11, color:'#475569', lineHeight:1.6 }}>
              <strong style={{ color:'#1565C0' }}>Note:</strong> This is an estimate based on CarExpert Africa market data. Actual value depends on service history, accident history, specific trim, photos, and current buyer demand. Values are in Kenya Shillings.
            </div>
          </>
        )}

        {step === 3 && result && (
          <div>
            {offerSubmitted ? (
              <div style={{ background:'#fff', border:'1.5px solid #E8EDF3', borderRadius:14, padding:48, textAlign:'center' }}>
                <div style={{ fontSize:48, marginBottom:16 }}>💰</div>
                <div style={{ fontFamily:'Outfit,sans-serif', fontSize:22, fontWeight:800, color:'#0A2540', marginBottom:8 }}>Request Sent!</div>
                <div style={{ fontSize:14, color:'#64748B', lineHeight:1.6, marginBottom:8, maxWidth:400, margin:'0 auto 16px' }}>
                  Your offer request for the <strong>{year} {make} {model}</strong> has been sent to dealers in our network. They will contact you within 24 hours.
                </div>
                <div style={{ background:'#F0FDF4', border:'1px solid #86EFAC', borderRadius:10, padding:14, marginBottom:24, display:'inline-block' }}>
                  <div style={{ fontSize:12, color:'#16A34A', fontWeight:600 }}>Your estimated value: {fmtV(result.mid)}</div>
                  <div style={{ fontSize:12, color:'#16A34A', fontWeight:600 }}>Expected dealer offer: {fmtV(result.dealerOffer)} – {fmtV(result.mid)}</div>
                </div>
                <div style={{ display:'flex', gap:10, justifyContent:'center', flexWrap:'wrap' }}>
                  <button onClick={() => { setStep(1); setOfferSubmitted(false) }}
                    style={{ background:'#F8FAFC', color:'#475569', border:'1.5px solid #E2E8F0', padding:'10px 20px', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'Outfit,sans-serif' }}>
                    Value Another Car
                  </button>
                  <button onClick={goListCar}
                    style={{ background:'#1565C0', color:'#fff', border:'none', padding:'10px 20px', borderRadius:8, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'Outfit,sans-serif' }}>
                    List It Instead →
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ background:'#0A2540', borderRadius:14, padding:18, marginBottom:14, display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:10 }}>
                  <div>
                    <div style={{ fontSize:11, color:'rgba(255,255,255,.5)', marginBottom:4 }}>{year} {make} {model} · {cond}</div>
                    <div style={{ fontFamily:'Outfit,sans-serif', fontSize:18, fontWeight:800, color:'#fff' }}>Expected offer: {fmtV(result.dealerOffer)} – {fmtV(result.mid)}</div>
                  </div>
                  <button onClick={() => setStep(2)} style={{ background:'rgba(255,255,255,.1)', color:'#fff', border:'1.5px solid rgba(255,255,255,.2)', padding:'8px 14px', borderRadius:8, fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'Outfit,sans-serif' }}>← Back</button>
                </div>

                <div style={{ background:'#fff', border:'1.5px solid #E8EDF3', borderRadius:14, padding:20 }}>
                  <div style={{ fontFamily:'Outfit,sans-serif', fontSize:15, fontWeight:700, color:'#0A2540', marginBottom:6, display:'flex', alignItems:'center', gap:8 }}>
                    <span style={{ width:3, height:15, background:'#F59E0B', borderRadius:2, display:'inline-block' }}/> Get a Cash Offer from Dealers
                  </div>
                  <div style={{ fontSize:13, color:'#64748B', marginBottom:18, lineHeight:1.6 }}>
                    We'll send your car details to verified dealers in our network. They'll review and contact you with their best cash offer within 24 hours. No obligation.
                  </div>

                  <div className="valuation-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
                    <div>
                      <label style={lbl}>Your Name *</label>
                      <input value={offerName} onChange={e => setOfferName(e.target.value)} placeholder="John Kamau" style={inp}/>
                    </div>
                    <div>
                      <label style={lbl}>Phone / WhatsApp *</label>
                      <input type="tel" value={offerPhone} onChange={e => setOfferPhone(e.target.value)} placeholder="+254 7XX XXX XXX" style={inp}/>
                    </div>
                    <div style={{ gridColumn:'1/-1' }}>
                      <label style={lbl}>Email <span style={{ fontWeight:400, textTransform:'none' }}>(optional)</span></label>
                      <input type="email" value={offerEmail} onChange={e => setOfferEmail(e.target.value)} placeholder="you@example.com" style={inp}/>
                    </div>
                    <div style={{ gridColumn:'1/-1' }}>
                      <label style={lbl}>Any additional details <span style={{ fontWeight:400, textTransform:'none' }}>(optional)</span></label>
                      <textarea value={offerNotes} onChange={e => setOfferNotes(e.target.value)} placeholder="e.g. Full service history, recent tyres, sunroof, no accidents..." rows={3}
                        style={{ ...inp, resize:'vertical' }}/>
                    </div>
                  </div>

                  <div style={{ background:'#FFFBEB', border:'1px solid #FCD34D', borderRadius:8, padding:'10px 14px', fontSize:12, color:'#92400E', marginBottom:16 }}>
                    🔒 Your details will only be shared with verified CEA dealers. No spam, no cold calls from unknown parties.
                  </div>

                  <button onClick={handleDealerOffer} disabled={submitting || !offerName.trim() || !offerPhone.trim()}
                    style={{ width:'100%', background: offerName.trim() && offerPhone.trim() ? '#F59E0B' : '#94A3B8', color: offerName.trim() && offerPhone.trim() ? '#0A2540' : '#fff', border:'none', padding:14, borderRadius:10, fontSize:14, fontWeight:800, cursor: offerName.trim() && offerPhone.trim() ? 'pointer' : 'default', fontFamily:'Outfit,sans-serif' }}>
                    {submitting ? 'Sending to Dealers...' : '💰 Send to Dealers in CEA Network →'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// PRICING PAGE
// ─────────────────────────────────────────────────────────────
export function PricingPage({ user }) {
  const [activeTab, setActiveTab] = useState('plans')
  const [dealers, setDealers] = useState([])
  const [stats, setStats] = useState(null)
  const [loadingStats, setLoadingStats] = useState(true)
  const [animVal, setAnimVal] = useState(0)

  useEffect(() => {
    supabase.from('dealers').select('name, location').order('created_at', { ascending: true })
      .then(({ data }) => setDealers(data || []))
    // fetch real stats from listings
    supabase.from('listings').select('status, views, featured, make, body_type, created_at, price')
      .then(({ data }) => {
        if (!data || data.length === 0) { setLoadingStats(false); return }
        const approved = data.filter(l => l.status === 'approved')
        const totalViews = approved.reduce((a, l) => a + (l.views || 0), 0)
        const avgViews = approved.length > 0 ? Math.round(totalViews / approved.length) : 0
        const featuredListings = approved.filter(l => l.featured)
        const featuredAvgViews = featuredListings.length > 0 ? Math.round(featuredListings.reduce((a,l) => a+(l.views||0),0) / featuredListings.length) : 0
        const makeCounts = {}
        approved.forEach(l => { if (l.make) makeCounts[l.make] = (makeCounts[l.make]||0)+1 })
        const topMakes = Object.entries(makeCounts).sort((a,b) => b[1]-a[1]).slice(0,5)
        const bodyCounts = {}
        approved.forEach(l => { if (l.body_type) bodyCounts[l.body_type] = (bodyCounts[l.body_type]||0)+1 })
        const topBodies = Object.entries(bodyCounts).sort((a,b) => b[1]-a[1]).slice(0,5)
        const prices = approved.map(l => l.price).filter(Boolean)
        const avgPrice = prices.length > 0 ? Math.round(prices.reduce((a,b)=>a+b,0)/prices.length/50000)*50000 : 0
        setStats({ total: data.length, approved: approved.length, totalViews, avgViews, featuredAvgViews, topMakes, topBodies, avgPrice, featuredCount: featuredListings.length })
        setLoadingStats(false)
      })
  }, [])

  useEffect(() => {
    if (activeTab !== 'results') return
    setAnimVal(0)
    const t = setTimeout(() => setAnimVal(100), 100)
    return () => clearTimeout(t)
  }, [activeTab])

  const PLACEHOLDER_DEALERS = [
    { name:'Nairobi Kars Ltd', location:'Westlands' },{ name:'AutoMart Kenya', location:'Mombasa' },
    { name:'Prime Motors', location:'Karen' },{ name:'Capital Cars', location:'Nakuru' },
    { name:'Safari Motors', location:'Kisumu' },{ name:'Prestige Auto', location:'Langata' },
    { name:'East Africa Motors', location:'Westlands' },{ name:'Savannah Auto', location:'Eldoret' },
  ]
  const displayDealers = dealers.length > 0 ? dealers : PLACEHOLDER_DEALERS
  const items = [...displayDealers, ...displayDealers, ...displayDealers]

  const fmtV = n => 'KSH ' + Number(n).toLocaleString()

  return (
    <div style={{ fontFamily:'DM Sans,sans-serif', background:'#F7F9FC', minHeight:'100vh' }}>
      <style>{MOBILE_CSS}{`
        @keyframes scroll-dealers-p { 0% { transform: translateX(0); } 100% { transform: translateX(-33.333%); } }
        @keyframes bar-grow { from { width: 0%; } to { width: var(--w); } }
        .stat-bar { transition: width 1.2s cubic-bezier(.4,0,.2,1); }
      `}</style>
      <Navbar user={user} />
      <div style={{ background:'linear-gradient(135deg,#0A2540,#1565C0)', padding:'44px 16px', textAlign:'center' }}>
        <div style={{ color:'#4DA6FF', fontSize:11, fontWeight:700, letterSpacing:'1.8px', textTransform:'uppercase', marginBottom:10 }}>CarExpert Africa</div>
        <h1 style={{ fontFamily:'Outfit,sans-serif', fontSize:28, fontWeight:800, color:'#fff', marginBottom:8 }}>Plans & Performance</h1>
        <p style={{ color:'rgba(255,255,255,.55)', fontSize:14 }}>Transparent pricing. Real results.</p>
      </div>

      {/* Tabs */}
      <div style={{ background:'#fff', borderBottom:'1px solid #E8EDF3' }}>
        <div style={{ display:'flex', maxWidth:900, margin:'0 auto', padding:'0 16px' }}>
          {[['plans','💳 Pricing Plans'],['results','📊 Why List on CEA?'],['faq','❓ FAQ']].map(([id, label]) => (
            <button key={id} onClick={() => setActiveTab(id)}
              style={{ padding:'14px 20px', border:'none', background:'none', fontSize:13, fontWeight:activeTab===id?700:500, color:activeTab===id?'#1565C0':'#64748B', cursor:'pointer', borderBottom:`2px solid ${activeTab===id?'#1565C0':'transparent'}`, fontFamily:'DM Sans,sans-serif', whiteSpace:'nowrap' }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Dealers scroll */}
      <div style={{ background:'#060F1A', padding:'16px 0', overflow:'hidden' }}>
        <div style={{ textAlign:'center', fontFamily:'Outfit,sans-serif', fontSize:10, fontWeight:700, color:'rgba(255,255,255,.3)', letterSpacing:'2px', textTransform:'uppercase', marginBottom:10 }}>Trusted by Dealers Across Kenya</div>
        <div style={{ overflow:'hidden', position:'relative' }}>
          <div style={{ position:'absolute', left:0, top:0, bottom:0, width:60, background:'linear-gradient(to right, #060F1A, transparent)', zIndex:2 }}/>
          <div style={{ position:'absolute', right:0, top:0, bottom:0, width:60, background:'linear-gradient(to left, #060F1A, transparent)', zIndex:2 }}/>
          <div style={{ display:'flex', animation:'scroll-dealers-p 28s linear infinite', width:'max-content' }}>
            {items.map((d, i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'0 28px', borderRight:'1px solid rgba(255,255,255,.06)', whiteSpace:'nowrap' }}>
                <div style={{ width:26, height:26, borderRadius:'50%', background:'rgba(77,166,255,.15)', border:'1px solid rgba(77,166,255,.25)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Outfit,sans-serif', fontSize:10, fontWeight:800, color:'#4DA6FF', flexShrink:0 }}>{d.name[0]}</div>
                <div>
                  <div style={{ fontFamily:'Outfit,sans-serif', fontSize:12, fontWeight:700, color:'#fff' }}>{d.name}</div>
                  <div style={{ fontSize:10, color:'rgba(255,255,255,.35)' }}>📍 {d.location}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth:900, margin:'0 auto', padding:'24px 16px' }}>

        {/* PLANS TAB */}
        {activeTab === 'plans' && (
          <>
            <div className="pricing-grid" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:24 }}>
              {[
                { name:'Free', price:'KSH 0', period:'forever', color:'#475569', features:['1 active listing','5 photos per listing','Standard placement','WhatsApp contact button','Basic analytics'], cta:'Get Started', href:'/auth' },
                { name:'Standard', price:'KSH 1,500', period:'per month', color:'#1565C0', features:['5 active listings','20 photos per listing','Priority placement','Featured badge','Full analytics dashboard','Saved search alerts'], cta:'Start Standard', href:'/auth', featured:true },
                { name:'Dealer Pro', price:'KSH 7,500', period:'per month', color:'#0A2540', features:['Unlimited listings','Unlimited photos','Top placement always','Dealer profile page','Lead tracking CRM','Verified dealer badge','Offer requests from buyers'], cta:'Contact Sales', href:'mailto:hello@carexpertafrica.com' },
              ].map(plan => (
                <div key={plan.name} style={{ background:'#fff', border:`2px solid ${plan.featured?'#1565C0':'#E8EDF3'}`, borderRadius:14, padding:20, position:'relative', boxShadow:plan.featured?'0 8px 32px rgba(21,101,192,.15)':'none' }}>
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
            <div style={{ background:'#fff', border:'1.5px solid #E8EDF3', borderRadius:14, padding:24, marginBottom:14, textAlign:'center' }}>
              <div style={{ fontFamily:'Outfit,sans-serif', fontSize:15, fontWeight:700, color:'#0A2540', marginBottom:14 }}>Joining {displayDealers.length}+ Dealers on CarExpert Africa</div>
              <div style={{ display:'flex', justifyContent:'center', flexWrap:'wrap', gap:8, marginBottom:14 }}>
                {displayDealers.slice(0,6).map((d,i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:6, background:'#F8FAFC', border:'1px solid #E8EDF3', borderRadius:100, padding:'6px 12px' }}>
                    <div style={{ width:20, height:20, borderRadius:'50%', background:'#0A2540', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Outfit,sans-serif', fontSize:9, fontWeight:800, color:'#fff', flexShrink:0 }}>{d.name[0]}</div>
                    <span style={{ fontSize:11, fontWeight:600, color:'#475569' }}>{d.name}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ background:'#0A2540', borderRadius:14, padding:24, textAlign:'center' }}>
              <div style={{ fontFamily:'Outfit,sans-serif', fontSize:18, fontWeight:800, color:'#fff', marginBottom:8 }}>Enterprise / Fleet Dealers</div>
              <div style={{ fontSize:13, color:'rgba(255,255,255,.55)', marginBottom:16 }}>Managing 50+ vehicles? Custom pricing, dedicated support, API access.</div>
              <a href="mailto:hello@carexpertafrica.com" style={{ background:'#4DA6FF', color:'#0A2540', padding:'12px 28px', borderRadius:9, fontWeight:800, fontSize:13, textDecoration:'none', fontFamily:'Outfit,sans-serif', display:'inline-block' }}>Contact Us →</a>
            </div>
          </>
        )}

        {/* RESULTS TAB */}
        {activeTab === 'results' && (
          <div>
            {loadingStats ? (
              <div style={{ textAlign:'center', padding:60, color:'#94A3B8' }}>Loading platform data...</div>
            ) : (
              <>
                {/* Hero stats */}
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(160px,1fr))', gap:12, marginBottom:24 }}>
                  {[
                    ['🚗', stats?.approved || 0, 'Live Listings', '#EEF5FF', '#1565C0'],
                    ['👁', stats?.totalViews || 0, 'Total Views', '#F0FDF4', '#16A34A'],
                    ['⭐', stats?.featuredCount || 0, 'Featured Cars', '#FFFBEB', '#D97706'],
                    ['📊', stats?.avgViews || 0, 'Avg Views/Listing', '#F5F3FF', '#7C3AED'],
                  ].map(([icon, val, label, bg, color]) => (
                    <div key={label} style={{ background:'#fff', border:'1.5px solid #E8EDF3', borderRadius:12, padding:16, textAlign:'center' }}>
                      <div style={{ width:40, height:40, borderRadius:10, background:bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, margin:'0 auto 10px' }}>{icon}</div>
                      <div style={{ fontFamily:'Outfit,sans-serif', fontSize:22, fontWeight:900, color, marginBottom:3 }}>{Number(val).toLocaleString()}</div>
                      <div style={{ fontSize:11, color:'#94A3B8' }}>{label}</div>
                    </div>
                  ))}
                </div>

                {/* Featured vs Standard */}
                <div style={{ background:'#fff', border:'1.5px solid #E8EDF3', borderRadius:14, padding:20, marginBottom:14 }}>
                  <div style={{ fontFamily:'Outfit,sans-serif', fontSize:15, fontWeight:700, color:'#0A2540', marginBottom:6, display:'flex', alignItems:'center', gap:8 }}>
                    <span style={{ width:3, height:15, background:'#1565C0', borderRadius:2, display:'inline-block' }}/> Featured vs Standard Performance
                  </div>
                  <div style={{ fontSize:12, color:'#94A3B8', marginBottom:18 }}>Average views per listing on the platform</div>
                  {[
                    ['⭐ Featured Listings', stats?.featuredAvgViews || 0, '#F59E0B', stats?.featuredAvgViews || 0],
                    ['📋 Standard Listings', stats?.avgViews || 0, '#1565C0', stats?.avgViews || 0],
                  ].map(([label, val, color]) => {
                    const max = Math.max(stats?.featuredAvgViews || 1, stats?.avgViews || 1)
                    const pct = max > 0 ? (val / max) * 100 : 0
                    return (
                      <div key={label} style={{ marginBottom:14 }}>
                        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                          <span style={{ fontSize:13, fontWeight:600, color:'#0A2540' }}>{label}</span>
                          <span style={{ fontFamily:'Outfit,sans-serif', fontSize:13, fontWeight:800, color }}>{val.toLocaleString()} views avg</span>
                        </div>
                        <div style={{ height:10, borderRadius:100, background:'#F0F4F8', overflow:'hidden' }}>
                          <div className="stat-bar" style={{ height:'100%', borderRadius:100, background:color, width: animVal > 0 ? `${pct}%` : '0%', transition:'width 1.2s cubic-bezier(.4,0,.2,1)' }}/>
                        </div>
                      </div>
                    )
                  })}
                  {stats?.featuredAvgViews > stats?.avgViews && (
                    <div style={{ background:'#FFFBEB', border:'1px solid #FCD34D', borderRadius:8, padding:'10px 14px', fontSize:12, color:'#92400E', marginTop:8 }}>
                      ⭐ Featured listings get <strong>{Math.round((stats.featuredAvgViews / Math.max(stats.avgViews, 1) - 1) * 100)}% more views</strong> than standard listings
                    </div>
                  )}
                </div>

                {/* Top makes */}
                {stats?.topMakes?.length > 0 && (
                  <div style={{ background:'#fff', border:'1.5px solid #E8EDF3', borderRadius:14, padding:20, marginBottom:14 }}>
                    <div style={{ fontFamily:'Outfit,sans-serif', fontSize:15, fontWeight:700, color:'#0A2540', marginBottom:4, display:'flex', alignItems:'center', gap:8 }}>
                      <span style={{ width:3, height:15, background:'#1565C0', borderRadius:2, display:'inline-block' }}/> Most Listed Makes
                    </div>
                    <div style={{ fontSize:12, color:'#94A3B8', marginBottom:16 }}>What buyers are searching for most on CEA</div>
                    {stats.topMakes.map(([make, count], i) => {
                      const max = stats.topMakes[0][1]
                      const pct = (count / max) * 100
                      const colors = ['#1565C0','#0D9488','#7C3AED','#D97706','#DC2626']
                      return (
                        <div key={make} style={{ marginBottom:12 }}>
                          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                              <span style={{ fontFamily:'Outfit,sans-serif', fontSize:11, fontWeight:800, color:'#94A3B8', width:16 }}>#{i+1}</span>
                              <span style={{ fontSize:13, fontWeight:700, color:'#0A2540' }}>{make}</span>
                            </div>
                            <span style={{ fontSize:12, color:'#94A3B8' }}>{count} listing{count!==1?'s':''}</span>
                          </div>
                          <div style={{ height:8, borderRadius:100, background:'#F0F4F8', overflow:'hidden' }}>
                            <div className="stat-bar" style={{ height:'100%', borderRadius:100, background:colors[i], width: animVal > 0 ? `${pct}%` : '0%', transition:`width ${1 + i*0.15}s cubic-bezier(.4,0,.2,1)` }}/>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Body types */}
                {stats?.topBodies?.length > 0 && (
                  <div style={{ background:'#fff', border:'1.5px solid #E8EDF3', borderRadius:14, padding:20, marginBottom:14 }}>
                    <div style={{ fontFamily:'Outfit,sans-serif', fontSize:15, fontWeight:700, color:'#0A2540', marginBottom:4, display:'flex', alignItems:'center', gap:8 }}>
                      <span style={{ width:3, height:15, background:'#1565C0', borderRadius:2, display:'inline-block' }}/> Most Popular Body Types
                    </div>
                    <div style={{ fontSize:12, color:'#94A3B8', marginBottom:16 }}>Body styles with highest buyer demand</div>
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(130px,1fr))', gap:10 }}>
                      {stats.topBodies.map(([body, count], i) => {
                        const icons = { SUV:'🚙', Sedan:'🚗', Pickup:'🛻', Hatchback:'🚘', Minivan:'🚐', Coupe:'🏎', Wagon:'🚗', Truck:'🚚' }
                        const colors = ['#1565C0','#0D9488','#7C3AED','#D97706','#DC2626']
                        return (
                          <div key={body} style={{ background:'#F8FAFC', border:`2px solid ${i===0?colors[0]:'#E8EDF3'}`, borderRadius:10, padding:'14px 10px', textAlign:'center' }}>
                            <div style={{ fontSize:28, marginBottom:6 }}>{icons[body] || '🚗'}</div>
                            <div style={{ fontFamily:'Outfit,sans-serif', fontSize:12, fontWeight:700, color:'#0A2540' }}>{body}</div>
                            <div style={{ fontSize:20, fontWeight:900, color:colors[i], fontFamily:'Outfit,sans-serif' }}>{count}</div>
                            <div style={{ fontSize:10, color:'#94A3B8' }}>listings</div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Why list CTA */}
                <div style={{ background:'linear-gradient(135deg,#0A2540,#1565C0)', borderRadius:14, padding:28, textAlign:'center' }}>
                  <div style={{ fontFamily:'Outfit,sans-serif', fontSize:20, fontWeight:800, color:'#fff', marginBottom:8 }}>Ready to Sell Your Car Faster?</div>
                  <div style={{ fontSize:14, color:'rgba(255,255,255,.6)', marginBottom:20 }}>Join {displayDealers.length}+ dealers and thousands of private sellers reaching buyers across Kenya every day.</div>
                  <div style={{ display:'flex', justifyContent:'center', gap:12, flexWrap:'wrap' }}>
                    <Link to="/list-car" style={{ background:'#4DA6FF', color:'#0A2540', padding:'12px 24px', borderRadius:9, fontWeight:800, fontSize:13, textDecoration:'none', fontFamily:'Outfit,sans-serif', display:'inline-block' }}>List a Car Free →</Link>
                    <button onClick={() => setActiveTab('plans')} style={{ background:'rgba(255,255,255,.1)', color:'#fff', border:'1.5px solid rgba(255,255,255,.25)', padding:'12px 24px', borderRadius:9, fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'Outfit,sans-serif' }}>View Plans</button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* FAQ TAB */}
        {activeTab === 'faq' && (
          <div>
            {[
              ['How long does it take to get my listing live?', 'All listings are reviewed by our team and go live within 1–2 hours during business hours (Mon–Sat, 8am–6pm EAT). You\'ll be notified once approved.'],
              ['How do buyers contact me?', 'Buyers can contact you directly via WhatsApp or phone call using the details you provide. All enquiries go straight to you — no middleman.'],
              ['Can I list multiple cars on the Free plan?', 'The Free plan allows 1 active listing at a time. Upgrade to Standard for 5 listings, or Dealer Pro for unlimited.'],
              ['How do featured listings work?', 'Featured listings appear at the top of search results and on the homepage. They get significantly more views than standard listings. Featured status can be purchased from the dashboard.'],
              ['What photos should I upload?', 'Upload at least 6 clear photos: front, rear, driver side, passenger side, dashboard/interior, and engine bay. Good photos dramatically increase buyer enquiries.'],
              ['Is my phone number shown publicly?', 'Yes — buyers contact you directly. If you prefer privacy, you can use a separate WhatsApp number or our messaging feature (coming soon).'],
              ['Can I edit my listing after submitting?', 'Yes — go to your Dashboard → My Listings → Edit. Any major changes may require re-approval.'],
              ['How do I get a dealer cash offer?', 'Use our free Valuation tool at /valuation. After getting your estimate, click "Get Dealer Offer" and fill in your contact details. Verified dealers in our network will respond within 24 hours.'],
              ['What payment methods are accepted?', 'M-Pesa and card payments are coming soon. For now, contact us at hello@carexpertafrica.com to upgrade your plan.'],
              ['How do I become a verified dealer?', 'Contact us at hello@carexpertafrica.com with your business registration details. Verified dealers get a badge and priority placement.'],
            ].map(([q, a], i) => <FaqItem key={i} q={q} a={a} />)}
          </div>
        )}
      </div>
    </div>
  )
}

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ background:'#fff', border:'1.5px solid #E8EDF3', borderRadius:12, marginBottom:8, overflow:'hidden' }}>
      <div onClick={() => setOpen(!open)} style={{ padding:'16px 18px', display:'flex', justifyContent:'space-between', alignItems:'center', cursor:'pointer' }}>
        <div style={{ fontFamily:'Outfit,sans-serif', fontSize:14, fontWeight:700, color:'#0A2540', paddingRight:12 }}>{q}</div>
        <span style={{ fontSize:18, color:'#94A3B8', flexShrink:0, transform:open?'rotate(45deg)':'none', transition:'transform .2s' }}>+</span>
      </div>
      {open && <div style={{ padding:'0 18px 16px', fontSize:13, color:'#475569', lineHeight:1.7, borderTop:'1px solid #F0F4F8' }}>{a}</div>}
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
  const [searchParams] = useSearchParams()
  const [step, setStep] = useState(1)
  const [make, setMake] = useState(searchParams.get('make') || 'Toyota')
  const [model, setModel] = useState(searchParams.get('model') || '')
  const [variant, setVariant] = useState(searchParams.get('variant') || '')
  const [year, setYear] = useState(searchParams.get('year') || '2020')
  const [km, setKm] = useState(searchParams.get('km') || '')
  const [engineCc, setEngineCc] = useState(searchParams.get('engine_cc') || '')
  const [bodyType, setBodyType] = useState('SUV')
  const [fuel, setFuel] = useState(searchParams.get('fuel') || 'Petrol')
  const [transmission, setTx] = useState(searchParams.get('transmission') || 'Automatic')
  const [drive, setDrive] = useState('AWD')
  const [colour, setColour] = useState(searchParams.get('colour') || '')
  const [condition, setCondition] = useState(() => {
    const c = searchParams.get('condition')
    if (!c) return 'Used — Excellent'
    if (c === 'Excellent') return 'Used — Excellent'
    if (c === 'Good') return 'Used — Good'
    if (c === 'Fair') return 'Used — Fair'
    return 'Used — Excellent'
  })
  const [price, setPrice] = useState('')
  const [nego, setNego] = useState(false)
  const [selFeats, setSelFeats] = useState(new Set())
  const [selectedFiles, setSelectedFiles] = useState([])
  const [photoPreviews, setPhotoPreviews] = useState([])
  const [uploadProgress, setUploadProgress] = useState('')
  const [contactName, setContactName] = useState('')
  const [phone, setPhone] = useState('')
  const [location, setLocation] = useState(searchParams.get('location') || 'Nairobi — Westlands')
  const [description, setDescription] = useState('')

  const toggleFeat = f => setSelFeats(prev => { const n=new Set(prev); n.has(f)?n.delete(f):n.add(f); return n })

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files).slice(0, 10)
    setSelectedFiles(prev => [...prev, ...files].slice(0, 10))
    files.forEach(file => {
      const reader = new FileReader()
      reader.onload = ev => setPhotoPreviews(prev => [...prev, ev.target.result].slice(0, 10))
      reader.readAsDataURL(file)
    })
  }

  const removePhoto = (i) => {
    setSelectedFiles(prev => prev.filter((_,idx) => idx !== i))
    setPhotoPreviews(prev => prev.filter((_,idx) => idx !== i))
  }

  const handleSubmit = async () => {
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    if (!currentUser) { alert('Please log in first'); return }
    setUploadProgress('Creating listing...')
    const { data: listing, error } = await supabase.from('listings').insert({
      user_id: currentUser.id, make, model, variant: variant || null, year, mileage: km,
      engine_cc: engineCc, body_type: bodyType, fuel_type: fuel,
      transmission, drive_type: drive, colour, condition, price,
      negotiable: nego, status: 'pending', contact_name: contactName,
      phone, location, description
    }).select().single()
    if (error) { alert('Error: ' + error.message); setUploadProgress(''); return }
    // Upload photos
    if (selectedFiles.length > 0) {
      setUploadProgress(`Uploading ${selectedFiles.length} photo${selectedFiles.length > 1 ? 's' : ''}...`)
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i]
        const ext = file.name.split('.').pop()
        const path = `${listing.id}/${Date.now()}_${i}.${ext}`
        const { error: uploadError } = await supabase.storage.from('listing-photos').upload(path, file)
        if (!uploadError) {
          const { data: urlData } = supabase.storage.from('listing-photos').getPublicUrl(path)
          await supabase.from('listing_photos').insert({ listing_id: listing.id, url: urlData.publicUrl, order: i })
        }
        setUploadProgress(`Uploading photo ${i+1} of ${selectedFiles.length}...`)
      }
    }
    setUploadProgress('')
    setStep(5)
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
              {searchParams.get('make') && (
                <div style={{ background:'#F0FDF4', border:'1px solid #86EFAC', borderRadius:8, padding:'10px 14px', marginBottom:14, fontSize:12, color:'#16A34A', fontWeight:600 }}>
                  ✓ Pre-filled from your valuation — review and complete the remaining details
                </div>
              )}
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

              {/* Upload area */}
              <label style={{ display:'block', cursor:'pointer' }}>
                <input type="file" accept="image/*" multiple onChange={handleFileSelect} style={{ display:'none' }}/>
                <div style={{ border:'2px dashed #BDD5FF', borderRadius:10, padding:'28px 20px', textAlign:'center', background:'#F8FBFF', marginBottom:14 }}>
                  <div style={{ fontSize:36, marginBottom:8 }}>📸</div>
                  <div style={{ fontFamily:'Outfit,sans-serif', fontSize:14, fontWeight:700, color:'#1565C0', marginBottom:4 }}>
                    {photoPreviews.length > 0 ? 'Add More Photos' : 'Tap to Upload Photos'}
                  </div>
                  <div style={{ fontSize:12, color:'#94A3B8' }}>
                    {photoPreviews.length > 0 ? `${photoPreviews.length}/10 photos selected` : 'Up to 10 photos · JPG, PNG, HEIC'}
                  </div>
                </div>
              </label>

              {/* Preview grid */}
              {photoPreviews.length > 0 && (
                <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:8, marginBottom:14 }}>
                  {photoPreviews.map((src, i) => (
                    <div key={i} style={{ position:'relative', aspectRatio:'4/3', borderRadius:8, overflow:'hidden', border:'2px solid #E2E8F0' }}>
                      <img src={src} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                      <button onClick={() => removePhoto(i)}
                        style={{ position:'absolute', top:4, right:4, width:20, height:20, borderRadius:'50%', background:'rgba(0,0,0,.6)', border:'none', color:'#fff', fontSize:12, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', lineHeight:1 }}>×</button>
                      {i === 0 && <span style={{ position:'absolute', bottom:4, left:4, background:'#1565C0', color:'#fff', fontSize:8, fontWeight:700, padding:'2px 5px', borderRadius:4 }}>COVER</span>}
                    </div>
                  ))}
                  {photoPreviews.length < 10 && (
                    <label style={{ cursor:'pointer' }}>
                      <input type="file" accept="image/*" multiple onChange={handleFileSelect} style={{ display:'none' }}/>
                      <div style={{ aspectRatio:'4/3', border:'2px dashed #E2E8F0', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, color:'#CBD5E1' }}>+</div>
                    </label>
                  )}
                </div>
              )}

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
                {make && model && year && km && (() => {
                  const condKey = condition === 'Used — Excellent' || condition === 'Foreign Used — Excellent' ? 'Excellent'
                    : condition === 'Used — Good' || condition === 'Foreign Used — Good' ? 'Good'
                    : condition === 'Used — Fair' ? 'Fair'
                    : condition === 'New' ? 'Excellent' : 'Good'
                  const base = getBase(make, model)
                  const raw = base * (condMult[condKey] || 1.0) * kmMult(Number(km)) * yearMult(Number(year)) * txMult(transmission) * fuelMult(fuel)
                  const suggested = Math.round(raw / 50000) * 50000
                  const low = Math.round(suggested * 0.88 / 50000) * 50000
                  const high = Math.round(suggested * 1.12 / 50000) * 50000
                  return (
                    <div style={{ marginTop:8, background:'#EEF5FF', border:'1px solid #BDD5FF', borderRadius:8, padding:'10px 12px', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:8 }}>
                      <div>
                        <div style={{ fontSize:11, color:'#64748B', marginBottom:2 }}>💡 Suggested listing price</div>
                        <div style={{ fontFamily:'Outfit,sans-serif', fontSize:15, fontWeight:800, color:'#1565C0' }}>KSH {suggested.toLocaleString()}</div>
                        <div style={{ fontSize:10, color:'#94A3B8' }}>Range: KSH {low.toLocaleString()} – {high.toLocaleString()}</div>
                      </div>
                      <button type="button" onClick={() => setPrice(String(suggested))}
                        style={{ background:'#1565C0', color:'#fff', border:'none', padding:'8px 14px', borderRadius:7, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'Outfit,sans-serif', whiteSpace:'nowrap' }}>
                        Use this price
                      </button>
                    </div>
                  )
                })()}
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
                <button onClick={handleSubmit} disabled={!!uploadProgress} style={{ background: uploadProgress?'#94A3B8':'#16A34A', color:'#fff', border:'none', padding:'11px 24px', borderRadius:8, fontSize:13, fontWeight:700, cursor: uploadProgress?'default':'pointer', fontFamily:'Outfit,sans-serif' }}>
                  {uploadProgress || 'Submit Listing ✓'}
                </button>
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
            <div style={{ height:130, background:'#C8DCF0', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, color:'#94A3B8', overflow:'hidden' }}>
              {photoPreviews[0]
                ? <img src={photoPreviews[0]} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                : photoPreviews.length > 0 ? '📸 Photos added' : 'Add photos to preview'
              }
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
function PerformanceTab({ user, listings }) {
  const [leads, setLeads] = useState([])
  const [priceHistory, setPriceHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const fmt = n => 'KSH ' + Number(n).toLocaleString()

  useEffect(() => {
    if (!listings.length) { setLoading(false); return }
    const ids = listings.map(l => l.id)
    Promise.all([
      supabase.from('listing_leads').select('listing_id, lead_type, created_at').in('listing_id', ids),
      supabase.from('price_history').select('listing_id, old_price, new_price, changed_at').in('listing_id', ids).order('changed_at', { ascending: false })
    ]).then(([leadsRes, priceRes]) => {
      setLeads(leadsRes.data || [])
      setPriceHistory(priceRes.data || [])
      setLoading(false)
    })
  }, [listings])

  if (loading) return <div style={{ textAlign:'center', padding:40, color:'#94A3B8' }}>Loading performance data...</div>
  if (!listings.length) return (
    <div style={{ textAlign:'center', padding:48, background:'#fff', borderRadius:12, border:'1.5px solid #E8EDF3' }}>
      <div style={{ fontSize:32, marginBottom:12 }}>📊</div>
      <div style={{ fontFamily:'Outfit,sans-serif', fontSize:15, fontWeight:700, color:'#0A2540', marginBottom:6 }}>No listings yet</div>
      <Link to="/list-car" style={{ background:'#1565C0', color:'#fff', padding:'10px 20px', borderRadius:8, fontSize:13, fontWeight:700, textDecoration:'none', fontFamily:'Outfit,sans-serif' }}>List Your First Car</Link>
    </div>
  )

  const getLeads = (id, type) => leads.filter(l => l.listing_id === id && (!type || l.lead_type === type)).length
  const totalViews = listings.reduce((a, l) => a + (l.views || 0), 0)
  const totalLeads = leads.length
  const sorted = [...listings].sort((a, b) => (b.views || 0) + getLeads(b.id)*3 - ((a.views || 0) + getLeads(a.id)*3))
  const best = sorted[0]
  const worst = sorted[sorted.length - 1]

  return (
    <div>
      <div style={{ fontFamily:'Outfit,sans-serif', fontSize:16, fontWeight:800, color:'#0A2540', marginBottom:16 }}>📊 Listing Performance</div>

      {/* Summary stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(140px,1fr))', gap:10, marginBottom:20 }}>
        {[
          ['👁', totalViews, 'Total Views', '#1565C0','#EEF5FF'],
          ['📞', leads.filter(l=>l.lead_type==='call').length, 'Call Clicks', '#16A34A','#DCFCE7'],
          ['📱', leads.filter(l=>l.lead_type==='whatsapp').length, 'WhatsApp Clicks', '#25D366','#F0FDF4'],
          ['🤝', leads.filter(l=>l.lead_type==='offer').length, 'Offers', '#D97706','#FFFBEB'],
          ['📅', leads.filter(l=>l.lead_type==='test_drive').length, 'Test Drives', '#7C3AED','#F5F3FF'],
        ].map(([icon,val,label,color,bg]) => (
          <div key={label} style={{ background:'#fff', border:'1.5px solid #E8EDF3', borderRadius:12, padding:'14px 12px', textAlign:'center' }}>
            <div style={{ width:34, height:34, borderRadius:8, background:bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, margin:'0 auto 8px' }}>{icon}</div>
            <div style={{ fontFamily:'Outfit,sans-serif', fontSize:20, fontWeight:900, color, marginBottom:2 }}>{val}</div>
            <div style={{ fontSize:10, color:'#94A3B8' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Best/Worst */}
      {listings.length > 1 && best && worst && best.id !== worst.id && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:20 }}>
          {[['🏆 Best Performer', best, '#DCFCE7', '#16A34A'], ['⚠️ Needs Attention', worst, '#FEF3C7', '#D97706']].map(([label, car, bg, color]) => (
            <div key={car.id} style={{ background:bg, border:`1.5px solid ${color}33`, borderRadius:12, padding:14 }}>
              <div style={{ fontSize:11, fontWeight:700, color, marginBottom:6 }}>{label}</div>
              <div style={{ fontFamily:'Outfit,sans-serif', fontSize:13, fontWeight:700, color:'#0A2540', marginBottom:4 }}>{car.year} {car.make} {car.model}</div>
              <div style={{ fontSize:12, color:'#64748B', marginBottom:8 }}>{fmt(car.price)}</div>
              <div style={{ display:'flex', gap:8, fontSize:11, color:'#475569', flexWrap:'wrap' }}>
                <span>👁 {car.views || 0} views</span>
                <span>📞 {getLeads(car.id)} leads</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Per-listing breakdown */}
      <div style={{ fontFamily:'Outfit,sans-serif', fontSize:14, fontWeight:700, color:'#0A2540', marginBottom:12 }}>All Listings</div>
      {listings.map(l => {
        const lLeads = getLeads(l.id)
        const calls = getLeads(l.id, 'call')
        const wa = getLeads(l.id, 'whatsapp')
        const offers = getLeads(l.id, 'offer')
        const testDrives = getLeads(l.id, 'test_drive')
        const maxBar = Math.max(1, ...listings.map(x => (x.views||0) + getLeads(x.id)*5))
        const score = (l.views||0) + lLeads*5
        const ph = priceHistory.filter(p => p.listing_id === l.id)

        return (
          <div key={l.id} style={{ background:'#fff', border:'1.5px solid #E8EDF3', borderRadius:12, padding:16, marginBottom:10 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12, flexWrap:'wrap', gap:8 }}>
              <div>
                <div style={{ fontFamily:'Outfit,sans-serif', fontSize:14, fontWeight:700, color:'#0A2540' }}>{l.year} {l.make} {l.model}{l.variant?` — ${l.variant}`:''}</div>
                <div style={{ fontSize:12, color:'#1565C0', fontWeight:700, marginTop:2 }}>{fmt(l.price)}</div>
              </div>
              <div style={{ display:'flex', gap:6 }}>
                <Link to={`/listings/${l.id}`} style={{ fontSize:11, color:'#1565C0', background:'#F0F6FF', border:'1.5px solid #BDD5FF', padding:'5px 10px', borderRadius:6, textDecoration:'none', fontWeight:700, fontFamily:'Outfit,sans-serif' }}>View</Link>
                <Link to={`/edit-listing/${l.id}`} style={{ fontSize:11, color:'#475569', background:'#F8FAFC', border:'1.5px solid #E2E8F0', padding:'5px 10px', borderRadius:6, textDecoration:'none', fontWeight:700, fontFamily:'Outfit,sans-serif' }}>Edit</Link>
              </div>
            </div>
            {/* Performance bar */}
            <div style={{ height:8, background:'#F0F4F8', borderRadius:100, marginBottom:10, overflow:'hidden' }}>
              <div style={{ height:'100%', borderRadius:100, background:'linear-gradient(90deg,#1565C0,#4DA6FF)', width:`${Math.min(100, (score/maxBar)*100)}%`, transition:'width 1s' }}/>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:6 }}>
              {[['👁',l.views||0,'Views'],['📞',calls,'Calls'],['📱',wa,'WhatsApp'],['🤝',offers,'Offers'],['📅',testDrives,'Test Drives']].map(([icon,val,lbl]) => (
                <div key={lbl} style={{ textAlign:'center', background:'#F8FAFC', borderRadius:8, padding:'8px 4px' }}>
                  <div style={{ fontSize:14 }}>{icon}</div>
                  <div style={{ fontFamily:'Outfit,sans-serif', fontSize:14, fontWeight:800, color:'#0A2540' }}>{val}</div>
                  <div style={{ fontSize:9, color:'#94A3B8' }}>{lbl}</div>
                </div>
              ))}
            </div>
            {/* Price history */}
            {ph.length > 0 && (
              <div style={{ marginTop:10, padding:'8px 10px', background:'#FFFBEB', borderRadius:8, border:'1px solid #FCD34D' }}>
                <div style={{ fontSize:10, fontWeight:700, color:'#92400E', marginBottom:4 }}>💰 Price History</div>
                {ph.slice(0,3).map((p,i) => (
                  <div key={i} style={{ fontSize:11, color:'#475569', display:'flex', gap:8 }}>
                    <span style={{ color: p.new_price < p.old_price ? '#16A34A' : '#DC2626' }}>
                      {p.new_price < p.old_price ? '↓' : '↑'} {fmt(p.new_price)}
                    </span>
                    <span style={{ color:'#94A3B8' }}>from {fmt(p.old_price)} · {new Date(p.changed_at).toLocaleDateString('en-GB', {day:'numeric',month:'short'})}</span>
                  </div>
                ))}
              </div>
            )}
            {/* Suggestions */}
            {(l.views || 0) < 10 && lLeads === 0 && (
              <div style={{ marginTop:10, fontSize:11, color:'#D97706', background:'#FFFBEB', borderRadius:8, padding:'8px 10px', border:'1px solid #FCD34D' }}>
                💡 <strong>Low visibility</strong> — Consider adding more photos, lowering the price, or upgrading to Featured
              </div>
            )}
            {(l.views || 0) > 20 && lLeads === 0 && (
              <div style={{ marginTop:10, fontSize:11, color:'#DC2626', background:'#FEE2E2', borderRadius:8, padding:'8px 10px', border:'1px solid #FECACA' }}>
                ⚠️ <strong>High views, no leads</strong> — Price may be too high. Similar cars sell for {fmt(Math.round(l.price * 0.92 / 50000)*50000)}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function OffersTab({ user, listings }) {
  const [offers, setOffers] = useState([])
  const [loading, setLoading] = useState(true)
  const fmt = n => 'KSH ' + Number(n).toLocaleString()

  useEffect(() => {
    if (!listings.length) { setLoading(false); return }
    const ids = listings.map(l => l.id)
    supabase.from('offers').select('*').in('listing_id', ids).order('created_at', { ascending: false })
      .then(({ data }) => { setOffers(data || []); setLoading(false) })
  }, [listings])

  const respond = async (id, status, counter) => {
    await supabase.from('offers').update({ status, counter_amount: counter || null }).eq('id', id)
    setOffers(prev => prev.map(o => o.id === id ? { ...o, status, counter_amount: counter||null } : o))
  }

  const getListing = (id) => listings.find(l => l.id === id)
  const statusColor = s => ({ pending:'#D97706', accepted:'#16A34A', declined:'#DC2626', countered:'#1565C0' }[s] || '#94A3B8')
  const statusBg = s => ({ pending:'#FFFBEB', accepted:'#DCFCE7', declined:'#FEE2E2', countered:'#EEF5FF' }[s] || '#F8FAFC')

  if (loading) return <div style={{ textAlign:'center', padding:40, color:'#94A3B8' }}>Loading offers...</div>

  return (
    <div>
      <div style={{ fontFamily:'Outfit,sans-serif', fontSize:16, fontWeight:800, color:'#0A2540', marginBottom:16 }}>
        🤝 Offers Received <span style={{ color:'#94A3B8', fontWeight:400, fontSize:13 }}>({offers.length})</span>
      </div>
      {offers.length === 0 ? (
        <div style={{ textAlign:'center', padding:48, background:'#fff', borderRadius:12, border:'1.5px solid #E8EDF3' }}>
          <div style={{ fontSize:32, marginBottom:12 }}>🤝</div>
          <div style={{ fontFamily:'Outfit,sans-serif', fontSize:15, fontWeight:700, color:'#0A2540' }}>No offers yet</div>
          <div style={{ fontSize:13, color:'#94A3B8', marginTop:4 }}>Offers from buyers will appear here</div>
        </div>
      ) : offers.map(o => {
        const listing = getListing(o.listing_id)
        const [countering, setCountering] = useState(false)
        const [counterAmt, setCounterAmt] = useState('')
        return (
          <div key={o.id} style={{ background:'#fff', border:'1.5px solid #E8EDF3', borderRadius:12, padding:16, marginBottom:10 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12, flexWrap:'wrap', gap:8 }}>
              <div>
                {listing && <div style={{ fontSize:12, color:'#94A3B8', marginBottom:2 }}>{listing.year} {listing.make} {listing.model}</div>}
                <div style={{ fontFamily:'Outfit,sans-serif', fontSize:18, fontWeight:800, color:'#0A2540' }}>Offer: {fmt(o.offer_amount)}</div>
                {listing && <div style={{ fontSize:11, color:'#64748B' }}>Asking: {fmt(listing.price)} · {Math.round((o.offer_amount/listing.price-1)*100)}% {o.offer_amount < listing.price ? 'below' : 'above'} asking</div>}
              </div>
              <span style={{ fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:100, background:statusBg(o.status), color:statusColor(o.status) }}>{o.status}</span>
            </div>
            <div style={{ fontSize:13, color:'#475569', marginBottom:12 }}>
              <span style={{ fontWeight:600 }}>{o.buyer_name}</span> · {o.buyer_phone}
              {o.message && <div style={{ marginTop:4, fontStyle:'italic', color:'#64748B' }}>"{o.message}"</div>}
            </div>
            {o.counter_amount && <div style={{ fontSize:12, color:'#1565C0', fontWeight:600, marginBottom:8 }}>Your counter offer: {fmt(o.counter_amount)}</div>}
            {o.status === 'pending' && (
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                <button onClick={() => respond(o.id, 'accepted', null)}
                  style={{ background:'#16A34A', color:'#fff', border:'none', padding:'8px 16px', borderRadius:7, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'Outfit,sans-serif' }}>✓ Accept</button>
                <button onClick={() => setCountering(!countering)}
                  style={{ background:'#1565C0', color:'#fff', border:'none', padding:'8px 16px', borderRadius:7, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'Outfit,sans-serif' }}>↩ Counter</button>
                <button onClick={() => respond(o.id, 'declined', null)}
                  style={{ background:'#FEE2E2', color:'#DC2626', border:'none', padding:'8px 16px', borderRadius:7, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'Outfit,sans-serif' }}>✕ Decline</button>
                <a href={`https://wa.me/${o.buyer_phone.replace(/\D/g,'')}?text=Hi ${o.buyer_name}, regarding your offer of ${fmt(o.offer_amount)} on my ${listing?.year} ${listing?.make} ${listing?.model}...`}
                  target="_blank" rel="noopener noreferrer"
                  style={{ background:'#25D366', color:'#fff', padding:'8px 16px', borderRadius:7, fontSize:12, fontWeight:700, textDecoration:'none' }}>📱 WhatsApp</a>
              </div>
            )}
            {countering && (
              <div style={{ marginTop:10, display:'flex', gap:8, alignItems:'center' }}>
                <input type="number" value={counterAmt} onChange={e => setCounterAmt(e.target.value)} placeholder="Counter offer amount"
                  style={{ flex:1, padding:'9px 12px', border:'1.5px solid #E2E8F0', borderRadius:7, fontSize:13, outline:'none' }}/>
                <button onClick={() => { respond(o.id, 'countered', Number(counterAmt)); setCountering(false) }}
                  style={{ background:'#1565C0', color:'#fff', border:'none', padding:'9px 16px', borderRadius:7, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'Outfit,sans-serif' }}>Send Counter</button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function TestDrivesTab({ user, listings }) {
  const [drives, setDrives] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!listings.length) { setLoading(false); return }
    const ids = listings.map(l => l.id)
    supabase.from('test_drives').select('*').in('listing_id', ids).order('preferred_date', { ascending: true })
      .then(({ data }) => { setDrives(data || []); setLoading(false) })
  }, [listings])

  const respond = async (id, status) => {
    await supabase.from('test_drives').update({ status }).eq('id', id)
    setDrives(prev => prev.map(d => d.id === id ? { ...d, status } : d))
  }

  const getListing = (id) => listings.find(l => l.id === id)
  const statusColor = s => ({ pending:'#D97706', confirmed:'#16A34A', declined:'#DC2626', completed:'#475569' }[s] || '#94A3B8')
  const statusBg = s => ({ pending:'#FFFBEB', confirmed:'#DCFCE7', declined:'#FEE2E2', completed:'#F8FAFC' }[s] || '#F8FAFC')
  const isPast = d => new Date(d.preferred_date) < new Date()

  if (loading) return <div style={{ textAlign:'center', padding:40, color:'#94A3B8' }}>Loading...</div>

  return (
    <div>
      <div style={{ fontFamily:'Outfit,sans-serif', fontSize:16, fontWeight:800, color:'#0A2540', marginBottom:16 }}>
        📅 Test Drive Requests <span style={{ color:'#94A3B8', fontWeight:400, fontSize:13 }}>({drives.length})</span>
      </div>
      {drives.length === 0 ? (
        <div style={{ textAlign:'center', padding:48, background:'#fff', borderRadius:12, border:'1.5px solid #E8EDF3' }}>
          <div style={{ fontSize:32, marginBottom:12 }}>📅</div>
          <div style={{ fontFamily:'Outfit,sans-serif', fontSize:15, fontWeight:700, color:'#0A2540' }}>No test drive requests yet</div>
        </div>
      ) : drives.map(d => {
        const listing = getListing(d.listing_id)
        const past = isPast(d)
        return (
          <div key={d.id} style={{ background:'#fff', border:'1.5px solid #E8EDF3', borderRadius:12, padding:16, marginBottom:10, opacity: past && d.status === 'pending' ? 0.7 : 1 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10, flexWrap:'wrap', gap:8 }}>
              <div>
                {listing && <div style={{ fontSize:11, color:'#94A3B8', marginBottom:2 }}>{listing.year} {listing.make} {listing.model}</div>}
                <div style={{ fontFamily:'Outfit,sans-serif', fontSize:16, fontWeight:800, color:'#0A2540' }}>
                  {new Date(d.preferred_date).toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'long' })} at {d.preferred_time}
                </div>
                {past && <div style={{ fontSize:10, color:'#D97706', fontWeight:600 }}>⚠️ Past date</div>}
              </div>
              <span style={{ fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:100, background:statusBg(d.status), color:statusColor(d.status) }}>{d.status}</span>
            </div>
            <div style={{ fontSize:13, color:'#475569', marginBottom:10 }}>
              <span style={{ fontWeight:600 }}>{d.buyer_name}</span> · {d.buyer_phone}
              {d.message && <div style={{ marginTop:4, fontStyle:'italic', color:'#64748B' }}>"{d.message}"</div>}
            </div>
            {d.status === 'pending' && (
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                <button onClick={() => respond(d.id, 'confirmed')}
                  style={{ background:'#16A34A', color:'#fff', border:'none', padding:'8px 16px', borderRadius:7, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'Outfit,sans-serif' }}>✓ Confirm</button>
                <button onClick={() => respond(d.id, 'declined')}
                  style={{ background:'#FEE2E2', color:'#DC2626', border:'none', padding:'8px 16px', borderRadius:7, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'Outfit,sans-serif' }}>✕ Decline</button>
                <a href={`https://wa.me/${d.buyer_phone.replace(/\D/g,'')}?text=Hi ${d.buyer_name}, confirming your test drive on ${new Date(d.preferred_date).toLocaleDateString('en-GB')} at ${d.preferred_time}`}
                  target="_blank" rel="noopener noreferrer"
                  style={{ background:'#25D366', color:'#fff', padding:'8px 16px', borderRadius:7, fontSize:12, fontWeight:700, textDecoration:'none' }}>📱 Confirm via WhatsApp</a>
              </div>
            )}
            {d.status === 'confirmed' && (
              <button onClick={() => respond(d.id, 'completed')}
                style={{ background:'#F8FAFC', color:'#475569', border:'1.5px solid #E2E8F0', padding:'8px 16px', borderRadius:7, fontSize:12, fontWeight:600, cursor:'pointer' }}>Mark Completed</button>
            )}
          </div>
        )
      })}
    </div>
  )
}

function SavedArticlesTab({ user }) {
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    supabase.from('saved_articles')
      .select('id, created_at, articles(id, title, slug, cover_image_url, category, author_name, read_time, published_at, excerpt)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setArticles((data || []).map(s => s.articles).filter(Boolean))
        setLoading(false)
      })
  }, [user])

  const unsave = async (articleId) => {
    await supabase.from('saved_articles').delete().eq('user_id', user.id).eq('article_id', articleId)
    setArticles(prev => prev.filter(a => a.id !== articleId))
  }

  if (loading) return <div style={{ textAlign:'center', padding:40, color:'#94A3B8' }}>Loading...</div>

  return (
    <div>
      <div style={{ fontFamily:'Outfit,sans-serif', fontSize:16, fontWeight:800, color:'#0A2540', marginBottom:14 }}>
        Saved Articles <span style={{ color:'#94A3B8', fontWeight:400, fontSize:13 }}>({articles.length})</span>
      </div>
      {articles.length === 0 ? (
        <div style={{ textAlign:'center', padding:48, background:'#fff', borderRadius:12, border:'1.5px solid #E8EDF3' }}>
          <div style={{ fontSize:32, marginBottom:12 }}>📰</div>
          <div style={{ fontFamily:'Outfit,sans-serif', fontSize:15, fontWeight:700, color:'#0A2540', marginBottom:6 }}>No saved articles yet</div>
          <div style={{ fontSize:13, color:'#94A3B8', marginBottom:16 }}>Click 🔖 Save on any article to find it here.</div>
          <Link to="/news" style={{ background:'#1565C0', color:'#fff', padding:'10px 24px', borderRadius:8, fontSize:13, fontWeight:700, textDecoration:'none', fontFamily:'Outfit,sans-serif' }}>Browse News</Link>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px,1fr))', gap:12 }}>
          {articles.map(a => (
            <div key={a.id} style={{ background:'#fff', border:'1.5px solid #E8EDF3', borderRadius:12, overflow:'hidden' }}>
              <div style={{ height:120, background:'linear-gradient(135deg,#EEF5FF,#DBEAFE)', overflow:'hidden' }}>
                {a.cover_image_url
                  ? <img src={a.cover_image_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                  : <div style={{ height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:32 }}>📰</div>}
              </div>
              <div style={{ padding:12 }}>
                <span style={{ background:'#EEF5FF', color:'#1565C0', fontSize:9, fontWeight:700, padding:'2px 8px', borderRadius:100, textTransform:'uppercase' }}>{a.category}</span>
                <div style={{ fontFamily:'Outfit,sans-serif', fontSize:13, fontWeight:700, color:'#0A2540', margin:'6px 0 4px', lineHeight:1.4 }}>{a.title}</div>
                <div style={{ fontSize:11, color:'#94A3B8', marginBottom:10 }}>By {a.author_name} · {a.read_time} min read</div>
                <div style={{ display:'flex', gap:6 }}>
                  <Link to={`/news/${a.slug}`} style={{ flex:1, background:'#F0F6FF', color:'#1565C0', border:'1.5px solid #BDD5FF', padding:'7px 0', borderRadius:6, fontSize:11, fontWeight:700, textDecoration:'none', textAlign:'center', fontFamily:'Outfit,sans-serif' }}>Read →</Link>
                  <button onClick={() => unsave(a.id)} style={{ background:'#FEE2E2', color:'#DC2626', border:'none', padding:'7px 10px', borderRadius:6, fontSize:11, cursor:'pointer' }}>✕</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

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
    { id:'performance', label:'Performance', icon:'📊' },
    { id:'offers', label:'Offers', icon:'🤝' },
    { id:'testdrives', label:'Test Drives', icon:'📅' },
    { id:'saved', label:'Saved Cars', icon:'❤️', badge: savedCars.length },
    { id:'searches', label:'Saved Searches', icon:'🔖' },
    { id:'articles', label:'Saved Articles', icon:'📰' },
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
              ) : myListings.map(l => {
                const daysLeft = l.expires_at ? Math.ceil((new Date(l.expires_at) - new Date()) / 86400000) : null
                const isExpiringSoon = daysLeft !== null && daysLeft <= 7 && daysLeft > 0
                const isExpired = daysLeft !== null && daysLeft <= 0
                const wasBumped = l.bumped_at && (Date.now() - new Date(l.bumped_at)) < 7 * 86400000

                const handleBump = async () => {
                  await supabase.from('listings').update({ bumped_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', l.id)
                  alert('✓ Listing bumped to top! It will appear first in search results.')
                }

                return (
                <div key={l.id} style={{ background:'#fff', border:`1.5px solid ${isExpired?'#FECACA':isExpiringSoon?'#FCD34D':'#E8EDF3'}`, borderRadius:12, padding:14, marginBottom:10 }}>
                  {/* Expiry warning */}
                  {isExpired && <div style={{ background:'#FEE2E2', color:'#DC2626', fontSize:11, fontWeight:700, padding:'6px 10px', borderRadius:7, marginBottom:10 }}>⚠️ This listing has expired. Renew it to keep it visible.</div>}
                  {isExpiringSoon && <div style={{ background:'#FFFBEB', color:'#D97706', fontSize:11, fontWeight:700, padding:'6px 10px', borderRadius:7, marginBottom:10 }}>⏰ Expires in {daysLeft} day{daysLeft!==1?'s':''}</div>}
                  {wasBumped && <div style={{ background:'#F0FDF4', color:'#16A34A', fontSize:11, fontWeight:700, padding:'6px 10px', borderRadius:7, marginBottom:10 }}>🚀 Bumped — showing at top of results</div>}

                  <div style={{ display:'grid', gridTemplateColumns:'72px 1fr auto', gap:12, alignItems:'center' }}>
                    <div style={{ width:72, height:52, borderRadius:7, background:'#EEF5FF', overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center' }}>
                      {l.listing_photos?.[0]?.url ? <img src={l.listing_photos[0].url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/> : <span style={{ fontSize:10, color:'#94A3B8' }}>No photo</span>}
                    </div>
                    <div>
                      <div style={{ fontFamily:'Outfit,sans-serif', fontSize:13, fontWeight:700, color:'#0A2540', marginBottom:2 }}>{l.year} {l.make} {l.model}{l.variant?` — ${l.variant}`:''}</div>
                      <div style={{ fontSize:11, color:'#94A3B8' }}>KSH {Number(l.price).toLocaleString()} · {Number(l.mileage||0).toLocaleString()} km</div>
                      <div style={{ display:'flex', gap:8, marginTop:3, fontSize:11, color:'#64748B' }}>
                        <span>👁 {l.views||0}</span>
                        {l.verified && <span style={{ color:'#16A34A', fontWeight:700 }}>✓ Verified</span>}
                      </div>
                    </div>
                    <div style={{ display:'flex', flexDirection:'column', gap:6, alignItems:'flex-end' }}>
                      <span style={{ fontSize:9, fontWeight:700, padding:'3px 8px', borderRadius:100, background:l.status==='approved'?'#DCFCE7':l.status==='pending'?'#FEF3C7':'#FEE2E2', color:l.status==='approved'?'#16A34A':l.status==='pending'?'#D97706':'#EF4444', fontFamily:'Outfit,sans-serif' }}>
                        {l.status==='approved'?'● Live':l.status==='pending'?'● Pending':'● Declined'}
                      </span>
                      <Link to={`/edit-listing/${l.id}`} style={{ background:'#F0F6FF', color:'#1565C0', border:'1.5px solid #BDD5FF', padding:'5px 10px', borderRadius:6, fontSize:11, fontWeight:700, fontFamily:'Outfit,sans-serif', textDecoration:'none' }}>Edit</Link>
                      {l.status === 'approved' && !wasBumped && (
                        <button onClick={handleBump} style={{ background:'#FFFBEB', color:'#D97706', border:'1.5px solid #FCD34D', padding:'5px 10px', borderRadius:6, fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:'Outfit,sans-serif' }}>🚀 Bump</button>
                      )}
                    </div>
                  </div>
                </div>
                )
              })}
            </div>
          )}

          {tab === 'performance' && <PerformanceTab user={user} listings={myListings} />}
          {tab === 'offers' && <OffersTab user={user} listings={myListings} />}
          {tab === 'testdrives' && <TestDrivesTab user={user} listings={myListings} />}
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

          {tab === 'articles' && (
            <SavedArticlesTab user={user} />
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
function VideosTab({ videos }) {
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState('All')
  const FILTERS = ['All', 'Review', 'Buying Guide', 'Tips', 'News', 'Market Insight']

  const getYouTubeId = (url) => {
    const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?/]+)/)
    return m ? m[1] : null
  }

  const filtered = videos.filter(v => {
    if (activeFilter !== 'All' && v.category !== activeFilter) return false
    if (search && !v.title.toLowerCase().includes(search.toLowerCase()) && !(v.creator_name||'').toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20, flexWrap:'wrap', gap:12 }}>
        <div>
          <div style={{ fontFamily:'Outfit,sans-serif', fontSize:20, fontWeight:800, color:'#0A2540', marginBottom:4 }}>🎬 Videos</div>
          <div style={{ fontSize:13, color:'#94A3B8' }}>{filtered.length} video{filtered.length !== 1 ? 's' : ''} from Kenya's top automotive creators</div>
        </div>
        <div style={{ position:'relative' }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search videos..."
            style={{ padding:'9px 12px 9px 34px', border:'1.5px solid #E2E8F0', borderRadius:8, fontSize:12, fontFamily:'DM Sans,sans-serif', outline:'none', background:'#fff', width:200 }}/>
          <span style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', fontSize:13 }}>🔍</span>
        </div>
      </div>

      {/* Filter chips */}
      <div style={{ display:'flex', gap:6, marginBottom:20, flexWrap:'wrap' }}>
        {FILTERS.map(f => (
          <button key={f} onClick={() => setActiveFilter(f)}
            style={{ padding:'5px 14px', borderRadius:100, border:`1.5px solid ${activeFilter===f?'#1565C0':'#E2E8F0'}`, background:activeFilter===f?'#1565C0':'#fff', color:activeFilter===f?'#fff':'#64748B', fontSize:12, fontWeight:activeFilter===f?700:500, cursor:'pointer', fontFamily:'DM Sans,sans-serif' }}>
            {f}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign:'center', padding:60, background:'#fff', borderRadius:12, border:'1.5px solid #E8EDF3' }}>
          <div style={{ fontSize:48, marginBottom:12 }}>🎬</div>
          <div style={{ fontFamily:'Outfit,sans-serif', fontSize:18, fontWeight:700, color:'#0A2540', marginBottom:8 }}>No videos yet</div>
          <div style={{ fontSize:13, color:'#94A3B8' }}>Videos from Kenya's top automotive creators will appear here</div>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(320px,1fr))', gap:20 }}>
          {filtered.map(v => {
            const ytId = getYouTubeId(v.youtube_url)
            return (
              <div key={v.id} style={{ background:'#fff', border:'1.5px solid #E8EDF3', borderRadius:12, overflow:'hidden', transition:'all .2s' }}
                onMouseOver={e => { e.currentTarget.style.borderColor='#1565C0'; e.currentTarget.style.boxShadow='0 8px 24px rgba(21,101,192,.1)' }}
                onMouseOut={e => { e.currentTarget.style.borderColor='#E8EDF3'; e.currentTarget.style.boxShadow='none' }}>
                {/* YouTube embed */}
                <div style={{ position:'relative', paddingBottom:'56.25%', height:0, overflow:'hidden', background:'#000' }}>
                  <iframe
                    src={`https://www.youtube.com/embed/${ytId}?rel=0`}
                    title={v.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    style={{ position:'absolute', top:0, left:0, width:'100%', height:'100%' }}
                  />
                </div>
                <div style={{ padding:14 }}>
                  <div style={{ display:'flex', gap:6, marginBottom:8, flexWrap:'wrap' }}>
                    <span style={{ background:'#EEF5FF', color:'#1565C0', border:'1px solid #BDD5FF', fontSize:9, fontWeight:700, padding:'2px 8px', borderRadius:100, textTransform:'uppercase' }}>{v.category}</span>
                    {(v.tags || []).slice(0,2).map(tag => (
                      <span key={tag} style={{ background:'#F8FAFC', color:'#94A3B8', border:'1px solid #E8EDF3', fontSize:9, fontWeight:600, padding:'2px 7px', borderRadius:100 }}>#{tag}</span>
                    ))}
                  </div>
                  <div style={{ fontFamily:'Outfit,sans-serif', fontSize:14, fontWeight:700, color:'#0A2540', lineHeight:1.4, marginBottom:6 }}>{v.title}</div>
                  {v.description && <div style={{ fontSize:12, color:'#64748B', lineHeight:1.5, marginBottom:8, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>{v.description}</div>}
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                      <div style={{ width:22, height:22, borderRadius:'50%', background:'#0A2540', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:800, color:'#fff', fontFamily:'Outfit,sans-serif', flexShrink:0 }}>
                        {(v.creator_name||'?')[0].toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize:11, fontWeight:700, color:'#0A2540' }}>{v.creator_name || 'Creator'}</div>
                        {v.creator_channel && <div style={{ fontSize:10, color:'#94A3B8' }}>{v.creator_channel}</div>}
                      </div>
                    </div>
                    <a href={v.youtube_url} target="_blank" rel="noopener noreferrer"
                      style={{ fontSize:11, fontWeight:700, color:'#EF4444', textDecoration:'none', display:'flex', alignItems:'center', gap:4 }}>
                      ▶ YouTube
                    </a>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function NewsSubscribeInline() {
  const [email, setEmail] = useState('')
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)

  const subscribe = async () => {
    if (!email.trim()) return
    setLoading(true)
    const { error } = await supabase.from('subscribers').insert({ email: email.trim() })
    setLoading(false)
    setDone(true)
  }

  if (done) return <div style={{ background:'rgba(255,255,255,.15)', borderRadius:8, padding:'10px 16px', color:'#fff', fontFamily:'Outfit,sans-serif', fontSize:13, fontWeight:700 }}>🎉 You're subscribed!</div>

  return (
    <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
      <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Your email address"
        style={{ padding:'10px 14px', borderRadius:8, border:'none', fontSize:13, fontFamily:'DM Sans,sans-serif', outline:'none', minWidth:200, flex:1 }}/>
      <button onClick={subscribe} disabled={loading || !email.trim()}
        style={{ background: email.trim() ? '#4DA6FF' : '#94A3B8', color:'#0A2540', border:'none', padding:'10px 20px', borderRadius:8, fontSize:13, fontWeight:800, cursor: email.trim() ? 'pointer' : 'default', fontFamily:'Outfit,sans-serif', whiteSpace:'nowrap' }}>
        {loading ? 'Subscribing...' : 'Subscribe Free →'}
      </button>
    </div>
  )
}

export function NewsReviewsPage({ user }) {
  const [articles, setArticles] = useState([])
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('All')
  const [searchQ, setSearchQ] = useState('')
  const [page, setPage] = useState(1)
  const navigate = useNavigate()

  const PER_PAGE = 12
  const CATEGORIES = ['All', 'News', 'Review', 'Buying Guide', 'Tips', 'Market Insight', 'Videos']

  useSEO({ title: 'News & Reviews', description: 'Kenya car market news, expert reviews, buying guides and automotive insights from CarExpert Africa.' })

  useEffect(() => {
    supabase.from('articles').select('id,title,slug,excerpt,cover_image_url,author_name,read_time,published_at,category,tags,views')
      .eq('published', true).order('published_at', { ascending: false })
      .then(({ data }) => { setArticles(data || []); setLoading(false) })
    supabase.from('videos').select('*').eq('published', true).order('created_at', { ascending: false })
      .then(({ data }) => setVideos(data || []))
  }, [])

  // reset to page 1 when filters change
  useEffect(() => { setPage(1) }, [activeCategory, searchQ])

  const filtered = activeCategory === 'Videos' ? [] : articles.filter(a => {
    if (activeCategory !== 'All' && a.category !== activeCategory) return false
    if (searchQ && !a.title.toLowerCase().includes(searchQ.toLowerCase()) &&
        !(a.excerpt || '').toLowerCase().includes(searchQ.toLowerCase())) return false
    return true
  })

  const featured = !searchQ && activeCategory === 'All' && page === 1 ? filtered[0] : null
  const gridItems = featured ? filtered.slice(1) : filtered
  const totalPages = Math.ceil(gridItems.length / PER_PAGE)
  const pageItems = gridItems.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  const scrollTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })

  return (
    <div style={{ fontFamily:'DM Sans,sans-serif', background:'#F7F9FC', minHeight:'100vh' }}>
      <style>{MOBILE_CSS}</style>
      <Navbar user={user} />
      <div style={{ background:'linear-gradient(135deg,#0A2540,#1565C0)', padding:'36px 16px', textAlign:'center' }}>
        <div style={{ color:'#4DA6FF', fontSize:11, fontWeight:700, letterSpacing:'1.8px', textTransform:'uppercase', marginBottom:10 }}>CarExpert Africa</div>
        <h1 style={{ fontFamily:'Outfit,sans-serif', fontSize:28, fontWeight:800, color:'#fff', marginBottom:8 }}>News & Reviews</h1>
        <p style={{ color:'rgba(255,255,255,.55)', fontSize:14, marginBottom:20 }}>Kenya car market insights, buying guides, and expert reviews</p>
        <div style={{ maxWidth:400, margin:'0 auto', position:'relative' }}>
          <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Search articles..."
            style={{ width:'100%', padding:'11px 16px 11px 40px', borderRadius:100, border:'none', fontSize:13, fontFamily:'DM Sans,sans-serif', outline:'none', boxSizing:'border-box' }}/>
          <span style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', fontSize:14 }}>🔍</span>
          {searchQ && <span onClick={() => setSearchQ('')} style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', cursor:'pointer', fontSize:18, color:'#94A3B8' }}>×</span>}
        </div>
      </div>

      {/* Category tabs */}
      <div style={{ background:'#fff', borderBottom:'1px solid #E8EDF3', overflowX:'auto' }}>
        <div style={{ display:'flex', maxWidth:1200, margin:'0 auto', padding:'0 16px' }}>
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)}
              style={{ flexShrink:0, padding:'12px 16px', border:'none', background:'none', fontSize:12, fontWeight:activeCategory===cat?700:500, color:activeCategory===cat?'#1565C0':'#64748B', cursor:'pointer', borderBottom:`2px solid ${activeCategory===cat?'#1565C0':'transparent'}`, fontFamily:'DM Sans,sans-serif' }}>
              {cat}
              {cat !== 'All' && cat !== 'Videos' && articles.filter(a => a.category === cat).length > 0 && (
                <span style={{ marginLeft:4, fontSize:10, color:'#94A3B8' }}>({articles.filter(a => a.category === cat).length})</span>
              )}
              {cat === 'Videos' && videos.length > 0 && (
                <span style={{ marginLeft:4, fontSize:10, color:'#94A3B8' }}>({videos.length})</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth:1200, margin:'0 auto', padding:'24px 16px' }}>
        {activeCategory === 'Videos' ? (
          <VideosTab videos={videos} />
        ) : loading ? (
          <div style={{ textAlign:'center', padding:60, color:'#94A3B8' }}>Loading articles...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign:'center', padding:60 }}>
            <div style={{ fontSize:40, marginBottom:16 }}>📰</div>
            <div style={{ fontFamily:'Outfit,sans-serif', fontSize:18, fontWeight:700, color:'#0A2540', marginBottom:8 }}>No articles found</div>
            <div style={{ fontSize:13, color:'#94A3B8' }}>{searchQ ? 'Try a different search' : 'Check back soon'}</div>
          </div>
        ) : (
          <>
            {/* Results count */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
              <div style={{ fontSize:13, color:'#64748B' }}>
                <span style={{ fontFamily:'Outfit,sans-serif', fontWeight:700, color:'#0A2540' }}>{filtered.length}</span> articles
                {totalPages > 1 && <span> · Page {page} of {totalPages}</span>}
              </div>
              {searchQ && <button onClick={() => setSearchQ('')} style={{ fontSize:11, color:'#EF4444', fontWeight:600, background:'none', border:'none', cursor:'pointer' }}>✕ Clear search</button>}
            </div>

            {/* Featured article — only page 1, no filters */}
            {featured && (
              <Link to={`/news/${featured.slug}`} style={{ textDecoration:'none', display:'block', marginBottom:24 }}>
                <div style={{ background:'#fff', border:'1.5px solid #E8EDF3', borderRadius:16, overflow:'hidden', display:'grid', gridTemplateColumns:'1fr 1fr', transition:'all .2s' }}
                  onMouseOver={e => { e.currentTarget.style.borderColor='#1565C0'; e.currentTarget.style.boxShadow='0 8px 32px rgba(21,101,192,.12)' }}
                  onMouseOut={e => { e.currentTarget.style.borderColor='#E8EDF3'; e.currentTarget.style.boxShadow='none' }}>
                  <div style={{ height:260, background:'linear-gradient(135deg,#EEF5FF,#DBEAFE)', overflow:'hidden' }}>
                    {featured.cover_image_url ? <img src={featured.cover_image_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/> : <div style={{ height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:64 }}>📰</div>}
                  </div>
                  <div style={{ padding:28, display:'flex', flexDirection:'column', justifyContent:'center' }}>
                    <div style={{ display:'flex', gap:6, marginBottom:12 }}>
                      <span style={{ background:'#1565C0', color:'#fff', fontSize:10, fontWeight:700, padding:'3px 10px', borderRadius:100 }}>FEATURED</span>
                      <span style={{ background:'#EEF5FF', color:'#1565C0', border:'1px solid #BDD5FF', fontSize:10, fontWeight:700, padding:'3px 10px', borderRadius:100 }}>{featured.category}</span>
                    </div>
                    <div style={{ fontFamily:'Outfit,sans-serif', fontSize:20, fontWeight:800, color:'#0A2540', lineHeight:1.3, marginBottom:10 }}>{featured.title}</div>
                    {featured.excerpt && <div style={{ fontSize:13, color:'#64748B', lineHeight:1.6, marginBottom:14 }}>{featured.excerpt}</div>}
                    <div style={{ fontSize:11, color:'#94A3B8' }}>
                      By {featured.author_name} · {featured.read_time} min read · {featured.published_at ? new Date(featured.published_at).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' }) : ''}
                    </div>
                  </div>
                </div>
              </Link>
            )}

            {/* Subscribe banner — page 1 only */}
            {page === 1 && !searchQ && activeCategory === 'All' && gridItems.length > 2 && (
              <div style={{ background:'linear-gradient(135deg,#0A2540,#1565C0)', borderRadius:14, padding:'24px 20px', marginBottom:24, display:'flex', alignItems:'center', gap:20, flexWrap:'wrap' }}>
                <div style={{ flex:1, minWidth:200 }}>
                  <div style={{ fontFamily:'Outfit,sans-serif', fontSize:18, fontWeight:800, color:'#fff', marginBottom:4 }}>📬 Stay Updated</div>
                  <div style={{ fontSize:13, color:'rgba(255,255,255,.6)' }}>Get Kenya car news, reviews and market insights straight to your inbox.</div>
                </div>
                <NewsSubscribeInline />
              </div>
            )}

            {/* Grid */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:16, marginBottom:32 }}>
              {pageItems.map(a => (
                <Link key={a.id} to={`/news/${a.slug}`} style={{ textDecoration:'none' }}>
                  <div style={{ background:'#fff', border:'1.5px solid #E8EDF3', borderRadius:12, overflow:'hidden', height:'100%', transition:'all .2s' }}
                    onMouseOver={e => { e.currentTarget.style.borderColor='#1565C0'; e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 8px 24px rgba(21,101,192,.1)' }}
                    onMouseOut={e => { e.currentTarget.style.borderColor='#E8EDF3'; e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='none' }}>
                    <div style={{ height:160, background:'linear-gradient(135deg,#EEF5FF,#DBEAFE)', overflow:'hidden' }}>
                      {a.cover_image_url ? <img src={a.cover_image_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/> : <div style={{ height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:44 }}>📰</div>}
                    </div>
                    <div style={{ padding:16 }}>
                      <div style={{ display:'flex', gap:6, marginBottom:8, flexWrap:'wrap' }}>
                        <span style={{ background:'#EEF5FF', color:'#1565C0', border:'1px solid #BDD5FF', fontSize:9, fontWeight:700, padding:'2px 8px', borderRadius:100, textTransform:'uppercase' }}>{a.category}</span>
                        {(a.tags || []).slice(0,2).map(tag => <span key={tag} style={{ background:'#F8FAFC', color:'#94A3B8', border:'1px solid #E8EDF3', fontSize:9, fontWeight:600, padding:'2px 7px', borderRadius:100 }}>#{tag}</span>)}
                      </div>
                      <div style={{ fontFamily:'Outfit,sans-serif', fontSize:14, fontWeight:700, color:'#0A2540', lineHeight:1.4, marginBottom:8 }}>{a.title}</div>
                      {a.excerpt && <div style={{ fontSize:12, color:'#64748B', lineHeight:1.5, marginBottom:10, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>{a.excerpt}</div>}
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                        <div style={{ fontSize:11, color:'#94A3B8' }}>By {a.author_name} · {a.read_time} min</div>
                        <div style={{ fontSize:11, color:'#94A3B8' }}>{a.views || 0} views</div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ display:'flex', justifyContent:'center', alignItems:'center', gap:8, marginBottom:32, flexWrap:'wrap' }}>
                <button onClick={() => { setPage(p => Math.max(1, p-1)); scrollTop() }} disabled={page === 1}
                  style={{ padding:'8px 16px', border:'1.5px solid #E2E8F0', borderRadius:8, fontSize:13, fontWeight:600, cursor:page===1?'default':'pointer', color:page===1?'#CBD5E1':'#475569', background:'#fff', fontFamily:'DM Sans,sans-serif' }}>
                  ← Prev
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button key={p} onClick={() => { setPage(p); scrollTop() }}
                    style={{ width:36, height:36, border:`1.5px solid ${page===p?'#1565C0':'#E2E8F0'}`, borderRadius:8, fontSize:13, fontWeight:page===p?700:500, cursor:'pointer', color:page===p?'#fff':'#475569', background:page===p?'#1565C0':'#fff', fontFamily:'Outfit,sans-serif' }}>
                    {p}
                  </button>
                ))}
                <button onClick={() => { setPage(p => Math.min(totalPages, p+1)); scrollTop() }} disabled={page === totalPages}
                  style={{ padding:'8px 16px', border:'1.5px solid #E2E8F0', borderRadius:8, fontSize:13, fontWeight:600, cursor:page===totalPages?'default':'pointer', color:page===totalPages?'#CBD5E1':'#475569', background:'#fff', fontFamily:'DM Sans,sans-serif' }}>
                  Next →
                </button>
              </div>
            )}

            {/* Bottom subscribe */}
            <div style={{ background:'linear-gradient(135deg,#0A2540,#1565C0)', borderRadius:16, padding:'32px 24px', textAlign:'center', marginBottom:16 }}>
              <div style={{ fontSize:32, marginBottom:12 }}>📬</div>
              <div style={{ fontFamily:'Outfit,sans-serif', fontSize:22, fontWeight:800, color:'#fff', marginBottom:8 }}>Never Miss a Story</div>
              <div style={{ fontSize:14, color:'rgba(255,255,255,.6)', marginBottom:20, maxWidth:400, margin:'0 auto 20px' }}>
                Join thousands of Kenyans getting the latest car news, reviews and market insights every week.
              </div>
              <div style={{ maxWidth:440, margin:'0 auto' }}>
                <NewsSubscribeInline />
              </div>
              <div style={{ fontSize:11, color:'rgba(255,255,255,.35)', marginTop:10 }}>Free forever · No spam · Unsubscribe anytime</div>
            </div>
          </>
        )}
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
