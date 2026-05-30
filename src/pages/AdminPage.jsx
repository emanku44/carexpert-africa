import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getAllListingsAdmin, approveListing, declineListing, markAsFeatured, removeFeatured, supabase } from '../lib/supabase'

const DECLINE_REASONS = ['Insufficient photos (min 5)','Price appears incorrect','Mileage inconsistency','Missing service history','Poor photo quality','Incomplete vehicle info','Duplicate listing','Unverified seller','Suspicious listing']
const fmt = (n) => 'KSH ' + Number(n).toLocaleString()

function Toast({ msg, type, show }) {
  if (!show) return null
  const bg = type === 'success' ? '#16A34A' : type === 'error' ? '#EF4444' : '#1565C0'
  return <div style={{ position:'fixed', bottom:24, right:24, background:bg, color:'#fff', padding:'12px 20px', borderRadius:12, fontFamily:'Outfit,sans-serif', fontSize:13, fontWeight:700, zIndex:9999, boxShadow:'0 4px 20px rgba(0,0,0,.2)' }}>{msg}</div>
}

function StatCard({ icon, number, label, color }) {
  return (
    <div style={{ background:'#fff', border:'1.5px solid #E8EDF3', borderRadius:12, padding:16, display:'flex', alignItems:'center', gap:12 }}>
      <div style={{ width:36, height:36, borderRadius:9, background:color+'22', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0 }}>{icon}</div>
      <div>
        <div style={{ fontFamily:'Outfit,sans-serif', fontSize:24, fontWeight:800, color:color, lineHeight:1 }}>{number}</div>
        <div style={{ fontSize:11, color:'#94A3B8', marginTop:2 }}>{label}</div>
      </div>
    </div>
  )
}

