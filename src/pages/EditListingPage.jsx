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
  'Audi': ['A1','A3','A4','A5','A6','A7','A8','Q2','Q3','Q5','Q7','Q8','RS3','RS4','RS5','RS6','S3','S4','S5','S6','TT'],
  'BAIC': ['BJ20','BJ40','BJ80','D20','D50','X25','X35','X55','X65'],
  'BMW': ['1 Series','2 Series','3 Series','4 Series','5 Series','6 Series','7 Series','8 Series','M2','M3','M4','M5','X1','X2','X3','X4','X5','X6','X7','Z4'],
  'BYD': ['Atto 3','Dolphin','Han','Seal','Song','Tang'],
  'Bentley': ['Bentayga','Continental GT','Flying Spur','Mulsanne'],
  'Changan': ['CS15','CS35','CS55','CS75','CS95','Alsvin','Eado','Uni-K','Uni-T'],
  'Chery': ['Arrizo 5','Arrizo 6','Omoda 5','QQ','Tiggo 4','Tiggo 5X','Tiggo 7','Tiggo 7 Pro','Tiggo 8'],
  'Chrysler': ['300','300C','Pacifica','Sebring','Voyager'],
  'Citroën': ['Berlingo','C3','C4','C5','Dispatch','Jumpy','Picasso'],
  'DAF': ['CF','LF','XF'],
  'Daihatsu': ['Boon','Gran Max','Mira','Move','Rocky','Sirion','Terios'],
  'Datsun': ['1200','120Y','1600','Go','Go+'],
  'Dodge': ['Challenger','Charger','Durango','RAM 1500','Viper'],
  'Dongfeng': ['AX4','AX7','DF6','Sokon','T5'],
  'Ferrari': ['488','812 Superfast','California','F8 Tributo','Portofino','Roma'],
  'Fiat': ['500','Bravo','Doblo','Ducato','Freemont','Punto','Tipo'],
  'Ford': ['Bronco','EcoSport','Edge','Everest','Explorer','F-150','Focus','Fusion','Kuga','Mondeo','Mustang','Ranger','Territory','Transit','Transit Connect'],
  'Foton': ['Auman','Commander','Gratour','Midi','Sauvana','Tunland','View'],
  'GAC': ['Emkoo','Empow','GS3','GS4','GS5','GS8','M6','M8'],
  'Geely': ['Azkarra','Boyue','Coolray','Emgrand','Okavango','Tugella'],
  'Haval': ['F7','H1','H2','H4','H5','H6','H9','Jolion','M6'],
  'Hino': ['300 Series','500 Series','700 Series','Dutro','Profia','Ranger'],
  'Honda': ['Accord','Airwave','Amaze','BR-V','CR-V','City','Civic','Element','Fit','Freed','HR-V','Jazz','Legend','Odyssey','Pilot','Stream','StepWagon','Vezel','WR-V'],
  'Hyundai': ['Accent','Creta','Elantra','H-1','H100','i10','i20','i30','ix35','Kona','Palisade','Santa Fe','Sonata','Starex','Tucson','Venue'],
  'Infiniti': ['FX35','FX37','G35','G37','Q50','Q60','Q70','QX50','QX56','QX60','QX80'],
  'Isuzu': ['D-Max','ELF','FRR','FTR','FVR','FVZ','MU-X','NKR','NPR','NQR','Trooper'],
  'Iveco': ['Daily','Eurocargo','Stralis','Trakker'],
  'JAC': ['J5','J7','S2','S3','S4','S5','T6','T8'],
  'Jaguar': ['E-Pace','F-Pace','F-Type','I-Pace','S-Type','XE','XF','XJ'],
  'Jeep': ['Cherokee','Compass','Grand Cherokee','Liberty','Patriot','Renegade','Wrangler'],
  'Kia': ['Carnival','Cerato','EV6','Niro','Optima','Picanto','Rio','Seltos','Sorento','Soul','Sportage','Stinger','Telluride'],
  'Land Rover': ['Defender 90','Defender 110','Discovery','Discovery Sport','Freelander','Range Rover','Range Rover Evoque','Range Rover Sport','Range Rover Velar'],
  'Lexus': ['CT200h','ES','GS','GS300','GS350','GX','GX460','IS','IS250','IS300','IS350','LC','LX','LX570','NX','RC','RX','RX330','RX350','UX'],
  'Lincoln': ['Aviator','Continental','MKC','MKX','MKZ','Navigator'],
  'MAN': ['TGA','TGE','TGL','TGM','TGS','TGX'],
  'MG': ['3','5','6','GS','HS','RX5','ZS','ZS EV'],
  'Mahindra': ['Bolero','KUV100','Scorpio','TUV300','Thar','XUV300','XUV500','XUV700'],
  'Maserati': ['Ghibli','GranTurismo','Levante','Quattroporte'],
  'Maxus': ['D60','D90','G10','T60','T90','V80','V90'],
  'Mazda': ['2','3','5','6','Atenza','Axela','BT-50','CX-3','CX-30','CX-5','CX-7','CX-8','CX-9','Demio','MPV','MX-5','Premacy'],
  'Mercedes-Benz': ['A-Class','AMG GT','B-Class','C-Class','CLA','CLS','E-Class','G-Class','GLA','GLB','GLC','GLE','GLS','ML','S-Class','SLK','Sprinter','V-Class','Viano','Vito'],
  'Mitsubishi': ['Attrage','Colt','Eclipse Cross','Galant','L200','L300','Lancer','Montero','Outlander','Pajero','Pajero Mini','Pajero Sport','RVR','Triton'],
  'Nissan': ['Almera','Caravan','Elgrand','GT-R','Juke','Kicks','Leaf','March','Murano','Navara','Note','Patrol','Pathfinder','Qashqai','Serena','Sylphy','Teana','Tiida','Urvan','X-Trail','350Z','370Z'],
  'Opel': ['Astra','Corsa','Insignia','Mokka','Movano','Vivaro','Zafira'],
  'Peugeot': ['2008','208','3008','308','4008','408','5008','508','Boxer','Expert','Partner'],
  'Porsche': ['718','911','Cayenne','Macan','Panamera','Taycan'],
  'Proton': ['Exora','Iriz','Persona','Saga','X50','X70'],
  'Renault': ['Captur','Clio','Duster','Kadjar','Koleos','Megane','Sandero','Scenic','Symbol'],
  'Rolls-Royce': ['Cullinan','Dawn','Ghost','Phantom','Wraith'],
  'Saab': ['9-3','9-5'],
  'Scania': ['G Series','P Series','R Series','S Series'],
  'SsangYong': ['Actyon','Korando','Musso','Rexton','Tivoli','XLV'],
  'Subaru': ['Ascent','BRZ','Crosstrek','Forester','Impreza','Legacy','Levorg','Outback','Tribeca','WRX','XV'],
  'Suzuki': ['Alto','Baleno','Carry','Celerio','Dzire','Ertiga','Escudo','Grand Vitara','Ignis','Jimny','S-Cross','SX4','Swift','Vitara','Wagon R'],
  'Tata': ['Ace','Harrier','Nexon','Safari','Xenon'],
  'Toyota': ['4Runner','Allion','Alphard','Auris','Avalon','Avanza','Axio','Camry','CH-R','Corolla','Crown','FJ Cruiser','Fielder','Fortuner','Harrier','Hiace','Hilux','Hilux Surf','Ipsum','Land Cruiser 70 Series','Land Cruiser 80 Series','Land Cruiser 100 Series','Land Cruiser 200','Land Cruiser 300','Land Cruiser Prado 90','Land Cruiser Prado 120','Land Cruiser Prado 150','Mark X','Noah','Premio','Probox','RAV4','Rush','Sequoia','Sienna','Spacio','Succeed','Supra','Tundra','Vanguard','Vellfire','Vitz','Voxy','Wish','Yaris'],
  'Volkswagen': ['Amarok','Arteon','Caddy','Caravelle','Golf','Jetta','Passat','Polo','Tiguan','Touareg','Touran','Transporter'],
  'Volvo': ['C30','C40','S60','S90','V40','V60','V90','XC40','XC60','XC90'],
  'Other': ['Other'],
}
const MAKES = Object.keys(CAR_DATA).sort()

