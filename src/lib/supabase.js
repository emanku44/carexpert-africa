// Temporary placeholder — replace with real Supabase credentials later
const supabaseUrl = 'https://placeholder.supabase.co'
const supabaseKey = 'placeholder-key'

import { createClient } from '@supabase/supabase-js'
export const supabase = createClient(supabaseUrl, supabaseKey)

export const signUp = () => {}
export const signIn = () => {}
export const signOut = () => {}
export const getUser = async () => null
export const isAdmin = () => false
export const getApprovedListings = async () => ({ data: [], error: null })
export const getListingById = async () => ({ data: null, error: null })
export const createListing = async () => ({ data: null, error: null })
export const updateListing = async () => {}
export const incrementViews = async () => {}
export const getPendingListings = async () => ({ data: [], error: null })
export const getAllListingsAdmin = async () => ({ data: [], error: null })
export const approveListing = async () => ({ error: null })
export const declineListing = async () => ({ error: null })
export const saveListing = async () => {}
export const unsaveListing = async () => {}
export const getSavedListings = async () => ({ data: [], error: null })
export const uploadPhoto = async () => null