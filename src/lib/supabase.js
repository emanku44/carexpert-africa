import { createClient } from '@supabase/supabase-js'
export const supabase = createClient(...)
const supabaseUrl = 'https://thpexqvpiwifzwpjzqqz.supabase.co'
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)

export const signUp = (email, password, meta) =>
  supabase.auth.signUp({ email, password, options: { data: meta } })

export const signIn = (email, password) =>
  supabase.auth.signInWithPassword({ email, password })

export const signOut = () => supabase.auth.signOut()

export const getUser = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export const isAdmin = (user) =>
  user?.user_metadata?.role === 'admin'

export const getApprovedListings = async (filters = {}) => {
  let query = supabase
    .from('listings')
    .select('*, listing_photos(*)')
    .eq('status', 'approved')
    .order('featured', { ascending: false })
    .order('created_at', { ascending: false })
  return query
}

export const getFeaturedListings = async () =>
  supabase
    .from('listings')
    .select('*, listing_photos(*)')
    .eq('status', 'approved')
    .eq('featured', true)
    .gt('featured_until', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(6)

export const getListingById = async (id) =>
  supabase.from('listings').select('*, listing_photos(*)').eq('id', id).single()

export const createListing = async (data) =>
  supabase.from('listings').insert(data)

export const updateListing = async (id, data) =>
  supabase.from('listings').update(data).eq('id', id)

export const incrementViews = async (id) =>
  supabase.rpc('increment_views', { listing_id: id })

export const getPendingListings = async () =>
  supabase.from('listings').select('*, listing_photos(*)').eq('status', 'pending')

export const getAllListingsAdmin = async () =>
  supabase.from('listings').select('*, listing_photos(*)').order('created_at', { ascending: false })

export const approveListing = async (id, tier, note) =>
  supabase.from('listings').update({ status: 'approved', tier, admin_note: note }).eq('id', id)

export const declineListing = async (id, note) =>
  supabase.from('listings').update({ status: 'declined', admin_note: note }).eq('id', id)

export const saveListing = async (userId, listingId) =>
  supabase.from('saved_listings').insert({ user_id: userId, listing_id: listingId })

export const unsaveListing = async (userId, listingId) =>
  supabase.from('saved_listings').delete().eq('user_id', userId).eq('listing_id', listingId)

export const getSavedListings = async (userId) =>
  supabase.from('saved_listings').select('*, listings(*, listing_photos(*))').eq('user_id', userId)
export const markAsFeatured = async (id, days = 30) => {
  const featuredUntil = new Date()
  featuredUntil.setDate(featuredUntil.getDate() + days)
  return supabase
    .from('listings')
    .update({ featured: true, featured_until: featuredUntil.toISOString() })
    .eq('id', id)
}

export const removeFeatured = async (id) =>
  supabase
    .from('listings')
    .update({ featured: false, featured_until: null })
    .eq('id', id)