import { useEffect, useMemo, useState } from 'react'
import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight, X } from 'lucide-react'
import { createTransaction, createTransfer, getTransactionFormData } from '../../lib/transactions'

const today = () => new Date().toISOString().slice(0, 10)
const empty = { type: 'expense', accountId: '', categoryId: '', fromAccountId: '', toAccountId: '', date: today(), amount: '', description: '' }

export default function TransactionModal({ user, onClose, onSaved }) {
  const [form, setForm] = useState(empty)
  const [data, setData] = useState({ accounts: [], categories: [] })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    getTransactionFormData(user.id).then(setData).catch(err => setError(err.message)).finally(() => setLoading(false))
  }, [user.id])

  const categories = useMemo(() => data.categories.filter(x => x.category_type === form.type), [data.categories, form.type])
  const set = (key, value) => setForm(prev => ({ ...prev, [key]: value }))

  const submit = async (event) => {
    event.preventDefault(); setError('')
    if (!form.amount || Number(form.amount) <= 0) return setError('Nominal harus lebih dari 0.')
    setSaving(true)
    try {
      if (form.type === 'transfer') await createTransfer({ userId: user.id, fromAccountId: form.fromAccountId, toAccountId: form.toAccountId, date: form.date, amount: form.amount, description: form.description })
      else await createTransaction({ userId: user.id, type: form.type, accountId: form.accountId, categoryId: form.categoryId, date: form.date, amount: form.amount, description: form.description })
      onSaved(); onClose()
    } catch (err) { setError(err.message || 'Gagal menyimpan transaksi.') } finally { setSaving(false) }
  }

  const field = 'mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-slate-100 outline-none focus:border-blue-500'
  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm">
    <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl">
      <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4"><div><h2 className="font-semibold">Transaksi Baru</h2><p className="text-xs text-slate-500">Catat pemasukan, pengeluaran, atau transfer</p></div><button onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-slate-800"><X size={19}/></button></div>
      <form onSubmit={submit} className="space-y-5 p-5">
        <div className="grid grid-cols-3 gap-2">{[['expense','Pengeluaran',ArrowUpRight],['income','Pemasukan',ArrowDownLeft],['transfer','Transfer',ArrowLeftRight]].map(([value,label,Icon]) => <button type="button" key={value} onClick={() => set('type', value)} className={`flex items-center justify-center gap-2 rounded-xl border px-2 py-3 text-xs font-semibold ${form.type === value ? 'border-blue-500 bg-blue-600/15 text-blue-300' : 'border-slate-800 text-slate-400 hover:bg-slate-800'}`}><Icon size={16}/>{label}</button>)}</div>
        {loading ? <div className="py-8 text-center text-sm text-slate-500">Memuat akun dan kategori...</div> : <>
          {form.type !== 'transfer' ? <><label className="block text-sm text-slate-300">Akun<select required value={form.accountId} onChange={e => set('accountId', e.target.value)} className={field}><option value="">Pilih akun</option>{data.accounts.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label><label className="block text-sm text-slate-300">Kategori<select value={form.categoryId} onChange={e => set('categoryId', e.target.value)} className={field}><option value="">Tanpa kategori</option>{categories.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label></> : <div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm text-slate-300">Dari<select required value={form.fromAccountId} onChange={e => set('fromAccountId', e.target.value)} className={field}><option value="">Akun sumber</option>{data.accounts.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label><label className="block text-sm text-slate-300">Ke<select required value={form.toAccountId} onChange={e => set('toAccountId', e.target.value)} className={field}><option value="">Akun tujuan</option>{data.accounts.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label></div>}
          <div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm text-slate-300">Tanggal<input required type="date" value={form.date} onChange={e => set('date', e.target.value)} className={field}/></label><label className="block text-sm text-slate-300">Nominal<input required min="1" step="0.01" inputMode="decimal" type="number" value={form.amount} onChange={e => set('amount', e.target.value)} placeholder="0" className={field}/></label></div>
          <label className="block text-sm text-slate-300">Keterangan<textarea value={form.description} onChange={e => set('description', e.target.value)} rows="3" maxLength="500" placeholder="Contoh: Belanja kebutuhan toko" className={field}/></label>
        </>}
        {error && <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-3 text-sm text-rose-300">{error}</div>}
        <div className="flex justify-end gap-2"><button type="button" onClick={onClose} className="rounded-xl border border-slate-700 px-4 py-3 text-sm text-slate-300 hover:bg-slate-800">Batal</button><button disabled={saving || loading} className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50">{saving ? 'Menyimpan...' : 'Simpan Transaksi'}</button></div>
      </form>
    </div>
  </div>
}
