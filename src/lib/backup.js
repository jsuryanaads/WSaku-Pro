import { supabase } from './supabase'

async function workspaceId(userId) {
  const { data, error } = await supabase.from('workspace_members').select('workspace_id').eq('user_id', userId).eq('is_active', true).limit(1).single()
  if (error) throw error
  return data.workspace_id
}

export async function createWorkspaceBackup(userId) {
  const id = await workspaceId(userId)
  const results = await Promise.all([
    supabase.from('workspaces').select('*').eq('id', id).single(),
    supabase.from('cash_accounts').select('*').eq('workspace_id', id).order('name'),
    supabase.from('categories').select('*').eq('workspace_id', id).order('category_type').order('name'),
    supabase.from('transactions').select('*').eq('workspace_id', id).order('transaction_date').order('created_at'),
    supabase.from('transfers').select('*').eq('workspace_id', id).order('transaction_date').order('created_at'),
    supabase.from('workspace_members').select('workspace_id,user_id,role,is_active,created_at,updated_at').eq('workspace_id', id),
  ])
  results.forEach(result => { if (result.error) throw result.error })
  const [workspace, accounts, categories, transactions, transfers, members] = results
  return { schema_version: 1, app: 'WSaku Pro', exported_at: new Date().toISOString(), workspace: workspace.data, accounts: accounts.data ?? [], categories: categories.data ?? [], transactions: transactions.data ?? [], transfers: transfers.data ?? [], members: members.data ?? [] }
}

export function downloadJson(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url)
}

export function downloadCsv(rows, filename) {
  if (!rows.length) return false
  const keys = Object.keys(rows[0])
  const esc = value => { const text = value == null ? '' : typeof value === 'object' ? JSON.stringify(value) : String(value); return /[",\n]/.test(text) ? `"${text.replaceAll('"','""')}"` : text }
  const csv = [keys.map(esc).join(','), ...rows.map(row => keys.map(key => esc(row[key])).join(','))].join('\n')
  const blob = new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8;' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href=url; a.download=filename; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url); return true
}
