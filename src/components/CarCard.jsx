import { Link } from 'react-router-dom'
import { useState } from 'react'
import { saveListing, unsaveListing } from '../lib/supabase'

const fmt = (n) => 'KSH ' + Number(n).toLocaleString()

export default function CarCard({ listing, user, saved: initialSaved = false, variant = 'grid' }) {
  const [saved, setSaved] = useState(initialSaved)
  const [saving, setSaving] = useState(false)

  const mainPhoto = listing.listing_photos?.find(p => p.is_main)?.url
    || listing.listing_photos?.[0]?.url
    || null

  const toggleSave = async (e) => {
    e.preventDefault()
    if (!user) { window.location.href = '/auth'; return }
    setSaving(true)
    if (saved) {
      await unsaveListing(user.id, listing.id)
    } else {
      await saveListing(user.id, listing.id)
    }
    setSaved(!saved)
    setSaving(false)
  }

  const waLink = listing.contact_phone
    ? `https://wa.me/${listing.contact_phone.replace(/\D/g, '')}?text=Hi, I saw your ${listing.year} ${listing.make} ${listing.model} on CarExpert Africa. Is it still available?`
    : null

  return (
    <div className={`car-card ${variant === 'list' ? 'car-card-list' : ''}`}>
      <Link to={`/listings/${listing.id}`} className="car-card-img-wrap">
        {mainPhoto ? (
          <img src={mainPhoto} alt={`${listing.year} ${listing.make} ${listing.model}`} className="car-card-img" loading="lazy" />
        ) : (
          <div className="car-card-img car-card-img-placeholder" />
        )}
        {listing.featured && <span className="badge badge-navy car-card-badge">Featured</span>}
        <button
          className={`car-card-save ${saved ? 'saved' : ''}`}
          onClick={toggleSave}
          disabled={saving}
          aria-label={saved ? 'Remove from saved' : 'Save listing'}
        >
          {saved ? '♥' : '♡'}
        </button>
      </Link>

      <div className="car-card-body">
        <div className="car-card-price">{fmt(listing.price)}</div>
        <Link to={`/listings/${listing.id}`} className="car-card-name">
          {listing.year} {listing.make} {listing.model}
        </Link>
        <div className="car-card-specs">
          <span>{Number(listing.mileage).toLocaleString()} km</span>
          <span>{listing.fuel}</span>
          <span>{listing.transmission}</span>
          {listing.engine_cc && <span>{listing.engine_cc}cc</span>}
          <span>{listing.body_type}</span>
        </div>
        <div className="car-card-actions">
          {waLink && (
            <a href={waLink} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp btn-sm" style={{ flex: 1, textAlign: 'center' }}>
              WhatsApp
            </a>
          )}
          <Link to={`/listings/${listing.id}`} className="btn btn-outline btn-sm" style={{ flex: 1, textAlign: 'center' }}>
            View Details
          </Link>
        </div>
      </div>
    </div>
  )
}
