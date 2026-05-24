import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Navbar from '../components/Navbar'

const EDIT_MOBILE_CSS = `
  @media (max-width: 768px) {
    .edit-form-grid { grid-template-columns: 1fr !important; }
    .edit-price-grid { grid-template-columns: 1fr !important; }
    .edit-contact-grid { grid-template-columns: 1fr !important; }
    .edit-actions { flex-direction: column !important; }
    .edit-actions a, .edit-actions button { width: 100% !important; text-align: center !important; }
  }
`

const CAR_DATA = {
  Audi: ['A3','A4','A6','Q3','Q5','Q7','TT'],
  Bentley: ['Continental','Bentayga','Flying Spur','Mulsanne'],
  BMW: ['X1','X3','X5','X6','3 Series','5 Series','7 Series','1 Series','2 Series'],
  Chevrolet: ['Tahoe','Suburban','Trailblazer','Captiva','Spark'],
  Ford: ['Ranger','Everest','Explorer','EcoSport','Fusion','Mustang'],
  Honda: ['CR-V','HR-V','Fit','Jazz','Civic','Accord','Pilot','Freed','Stream','Odyssey','StepWagon'],
  Hyundai: ['Tucson','Santa Fe','Elantra','i10','i20','ix35','Creta'],
  Isuzu: ['D-Max','MU-X','Trooper'],
  Jaguar: ['F-Pace','E-Pace','XF','XE','XJ'],
  Jeep: ['Wrangler','Grand Cherokee','Cherokee','Renegade','Compass'],
  Kia: ['Sportage','Sorento','Picanto','Rio','Cerato','Carnival'],
  'Land Rover': ['Defender','Discovery','Discovery Sport','Range Rover','Range Rover Sport','Range Rover Evoque','Freelander'],
  Lexus: ['LX','GX','RX','NX','IS','GS','LS','UX'],
  Mazda: ['CX-5','CX-3','CX-7','CX-9','Demio','Axela','Atenza','BT-50','MPV'],
  'Mercedes-Benz': ['C-Class','E-Class','S-Class','GLC','GLE','GLS','A-Class','B-Class','ML','GL'],
  Mitsubishi: ['Pajero','Pajero Mini','Outlander','Eclipse Cross','Montero','L200','Colt','Galant','Lancer'],
  Nissan: ['X-Trail','Patrol','Juke','Note','March','Tiida','Sylphy','Teana','Murano','Qashqai','Navara','Urvan','Caravan','Serena','Elgrand'],
  Porsche: ['Cayenne','Macan','Panamera','911'],
  Subaru: ['Forester','Outback','Legacy','Impreza','XV','Tribeca','WRX'],
  Suzuki: ['Vitara','Jimny','Swift','Alto','Baleno','Ertiga','Grand Vitara','Escudo'],
  Toyota: ['Land Cruiser 200','Land Cruiser 300','Land Cruiser Prado 150','Land Cruiser Prado 120','Hilux','Harrier','RAV4','Vanguard','Fortuner','Rush','Fielder','Corolla','Camry','Crown','Mark X','Allion','Premio','Wish','Noah','Voxy','Alphard','Vellfire','Hiace','Probox','Succeed'],
  Volkswagen: ['Golf','Polo','Passat','Tiguan','Touareg','Amarok','Transporter'],
  Volvo: ['XC90','XC60','XC40','S60','V60'],
  Other: ['Other'],
}
const MAKES = Object.keys(CAR_DATA).sort()

