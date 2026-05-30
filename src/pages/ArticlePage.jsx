import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { supabase } from '../lib/supabase'
import useSEO from './useSEO'

function timeAgo(date) {
  const s = Math.floor((new Date() - new Date(date)) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s/60)}m ago`
  if (s < 86400) return `${Math.floor(s/3600)}h ago`
  if (s < 604800) return `${Math.floor(s/86400)}d ago`
  return new Date(date).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' })
}

function renderContent(content) {
  if (!content) return []
  return content.split('\n').map((line, i) => {
    if (line.startsWith('## ')) return <h2 key={i} style={{ fontFamily:'Outfit,sans-serif', fontSize:20, fontWeight:800, color:'#0A2540', margin:'28px 0 12px' }}>{line.slice(3)}</h2>
    if (line.startsWith('### ')) return <h3 key={i} style={{ fontFamily:'Outfit,sans-serif', fontSize:17, fontWeight:700, color:'#0A2540', margin:'22px 0 10px' }}>{line.slice(4)}</h3>
    if (line.startsWith('> ')) return <blockquote key={i} style={{ borderLeft:'4px solid #1565C0', paddingLeft:16, margin:'20px 0', color:'#475569', fontStyle:'italic', fontSize:15, lineHeight:1.7 }}>{line.slice(2)}</blockquote>
    if (line.startsWith('- ')) return <li key={i} style={{ fontSize:14, color:'#475569', lineHeight:1.8, marginBottom:4 }}>{line.slice(2)}</li>
    if (line.trim() === '') return <div key={i} style={{ height:12 }}/>
    return <p key={i} style={{ fontSize:15, color:'#475569', lineHeight:1.8, margin:'0 0 14px' }}>{line}</p>
  })
}

function SubscribeBar() {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)

  const subscribe = async () => {
    if (!email.trim()) return
    setLoading(true)
    const { error } = await supabase.from('subscribers').insert({ email: email.trim(), name: name.trim() || null })
    setLoading(false)
    if (error && error.code === '23505') { setDone(true); return } // already subscribed
    if (!error) setDone(true)
  }

  if (done) return (
    <div style={{ background:'linear-gradient(135deg,#0A2540,#1565C0)', borderRadius:14, padding:'24px 20px', textAlign:'center', marginBottom:32 }}>
      <div style={{ fontSize:32, marginBottom:8 }}>🎉</div>
      <div style={{ fontFamily:'Outfit,sans-serif', fontSize:18, fontWeight:800, color:'#fff', marginBottom:6 }}>You're subscribed!</div>
      <div style={{ fontSize:13, color:'rgba(255,255,255,.6)' }}>We'll notify you when new articles are published.</div>
    </div>
  )

  return (
    <div style={{ background:'linear-gradient(135deg,#0A2540,#1565C0)', borderRadius:14, padding:'24px 20px', marginBottom:32 }}>
      <div style={{ textAlign:'center', marginBottom:16 }}>
        <div style={{ fontSize:24, marginBottom:6 }}>📬</div>
        <div style={{ fontFamily:'Outfit,sans-serif', fontSize:18, fontWeight:800, color:'#fff', marginBottom:4 }}>Stay in the Loop</div>
        <div style={{ fontSize:13, color:'rgba(255,255,255,.6)' }}>Get the latest Kenya car news, reviews and market insights.</div>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:8, maxWidth:400, margin:'0 auto' }}>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name (optional)"
          style={{ padding:'10px 14px', borderRadius:8, border:'none', fontSize:13, fontFamily:'DM Sans,sans-serif', outline:'none' }}/>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Your email address"
          style={{ padding:'10px 14px', borderRadius:8, border:'none', fontSize:13, fontFamily:'DM Sans,sans-serif', outline:'none' }}/>
        <button onClick={subscribe} disabled={loading || !email.trim()}
          style={{ background: email.trim() ? '#4DA6FF' : '#94A3B8', color:'#0A2540', border:'none', padding:'11px', borderRadius:8, fontSize:13, fontWeight:800, cursor: email.trim() ? 'pointer' : 'default', fontFamily:'Outfit,sans-serif' }}>
          {loading ? 'Subscribing...' : '📬 Subscribe — It\'s Free'}
        </button>
      </div>
    </div>
  )
}

export default function ArticlePage({ user }) {
  const { slug } = useParams()
  const [article, setArticle] = useState(null)
  const [related, setRelated] = useState([])
  const [relatedListings, setRelatedListings] = useState([])
  const [comments, setComments] = useState([])
  const [likes, setLikes] = useState(0)
  const [liked, setLiked] = useState(false)
  const [savedArticle, setSavedArticle] = useState(false)
  const [loading, setLoading] = useState(true)
  const [commentText, setCommentText] = useState('')
  const [commentName, setCommentName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [copyMsg, setCopyMsg] = useState('')

  useEffect(() => {
    if (!slug) return
    supabase.from('articles').select('*').eq('slug', slug).eq('published', true).single()
      .then(async ({ data }) => {
        if (!data) { setLoading(false); return }
        setArticle(data)
        supabase.from('articles').update({ views: (data.views || 0) + 1 }).eq('id', data.id)

        // related articles
        supabase.from('articles').select('id,title,slug,cover_image_url,author_name,read_time,published_at,category')
          .eq('published', true).eq('category', data.category).neq('id', data.id).limit(3)
          .then(({ data: rel }) => setRelated(rel || []))

        // comments
        supabase.from('article_comments').select('*').eq('article_id', data.id).order('created_at', { ascending: true })
          .then(({ data: c }) => setComments(c || []))

        // likes
        supabase.from('article_likes').select('id', { count: 'exact' }).eq('article_id', data.id)
          .then(({ count }) => setLikes(count || 0))

        // related listings — search by tags and title keywords
        const searchTerms = [
          ...(data.tags || []),
          ...data.title.toLowerCase().split(' ').filter(w => w.length > 4)
        ].slice(0, 5)

        if (searchTerms.length > 0) {
          // try to find listings matching any tag as make or model
          const { data: listings } = await supabase
            .from('listings')
            .select('id, make, model, variant, year, price, mileage, fuel_type, transmission, location, listing_photos(*)')
            .eq('status', 'approved')
            .or(searchTerms.map(t => `make.ilike.%${t}%,model.ilike.%${t}%`).join(','))
            .limit(4)
          setRelatedListings(listings || [])
        }

        // check user state
        supabase.auth.getUser().then(({ data: { user: u } }) => {
          if (!u) return
          setCommentName(u.user_metadata?.full_name || u.email?.split('@')[0] || '')
          supabase.from('article_likes').select('id').eq('article_id', data.id).eq('user_id', u.id).single()
            .then(({ data: l }) => { if (l) setLiked(true) })
          supabase.from('saved_articles').select('id').eq('article_id', data.id).eq('user_id', u.id).single()
            .then(({ data: s }) => { if (s) setSavedArticle(true) })
        })

        setLoading(false)
      })
  }, [slug])

  const handleLike = async () => {
    const { data: { user: u } } = await supabase.auth.getUser()
    if (!u) { alert('Please log in to like articles'); return }
    if (liked) {
      await supabase.from('article_likes').delete().eq('article_id', article.id).eq('user_id', u.id)
      setLiked(false); setLikes(l => l - 1)
    } else {
      await supabase.from('article_likes').insert({ article_id: article.id, user_id: u.id })
      setLiked(true); setLikes(l => l + 1)
    }
  }

  const handleSaveArticle = async () => {
    const { data: { user: u } } = await supabase.auth.getUser()
    if (!u) { alert('Please log in to save articles'); return }
    if (savedArticle) {
      await supabase.from('saved_articles').delete().eq('article_id', article.id).eq('user_id', u.id)
      setSavedArticle(false)
    } else {
      await supabase.from('saved_articles').insert({ article_id: article.id, user_id: u.id })
      setSavedArticle(true)
    }
  }

  const handleComment = async () => {
    if (!commentText.trim() || !commentName.trim()) return
    setSubmitting(true)
    const { data: { user: u } } = await supabase.auth.getUser()
    const { data: newComment, error } = await supabase.from('article_comments').insert({
      article_id: article.id, user_id: u?.id || null,
      author_name: commentName.trim(), content: commentText.trim()
    }).select().single()
    if (!error && newComment) { setComments(prev => [...prev, newComment]); setCommentText('') }
    setSubmitting(false)
  }

  const handleShare = (type) => {
    const url = window.location.href
    const text = `${article.title} — CarExpert Africa`
    if (type === 'whatsapp') window.open(`https://wa.me/?text=${encodeURIComponent(text + '\n' + url)}`, '_blank')
    else if (type === 'twitter') window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank')
    else if (type === 'copy') { navigator.clipboard.writeText(url); setCopyMsg('Copied!'); setTimeout(() => setCopyMsg(''), 2000) }
  }

  useSEO({
    title: article?.title,
    description: article?.excerpt,
    image: article?.cover_image_url,
    url: window.location.href,
    type: 'article',
  })

  if (loading) return (
    <div style={{ fontFamily:'DM Sans,sans-serif', minHeight:'100vh', background:'#F7F9FC' }}>
      <Navbar user={user} />
      <div style={{ textAlign:'center', padding:80, color:'#94A3B8' }}>Loading...</div>
    </div>
  )

  if (!article) return (
    <div style={{ fontFamily:'DM Sans,sans-serif', minHeight:'100vh', background:'#F7F9FC' }}>
      <Navbar user={user} />
      <div style={{ textAlign:'center', padding:80 }}>
        <div style={{ fontSize:40, marginBottom:16 }}>📰</div>
        <div style={{ fontFamily:'Outfit,sans-serif', fontSize:20, fontWeight:800, color:'#0A2540', marginBottom:8 }}>Article not found</div>
        <Link to="/news" style={{ background:'#1565C0', color:'#fff', padding:'10px 24px', borderRadius:8, fontSize:13, fontWeight:700, textDecoration:'none', fontFamily:'Outfit,sans-serif' }}>Back to News</Link>
      </div>
    </div>
  )

  return (
    <div style={{ fontFamily:'DM Sans,sans-serif', background:'#F7F9FC', minHeight:'100vh' }}>
      <style>{`
        @media (max-width: 768px) {
          .article-layout { grid-template-columns: 1fr !important; }
          .article-sidebar { display: none; }
          .article-share-sticky { display: none !important; }
          .article-mobile-share { display: flex !important; }
          .related-listings-grid { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>
      <Navbar user={user} />
      <div style={{ background:'#fff', borderBottom:'1px solid #E8EDF3', padding:'10px 16px', fontSize:12, color:'#94A3B8' }}>
        <Link to="/" style={{ color:'#1565C0', textDecoration:'none' }}>Home</Link> / <Link to="/news" style={{ color:'#1565C0', textDecoration:'none' }}>News</Link> / {article.title.slice(0, 50)}{article.title.length > 50 ? '...' : ''}
      </div>

      <div className="article-layout" style={{ display:'grid', gridTemplateColumns:'1fr 300px', gap:24, maxWidth:1200, margin:'0 auto', padding:'24px 16px' }}>
        {/* Main */}
        <div>
          {article.cover_image_url && (
            <div style={{ borderRadius:14, overflow:'hidden', height:340, marginBottom:24 }}>
              <img src={article.cover_image_url} alt={article.title} style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
            </div>
          )}

          {/* Category + tags */}
          <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:16 }}>
            <span style={{ background:'#1565C0', color:'#fff', fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:100, fontFamily:'Outfit,sans-serif' }}>{article.category}</span>
            {(article.tags || []).map(tag => (
              <span key={tag} style={{ background:'#EEF5FF', color:'#1565C0', border:'1px solid #BDD5FF', fontSize:11, fontWeight:600, padding:'3px 10px', borderRadius:100 }}>#{tag}</span>
            ))}
          </div>

          <h1 style={{ fontFamily:'Outfit,sans-serif', fontSize:28, fontWeight:900, color:'#0A2540', lineHeight:1.2, margin:'0 0 16px' }}>{article.title}</h1>

          {/* Author + meta */}
          <div style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 0', borderTop:'1px solid #F0F4F8', borderBottom:'1px solid #F0F4F8', marginBottom:24 }}>
            <div style={{ width:40, height:40, borderRadius:'50%', background:'#0A2540', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Outfit,sans-serif', fontSize:15, fontWeight:800, color:'#fff', flexShrink:0 }}>
              {article.author_name[0].toUpperCase()}
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontFamily:'Outfit,sans-serif', fontSize:13, fontWeight:700, color:'#0A2540' }}>{article.author_name}</div>
              <div style={{ fontSize:11, color:'#94A3B8' }}>
                {article.published_at ? new Date(article.published_at).toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric' }) : ''} · {article.read_time} min read · {article.views} views
              </div>
            </div>
            {/* Save + mobile share */}
            <div className="article-mobile-share" style={{ display:'none', gap:6, alignItems:'center' }}>
              <button onClick={handleSaveArticle} style={{ background: savedArticle?'#EEF5FF':'#F8FAFC', color: savedArticle?'#1565C0':'#94A3B8', border:`1.5px solid ${savedArticle?'#BDD5FF':'#E2E8F0'}`, padding:'6px 10px', borderRadius:7, fontSize:11, fontWeight:700, cursor:'pointer' }}>
                {savedArticle ? '🔖 Saved' : '🔖'}
              </button>
              <button onClick={() => handleShare('whatsapp')} style={{ background:'#25D366', color:'#fff', border:'none', padding:'6px 10px', borderRadius:7, fontSize:11, fontWeight:700, cursor:'pointer' }}>📱</button>
              <button onClick={() => handleShare('copy')} style={{ background:'#F0F6FF', color:'#1565C0', border:'1.5px solid #BDD5FF', padding:'6px 10px', borderRadius:7, fontSize:11, fontWeight:700, cursor:'pointer' }}>🔗</button>
            </div>
          </div>

          {article.excerpt && (
            <div style={{ background:'#EEF5FF', border:'1px solid #BDD5FF', borderRadius:10, padding:'14px 16px', marginBottom:24, fontSize:15, color:'#1565C0', fontWeight:500, lineHeight:1.7, fontStyle:'italic' }}>
              {article.excerpt}
            </div>
          )}

          {/* Content */}
          <div style={{ marginBottom:32 }}>
            {renderContent(article.content)}
          </div>

          {/* Related car listings */}
          {relatedListings.length > 0 && (
            <div style={{ background:'#fff', border:'1.5px solid #E8EDF3', borderRadius:14, padding:20, marginBottom:32 }}>
              <div style={{ fontFamily:'Outfit,sans-serif', fontSize:16, fontWeight:800, color:'#0A2540', marginBottom:4 }}>🚗 Related Cars For Sale</div>
              <div style={{ fontSize:12, color:'#94A3B8', marginBottom:16 }}>Cars mentioned in this article that are currently listed for sale</div>
              <div className="related-listings-grid" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10 }}>
                {relatedListings.map(car => (
                  <Link key={car.id} to={`/listings/${car.id}`} style={{ textDecoration:'none' }}>
                    <div style={{ background:'#F8FAFC', border:'1.5px solid #E8EDF3', borderRadius:10, overflow:'hidden', transition:'all .2s' }}
                      onMouseOver={e => { e.currentTarget.style.borderColor='#1565C0'; e.currentTarget.style.transform='translateY(-2px)' }}
                      onMouseOut={e => { e.currentTarget.style.borderColor='#E8EDF3'; e.currentTarget.style.transform='none' }}>
                      <div style={{ height:90, background:'#EEF5FF', overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center' }}>
                        {car.listing_photos?.[0]?.url
                          ? <img src={car.listing_photos[0].url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                          : <span style={{ fontSize:24 }}>🚗</span>}
                      </div>
                      <div style={{ padding:'8px 10px' }}>
                        <div style={{ fontFamily:'Outfit,sans-serif', fontSize:12, fontWeight:800, color:'#1565C0' }}>KSH {Number(car.price).toLocaleString()}</div>
                        <div style={{ fontSize:11, fontWeight:600, color:'#0A2540', marginTop:1 }}>{car.year} {car.make} {car.model}{car.variant ? ` — ${car.variant}` : ''}</div>
                        <div style={{ fontSize:10, color:'#94A3B8', marginTop:2 }}>📍 {car.location}</div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
              <Link to={`/listings?make=${relatedListings[0]?.make}`} style={{ display:'inline-block', marginTop:12, fontSize:12, color:'#1565C0', fontWeight:600, textDecoration:'none' }}>
                View all {relatedListings[0]?.make} listings →
              </Link>
            </div>
          )}

          {/* Like + Share */}
          <div style={{ display:'flex', alignItems:'center', gap:10, padding:'16px 0', borderTop:'1px solid #E8EDF3', borderBottom:'1px solid #E8EDF3', marginBottom:32, flexWrap:'wrap' }}>
            <button onClick={handleLike}
              style={{ display:'flex', alignItems:'center', gap:6, background:liked?'#FEE2E2':'#F8FAFC', color:liked?'#DC2626':'#475569', border:`1.5px solid ${liked?'#FECACA':'#E2E8F0'}`, padding:'8px 16px', borderRadius:8, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'Outfit,sans-serif' }}>
              {liked ? '❤️' : '🤍'} {likes} {likes === 1 ? 'Like' : 'Likes'}
            </button>
            <button onClick={handleSaveArticle}
              style={{ display:'flex', alignItems:'center', gap:6, background:savedArticle?'#EEF5FF':'#F8FAFC', color:savedArticle?'#1565C0':'#475569', border:`1.5px solid ${savedArticle?'#BDD5FF':'#E2E8F0'}`, padding:'8px 16px', borderRadius:8, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'Outfit,sans-serif' }}>
              {savedArticle ? '🔖 Saved' : '🔖 Save'}
            </button>
            <button onClick={() => handleShare('whatsapp')} style={{ background:'#25D366', color:'#fff', border:'none', padding:'8px 16px', borderRadius:8, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'Outfit,sans-serif' }}>📱 WhatsApp</button>
            <button onClick={() => handleShare('twitter')} style={{ background:'#000', color:'#fff', border:'none', padding:'8px 16px', borderRadius:8, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'Outfit,sans-serif' }}>𝕏 Tweet</button>
            <button onClick={() => handleShare('copy')} style={{ background:'#F0F6FF', color:'#1565C0', border:'1.5px solid #BDD5FF', padding:'8px 16px', borderRadius:8, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'Outfit,sans-serif' }}>
              {copyMsg || '🔗 Copy Link'}
            </button>
          </div>

          {/* Subscribe bar */}
          <SubscribeBar />

          {/* Comments */}
          <div>
            <div style={{ fontFamily:'Outfit,sans-serif', fontSize:18, fontWeight:800, color:'#0A2540', marginBottom:20 }}>
              💬 Comments ({comments.length})
            </div>
            <div style={{ background:'#fff', border:'1.5px solid #E8EDF3', borderRadius:12, padding:16, marginBottom:20 }}>
              <div style={{ fontFamily:'Outfit,sans-serif', fontSize:13, fontWeight:700, color:'#0A2540', marginBottom:12 }}>Leave a Comment</div>
              <input value={commentName} onChange={e => setCommentName(e.target.value)} placeholder="Your name"
                style={{ width:'100%', padding:'10px 12px', border:'1.5px solid #E2E8F0', borderRadius:8, fontSize:13, fontFamily:'DM Sans,sans-serif', outline:'none', marginBottom:10, boxSizing:'border-box' }}/>
              <textarea value={commentText} onChange={e => setCommentText(e.target.value)} placeholder="Share your thoughts..." rows={3}
                style={{ width:'100%', padding:'10px 12px', border:'1.5px solid #E2E8F0', borderRadius:8, fontSize:13, fontFamily:'DM Sans,sans-serif', outline:'none', resize:'vertical', marginBottom:10, boxSizing:'border-box' }}/>
              <button onClick={handleComment} disabled={submitting || !commentText.trim() || !commentName.trim()}
                style={{ background: commentText.trim() && commentName.trim() ? '#1565C0' : '#94A3B8', color:'#fff', border:'none', padding:'10px 20px', borderRadius:8, fontSize:13, fontWeight:700, cursor: commentText.trim() && commentName.trim() ? 'pointer' : 'default', fontFamily:'Outfit,sans-serif' }}>
                {submitting ? 'Posting...' : 'Post Comment'}
              </button>
            </div>
            {comments.length === 0
              ? <div style={{ textAlign:'center', padding:'32px 0', color:'#94A3B8', fontSize:13 }}>No comments yet. Be the first!</div>
              : comments.map(c => (
                <div key={c.id} style={{ background:'#fff', border:'1.5px solid #E8EDF3', borderRadius:12, padding:16, marginBottom:10 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                    <div style={{ width:34, height:34, borderRadius:'50%', background:'#0A2540', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Outfit,sans-serif', fontSize:13, fontWeight:700, color:'#fff', flexShrink:0 }}>
                      {c.author_name[0].toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontFamily:'Outfit,sans-serif', fontSize:13, fontWeight:700, color:'#0A2540' }}>{c.author_name}</div>
                      <div style={{ fontSize:11, color:'#94A3B8' }}>{timeAgo(c.created_at)}</div>
                    </div>
                  </div>
                  <p style={{ fontSize:13, color:'#475569', lineHeight:1.7, margin:0 }}>{c.content}</p>
                </div>
              ))
            }
          </div>

          {/* Related articles */}
          {related.length > 0 && (
            <div style={{ marginTop:40 }}>
              <div style={{ fontFamily:'Outfit,sans-serif', fontSize:18, fontWeight:800, color:'#0A2540', marginBottom:16 }}>Related Articles</div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(240px,1fr))', gap:14 }}>
                {related.map(a => (
                  <Link key={a.id} to={`/news/${a.slug}`} style={{ textDecoration:'none' }}>
                    <div style={{ background:'#fff', border:'1.5px solid #E8EDF3', borderRadius:12, overflow:'hidden', transition:'all .2s' }}
                      onMouseOver={e => { e.currentTarget.style.borderColor='#1565C0'; e.currentTarget.style.transform='translateY(-2px)' }}
                      onMouseOut={e => { e.currentTarget.style.borderColor='#E8EDF3'; e.currentTarget.style.transform='none' }}>
                      <div style={{ height:120, background:'linear-gradient(135deg,#EEF5FF,#DBEAFE)', overflow:'hidden' }}>
                        {a.cover_image_url ? <img src={a.cover_image_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/> : <div style={{ height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:32 }}>📰</div>}
                      </div>
                      <div style={{ padding:12 }}>
                        <div style={{ fontSize:10, fontWeight:700, color:'#1565C0', textTransform:'uppercase', marginBottom:4 }}>{a.category}</div>
                        <div style={{ fontFamily:'Outfit,sans-serif', fontSize:13, fontWeight:700, color:'#0A2540', lineHeight:1.4, marginBottom:6 }}>{a.title}</div>
                        <div style={{ fontSize:11, color:'#94A3B8' }}>{a.read_time} min read</div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="article-sidebar">
          <div className="article-share-sticky" style={{ position:'sticky', top:80 }}>
            <div style={{ background:'#fff', border:'1.5px solid #E8EDF3', borderRadius:12, padding:16, marginBottom:14 }}>
              <div style={{ fontFamily:'Outfit,sans-serif', fontSize:12, fontWeight:700, color:'#0A2540', marginBottom:12, textTransform:'uppercase', letterSpacing:'.5px' }}>Actions</div>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                <button onClick={handleLike}
                  style={{ background:liked?'#FEE2E2':'#F8FAFC', color:liked?'#DC2626':'#475569', border:`1.5px solid ${liked?'#FECACA':'#E2E8F0'}`, padding:'10px', borderRadius:8, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'Outfit,sans-serif', textAlign:'left' }}>
                  {liked ? '❤️' : '🤍'} {likes} {likes === 1 ? 'Like' : 'Likes'}
                </button>
                <button onClick={handleSaveArticle}
                  style={{ background:savedArticle?'#EEF5FF':'#F8FAFC', color:savedArticle?'#1565C0':'#475569', border:`1.5px solid ${savedArticle?'#BDD5FF':'#E2E8F0'}`, padding:'10px', borderRadius:8, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'Outfit,sans-serif', textAlign:'left' }}>
                  {savedArticle ? '🔖 Article Saved' : '🔖 Save Article'}
                </button>
                <div style={{ height:1, background:'#E8EDF3' }}/>
                <button onClick={() => handleShare('whatsapp')} style={{ background:'#25D366', color:'#fff', border:'none', padding:'10px', borderRadius:8, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'Outfit,sans-serif', textAlign:'left' }}>📱 Share on WhatsApp</button>
                <button onClick={() => handleShare('twitter')} style={{ background:'#000', color:'#fff', border:'none', padding:'10px', borderRadius:8, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'Outfit,sans-serif', textAlign:'left' }}>𝕏 Share on X</button>
                <button onClick={() => handleShare('copy')} style={{ background:'#F0F6FF', color:'#1565C0', border:'1.5px solid #BDD5FF', padding:'10px', borderRadius:8, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'Outfit,sans-serif', textAlign:'left' }}>
                  {copyMsg || '🔗 Copy Link'}
                </button>
              </div>
            </div>
            <div style={{ background:'#0A2540', borderRadius:12, padding:16, color:'#fff', marginBottom:14 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                <div style={{ width:44, height:44, borderRadius:'50%', background:'#1565C0', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Outfit,sans-serif', fontSize:16, fontWeight:800, flexShrink:0 }}>
                  {article.author_name[0].toUpperCase()}
                </div>
                <div>
                  <div style={{ fontFamily:'Outfit,sans-serif', fontSize:13, fontWeight:700 }}>{article.author_name}</div>
                  <div style={{ fontSize:11, color:'rgba(255,255,255,.5)' }}>CarExpert Africa Writer</div>
                </div>
              </div>
              <div style={{ fontSize:12, color:'rgba(255,255,255,.6)', lineHeight:1.6 }}>Kenya automotive expert covering market trends, car reviews, and buying guides.</div>
            </div>
            {/* Mini subscribe */}
            <div style={{ background:'linear-gradient(135deg,#0A2540,#1565C0)', borderRadius:12, padding:16 }}>
              <div style={{ fontFamily:'Outfit,sans-serif', fontSize:13, fontWeight:700, color:'#fff', marginBottom:6 }}>📬 Get New Articles</div>
              <div style={{ fontSize:11, color:'rgba(255,255,255,.6)', marginBottom:12 }}>Subscribe for free car market updates.</div>
              <SubscribeBar />
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
