import { supabase } from './supabase'

async function getWorkspaceId(userId) {
  const { data, error } = await supabase.from('workspace_members').select('workspace_id').eq('user_id', userId).order('created_at', { ascending: true }).limit(1).single()
  if (error) throw error
  return data.workspace_id
}

export async function createTransaction({ userId, type, accountId, categoryId, date, amount, description }) {
  if (!supabase) throw new Error('Supabase belum dikonfigurasi.')
  if (!userId || !accountId || !type || !date || !Number(amount) || Number(amount) <= 0) throw new Error('Data transaksi belum lengkap.')
  const workspaceId = await getWorkspaceId(userId)
  const { data, error } = await supabase.from('transactions').insert({ workspace_id: workspaceId, cash_account_id: accountId, category_id: categoryId || null, transaction_type: type, transaction_date: date, amount: Number(amount), description: description?.trim() || null, created_by: userId }).select('*, categories(name), cash_accounts(name)').single()
  if (error) throw error
  return data
}

export async function createTransfer({ userId, fromAccountId, toAccountId, date, amount, description }) {
  if (!supabase) throw new Error('Supabase belum dikonfigurasi.')
  if (!userId || !fromAccountId || !toAccountId || fromAccountId === toAccountId || !date || !Number(amount) || Number(amount) <= 0) throw new Error('Data transfer belum lengkap atau akun sumber dan tujuan sama.')
  const workspaceId = await getWorkspaceId(userId)
  const { data, error } = await supabase.from('transfers').insert({ workspace_id: workspaceId, from_account_id: fromAccountId, to_account_id: toAccountId, transaction_date: date, amount: Number(amount), description: description?.trim() || null, created_by: userId }).select('*, from_account:cash_accounts!transfers_from_account_id_fkey(name), to_account:cash_accounts!transfers_to_account_id_fkey(name)').single()
  if (error) throw error
  return data
}

export async function getTransactionFormData(userId) {
  if (!supabase) throw new Error('Supabase belum dikonfigurasi.')
  const workspaceId = await getWorkspaceId(userId)
  const [accounts, categories] = await Promise.all([
    supabase.from('cash_accounts').select('*').eq('workspace_id', workspaceId).eq('is_active', true).order('name'),
    supabase.from('categories').select('*').eq('workspace_id', workspaceId).order('category_type').order('name'),
  ])
  if (accounts.error) throw accounts.error
  if (categories.error) throw categories.error
  return { accounts: accounts.data ?? [], categories: categories.data ?? [] }
}
