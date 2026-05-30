// useSEO.js — sets document title and meta tags
import { useEffect } from 'react'

export default function useSEO({ title, description, image, url, type = 'website' }) {
  useEffect(() => {
    const base = 'CarExpert Africa®'
    const fullTitle = title ? `${title} | ${base}` : base
    const desc = description || 'Kenya\'s #1 car marketplace. Buy and sell cars in Nairobi, Mombasa, Kisumu and across Kenya. Free listings, real prices, trusted sellers.'
    const img = image || 'https://carexpert-africa.vercel.app/og-image.png'
    const canonical = url || window.location.href

    document.title = fullTitle

    const set = (sel, attr, val) => {
      let el = document.querySelector(sel)
      if (!el) {
        el = document.createElement('meta')
        const [k, v] = sel.replace('meta[','').replace(']','').split('=')
        el.setAttribute(k.trim(), v.replace(/"/g,'').trim())
        document.head.appendChild(el)
      }
      el.setAttribute(attr, val)
    }

    set('meta[name="description"]', 'content', desc)
    set('meta[property="og:title"]', 'content', fullTitle)
    set('meta[property="og:description"]', 'content', desc)
    set('meta[property="og:image"]', 'content', img)
    set('meta[property="og:url"]', 'content', canonical)
    set('meta[property="og:type"]', 'content', type)
    set('meta[property="og:site_name"]', 'content', 'CarExpert Africa')
    set('meta[name="twitter:card"]', 'content', 'summary_large_image')
    set('meta[name="twitter:title"]', 'content', fullTitle)
    set('meta[name="twitter:description"]', 'content', desc)
    set('meta[name="twitter:image"]', 'content', img)

    // canonical link
    let link = document.querySelector('link[rel="canonical"]')
    if (!link) { link = document.createElement('link'); link.rel = 'canonical'; document.head.appendChild(link) }
    link.href = canonical

    return () => { document.title = base }
  }, [title, description, image, url])
}