const VARIANTS = {
  'Land Cruiser 300': ['GX','GXR','VX','VX.R','ZX','Sahara','Sahara ZX','Black Edition','GR Sport'],
  'Land Cruiser 200': ['GX','GXR','VX','VXR','VX Limited','ZX','Sahara','Heritage Edition'],
  'Land Cruiser Prado 150': ['GX','GXR','TX','TX-L','VX','VXL','TZ-G','Active','Kakadu'],
  'Land Cruiser Prado 120': ['GX','GXL','VX','VXL','Grande'],
  'Land Cruiser Prado 90': ['GX','VX','RV'],
  'Land Cruiser 100 Series': ['GX','VX','VX Limited','Sahara','Amazon'],
  'Land Cruiser 80 Series': ['GX','VX','GXL','VXL','Sahara'],
  'Land Cruiser 70 Series': ['Single Cab','Double Cab','Troop Carrier','VDJ76','VDJ78','VDJ79'],
  'Hilux': ['Single Cab 4x2','Single Cab 4x4','Extra Cab 4x2','Extra Cab 4x4','Double Cab 4x2','Double Cab 4x4','Raider','Revo','Legend 50','Legend RS','GD-6'],
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
  'Vanguard': ['Standard','S Premium'],
  'Patrol': ['DX','SGL','LE','SE','Titanium','Safari','Y61','Y62'],
  'X-Trail': ['LE','ST','ST-L','Ti','Ti-L'],
  'Navara': ['D40','D23','NP300','LE','SE','Calibre','King Cab','Double Cab'],
  'Elgrand': ['Standard','Rider','Highway Star','VIP','E51','E52'],
  'C-Class': ['C180','C200','C220d','C250','C300','C350','AMG C43','AMG C63'],
  'E-Class': ['E200','E220','E250','E300','E350','E400','AMG E43','AMG E63','E220d'],
  'S-Class': ['S300','S320','S350','S400','S450','S500','S600','AMG S63','Maybach S580'],
  'GLE': ['GLE 300d','GLE 350','GLE 400','GLE 450','AMG GLE 53','AMG GLE 63','Coupe'],
  'GLC': ['GLC 200','GLC 220d','GLC 250','GLC 300','AMG GLC 43','Coupe'],
  'GLS': ['GLS 350d','GLS 400','GLS 450','AMG GLS 63'],
  'ML': ['ML 250','ML 320','ML 350','ML 400','AMG ML 63'],
  'G-Class': ['G 350d','G 500','G 550','AMG G 63'],
  'Sprinter': ['211 CDI','213 CDI','315 CDI','319 CDI','316 CDI'],
  'X5': ['xDrive 25d','xDrive 30d','xDrive 40i','M50i','xDrive 45e','M Competition'],
  'X3': ['xDrive 20i','xDrive 20d','xDrive 30i','xDrive 30d','M40i','M Competition'],
  'X6': ['xDrive 30d','xDrive 40i','M50i','M Competition'],
  '3 Series': ['316i','318i','320i','320d','325i','328i','330i','335i','M3'],
  '5 Series': ['518d','520i','520d','525d','528i','530i','535i','M5'],
  'X7': ['xDrive 30d','xDrive 40i','M50i'],
  'Range Rover': ['Vogue','Vogue SE','Autobiography','SVAutobiography','Sport HSE','Sport HST','P400e'],
  'Range Rover Sport': ['SE','HSE','HSE Dynamic','Autobiography Dynamic','SVR','P400e'],
  'Range Rover Evoque': ['S','SE','HSE','R-Dynamic SE','First Edition'],
  'Discovery': ['S','SE','HSE','HSE Luxury','First Edition','HSE Si6'],
  'Defender 110': ['S','SE','HSE','X','X-Dynamic SE','Trophy Edition','Heritage'],
  'Defender 90': ['S','SE','HSE','X','X-Dynamic SE','Trophy Edition'],
  'Golf': ['Trendline','Comfortline','Highline','R-Line','GTI','Golf R','e-Golf'],
  'Tiguan': ['Trendline','Comfortline','Highline','R-Line','Allspace'],
  'Amarok': ['Trendline','Comfortline','Highline','V6 TDI','Aventura'],
  'Touareg': ['SE','Elegance','R-Line','Atmosphere'],
  'Ranger': ['XL','XLS','XLT','Sport','Wildtrak','Raptor','Limited','FX4','Tremor'],
  'Everest': ['Ambiente','Trend','Sport','Titanium','Titanium Plus','Platinum'],
  'Explorer': ['Base','XLT','Limited','ST','Platinum','King Ranch'],
  'Pajero': ['GLX','GLS','Exceed','Dakar','Final Edition','Short Body','Long Body'],
  'Outlander': ['GLX','GLS','Exceed','GT','PHEV'],
  'L200': ['GL','GLX','GLS','Triton','Double Cab','Single Cab'],
  'Forester': ['2.0i','2.5i','XT','X20','Premium','Sport','Touring'],
  'Outback': ['2.5i','3.6R','Premium','Limited','Touring','XT'],
  'WRX': ['Base','Premium','Limited','STI','STI S209'],
  'CR-V': ['LX','EX','EX-L','Touring','Sport'],
  'Pilot': ['LX','EX','EX-L','Touring','Elite','Black Edition'],
  'HR-V': ['LX','EX','EX-L','Sport','Touring'],
  'LX': ['LX 450d','LX 570','LX 600 Luxury','LX 600 Ultra Luxury'],
  'GX': ['GX 400','GX 460','Luxury','Premium'],
  'RX': ['RX 200t','RX 300','RX 330','RX 350','RX 450h','F Sport'],
  'IS': ['IS 200','IS 250','IS 300','IS 350','F Sport'],
  'GS': ['GS 250','GS 300','GS 350','GS 450h','F Sport'],
  'H6': ['Classic','Premium','Supreme','Ultra','HEV'],
  'H9': ['Ultra','Supreme'],
  'Jolion': ['Comfort','Premium','Lux','HEV'],
  'F7': ['Comfort','Premium','Luxury','Sport'],
  'Tiggo 7 Pro': ['Comfort','Premium','Luxury'],
  'Tiggo 8': ['Comfort','Premium','Luxury','Sport','Pro'],
  'Q7': ['35 TDI','45 TFSI','55 TFSI','SQ7'],
  'Q5': ['35 TDI','40 TDI','40 TFSI','45 TFSI','SQ5'],
  'A4': ['35 TDI','40 TDI','40 TFSI','45 TFSI','S4','RS4'],
  'A6': ['40 TDI','45 TDI','45 TFSI','55 TFSI','S6','RS6'],
  'Cayenne': ['Base','S','GTS','Turbo','Turbo S','E-Hybrid','Coupe'],
  'Macan': ['Base','S','GTS','Turbo'],
  '911': ['Carrera','Carrera S','Carrera 4','Carrera 4S','Turbo','Turbo S','GT3'],
  'Santa Fe': ['GL','GLS','Executive','XL','Highlander','Calligraphy'],
  'Tucson': ['GL','GLS','Executive','Highlander','N Line'],
  'Starex': ['GL','GLS','Executive','Limousine','Urban'],
  'Sorento': ['LX','EX','SX','SX Prestige','Hybrid EX'],
  'Sportage': ['LX','EX','SX','GT Line','Hybrid'],
  'D-Max': ['Base','LS','V-Cross','X-Series','4x2','4x4','Single Cab','Spacecab','Double Cab'],
  'MU-X': ['LS-U','LS-T','X Series','Ultimate'],
}

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
  const [variant, setVariant]     = useState('')
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
    setVariant(data.variant || '')
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
      make, model, variant: variant || null, year: Number(year),
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
              <select value={make} onChange={e => { setMake(e.target.value); setModel(''); setVariant('') }} style={inp}>
                {MAKES.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Model</label>
              <select value={model} onChange={e => { setModel(e.target.value); setVariant('') }} style={inp}>
                <option value="">Select model...</option>
                {(CAR_DATA[make] || []).map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
            {model && VARIANTS[model] && (
              <div style={{ gridColumn:'1/-1' }}>
                <label style={lbl}>Variant / Trim <span style={{ color:'#94A3B8', fontWeight:400, textTransform:'none', letterSpacing:0, fontSize:10 }}>(optional)</span></label>
                <select value={variant} onChange={e => setVariant(e.target.value)} style={inp}>
                  <option value="">Select variant...</option>
                  {VARIANTS[model].map(v => <option key={v}>{v}</option>)}
                </select>
              </div>
            )}
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
