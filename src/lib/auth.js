import { supabase } from './supabase'

export async function signIn(email, password) {
  if (!supabase) throw new Error('Supabase belum dikonfigurasi.')
  return supabase.auth.signInWithPassword({ email, password })
}

export async function signUp(email, password, fullName) {
  if (!supabase) throw new Error('Supabase belum dikonfigurasi.')
  return supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  })
}

export async function signOut() {
  if (!supabase) return { error: null }
  return supabase.auth.signOut()
}
