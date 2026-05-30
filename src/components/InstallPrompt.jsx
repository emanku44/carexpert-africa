import { useState, useEffect } from 'react'

export default function InstallPrompt() {
  const [prompt, setPrompt] = useState(null)
  const [show, setShow] = useState(false)
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstalled(true)
      return
    }

    // Capture install prompt
    const handler = (e) => {
      e.preventDefault()
      setPrompt(e)
      // Show after 30 seconds on site
      setTimeout(() => setShow(true), 30000)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const install = async () => {
    if (!prompt) return
    prompt.prompt()
    const { outcome } = await prompt.userChoice
    if (outcome === 'accepted') setInstalled(true)
    setShow(false)
    setPrompt(null)
  }

  if (!show || installed) return null

  return (
    <div style={{
      position: 'fixed', bottom: 80, left: 16, right: 16, zIndex: 999,
      background: '#0A2540', borderRadius: 14, padding: '14px 16px',
      boxShadow: '0 8px 32px rgba(0,0,0,.3)',
      display: 'flex', alignItems: 'center', gap: 12,
      animation: 'slideUp .3s ease',
    }}>
      <style>{`@keyframes slideUp { from { transform: translateY(100px); opacity:0; } to { transform: translateY(0); opacity:1; } }`}</style>
      <div style={{ width: 44, height: 44, borderRadius: 10, background: '#1565C0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>🚗</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: 'Outfit,sans-serif', fontSize: 13, fontWeight: 800, color: '#fff', marginBottom: 2 }}>Install CarExpert Africa</div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,.6)' }}>Add to your home screen for faster access</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
        <button onClick={install}
          style={{ background: '#4DA6FF', color: '#0A2540', border: 'none', padding: '7px 14px', borderRadius: 7, fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: 'Outfit,sans-serif', whiteSpace: 'nowrap' }}>
          Install
        </button>
        <button onClick={() => setShow(false)}
          style={{ background: 'transparent', color: 'rgba(255,255,255,.5)', border: 'none', fontSize: 11, cursor: 'pointer', padding: 0 }}>
          Not now
        </button>
      </div>
    </div>
  )
}
