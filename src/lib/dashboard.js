import { supabase } from './supabase'

export async function getDashboardData(userId) {
  if (!supabase) throw new Error('Supabase belum dikonfigurasi.')

  const { data: memberships, error: membershipError } = await supabase
    .from('workspace_members')
    .select('workspace_id, role, workspaces(id, name, workspace_type)')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })

  if (membershipError) throw membershipError

  const workspace = memberships?.[0]?.workspaces
  if (!workspace) return { workspace: null, accounts: [], transactions: [], transfers: [] }

  const [accountsRes, balancesRes, transactionsRes, transfersRes] = await Promise.all([
    supabase.from('cash_accounts').select('*').eq('workspace_id', workspace.id).eq('is_active', true).order('name'),
    supabase.from('account_balances').select('id,current_balance').eq('workspace_id', workspace.id).eq('is_active', true),
    supabase.from('transactions').select('*, categories(name), cash_accounts(name)').eq('workspace_id', workspace.id).order('transaction_date', { ascending: false }).order('created_at', { ascending: false }).limit(100),
    supabase.from('transfers').select('*, from_account:cash_accounts!transfers_from_account_id_fkey(name), to_account:cash_accounts!transfers_to_account_id_fkey(name)').eq('workspace_id', workspace.id).order('transaction_date', { ascending: false }).limit(50),
  ])

  if (accountsRes.error) throw accountsRes.error
  if (balancesRes.error) throw balancesRes.error
  if (transactionsRes.error) throw transactionsRes.error
  if (transfersRes.error) throw transfersRes.error

  const balanceMap = new Map((balancesRes.data ?? []).map(item => [item.id, Number(item.current_balance)]))
  const accounts = (accountsRes.data ?? []).map(account => ({ ...account, current_balance: balanceMap.get(account.id) ?? Number(account.opening_balance || 0) }))

  return { workspace, accounts, transactions: transactionsRes.data ?? [], transfers: transfersRes.data ?? [] }
}
