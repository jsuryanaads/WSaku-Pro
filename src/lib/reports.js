import { supabase } from './supabase'

async function getWorkspaceId(userId) {
  const { data, error } = await supabase.from('workspace_members').select('workspace_id').eq('user_id', userId).eq('is_active', true).order('created_at').limit(1).single()
  if (error) throw error
  return data.workspace_id
}

export async function getReportData(userId, startDate, endDate) {
  if (!supabase) throw new Error('Supabase belum dikonfigurasi.')
  if (!startDate || !endDate || startDate > endDate) throw new Error('Periode laporan tidak valid.')
  const workspaceId = await getWorkspaceId(userId)
  const { data, error } = await supabase.from('transactions').select('id, transaction_type, transaction_date, amount, description, categories(id,name), cash_accounts(id,name)').eq('workspace_id', workspaceId).gte('transaction_date', startDate).lte('transaction_date', endDate).order('transaction_date', { ascending: false }).order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export function summarizeByCategory(rows, type) {
  const map = new Map()
  rows.filter(x => x.transaction_type === type).forEach(x => {
    const key = x.categories?.id || 'uncategorized'
    const current = map.get(key) || { id: key, name: x.categories?.name || 'Tanpa kategori', amount: 0 }
    current.amount += Number(x.amount)
    map.set(key, current)
  })
  return [...map.values()].sort((a,b) => b.amount - a.amount)
}

export function summarizeByAccount(rows) {
  const map = new Map()
  rows.forEach(x => {
    const key = x.cash_accounts?.id || 'unknown'
    const current = map.get(key) || { id: key, name: x.cash_accounts?.name || 'Akun', income: 0, expense: 0, net: 0 }
    const amount = Number(x.amount)
    if (x.transaction_type === 'income') { current.income += amount; current.net += amount }
    else { current.expense += amount; current.net -= amount }
    map.set(key, current)
  })
  return [...map.values()].sort((a,b) => Math.abs(b.net) - Math.abs(a.net))
}

export function csvFromRows(rows) {
  const header = ['Tanggal','Tipe','Kategori','Akun','Keterangan','Nominal']
  const body = rows.map(x => [x.transaction_date, x.transaction_type === 'income' ? 'Pemasukan' : 'Pengeluaran', x.categories?.name || '', x.cash_accounts?.name || '', x.description || '', Number(x.amount).toFixed(2)])
  return [header, ...body].map(row => row.map(v => `"${String(v).replaceAll('"','""')}"`).join(',')).join('\n')
}
