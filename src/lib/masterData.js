import { supabase } from './supabase'

async function workspaceId(userId) {
  const { data, error } = await supabase.from('workspace_members').select('workspace_id').eq('user_id', userId).order('created_at').limit(1).single()
  if (error) throw error
  return data.workspace_id
}

export async function getMasterData(userId) {
  if (!supabase) throw new Error('Supabase belum dikonfigurasi.')
  const id = await workspaceId(userId)
  const [accounts, categories] = await Promise.all([
    supabase.from('cash_accounts').select('*').eq('workspace_id', id).order('is_active', { ascending: false }).order('name'),
    supabase.from('categories').select('*').eq('workspace_id', id).order('category_type').order('name'),
  ])
  if (accounts.error) throw accounts.error
  if (categories.error) throw categories.error
  return { workspaceId: id, accounts: accounts.data ?? [], categories: categories.data ?? [] }
}

export async function saveAccount({ userId, id, name, type, openingBalance, active = true }) {
  const workspace_id = await workspaceId(userId)
  const payload = { workspace_id, name: name.trim(), account_type: type, opening_balance: Number(openingBalance || 0), is_active: active }
  const query = id ? supabase.from('cash_accounts').update(payload).eq('id', id).eq('workspace_id', workspace_id) : supabase.from('cash_accounts').insert(payload)
  const { error } = await query
  if (error) throw error
}

export async function saveCategory({ userId, id, name, type }) {
  const workspace_id = await workspaceId(userId)
  const payload = { workspace_id, name: name.trim(), category_type: type }
  const query = id ? supabase.from('categories').update(payload).eq('id', id).eq('workspace_id', workspace_id) : supabase.from('categories').insert(payload)
  const { error } = await query
  if (error) throw error
}