function ListingRow({ listing, onApprove, onDecline, onFeatured }) {
  const [expanded, setExpanded] = useState(false)
  const [showDecline, setShowDecline] = useState(false)
  const [showApprove, setShowApprove] = useState(false)
  const [selectedReasons, setSelectedReasons] = useState(new Set())
  const [note, setNote] = useState('')
  const [tier, setTier] = useState('standard')
  const sc = { pending:{bg:'#FEF3C7',text:'#D97706',label:'Pending'}, approved:{bg:'#DCFCE7',text:'#16A34A',label:'Approved'}, declined:{bg:'#FEE2E2',text:'#EF4444',label:'Declined'} }[listing.status] || {bg:'#FEF3C7',text:'#D97706',label:'Pending'}
  const toggleReason = (r) => { const n=new Set(selectedReasons); n.has(r)?n.delete(r):n.add(r); setSelectedReasons(n) }
  const handleDeclineConfirm = () => { const p=[...selectedReasons]; if(note.trim()) p.push(note.trim()); onDecline(listing.id,p.join('. ')||'Did not meet requirements.'); setShowDecline(false) }
  const handleApproveConfirm = () => { onApprove(listing.id,tier); setShowApprove(false) }
  const borderColor = listing.status==='approved'?'#16A34A':listing.status==='declined'?'#EF4444':'#D97706'
  return (
    <div style={{ background:'#fff', border:'1.5px solid #E8EDF3', borderLeft:`4px solid ${borderColor}`, borderRadius:12, marginBottom:10, overflow:'hidden' }}>
      <div className="listing-row-grid" style={{ display:'grid', gridTemplateColumns:'60px 1fr auto', gap:10, padding:12, alignItems:'start', cursor:'pointer' }} onClick={() => setExpanded(!expanded)}>
        <div style={{ width:72, height:50, borderRadius:8, background:'#EEF5FF', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, overflow:'hidden' }}>
          {listing.listing_photos?.[0]?.url ? <img src={listing.listing_photos[0].url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/> : <span style={{ fontSize:11, color:'#94A3B8', fontWeight:600 }}>No photo</span>}
        </div>
        <div>
          <div style={{ fontFamily:'Outfit,sans-serif', fontSize:13, fontWeight:700, color:'#0A2540', marginBottom:2 }}>{listing.year} {listing.make} {listing.model}</div>
          <div style={{ fontSize:11, color:'#64748B', marginBottom:4 }}>by <strong>{listing.contact_name}</strong></div>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
            {[fmt(listing.price), `${Number(listing.mileage).toLocaleString()} km`, listing.fuel, listing.transmission, listing.body_type, `${listing.listing_photos?.length||0} photos`, listing.location].map((t,i) => (
              <span key={i} style={{ fontSize:10, color:'#94A3B8', padding:'2px 7px', background:'#F8FAFC', borderRadius:100, border:'1px solid #E8EDF3', fontWeight:500 }}>{t}</span>
            ))}
          </div>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:6, alignItems:'flex-end', flexShrink:0 }}>
          <span style={{ fontSize:10, fontWeight:700, padding:'3px 10px', borderRadius:100, background:sc.bg, color:sc.text, fontFamily:'Outfit,sans-serif', whiteSpace:'nowrap' }}>{sc.label}</span>
          <span style={{ fontSize:10, color:'#94A3B8' }}>{new Date(listing.created_at).toLocaleDateString('en-GB')}</span>
          {listing.status==='pending' && (
            <div style={{ display:'flex', gap:6 }}>
              <button onClick={(e)=>{ e.stopPropagation(); setShowApprove(!showApprove); setShowDecline(false); setExpanded(true) }} style={{ background:'#16A34A', color:'#fff', border:'none', padding:'6px 12px', borderRadius:6, fontSize:11, fontWeight:700, cursor:'pointer' }}>Approve</button>
              <button onClick={(e)=>{ e.stopPropagation(); setShowDecline(!showDecline); setShowApprove(false); setExpanded(true) }} style={{ background:'#FEE2E2', color:'#DC2626', border:'1.5px solid #FECACA', padding:'6px 12px', borderRadius:6, fontSize:11, fontWeight:700, cursor:'pointer' }}>Decline</button>
            </div>
          )}
        </div>
      </div>
      {expanded && (
        <div style={{ borderTop:'1px solid #F0F4F8', padding:16, background:'#FAFBFC' }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12, marginBottom:14 }}>
            <div style={{ fontSize:12, color:'#475569' }}><span style={{ display:'block', fontSize:10, color:'#94A3B8', fontWeight:700, textTransform:'uppercase', letterSpacing:'.4px', marginBottom:2 }}>Engine / Drive</span>{listing.engine_cc}cc - {listing.drive_type}</div>
            <div style={{ fontSize:12, color:'#475569' }}><span style={{ display:'block', fontSize:10, color:'#94A3B8', fontWeight:700, textTransform:'uppercase', letterSpacing:'.4px', marginBottom:2 }}>Colour</span>{listing.colour||'—'}</div>
            <div style={{ fontSize:12, color:'#475569' }}><span style={{ display:'block', fontSize:10, color:'#94A3B8', fontWeight:700, textTransform:'uppercase', letterSpacing:'.4px', marginBottom:2 }}>Condition</span>{listing.condition}</div>
            <div style={{ fontSize:12, color:'#475569', gridColumn:'1/-1' }}><span style={{ display:'block', fontSize:10, color:'#94A3B8', fontWeight:700, textTransform:'uppercase', letterSpacing:'.4px', marginBottom:2 }}>Description</span>{listing.description}</div>
            {listing.admin_note && <div style={{ fontSize:12, color:'#DC2626', gridColumn:'1/-1' }}><span style={{ display:'block', fontSize:10, color:'#DC2626', fontWeight:700, textTransform:'uppercase', letterSpacing:'.4px', marginBottom:2 }}>Admin Note</span>{listing.admin_note}</div>}
          </div>
          {listing.status==='approved' && (
            <div style={{ marginTop:12, paddingTop:12, borderTop:'1px solid #E8EDF3' }}>
              <p style={{ fontSize:13, color:'#475569', margin:'0 0 8px', fontWeight:600 }}>Featured: {listing.featured ? <span style={{ color:'#1565C0' }}>Yes</span> : <span style={{ color:'#94A3B8' }}>No</span>}</p>
              <div style={{ display:'flex', gap:8 }}>
                {[7,14,30].map(days => <button key={days} onClick={async(e)=>{ e.stopPropagation(); await markAsFeatured(listing.id,days); onFeatured() }} style={{ background:'#1565C0', color:'white', border:'1px solid #1565C0', borderRadius:6, padding:'6px 12px', fontSize:12, fontWeight:600, cursor:'pointer' }}>{days}d Featured</button>)}
                {listing.featured && <button onClick={async(e)=>{ e.stopPropagation(); await removeFeatured(listing.id); onFeatured() }} style={{ background:'#fff0f0', color:'#dc2626', border:'1px solid #dc2626', borderRadius:6, padding:'6px 12px', fontSize:12, fontWeight:600, cursor:'pointer' }}>Remove</button>}
              </div>
            </div>
          )}
          {showDecline && listing.status==='pending' && (
            <div style={{ background:'#FFF5F5', border:'1.5px solid #FECACA', borderRadius:10, padding:14, marginTop:10 }}>
              <div style={{ fontFamily:'Outfit,sans-serif', fontSize:13, fontWeight:700, color:'#DC2626', marginBottom:10 }}>Decline — Add Reason</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:12 }}>
                {DECLINE_REASONS.map(r => <button key={r} onClick={()=>toggleReason(r)} style={{ border:`1.5px solid ${selectedReasons.has(r)?'#EF4444':'#FECACA'}`, borderRadius:100, padding:'4px 10px', fontSize:11, fontWeight:600, cursor:'pointer', background:selectedReasons.has(r)?'#EF4444':'#fff', color:selectedReasons.has(r)?'#fff':'#DC2626' }}>{r}</button>)}
              </div>
              <textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="Additional note (optional)" style={{ width:'100%', padding:'9px 11px', border:'1.5px solid #FECACA', borderRadius:7, fontSize:12, fontFamily:'DM Sans,sans-serif', resize:'vertical', minHeight:70, outline:'none', lineHeight:1.5 }}/>
              <div style={{ display:'flex', gap:8, justifyContent:'flex-end', marginTop:10 }}>
                <button onClick={()=>setShowDecline(false)} style={{ background:'#fff', color:'#64748B', border:'1.5px solid #E2E8F0', padding:'7px 14px', borderRadius:7, fontSize:11, fontWeight:600, cursor:'pointer' }}>Cancel</button>
                <button onClick={handleDeclineConfirm} style={{ background:'#EF4444', color:'#fff', border:'none', padding:'7px 14px', borderRadius:7, fontSize:11, fontWeight:700, cursor:'pointer' }}>Send Decline</button>
              </div>
            </div>
          )}
          {showApprove && listing.status==='pending' && (
            <div style={{ background:'#F0FDF4', border:'1.5px solid #86EFAC', borderRadius:10, padding:14, marginTop:10 }}>
              <div style={{ fontFamily:'Outfit,sans-serif', fontSize:13, fontWeight:700, color:'#16A34A', marginBottom:6 }}>Approve Listing</div>
              <div style={{ fontSize:12, color:'#475569', marginBottom:10 }}>Listing will go live immediately.</div>
              <div style={{ display:'flex', gap:6, marginBottom:12 }}>
                {['standard','featured','special deal'].map(t => <button key={t} onClick={()=>setTier(t)} style={{ border:`1.5px solid ${tier===t?'#16A34A':'#E2E8F0'}`, borderRadius:7, padding:'5px 12px', fontSize:11, fontWeight:600, cursor:'pointer', background:tier===t?'#DCFCE7':'#fff', color:tier===t?'#16A34A':'#475569' }}>{t.charAt(0).toUpperCase()+t.slice(1)}</button>)}
              </div>
              <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
                <button onClick={()=>setShowApprove(false)} style={{ background:'#fff', color:'#64748B', border:'1.5px solid #E2E8F0', padding:'7px 14px', borderRadius:7, fontSize:11, fontWeight:600, cursor:'pointer' }}>Cancel</button>
                <button onClick={handleApproveConfirm} style={{ background:'#16A34A', color:'#fff', border:'none', padding:'7px 14px', borderRadius:7, fontSize:11, fontWeight:700, cursor:'pointer' }}>Approve and Publish</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function UsersTab() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  useEffect(() => {
    supabase.from('user_list').select('*').order('created_at', { ascending:false })
      .then(({ data }) => { setUsers(data||[]); setLoading(false) })
  }, [])
  const filtered = users.filter(u => !search || u.email?.toLowerCase().includes(search.toLowerCase()) || u.full_name?.toLowerCase().includes(search.toLowerCase()))
  return (
    <div>
      <div className="admin-header" style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <h2 style={{ fontFamily:'Outfit,sans-serif', fontSize:18, fontWeight:800, color:'#0A2540', margin:0 }}>All Users</h2>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search..." className="admin-search" style={{ padding:'8px 12px', border:'1.5px solid #E2E8F0', borderRadius:8, fontSize:12, outline:'none', background:'#fff', width:240 }}/>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:18 }}>
        <StatCard icon="👤" number={users.length} label="Total Users" color="#1565C0"/>
        <StatCard icon="✓" number={users.filter(u=>u.email_confirmed).length} label="Verified" color="#16A34A"/>
        <StatCard icon="🏢" number={users.filter(u=>u.role==='dealer').length} label="Dealers" color="#D97706"/>
      </div>
      {loading ? <div style={{ textAlign:'center', padding:40, color:'#94A3B8' }}>Loading users...</div> : (
        <div style={{ background:'#fff', border:'1.5px solid #E8EDF3', borderRadius:12, overflow:'hidden' }}>
          <div className="users-table-header" style={{ display:'grid', gridTemplateColumns:'40px 1fr 160px 110px 100px', padding:'10px 16px', background:'#F8FAFC', borderBottom:'1px solid #E8EDF3' }}>
            {['','User','Joined','Role','Status'].map((h,i) => <div key={i} style={{ fontSize:10, fontWeight:700, color:'#94A3B8', textTransform:'uppercase', letterSpacing:'.5px' }}>{h}</div>)}
          </div>
          {filtered.length===0 ? <div style={{ textAlign:'center', padding:32, color:'#94A3B8', fontSize:13 }}>No users found.</div>
           : filtered.map((u,i) => (
            <div key={u.id} className="users-table-row" style={{ display:'grid', gridTemplateColumns:'40px 1fr 160px 110px 100px', padding:'12px 16px', borderBottom:'1px solid #F5F7FA', alignItems:'center', background:i%2===0?'#fff':'#FAFBFC' }}>
              <div style={{ width:28, height:28, borderRadius:'50%', background:'#1565C0', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Outfit,sans-serif', fontSize:11, fontWeight:700, color:'#fff' }}>{u.email?.[0]?.toUpperCase()||'?'}</div>
              <div><div style={{ fontSize:13, fontWeight:600, color:'#0A2540' }}>{u.full_name||'—'}</div><div style={{ fontSize:11, color:'#94A3B8' }}>{u.email}</div></div>
              <div style={{ fontSize:12, color:'#64748B' }}>{new Date(u.created_at).toLocaleDateString('en-GB')}</div>
              <div><span style={{ fontSize:10, fontWeight:700, padding:'3px 10px', borderRadius:100, fontFamily:'Outfit,sans-serif', background:u.role==='admin'?'#FEF3C7':u.role==='dealer'?'#EEF5FF':'#F0F4F8', color:u.role==='admin'?'#D97706':u.role==='dealer'?'#1565C0':'#64748B' }}>{u.role||'user'}</span></div>
              <div><span style={{ fontSize:10, fontWeight:700, padding:'3px 10px', borderRadius:100, fontFamily:'Outfit,sans-serif', background:u.email_confirmed?'#DCFCE7':'#FEE2E2', color:u.email_confirmed?'#16A34A':'#DC2626' }}>{u.email_confirmed?'Verified':'Unverified'}</span></div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function DealersTab({ listings }) {
  const [search, setSearch] = useState('')
  const dealerMap = {}
  listings.filter(l=>l.status==='approved').forEach(l => {
    const key = l.contact_name||'Unknown'
    if (!dealerMap[key]) dealerMap[key] = { name:key, phone:l.phone, location:l.location, count:0, total:0 }
    dealerMap[key].count++
    dealerMap[key].total += Number(l.price)||0
  })
  const dealers = Object.values(dealerMap).sort((a,b)=>b.count-a.count)
  const filtered = dealers.filter(d=>!search||d.name.toLowerCase().includes(search.toLowerCase()))
  return (
    <div>
      <div className="admin-header" style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <h2 style={{ fontFamily:'Outfit,sans-serif', fontSize:18, fontWeight:800, color:'#0A2540', margin:0 }}>Dealers and Sellers</h2>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search..." className="admin-search" style={{ padding:'8px 12px', border:'1.5px solid #E2E8F0', borderRadius:8, fontSize:12, outline:'none', background:'#fff', width:240 }}/>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:18 }}>
        <StatCard icon="🏢" number={dealers.length} label="Active Sellers" color="#1565C0"/>
        <StatCard icon="🚗" number={listings.filter(l=>l.status==='approved').length} label="Live Listings" color="#16A34A"/>
        <StatCard icon="💰" number={dealers.filter(d=>d.count>=3).length} label="Power Sellers (3+ listings)" color="#D97706"/>
      </div>
      <div style={{ background:'#fff', border:'1.5px solid #E8EDF3', borderRadius:12, overflow:'hidden' }}>
        <div className="dealers-table-header" style={{ display:'grid', gridTemplateColumns:'1fr 140px 120px 160px', padding:'10px 16px', background:'#F8FAFC', borderBottom:'1px solid #E8EDF3' }}>
          {['Seller','Location','Listings','Inventory Value'].map(h => <div key={h} style={{ fontSize:10, fontWeight:700, color:'#94A3B8', textTransform:'uppercase', letterSpacing:'.5px' }}>{h}</div>)}
        </div>
        {filtered.length===0 ? <div style={{ textAlign:'center', padding:32, color:'#94A3B8', fontSize:13 }}>No dealers yet.</div>
         : filtered.map((d,i) => (
          <div key={d.name} className="dealers-table-row" style={{ display:'grid', gridTemplateColumns:'1fr 140px 120px 160px', padding:'12px 16px', borderBottom:'1px solid #F5F7FA', alignItems:'center', background:i%2===0?'#fff':'#FAFBFC' }}>
            <div><div style={{ fontSize:13, fontWeight:600, color:'#0A2540' }}>{d.name}</div><div style={{ fontSize:11, color:'#94A3B8' }}>{d.phone||'—'}</div></div>
            <div style={{ fontSize:12, color:'#64748B' }}>{d.location||'—'}</div>
            <div><span style={{ fontSize:13, fontWeight:700, color:'#1565C0', fontFamily:'Outfit,sans-serif' }}>{d.count}</span><span style={{ fontSize:11, color:'#94A3B8' }}> listing{d.count!==1?'s':''}</span></div>
            <div style={{ fontSize:12, fontWeight:600, color:'#0A2540', fontFamily:'Outfit,sans-serif' }}>{fmt(d.total)}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function AnalyticsTab({ listings }) {
  const approved = listings.filter(l=>l.status==='approved')
  const pending  = listings.filter(l=>l.status==='pending')
  const declined = listings.filter(l=>l.status==='declined')
  const makeCounts = {}
  approved.forEach(l=>{ makeCounts[l.make]=(makeCounts[l.make]||0)+1 })
  const topMakes = Object.entries(makeCounts).sort((a,b)=>b[1]-a[1]).slice(0,8)
  const maxMakeCount = topMakes[0]?.[1]||1
  const bodyCounts = {}
  approved.forEach(l=>{ bodyCounts[l.body_type]=(bodyCounts[l.body_type]||0)+1 })
  const topBodies = Object.entries(bodyCounts).sort((a,b)=>b[1]-a[1]).slice(0,6)
  const prices = approved.map(l=>Number(l.price)).filter(Boolean)
  const avgPrice = prices.length ? Math.round(prices.reduce((a,b)=>a+b,0)/prices.length) : 0
  const maxPrice = prices.length ? Math.max(...prices) : 0
  const minPrice = prices.length ? Math.min(...prices) : 0
  const totalViews = listings.reduce((a,l)=>a+(Number(l.views)||0),0)
  return (
    <div>
      <h2 style={{ fontFamily:'Outfit,sans-serif', fontSize:20, fontWeight:800, color:'#0A2540', marginBottom:16 }}>Analytics</h2>
      <div className="admin-stat-grid" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 }}>
        <StatCard icon="📋" number={listings.length} label="Total Listings" color="#1565C0"/>
        <StatCard icon="✓" number={approved.length} label="Live Listings" color="#16A34A"/>
        <StatCard icon="👁" number={totalViews.toLocaleString()} label="Total Views" color="#7C3AED"/>
        <StatCard icon="💰" number={fmt(avgPrice)} label="Avg Price" color="#D97706"/>
      </div>
      <div className="admin-analytics-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
        <div style={{ background:'#fff', border:'1.5px solid #E8EDF3', borderRadius:12, padding:18 }}>
          <div style={{ fontFamily:'Outfit,sans-serif', fontSize:14, fontWeight:700, color:'#0A2540', marginBottom:14 }}>Listing Status</div>
          {[['Approved / Live',approved.length,'#16A34A'],['Pending Review',pending.length,'#D97706'],['Declined',declined.length,'#EF4444']].map(([label,count,color]) => (
            <div key={label} style={{ marginBottom:12 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                <span style={{ fontSize:12, color:'#475569' }}>{label}</span>
                <span style={{ fontSize:12, fontWeight:700, color, fontFamily:'Outfit,sans-serif' }}>{count}</span>
              </div>
              <div style={{ height:6, borderRadius:3, background:'#F0F4F8', overflow:'hidden' }}>
                <div style={{ height:'100%', borderRadius:3, background:color, width:`${listings.length?(count/listings.length*100):0}%` }}/>
              </div>
            </div>
          ))}
        </div>
        <div style={{ background:'#fff', border:'1.5px solid #E8EDF3', borderRadius:12, padding:18 }}>
          <div style={{ fontFamily:'Outfit,sans-serif', fontSize:14, fontWeight:700, color:'#0A2540', marginBottom:14 }}>Price Insights</div>
          {[['Lowest Listing',fmt(minPrice),'#16A34A'],['Average Price',fmt(avgPrice),'#1565C0'],['Highest Listing',fmt(maxPrice),'#D97706'],['Total Value',fmt(prices.reduce((a,b)=>a+b,0)),'#0A2540']].map(([label,value,color]) => (
            <div key={label} style={{ display:'flex', justifyContent:'space-between', padding:'9px 0', borderBottom:'1px solid #F5F7FA' }}>
              <span style={{ fontSize:12, color:'#64748B' }}>{label}</span>
              <span style={{ fontSize:13, fontWeight:700, color, fontFamily:'Outfit,sans-serif' }}>{value}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ background:'#fff', border:'1.5px solid #E8EDF3', borderRadius:12, padding:18, marginBottom:16 }}>
        <div style={{ fontFamily:'Outfit,sans-serif', fontSize:14, fontWeight:700, color:'#0A2540', marginBottom:14 }}>Top Makes on Platform</div>
        {topMakes.length===0 ? <div style={{ textAlign:'center', color:'#94A3B8', fontSize:13, padding:20 }}>No approved listings yet.</div>
         : topMakes.map(([make,count]) => (
          <div key={make} style={{ marginBottom:10 }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
              <span style={{ fontSize:12, fontWeight:600, color:'#0A2540' }}>{make}</span>
              <span style={{ fontSize:12, color:'#94A3B8' }}>{count} listing{count!==1?'s':''}</span>
            </div>
            <div style={{ height:8, borderRadius:4, background:'#F0F4F8', overflow:'hidden' }}>
              <div style={{ height:'100%', borderRadius:4, background:'#1565C0', width:`${(count/maxMakeCount)*100}%` }}/>
            </div>
          </div>
        ))}
      </div>
      <div style={{ background:'#fff', border:'1.5px solid #E8EDF3', borderRadius:12, padding:18 }}>
        <div style={{ fontFamily:'Outfit,sans-serif', fontSize:14, fontWeight:700, color:'#0A2540', marginBottom:14 }}>Body Types</div>
        {topBodies.length===0 ? <div style={{ textAlign:'center', color:'#94A3B8', fontSize:13, padding:20 }}>No data yet.</div> : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
            {topBodies.map(([body,count]) => (
              <div key={body} style={{ background:'#EEF5FF', borderRadius:10, padding:'12px 14px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ fontSize:13, fontWeight:600, color:'#0A2540' }}>{body||'Other'}</span>
                <span style={{ fontSize:20, fontWeight:800, color:'#1565C0', fontFamily:'Outfit,sans-serif' }}>{count}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function ArticlesTab() {
  const [articles, setArticles] = useState([])
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ title:'', slug:'', excerpt:'', content:'', cover_image_url:'', author_name:'CarExpert Africa', category:'News', tags:'', read_time:3, published:false })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const CATEGORIES = ['News','Review','Buying Guide','Tips','Market Insight','EV','Lifestyle']

  useEffect(() => {
    supabase.from('articles').select('id,title,slug,category,published,published_at,views,author_name,read_time').order('created_at', { ascending: false })
      .then(({ data }) => setArticles(data || []))
  }, [])

  const openNew = () => {
    setEditing('new')
    setForm({ title:'', slug:'', excerpt:'', content:'', cover_image_url:'', author_name:'CarExpert Africa', category:'News', tags:'', read_time:3, published:false })
  }

  const openEdit = async (id) => {
    const { data } = await supabase.from('articles').select('*').eq('id', id).single()
    if (data) {
      setForm({ ...data, tags: (data.tags || []).join(', ') })
      setEditing(id)
    }
  }

  const makeSlug = (title) => title.toLowerCase().replace(/[^a-z0-9\s-]/g,'').replace(/\s+/g,'-').replace(/-+/g,'-').slice(0, 80)

  const save = async () => {
    if (!form.title.trim()) { setMsg('Title is required'); return }
    setSaving(true)
    const payload = {
      ...form,
      slug: form.slug || makeSlug(form.title),
      tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      read_time: Number(form.read_time),
      published_at: form.published && !form.published_at ? new Date().toISOString() : form.published_at,
      updated_at: new Date().toISOString()
    }
    const { data: { user: u } } = await supabase.auth.getUser()
    if (editing === 'new') {
      payload.author_id = u?.id
      const { error } = await supabase.from('articles').insert(payload)
      if (error) { setMsg('Error: ' + error.message); setSaving(false); return }
      setMsg('✓ Article created!')
    } else {
      const { error } = await supabase.from('articles').update(payload).eq('id', editing)
      if (error) { setMsg('Error: ' + error.message); setSaving(false); return }
      setMsg('✓ Saved!')
    }
    setSaving(false)
    const { data } = await supabase.from('articles').select('id,title,slug,category,published,published_at,views,author_name,read_time').order('created_at', { ascending: false })
    setArticles(data || [])
    setTimeout(() => { setMsg(''); setEditing(null) }, 1500)
  }

  const deleteArticle = async (id) => {
    if (!window.confirm('Delete this article?')) return
    await supabase.from('articles').delete().eq('id', id)
    setArticles(prev => prev.filter(a => a.id !== id))
  }

  const inp = { width:'100%', padding:'10px 12px', border:'1.5px solid #E2E8F0', borderRadius:8, fontSize:13, fontFamily:'DM Sans,sans-serif', outline:'none', background:'#fff', boxSizing:'border-box' }
  const lbl = { display:'block', fontSize:10, fontWeight:700, color:'#64748B', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:5 }

  if (editing !== null) {
    return (
      <div>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16, flexWrap:'wrap', gap:8 }}>
          <div style={{ fontFamily:'Outfit,sans-serif', fontSize:17, fontWeight:800, color:'#0A2540' }}>
            {editing === 'new' ? '✏️ New Article' : '✏️ Edit Article'}
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={() => setEditing(null)} style={{ background:'#F8FAFC', color:'#64748B', border:'1.5px solid #E2E8F0', padding:'8px 16px', borderRadius:7, fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'Outfit,sans-serif' }}>← Back</button>
            <button onClick={save} disabled={saving} style={{ background:'#1565C0', color:'#fff', border:'none', padding:'8px 16px', borderRadius:7, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'Outfit,sans-serif' }}>
              {saving ? 'Saving...' : form.published ? '🌐 Save & Publish' : '💾 Save Draft'}
            </button>
          </div>
        </div>
        {msg && <div style={{ background: msg.startsWith('✓') ? '#DCFCE7' : '#FEE2E2', color: msg.startsWith('✓') ? '#16A34A' : '#DC2626', borderRadius:8, padding:'10px 14px', fontSize:13, fontWeight:600, marginBottom:14 }}>{msg}</div>}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 280px', gap:16 }}>
          <div>
            <div style={{ background:'#fff', border:'1.5px solid #E8EDF3', borderRadius:12, padding:18, marginBottom:14 }}>
              <div style={{ marginBottom:14 }}>
                <label style={lbl}>Title *</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title:e.target.value, slug: makeSlug(e.target.value) }))} placeholder="Article title" style={{ ...inp, fontSize:16, fontWeight:600 }}/>
              </div>
              <div style={{ marginBottom:14 }}>
                <label style={lbl}>Slug (URL) <span style={{ fontWeight:400, textTransform:'none', color:'#94A3B8' }}>— auto-generated</span></label>
                <input value={form.slug} onChange={e => setForm(f => ({ ...f, slug:e.target.value }))} placeholder="article-url-slug" style={inp}/>
                <div style={{ fontSize:11, color:'#94A3B8', marginTop:4 }}>carexpertafrica.com/news/{form.slug || 'article-slug'}</div>
              </div>
              <div style={{ marginBottom:14 }}>
                <label style={lbl}>Excerpt <span style={{ fontWeight:400, textTransform:'none', color:'#94A3B8' }}>— shown on listing cards</span></label>
                <textarea value={form.excerpt} onChange={e => setForm(f => ({ ...f, excerpt:e.target.value }))} placeholder="Short description (1-2 sentences)..." rows={2} style={{ ...inp, resize:'vertical' }}/>
              </div>
              <div>
                <label style={lbl}>Content <span style={{ fontWeight:400, textTransform:'none', color:'#94A3B8' }}>— use ## for headings, > for quotes, - for bullet points</span></label>
                <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content:e.target.value }))} placeholder={`## Introduction\n\nWrite your article here...\n\n## Key Points\n\n- Point 1\n- Point 2\n\n> A great quote goes here`} rows={20} style={{ ...inp, resize:'vertical', fontFamily:'monospace', fontSize:13, lineHeight:1.7 }}/>
              </div>
            </div>
          </div>
          <div>
            <div style={{ background:'#fff', border:'1.5px solid #E8EDF3', borderRadius:12, padding:16, marginBottom:14 }}>
              <div style={{ fontFamily:'Outfit,sans-serif', fontSize:13, fontWeight:700, color:'#0A2540', marginBottom:14 }}>Publish Settings</div>
              <div onClick={() => setForm(f => ({ ...f, published:!f.published }))}
                style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', border:`1.5px solid ${form.published?'#16A34A':'#E2E8F0'}`, borderRadius:8, cursor:'pointer', marginBottom:14, background:form.published?'#F0FDF4':'#F8FAFC' }}>
                <div style={{ width:18, height:18, borderRadius:4, border:`2px solid ${form.published?'#16A34A':'#CBD5E1'}`, background:form.published?'#16A34A':'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, color:'#fff' }}>{form.published?'✓':''}</div>
                <div>
                  <div style={{ fontSize:13, fontWeight:700, color:form.published?'#16A34A':'#475569' }}>{form.published ? '🌐 Published' : '📝 Draft'}</div>
                  <div style={{ fontSize:11, color:'#94A3B8' }}>{form.published ? 'Visible to everyone' : 'Only visible to admins'}</div>
                </div>
              </div>
              <div style={{ marginBottom:12 }}>
                <label style={lbl}>Category</label>
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category:e.target.value }))} style={inp}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div style={{ marginBottom:12 }}>
                <label style={lbl}>Author Name</label>
                <input value={form.author_name} onChange={e => setForm(f => ({ ...f, author_name:e.target.value }))} style={inp}/>
              </div>
              <div style={{ marginBottom:12 }}>
                <label style={lbl}>Read Time (minutes)</label>
                <input type="number" value={form.read_time} onChange={e => setForm(f => ({ ...f, read_time:e.target.value }))} min={1} max={60} style={inp}/>
              </div>
              <div style={{ marginBottom:12 }}>
                <label style={lbl}>Tags <span style={{ fontWeight:400, textTransform:'none' }}>comma separated</span></label>
                <input value={form.tags} onChange={e => setForm(f => ({ ...f, tags:e.target.value }))} placeholder="toyota, suv, review" style={inp}/>
              </div>
              <div>
                <label style={lbl}>Cover Image URL</label>
                <input value={form.cover_image_url} onChange={e => setForm(f => ({ ...f, cover_image_url:e.target.value }))} placeholder="https://..." style={inp}/>
                {form.cover_image_url && <img src={form.cover_image_url} alt="" style={{ width:'100%', height:120, objectFit:'cover', borderRadius:8, marginTop:8, border:'1px solid #E8EDF3' }} onError={e => e.target.style.display='none'}/>}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <div style={{ fontFamily:'Outfit,sans-serif', fontSize:17, fontWeight:800, color:'#0A2540' }}>Articles <span style={{ color:'#94A3B8', fontWeight:400, fontSize:13 }}>({articles.length})</span></div>
        <button onClick={openNew} style={{ background:'#1565C0', color:'#fff', border:'none', padding:'9px 18px', borderRadius:8, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'Outfit,sans-serif' }}>+ New Article</button>
      </div>
      {articles.length === 0 ? (
        <div style={{ textAlign:'center', padding:60, background:'#fff', borderRadius:12, border:'1.5px solid #E8EDF3' }}>
          <div style={{ fontSize:40, marginBottom:16 }}>📰</div>
          <div style={{ fontFamily:'Outfit,sans-serif', fontSize:16, fontWeight:700, color:'#0A2540', marginBottom:8 }}>No articles yet</div>
          <button onClick={openNew} style={{ background:'#1565C0', color:'#fff', border:'none', padding:'10px 24px', borderRadius:8, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'Outfit,sans-serif' }}>Write First Article</button>
        </div>
      ) : articles.map(a => (
        <div key={a.id} style={{ background:'#fff', border:'1.5px solid #E8EDF3', borderRadius:12, padding:16, marginBottom:10, display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:10 }}>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
              <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:100, background:a.published?'#DCFCE7':'#FEF3C7', color:a.published?'#16A34A':'#D97706', fontFamily:'Outfit,sans-serif' }}>
                {a.published ? '🌐 Live' : '📝 Draft'}
              </span>
              <span style={{ background:'#EEF5FF', color:'#1565C0', fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:100 }}>{a.category}</span>
            </div>
            <div style={{ fontFamily:'Outfit,sans-serif', fontSize:14, fontWeight:700, color:'#0A2540', marginBottom:3 }}>{a.title}</div>
            <div style={{ fontSize:11, color:'#94A3B8' }}>By {a.author_name} · {a.read_time} min · {a.views || 0} views · /news/{a.slug}</div>
          </div>
          <div style={{ display:'flex', gap:8, flexShrink:0 }}>
            <a href={`/news/${a.slug}`} target="_blank" rel="noopener noreferrer" style={{ background:'#F0F6FF', color:'#1565C0', border:'1.5px solid #BDD5FF', padding:'7px 12px', borderRadius:7, fontSize:11, fontWeight:700, textDecoration:'none', fontFamily:'Outfit,sans-serif' }}>View →</a>
            <button onClick={() => openEdit(a.id)} style={{ background:'#F8FAFC', color:'#475569', border:'1.5px solid #E2E8F0', padding:'7px 12px', borderRadius:7, fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:'Outfit,sans-serif' }}>Edit</button>
            <button onClick={() => deleteArticle(a.id)} style={{ background:'#FEE2E2', color:'#DC2626', border:'none', padding:'7px 10px', borderRadius:7, fontSize:11, cursor:'pointer' }}>✕</button>
          </div>
        </div>
      ))}
    </div>
  )
}

function VideosAdminTab() {
  const [videos, setVideos] = useState([])
  const [form, setForm] = useState({ title:'', youtube_url:'', description:'', creator_name:'', creator_channel:'', category:'Review', tags:'', published:true })
  const [adding, setAdding] = useState(false)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const CATEGORIES = ['Review','Buying Guide','Tips','News','Market Insight']

  useEffect(() => {
    supabase.from('videos').select('*').order('created_at', { ascending: false })
      .then(({ data }) => setVideos(data || []))
  }, [])

  const getYouTubeId = (url) => {
    const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?/]+)/)
    return m ? m[1] : null
  }

  const save = async () => {
    if (!form.title.trim() || !form.youtube_url.trim()) { setMsg('Title and YouTube URL are required'); return }
    const ytId = getYouTubeId(form.youtube_url)
    if (!ytId) { setMsg('Invalid YouTube URL'); return }
    setSaving(true)
    const payload = { ...form, youtube_id: ytId, tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [] }
    const { data, error } = await supabase.from('videos').insert(payload).select().single()
    setSaving(false)
    if (error) { setMsg('Error: ' + error.message); return }
    setVideos(prev => [data, ...prev])
    setMsg('✓ Video added!')
    setForm({ title:'', youtube_url:'', description:'', creator_name:'', creator_channel:'', category:'Review', tags:'', published:true })
    setAdding(false)
    setTimeout(() => setMsg(''), 2000)
  }

  const deleteVideo = async (id) => {
    if (!window.confirm('Delete this video?')) return
    await supabase.from('videos').delete().eq('id', id)
    setVideos(prev => prev.filter(v => v.id !== id))
  }

  const inp = { width:'100%', padding:'10px 12px', border:'1.5px solid #E2E8F0', borderRadius:8, fontSize:13, fontFamily:'DM Sans,sans-serif', outline:'none', background:'#fff', boxSizing:'border-box' }
  const lbl = { display:'block', fontSize:10, fontWeight:700, color:'#64748B', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:5 }

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <div style={{ fontFamily:'Outfit,sans-serif', fontSize:17, fontWeight:800, color:'#0A2540' }}>Videos <span style={{ color:'#94A3B8', fontWeight:400, fontSize:13 }}>({videos.length})</span></div>
        <button onClick={() => setAdding(!adding)} style={{ background:'#1565C0', color:'#fff', border:'none', padding:'9px 18px', borderRadius:8, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'Outfit,sans-serif' }}>
          {adding ? '✕ Cancel' : '+ Add Video'}
        </button>
      </div>

      {msg && <div style={{ background: msg.startsWith('✓') ? '#DCFCE7' : '#FEE2E2', color: msg.startsWith('✓') ? '#16A34A' : '#DC2626', borderRadius:8, padding:'10px 14px', fontSize:13, fontWeight:600, marginBottom:14 }}>{msg}</div>}

      {adding && (
        <div style={{ background:'#fff', border:'1.5px solid #E8EDF3', borderRadius:12, padding:18, marginBottom:16 }}>
          <div style={{ fontFamily:'Outfit,sans-serif', fontSize:14, fontWeight:700, color:'#0A2540', marginBottom:14 }}>Add YouTube Video</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
            <div style={{ gridColumn:'1/-1' }}>
              <label style={lbl}>YouTube URL *</label>
              <input value={form.youtube_url} onChange={e => setForm(f => ({ ...f, youtube_url:e.target.value }))} placeholder="https://www.youtube.com/watch?v=..." style={inp}/>
              {form.youtube_url && getYouTubeId(form.youtube_url) && (
                <div style={{ marginTop:8, borderRadius:8, overflow:'hidden', height:140 }}>
                  <iframe src={`https://www.youtube.com/embed/${getYouTubeId(form.youtube_url)}`} title="preview" frameBorder="0" allowFullScreen style={{ width:'100%', height:'100%' }}/>
                </div>
              )}
            </div>
            <div style={{ gridColumn:'1/-1' }}>
              <label style={lbl}>Title *</label>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title:e.target.value }))} placeholder="Video title" style={inp}/>
            </div>
            <div>
              <label style={lbl}>Creator Name</label>
              <input value={form.creator_name} onChange={e => setForm(f => ({ ...f, creator_name:e.target.value }))} placeholder="e.g. Nairobi Garage" style={inp}/>
            </div>
            <div>
              <label style={lbl}>Channel</label>
              <input value={form.creator_channel} onChange={e => setForm(f => ({ ...f, creator_channel:e.target.value }))} placeholder="e.g. @nairobigarage" style={inp}/>
            </div>
            <div>
              <label style={lbl}>Category</label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category:e.target.value }))} style={inp}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Tags (comma separated)</label>
              <input value={form.tags} onChange={e => setForm(f => ({ ...f, tags:e.target.value }))} placeholder="toyota, review, suv" style={inp}/>
            </div>
            <div style={{ gridColumn:'1/-1' }}>
              <label style={lbl}>Description</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description:e.target.value }))} placeholder="Brief description..." rows={2} style={{ ...inp, resize:'vertical' }}/>
            </div>
          </div>
          <button onClick={save} disabled={saving}
            style={{ background:'#1565C0', color:'#fff', border:'none', padding:'10px 24px', borderRadius:8, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'Outfit,sans-serif' }}>
            {saving ? 'Saving...' : '✓ Add Video'}
          </button>
        </div>
      )}

      {videos.length === 0 ? (
        <div style={{ textAlign:'center', padding:48, background:'#fff', borderRadius:12, border:'1.5px solid #E8EDF3' }}>
          <div style={{ fontSize:32, marginBottom:12 }}>🎬</div>
          <div style={{ fontFamily:'Outfit,sans-serif', fontSize:15, fontWeight:700, color:'#0A2540' }}>No videos yet</div>
        </div>
      ) : videos.map(v => (
        <div key={v.id} style={{ background:'#fff', border:'1.5px solid #E8EDF3', borderRadius:12, padding:14, marginBottom:10, display:'grid', gridTemplateColumns:'120px 1fr auto', gap:12, alignItems:'center' }}>
          <div style={{ borderRadius:8, overflow:'hidden', height:68, background:'#000' }}>
            <img src={`https://img.youtube.com/vi/${v.youtube_id}/mqdefault.jpg`} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
          </div>
          <div>
            <div style={{ fontFamily:'Outfit,sans-serif', fontSize:13, fontWeight:700, color:'#0A2540', marginBottom:3 }}>{v.title}</div>
            <div style={{ fontSize:11, color:'#94A3B8' }}>
              {v.creator_name && <span>By {v.creator_name} · </span>}
              <span style={{ background:'#EEF5FF', color:'#1565C0', fontSize:9, fontWeight:700, padding:'1px 6px', borderRadius:100 }}>{v.category}</span>
            </div>
          </div>
          <div style={{ display:'flex', gap:6, flexShrink:0 }}>
            <a href={v.youtube_url} target="_blank" rel="noopener noreferrer"
              style={{ background:'#FEE2E2', color:'#EF4444', border:'none', padding:'6px 10px', borderRadius:7, fontSize:11, fontWeight:700, textDecoration:'none' }}>▶ View</a>
            <button onClick={() => deleteVideo(v.id)} style={{ background:'#FEE2E2', color:'#DC2626', border:'none', padding:'6px 10px', borderRadius:7, fontSize:11, cursor:'pointer' }}>✕</button>
          </div>
        </div>
      ))}
    </div>
  )
}

