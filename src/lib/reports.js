import { supabase } from './supabase'

async function getWorkspaceId(userId) {
  const { data, error } = await supabase.from('workspace_members').select('workspace_id').eq('user_id', userId).order('created_at').limit(1).single()
  if (error) throw error
  return data.workspace_id
}

export async function getReportData(userId, startDate, endDate) {
  if (!supabase) throw new Error('Supabase belum dikonfigurasi.')
  const workspaceId = await getWorkspaceId(userId)
  const { data, error } = await supabase.from('transactions').select('id, transaction_type, transaction_date, amount, description, categories(name), cash_accounts(name)').eq('workspace_id', workspaceId).gte('transaction_date', startDate).lte('transaction_date', endDate).order('transaction_date', { ascending: false }).order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export function csvFromRows(rows) {
  const header = ['Tanggal','Tipe','Kategori','Akun','Keterangan','Nominal']
  const body = rows.map(x => [x.transaction_date, x.transaction_type === 'income' ? 'Pemasukan' : 'Pengeluaran', x.categories?.name || '', x.cash_accounts?.name || '', x.description || '', Number(x.amount).toFixed(2)])
  return [header, ...body].map(row => row.map(v => `"${String(v).replaceAll('"','""')}"`).join(',')).join('\n')
}
