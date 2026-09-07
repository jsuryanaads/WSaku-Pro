import { supabase } from './supabase'

const PAGE_SIZE = 1000

async function workspaceId(userId) {
  const { data, error } = await supabase.from('workspace_members').select('workspace_id').eq('user_id', userId).eq('is_active', true).limit(1).single()
  if (error) throw error
  return data.workspace_id
}

async function fetchAll(queryFactory) {
  const rows = []
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await queryFactory(from, from + PAGE_SIZE - 1)
    if (error) throw error
    const page = data ?? []
    rows.push(...page)
    if (page.length < PAGE_SIZE) return rows
  }
}

export async function createWorkspaceBackup(userId) {
  const id = await workspaceId(userId)
  const [workspace, accounts, categories, transactions, transfers, members] = await Promise.all([
    supabase.from('workspaces').select('*').eq('id', id).single(),
    fetchAll((from, to) => supabase.from('cash_accounts').select('*').eq('workspace_id', id).order('name').range(from, to)),
    fetchAll((from, to) => supabase.from('categories').select('*').eq('workspace_id', id).order('category_type').order('name').range(from, to)),
    fetchAll((from, to) => supabase.from('transactions').select('*').eq('workspace_id', id).order('transaction_date').order('created_at').order('id').range(from, to)),
    fetchAll((from, to) => supabase.from('transfers').select('*').eq('workspace_id', id).order('transaction_date').order('created_at').order('id').range(from, to)),
    fetchAll((from, to) => supabase.from('workspace_members').select('workspace_id,user_id,role,is_active,created_at,updated_at').eq('workspace_id', id).order('created_at').order('user_id').range(from, to)),
  ])
  if (workspace.error) throw workspace.error
  return {
    schema_version: 1,
    app: 'WSaku Pro',
    exported_at: new Date().toISOString(),
    workspace: workspace.data,
    accounts,
    categories,
    transactions,
    transfers,
    members,
  }
}

export async function restoreWorkspaceBackup(userId, backup) {
  if (!backup || backup.app !== 'WSaku Pro' || backup.schema_version !== 1) throw new Error('File backup WSaku Pro tidak valid atau versinya tidak didukung.')
  if (!backup.workspace?.id) throw new Error('Backup tidak memiliki identitas workspace.')
  const currentId = await workspaceId(userId)
  const { data, error } = await supabase.rpc('restore_workspace_data', {
    p_workspace_id: currentId,
    p_accounts: backup.accounts ?? [],
    p_categories: backup.categories ?? [],
    p_transactions: backup.transactions ?? [],
    p_transfers: backup.transfers ?? [],
  })
  if (error) throw error
  return data
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