function DealerOffersTab() {
  const [offers, setOffers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('dealer_offer_requests').select('*').order('created_at', { ascending: false })
      .then(({ data }) => { setOffers(data || []); setLoading(false) })
  }, [])

  const updateStatus = async (id, status) => {
    await supabase.from('dealer_offer_requests').update({ status }).eq('id', id)
    setOffers(prev => prev.map(o => o.id === id ? { ...o, status } : o))
  }

  const fmtV = n => 'KSH ' + Number(n).toLocaleString()
  const statusColor = s => s === 'open' ? '#D97706' : s === 'contacted' ? '#1565C0' : s === 'sold' ? '#16A34A' : '#94A3B8'
  const statusBg = s => s === 'open' ? '#FEF3C7' : s === 'contacted' ? '#EEF5FF' : s === 'sold' ? '#DCFCE7' : '#F8FAFC'

  if (loading) return <div style={{ textAlign:'center', padding:40, color:'#94A3B8' }}>Loading...</div>

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <div style={{ fontFamily:'Outfit,sans-serif', fontSize:17, fontWeight:800, color:'#0A2540' }}>
          Dealer Offer Requests <span style={{ color:'#94A3B8', fontWeight:400, fontSize:13 }}>({offers.length})</span>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          {['open','contacted','sold','closed'].map(s => (
            <span key={s} style={{ fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:100, background:statusBg(s), color:statusColor(s) }}>
              {offers.filter(o => o.status === s).length} {s}
            </span>
          ))}
        </div>
      </div>
      {offers.length === 0 ? (
        <div style={{ textAlign:'center', padding:48, background:'#fff', borderRadius:12, border:'1.5px solid #E8EDF3' }}>
          <div style={{ fontSize:32, marginBottom:12 }}>💰</div>
          <div style={{ fontFamily:'Outfit,sans-serif', fontSize:15, fontWeight:700, color:'#0A2540' }}>No offer requests yet</div>
        </div>
      ) : offers.map(o => (
        <div key={o.id} style={{ background:'#fff', border:'1.5px solid #E8EDF3', borderRadius:12, padding:16, marginBottom:10 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:12, alignItems:'start' }}>
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6, flexWrap:'wrap' }}>
                <span style={{ fontFamily:'Outfit,sans-serif', fontSize:14, fontWeight:800, color:'#0A2540' }}>{o.year} {o.make} {o.model}</span>
                <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:100, background:statusBg(o.status), color:statusColor(o.status), fontFamily:'Outfit,sans-serif' }}>{o.status}</span>
              </div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:12, fontSize:12, color:'#64748B', marginBottom:8 }}>
                <span>📅 {o.year} · {Number(o.mileage || 0).toLocaleString()} km · {o.condition}</span>
                <span>⚙️ {o.transmission} · {o.fuel_type}</span>
                {o.colour && <span>🎨 {o.colour}</span>}
                {o.location && <span>📍 {o.location}</span>}
              </div>
              <div style={{ display:'flex', gap:16, fontSize:12, marginBottom:8 }}>
                <span style={{ color:'#94A3B8' }}>Est. Low: <strong style={{ color:'#0A2540' }}>{fmtV(o.estimated_low)}</strong></span>
                <span style={{ color:'#94A3B8' }}>Est. Mid: <strong style={{ color:'#1565C0' }}>{fmtV(o.estimated_mid)}</strong></span>
                <span style={{ color:'#94A3B8' }}>Est. High: <strong style={{ color:'#0A2540' }}>{fmtV(o.estimated_high)}</strong></span>
              </div>
              <div style={{ display:'flex', gap:16, fontSize:12, color:'#475569' }}>
                <span>👤 {o.contact_name}</span>
                <a href={`tel:${o.contact_phone}`} style={{ color:'#1565C0', textDecoration:'none' }}>📞 {o.contact_phone}</a>
                {o.contact_email && <a href={`mailto:${o.contact_email}`} style={{ color:'#1565C0', textDecoration:'none' }}>✉️ {o.contact_email}</a>}
              </div>
              {o.notes && <div style={{ marginTop:6, fontSize:11, color:'#64748B', fontStyle:'italic' }}>"{o.notes}"</div>}
              <div style={{ fontSize:10, color:'#94A3B8', marginTop:4 }}>{new Date(o.created_at).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })}</div>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:6, flexShrink:0 }}>
              <a href={`https://wa.me/${(o.contact_phone||'').replace(/\D/g,'')}?text=Hi ${o.contact_name}, this is CarExpert Africa regarding your ${o.year} ${o.make} ${o.model} offer request.`}
                target="_blank" rel="noopener noreferrer"
                style={{ background:'#25D366', color:'#fff', border:'none', padding:'7px 12px', borderRadius:7, fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:'Outfit,sans-serif', textDecoration:'none', textAlign:'center' }}>
                WhatsApp
              </a>
              {['contacted','sold','closed'].map(s => (
                o.status !== s && <button key={s} onClick={() => updateStatus(o.id, s)}
                  style={{ background:'#F8FAFC', color:'#475569', border:'1.5px solid #E2E8F0', padding:'6px 10px', borderRadius:7, fontSize:10, fontWeight:600, cursor:'pointer', textTransform:'capitalize' }}>
                  → {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function ReportsTab() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('listing_reports').select('*').order('created_at', { ascending: false })
      .then(({ data }) => { setReports(data || []); setLoading(false) })
  }, [])

  const updateStatus = async (id, status) => {
    await supabase.from('listing_reports').update({ status }).eq('id', id)
    setReports(prev => prev.map(r => r.id === id ? { ...r, status } : r))
  }

  const statusColor = s => ({ open:'#D97706', reviewed:'#1565C0', resolved:'#16A34A', dismissed:'#94A3B8' }[s] || '#94A3B8')
  const statusBg = s => ({ open:'#FFFBEB', reviewed:'#EEF5FF', resolved:'#DCFCE7', dismissed:'#F8FAFC' }[s] || '#F8FAFC')

  if (loading) return <div style={{ textAlign:'center', padding:40, color:'#94A3B8' }}>Loading...</div>

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <div style={{ fontFamily:'Outfit,sans-serif', fontSize:17, fontWeight:800, color:'#0A2540' }}>
          🚩 Listing Reports <span style={{ color:'#94A3B8', fontWeight:400, fontSize:13 }}>({reports.length})</span>
        </div>
        <span style={{ fontSize:12, fontWeight:700, padding:'4px 12px', borderRadius:100, background:'#FFFBEB', color:'#D97706' }}>
          {reports.filter(r => r.status === 'open').length} open
        </span>
      </div>
      {reports.length === 0 ? (
        <div style={{ textAlign:'center', padding:48, background:'#fff', borderRadius:12, border:'1.5px solid #E8EDF3' }}>
          <div style={{ fontSize:32, marginBottom:12 }}>✅</div>
          <div style={{ fontFamily:'Outfit,sans-serif', fontSize:15, fontWeight:700, color:'#0A2540' }}>No reports yet</div>
        </div>
      ) : reports.map(r => (
        <div key={r.id} style={{ background:'#fff', border:'1.5px solid #E8EDF3', borderRadius:12, padding:16, marginBottom:10 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8, flexWrap:'wrap', gap:8 }}>
            <div>
              <div style={{ fontFamily:'Outfit,sans-serif', fontSize:14, fontWeight:700, color:'#DC2626', marginBottom:2 }}>🚩 {r.reason}</div>
              {r.details && <div style={{ fontSize:12, color:'#64748B', fontStyle:'italic' }}>"{r.details}"</div>}
            </div>
            <span style={{ fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:100, background:statusBg(r.status), color:statusColor(r.status) }}>{r.status}</span>
          </div>
          <div style={{ fontSize:11, color:'#94A3B8', marginBottom:10 }}>
            {r.reporter_name && <span>{r.reporter_name} · </span>}
            {r.reporter_email && <span>{r.reporter_email} · </span>}
            {new Date(r.created_at).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' })}
          </div>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            <a href={`/listings/${r.listing_id}`} target="_blank" rel="noopener noreferrer"
              style={{ fontSize:11, fontWeight:700, color:'#1565C0', background:'#F0F6FF', border:'1.5px solid #BDD5FF', padding:'6px 12px', borderRadius:7, textDecoration:'none' }}>View Listing →</a>
            {['reviewed','resolved','dismissed'].filter(s => s !== r.status).map(s => (
              <button key={s} onClick={() => updateStatus(r.id, s)}
                style={{ background:'#F8FAFC', color:'#475569', border:'1.5px solid #E2E8F0', padding:'6px 10px', borderRadius:7, fontSize:11, fontWeight:600, cursor:'pointer', textTransform:'capitalize' }}>
                → {s}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

const ADMIN_MOBILE_CSS = `
  @media (max-width: 768px) {
    .admin-layout { grid-template-columns: 1fr !important; }
    .admin-sidebar { display: none !important; }
    .admin-desktop-tabs { display: none !important; }
    .admin-nav-tabs { display: flex !important; overflow-x: auto; }
    .admin-stat-grid { grid-template-columns: 1fr 1fr !important; }
    .admin-analytics-grid { grid-template-columns: 1fr !important; }
    .admin-search { width: 100% !important; box-sizing: border-box; }
    .admin-header { flex-direction: column !important; align-items: flex-start !important; gap: 10px !important; }
    .listing-row-grid { grid-template-columns: 52px 1fr !important; }
    .listing-row-grid > div:last-child { grid-column: 1 / -1; display: flex; gap: 8px; justify-content: space-between; align-items: center; flex-wrap: wrap; }
    .users-table-header { display: none !important; }
    .users-table-row { grid-template-columns: 36px 1fr !important; }
    .users-table-row > div:nth-child(3),
    .users-table-row > div:nth-child(4) { display: none !important; }
    .dealers-table-header { display: none !important; }
    .dealers-table-row { grid-template-columns: 1fr !important; }
    .dealers-table-row > div:nth-child(2) { display: none !important; }
    .main-pad { padding: 12px !important; }
  }
`

export default function AdminPage({ user }) {
  const [adminTab, setAdminTab] = useState('listings')
  const [listings, setListings] = useState([])
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState({ show:false, msg:'', type:'success' })

  useEffect(() => { fetchListings() }, [])

  const fetchListings = async () => {
    setLoading(true)
    const { data, error } = await getAllListingsAdmin()
    if (!error) setListings(data||[])
    setLoading(false)
  }

  const showToast = (msg, type='success') => { setToast({ show:true, msg, type }); setTimeout(()=>setToast(t=>({...t,show:false})),3000) }

  const handleApprove = async (id, tier) => {
    const { error } = await approveListing(id, tier)
    if (error) { showToast('Error approving listing','error'); return }
    setListings(prev=>prev.map(l=>l.id===id?{...l,status:'approved'}:l))
    showToast('Listing approved and published!','success')
  }

  const handleDecline = async (id, note) => {
    const { error } = await declineListing(id, note)
    if (error) { showToast('Error declining listing','error'); return }
    setListings(prev=>prev.map(l=>l.id===id?{...l,status:'declined',admin_note:note}:l))
    showToast('Listing declined.','error')
  }

  const filtered = listings.filter(l => {
    const matchesFilter = filter==='all'||l.status===filter
    const q = search.toLowerCase()
    return matchesFilter && (!q||`${l.make} ${l.model} ${l.contact_name}`.toLowerCase().includes(q))
  })

  const counts = { all:listings.length, pending:listings.filter(l=>l.status==='pending').length, approved:listings.filter(l=>l.status==='approved').length, declined:listings.filter(l=>l.status==='declined').length }
  const TABS = ['all','pending','approved','declined']
  const SIDEBAR = [
    { label:'Listings', icon:'📋', tab:'listings' },
    { label:'Pending',  icon:'⏳', tab:'listings', badge:counts.pending, badgeRed:true },
    { section:true },
    { label:'All Users', icon:'👤', tab:'users' },
    { label:'Dealers',   icon:'🏢', tab:'dealers' },
    { section:true },
    { label:'Analytics', icon:'📊', tab:'analytics' },
  ]

  return (
    <div style={{ fontFamily:'DM Sans,sans-serif', background:'#F0F2F5', minHeight:'100vh' }}>
      <style>{ADMIN_MOBILE_CSS}</style>
      <nav style={{ background:'#060F1A', padding:'0 16px', height:56, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ fontFamily:'Outfit,sans-serif', fontSize:15, fontWeight:800, color:'#fff', display:'flex', alignItems:'center', gap:8 }}>
          <Link to="/" style={{ color:'#fff', textDecoration:'none' }}>CarExpert<span style={{ color:'#4DA6FF' }}>Africa</span></Link>
          <span style={{ color:'rgba(255,255,255,.3)', fontWeight:400, fontSize:12 }}>/ Admin</span>
          {counts.pending>0 && <span style={{ background:'#EF4444', color:'#fff', fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:100 }}>{counts.pending}</span>}
        </div>
        <div className="admin-desktop-tabs" style={{ display:'flex', gap:12, alignItems:'center' }}>
          {['listings','users','dealers','analytics','articles','videos','offers','reports'].map(t => (
            <span key={t} onClick={()=>setAdminTab(t)} style={{ color:adminTab===t?'#4DA6FF':'rgba(255,255,255,.5)', fontSize:12, cursor:'pointer', fontWeight:adminTab===t?700:400, textTransform:'capitalize' }}>{t}{t==='listings'&&counts.pending>0?` (${counts.pending})`:''}</span>
          ))}
          <div style={{ width:30, height:30, borderRadius:'50%', background:'#1565C0', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Outfit,sans-serif', fontSize:11, fontWeight:700, color:'#fff' }}>{user?.email?.[0]?.toUpperCase()||'A'}</div>
        </div>
      </nav>

      {/* Mobile tab bar */}
      <div className="admin-nav-tabs" style={{ display:'none', background:'#0A2540', overflowX:'auto', borderBottom:'1px solid rgba(255,255,255,.1)' }}>
        {['listings','users','dealers','analytics','articles','videos','offers','reports'].map(t => (
          <button key={t} onClick={()=>setAdminTab(t)} style={{ flexShrink:0, padding:'11px 16px', border:'none', background:'none', fontSize:12, fontWeight:adminTab===t?700:500, color:adminTab===t?'#4DA6FF':'rgba(255,255,255,.5)', cursor:'pointer', borderBottom:`2px solid ${adminTab===t?'#4DA6FF':'transparent'}`, textTransform:'capitalize', fontFamily:'DM Sans,sans-serif' }}>
            {t}{t==='listings'&&counts.pending>0?` (${counts.pending})`:''}
          </button>
        ))}
      </div>

      <div className="admin-layout" style={{ display:'grid', gridTemplateColumns:'180px 1fr', minHeight:'calc(100vh - 56px)' }}>
        <aside className="admin-sidebar" style={{ background:'#0A2540', padding:'16px 0' }}>
          {SIDEBAR.map((item,i) => item.section ? (
            <div key={i} style={{ height:1, background:'rgba(255,255,255,.06)', margin:'8px 0' }}/>
          ) : (
            <div key={i} onClick={()=>setAdminTab(item.tab)} style={{ display:'flex', alignItems:'center', gap:8, padding:'9px 16px', fontSize:12, fontWeight:adminTab===item.tab?600:500, cursor:'pointer', color:adminTab===item.tab?'#4DA6FF':'rgba(255,255,255,.5)', background:adminTab===item.tab?'rgba(77,166,255,.1)':'transparent', borderLeft:adminTab===item.tab?'3px solid #4DA6FF':'3px solid transparent' }}>
              <span style={{ fontSize:12 }}>{item.icon}</span>
              {item.label}
              {item.badge>0 && <span style={{ background:item.badgeRed?'#EF4444':'#D97706', color:'#fff', borderRadius:100, padding:'1px 6px', fontSize:9, fontWeight:700, marginLeft:'auto', fontFamily:'Outfit,sans-serif' }}>{item.badge}</span>}
            </div>
          ))}
        </aside>

        <main className="main-pad" style={{ padding:20 }}>
          {adminTab==='listings' && (
            <>
              <div className="admin-header" style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
                <h2 style={{ fontFamily:'Outfit,sans-serif', fontSize:18, fontWeight:800, color:'#0A2540', margin:0 }}>Listing Approvals</h2>
                <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search..." className="admin-search" style={{ padding:'8px 12px', border:'1.5px solid #E2E8F0', borderRadius:8, fontSize:12, outline:'none', background:'#fff', width:220 }}/>
              </div>
              <div className="admin-stat-grid" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:18 }}>
                <StatCard icon="⏳" number={counts.pending} label="Pending Review" color="#D97706"/>
                <StatCard icon="✓" number={listings.filter(l=>l.status==='approved'&&new Date(l.updated_at)>new Date(Date.now()-86400000)).length} label="Approved Today" color="#16A34A"/>
                <StatCard icon="✕" number={listings.filter(l=>l.status==='declined'&&new Date(l.updated_at)>new Date(Date.now()-86400000)).length} label="Declined Today" color="#EF4444"/>
                <StatCard icon="📋" number={counts.approved} label="Total Live" color="#1565C0"/>
              </div>
              <div style={{ display:'flex', background:'#fff', border:'1.5px solid #E8EDF3', borderRadius:10, overflow:'hidden', marginBottom:14, overflowX:'auto' }}>
                {TABS.map(t => (
                  <button key={t} onClick={()=>setFilter(t)} style={{ padding:'8px 16px', fontSize:12, fontWeight:600, cursor:'pointer', color:filter===t?'#fff':'#64748B', background:filter===t?'#0A2540':'transparent', border:'none', borderRight:'1px solid #F0F4F8', fontFamily:'Outfit,sans-serif', display:'flex', alignItems:'center', gap:5 }}>
                    {t.charAt(0).toUpperCase()+t.slice(1)}
                    <span style={{ fontSize:10, padding:'1px 6px', borderRadius:100, background:filter===t?'rgba(255,255,255,.2)':'rgba(0,0,0,.08)' }}>{counts[t]}</span>
                  </button>
                ))}
              </div>
              {loading ? <div style={{ textAlign:'center', padding:40, color:'#94A3B8', fontFamily:'Outfit,sans-serif', fontWeight:600 }}>Loading listings...</div>
               : filtered.length===0 ? <div style={{ textAlign:'center', padding:40, color:'#94A3B8', fontFamily:'Outfit,sans-serif', fontWeight:600 }}>No listings found.</div>
               : filtered.map(l => <ListingRow key={l.id} listing={l} onApprove={handleApprove} onDecline={handleDecline} onFeatured={fetchListings}/>)}
            </>
          )}
          {adminTab==='users'     && <UsersTab/>}
          {adminTab==='dealers'   && <DealersTab listings={listings}/>}
          {adminTab==='analytics' && <AnalyticsTab listings={listings}/>}
          {adminTab==='articles' && <ArticlesTab/>}
          {adminTab==='videos' && <VideosAdminTab/>}
          {adminTab==='offers' && <DealerOffersTab/>}
          {adminTab==='reports' && <ReportsTab/>}
        </main>
      </div>
      <Toast msg={toast.msg} type={toast.type} show={toast.show}/>
    </div>
  )
}