export default function EditListingPage({ user }) {
  const { id } = useParams()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [notFound, setNotFound] = useState(false)

  const [make, setMake]           = useState('Toyota')
  const [model, setModel]         = useState('')
  const [year, setYear]           = useState('2020')
  const [km, setKm]               = useState('')
  const [engineCc, setEngineCc]   = useState('')
  const [bodyType, setBodyType]   = useState('SUV')
  const [fuel, setFuel]           = useState('Petrol')
  const [transmission, setTx]     = useState('Automatic')
  const [drive, setDrive]         = useState('AWD')
  const [colour, setColour]       = useState('')
  const [condition, setCondition] = useState('Used — Excellent')
  const [price, setPrice]         = useState('')
  const [nego, setNego]           = useState(false)
  const [description, setDescription] = useState('')
  const [contactName, setContactName] = useState('')
  const [phone, setPhone]         = useState('')
  const [location, setLocation]   = useState('')
  const [originalStatus, setOriginalStatus] = useState('')

  useEffect(() => {
    if (!user) { navigate('/auth'); return }
    fetchListing()
  }, [user])

  const fetchListing = async () => {
    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error || !data) { setNotFound(true); setLoading(false); return }

    setMake(data.make || 'Toyota')
    setModel(data.model || '')
    setYear(String(data.year || '2020'))
    setKm(String(data.mileage || ''))
    setEngineCc(String(data.engine_cc || ''))
    setBodyType(data.body_type || 'SUV')
    setFuel(data.fuel_type || 'Petrol')
    setTx(data.transmission || 'Automatic')
    setDrive(data.drive_type || 'AWD')
    setColour(data.colour || data.color || '')
    setCondition(data.condition || 'Used — Excellent')
    setPrice(String(data.price || ''))
    setNego(data.negotiable || false)
    setDescription(data.description || '')
    setContactName(data.contact_name || '')
    setPhone(data.phone || '')
    setLocation(data.location || '')
    setOriginalStatus(data.status)
    setLoading(false)
  }

  const handleSave = async (resubmit = false) => {
    setSaving(true)
    setError('')

    const updates = {
      make, model, year: Number(year),
      mileage: Number(km),
      engine_cc: Number(engineCc),
      body_type: bodyType,
      fuel_type: fuel,
      transmission,
      drive_type: drive,
      colour, condition,
      price: Number(price),
      negotiable: nego,
      description,
      contact_name: contactName,
      phone, location,
      updated_at: new Date().toISOString(),
    }

    if (resubmit) {
      updates.status = 'pending'
      updates.admin_note = null
    }

    const { error } = await supabase
      .from('listings')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      setError('Error saving: ' + error.message)
    } else {
      setSuccess(true)
      setTimeout(() => navigate('/dashboard'), 2000)
    }
    setSaving(false)
  }

  const inp = { width:'100%', padding:'10px 12px', border:'1.5px solid #E2E8F0', borderRadius:7, fontSize:13, fontFamily:'DM Sans,sans-serif', outline:'none', background:'#F8FAFC' }
  const lbl = { display:'block', fontSize:10, fontWeight:700, color:'#64748B', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:5 }

  if (loading) return (
    <div style={{ fontFamily:'DM Sans,sans-serif', background:'#F7F9FC', minHeight:'100vh' }}>
      <Navbar user={user} />
      <div style={{ textAlign:'center', padding:80, color:'#94A3B8', fontFamily:'Outfit,sans-serif', fontSize:16, fontWeight:600 }}>Loading listing...</div>
    </div>
  )

  if (notFound) return (
    <div style={{ fontFamily:'DM Sans,sans-serif', background:'#F7F9FC', minHeight:'100vh' }}>
      <Navbar user={user} />
      <div style={{ textAlign:'center', padding:80 }}>
        <div style={{ fontSize:40, marginBottom:16 }}>🚫</div>
        <div style={{ fontFamily:'Outfit,sans-serif', fontSize:20, fontWeight:800, color:'#0A2540', marginBottom:8 }}>Listing not found</div>
        <div style={{ fontSize:13, color:'#94A3B8', marginBottom:20 }}>This listing doesn't exist or you don't have permission to edit it.</div>
        <Link to="/dashboard" style={{ background:'#1565C0', color:'#fff', padding:'10px 24px', borderRadius:8, fontSize:13, fontWeight:700, textDecoration:'none', fontFamily:'Outfit,sans-serif' }}>Back to Dashboard</Link>
      </div>
    </div>
  )

  if (success) return (
    <div style={{ fontFamily:'DM Sans,sans-serif', background:'#F7F9FC', minHeight:'100vh' }}>
      <Navbar user={user} />
      <div style={{ textAlign:'center', padding:80 }}>
        <div style={{ fontSize:48, marginBottom:16 }}>✅</div>
        <div style={{ fontFamily:'Outfit,sans-serif', fontSize:22, fontWeight:800, color:'#0A2540', marginBottom:8 }}>Listing Updated!</div>
        <div style={{ fontSize:13, color:'#64748B' }}>Redirecting to your dashboard...</div>
      </div>
    </div>
  )

  return (
    <div style={{ fontFamily:'DM Sans,sans-serif', background:'#F7F9FC', minHeight:'100vh' }}>
      <style>{EDIT_MOBILE_CSS}</style>
      <Navbar user={user} />

      <div style={{ background:'linear-gradient(135deg,#0A2540,#0D3B6E)', padding:'24px' }}>
        <div style={{ maxWidth:800, margin:'0 auto' }}>
          <div style={{ color:'#4DA6FF', fontSize:10, fontWeight:700, letterSpacing:'1.8px', textTransform:'uppercase', marginBottom:6 }}>Edit Listing</div>
          <div style={{ fontFamily:'Outfit,sans-serif', fontSize:20, fontWeight:800, color:'#fff' }}>Update Your Car Listing</div>
          <div style={{ color:'rgba(255,255,255,.5)', fontSize:12, marginTop:4 }}>
            {originalStatus === 'declined'
              ? '⚠️ Your listing was declined. Fix the issues and resubmit for review.'
              : originalStatus === 'approved'
              ? '✓ This listing is live. Saving will keep it live with the updated details.'
              : '⏳ This listing is pending review.'}
          </div>
        </div>
      </div>

      <div style={{ maxWidth:800, margin:'0 auto', padding:'24px' }}>
        {error && <div style={{ background:'#FEE2E2', color:'#DC2626', borderRadius:8, padding:'12px 16px', fontSize:13, fontWeight:600, marginBottom:16 }}>{error}</div>}

        {/* Vehicle Info */}
        <div style={{ background:'#fff', border:'1.5px solid #E8EDF3', borderRadius:14, padding:22, marginBottom:16 }}>
          <div style={{ fontFamily:'Outfit,sans-serif', fontSize:15, fontWeight:700, color:'#0A2540', marginBottom:18, display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ width:3, height:15, background:'#1565C0', borderRadius:2, display:'inline-block' }}></span> Vehicle Information
          </div>
          <div className="edit-form-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
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
                {Array.from({length:30},(_,i)=>`${2025-i}`).map(y => <option key={y}>{y}</option>)}
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
        </div>

        {/* Pricing */}
        <div style={{ background:'#fff', border:'1.5px solid #E8EDF3', borderRadius:14, padding:22, marginBottom:16 }}>
          <div style={{ fontFamily:'Outfit,sans-serif', fontSize:15, fontWeight:700, color:'#0A2540', marginBottom:16, display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ width:3, height:15, background:'#1565C0', borderRadius:2, display:'inline-block' }}></span> Pricing
          </div>
          <div className="edit-price-grid" style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:12, alignItems:'end' }}>
            <div>
              <label style={lbl}>Asking Price (KSH)</label>
              <input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="e.g. 4500000" style={inp}/>
            </div>
            <div onClick={() => setNego(!nego)} style={{ display:'flex', alignItems:'center', gap:8, paddingBottom:10, cursor:'pointer' }}>
              <div style={{ width:32, height:18, borderRadius:100, background:nego?'#1565C0':'#E2E8F0', position:'relative' }}>
                <div style={{ position:'absolute', top:2, left:nego?16:2, width:14, height:14, borderRadius:'50%', background:'#fff', transition:'left .2s' }}/>
              </div>
              <span style={{ fontSize:12, fontWeight:600, color:'#475569' }}>Negotiable</span>
            </div>
          </div>
        </div>

        {/* Description */}
        <div style={{ background:'#fff', border:'1.5px solid #E8EDF3', borderRadius:14, padding:22, marginBottom:16 }}>
          <div style={{ fontFamily:'Outfit,sans-serif', fontSize:15, fontWeight:700, color:'#0A2540', marginBottom:12, display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ width:3, height:15, background:'#1565C0', borderRadius:2, display:'inline-block' }}></span> Description
          </div>
          <textarea value={description} onChange={e => setDescription(e.target.value)}
            placeholder="Describe the car's condition, history, modifications, and why you are selling..."
            rows={4} style={{ ...inp, resize:'vertical', lineHeight:1.5 }}/>
        </div>

        {/* Contact */}
        <div style={{ background:'#fff', border:'1.5px solid #E8EDF3', borderRadius:14, padding:22, marginBottom:20 }}>
          <div style={{ fontFamily:'Outfit,sans-serif', fontSize:15, fontWeight:700, color:'#0A2540', marginBottom:14, display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ width:3, height:15, background:'#1565C0', borderRadius:2, display:'inline-block' }}></span> Contact Details
          </div>
          <div className="edit-contact-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
            <div>
              <label style={lbl}>Contact Name</label>
              <input value={contactName} onChange={e => setContactName(e.target.value)} placeholder="Your name" style={inp}/>
            </div>
            <div>
              <label style={lbl}>Phone / WhatsApp</label>
              <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+254 7XX XXX XXX" style={inp}/>
            </div>
          </div>
          <div>
            <label style={lbl}>Location</label>
            <select value={location} onChange={e => setLocation(e.target.value)} style={inp}>
              <option value="">Select location...</option>
              {['Nairobi — Westlands','Nairobi — CBD','Nairobi — Karen','Nairobi — Langata','Mombasa','Kisumu','Nakuru','Eldoret','Thika','Meru'].map(l => <option key={l}>{l}</option>)}
            </select>
          </div>
        </div>

        {/* Action buttons */}
        <div className="edit-actions" style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
          <Link to="/dashboard" style={{ background:'#fff', color:'#475569', border:'1.5px solid #E2E8F0', padding:'11px 20px', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'Outfit,sans-serif', textDecoration:'none' }}>
            Cancel
          </Link>

          {/* Save without resubmitting — only for approved listings */}
          {originalStatus === 'approved' && (
            <button onClick={() => handleSave(false)} disabled={saving}
              style={{ background:'#fff', color:'#1565C0', border:'1.5px solid #1565C0', padding:'11px 20px', borderRadius:8, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'Outfit,sans-serif', opacity:saving?0.7:1 }}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          )}

          {/* Resubmit for review */}
          <button onClick={() => handleSave(true)} disabled={saving}
            style={{ background:'#1565C0', color:'#fff', border:'none', padding:'11px 24px', borderRadius:8, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'Outfit,sans-serif', opacity:saving?0.7:1 }}>
            {saving ? 'Saving...' : originalStatus === 'approved' ? '🔄 Save & Resubmit for Review' : '✓ Save & Submit for Review'}
          </button>
        </div>
      </div>
    </div>
  )
}
