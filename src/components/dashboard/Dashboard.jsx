import { useEffect, useMemo, useState } from 'react'
import { ArrowDownLeft, ArrowUpRight, Banknote, ChevronDown, CreditCard, LogOut, Plus, RefreshCw, Wallet, WalletCards } from 'lucide-react'
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { getDashboardData } from '../../lib/dashboard'
import { signOut } from '../../lib/auth'

const rupiah = (value) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value || 0)
const dateLabel = (value) => new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short' }).format(new Date(`${value}T00:00:00`))

function StatCard({ icon: Icon, label, value, tone = 'default', note }) {
  const tones = {
    default: 'bg-slate-800 text-blue-300',
    income: 'bg-emerald-500/10 text-emerald-400',
    expense: 'bg-rose-500/10 text-rose-400',
    transfer: 'bg-violet-500/10 text-violet-400',
  }
  return <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-sm">
    <div className="flex items-start justify-between"><div><p className="text-sm text-slate-400">{label}</p><p className="mt-2 text-xl font-bold tracking-tight text-white">{value}</p></div><div className={`rounded-xl p-3 ${tones[tone]}`}><Icon size={20} /></div></div>
    {note && <p className="mt-4 text-xs text-slate-500">{note}</p>}
  </div>
}

export default function Dashboard({ user }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true); setError('')
    try { setData(await getDashboardData(user.id)) } catch (err) { setError(err.message || 'Gagal memuat dashboard.') } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [user.id])

  const summary = useMemo(() => {
    const transactions = data?.transactions ?? []
    const income = transactions.filter(x => x.transaction_type === 'income').reduce((s, x) => s + Number(x.amount), 0)
    const expense = transactions.filter(x => x.transaction_type === 'expense').reduce((s, x) => s + Number(x.amount), 0)
    const opening = (data?.accounts ?? []).reduce((s, x) => s + Number(x.opening_balance), 0)
    return { income, expense, balance: opening + income - expense }
  }, [data])

  const chartData = useMemo(() => {
    const map = new Map()
    ;(data?.transactions ?? []).forEach((item) => {
      const key = item.transaction_date
      const current = map.get(key) || { date: key, income: 0, expense: 0 }
      current[item.transaction_type] += Number(item.amount)
      map.set(key, current)
    })
    return [...map.values()].sort((a, b) => a.date.localeCompare(b.date)).slice(-14).map(x => ({ ...x, label: dateLabel(x.date) }))
  }, [data])

  if (loading) return <div className="grid min-h-screen place-items-center bg-slate-950 text-slate-400"><div className="flex items-center gap-3"><RefreshCw className="animate-spin" size={18} /> Memuat dashboard...</div></div>
  if (error) return <div className="min-h-screen bg-slate-950 p-6 text-slate-100"><div className="mx-auto mt-16 max-w-lg rounded-2xl border border-rose-500/20 bg-rose-500/10 p-6"><h2 className="font-semibold">Dashboard tidak dapat dimuat</h2><p className="mt-2 text-sm text-slate-400">{error}</p><button onClick={load} className="mt-5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold hover:bg-blue-500">Coba lagi</button></div></div>

  return <main className="min-h-screen bg-slate-950 text-slate-100">
    <header className="sticky top-0 z-20 border-b border-slate-800/80 bg-slate-950/90 px-4 py-4 backdrop-blur md:px-6">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <div className="flex items-center gap-3"><div className="rounded-xl bg-blue-600 p-2"><WalletCards size={20} /></div><div><p className="font-bold">WSaku Pro</p><p className="hidden text-xs text-slate-500 sm:block">Keuangan lebih rapi</p></div></div>
        <div className="flex items-center gap-2"><button onClick={load} title="Refresh" className="rounded-xl border border-slate-800 p-2 text-slate-400 hover:bg-slate-900"><RefreshCw size={18} /></button><button onClick={signOut} className="flex items-center gap-2 rounded-xl border border-slate-800 px-3 py-2 text-sm text-slate-300 hover:bg-slate-900"><LogOut size={16} /><span className="hidden sm:inline">Keluar</span></button></div>
      </div>
    </header>

    <div className="mx-auto max-w-7xl px-4 py-6 pb-24 md:px-6 md:py-8">
      <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><p className="text-sm text-slate-400">Selamat datang kembali</p><h1 className="mt-1 text-2xl font-bold sm:text-3xl">Dashboard Keuangan</h1><p className="mt-1 text-sm text-slate-500">{data?.workspace?.name || 'Keuangan Pribadi'} · {user.email}</p></div><button className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold shadow-lg shadow-blue-900/20 hover:bg-blue-500"><Plus size={18} /> Transaksi Baru</button></div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Wallet} label="Saldo Bersih" value={rupiah(summary.balance)} note="Saldo awal + pemasukan - pengeluaran" />
        <StatCard icon={ArrowDownLeft} label="Pendapatan" value={rupiah(summary.income)} tone="income" note="Total transaksi pemasukan" />
        <StatCard icon={ArrowUpRight} label="Pengeluaran" value={rupiah(summary.expense)} tone="expense" note="Total transaksi pengeluaran" />
        <StatCard icon={CreditCard} label="Akun Aktif" value={(data?.accounts ?? []).length} tone="transfer" note="Kas, bank, e-wallet, lainnya" />
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-[1.65fr_1fr]">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-6"><div className="flex items-center justify-between"><div><h2 className="font-semibold">Arus Kas</h2><p className="mt-1 text-xs text-slate-500">14 hari transaksi terakhir</p></div><div className="flex items-center gap-3 text-xs text-slate-400"><span>● Pendapatan</span><span>● Pengeluaran</span></div></div><div className="mt-6 h-64">{chartData.length ? <ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData}><defs><linearGradient id="incomeFill" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#34d399" stopOpacity={0.22}/><stop offset="95%" stopColor="#34d399" stopOpacity={0}/></linearGradient><linearGradient id="expenseFill" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#fb7185" stopOpacity={0.18}/><stop offset="95%" stopColor="#fb7185" stopOpacity={0}/></linearGradient></defs><XAxis dataKey="label" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false}/><YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${Math.round(v / 1000)}k`}/><Tooltip formatter={(v) => rupiah(v)} contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 12 }} /><Area type="monotone" dataKey="income" stroke="#34d399" fill="url(#incomeFill)" strokeWidth={2} /><Area type="monotone" dataKey="expense" stroke="#fb7185" fill="url(#expenseFill)" strokeWidth={2} /></AreaChart></ResponsiveContainer> : <div className="grid h-full place-items-center rounded-xl border border-dashed border-slate-800 text-sm text-slate-500">Belum ada transaksi untuk ditampilkan.</div>}</div></div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-6"><div className="flex items-center justify-between"><div><h2 className="font-semibold">Akun Keuangan</h2><p className="mt-1 text-xs text-slate-500">Saldo awal akun aktif</p></div><Banknote className="text-slate-500" size={20}/></div><div className="mt-5 space-y-3">{(data?.accounts ?? []).length ? data.accounts.map(account => <div key={account.id} className="flex items-center justify-between rounded-xl bg-slate-950/60 p-3"><div className="flex items-center gap-3"><div className="rounded-lg bg-slate-800 p-2"><Wallet size={16} className="text-blue-300"/></div><div><p className="text-sm font-medium">{account.name}</p><p className="text-xs text-slate-500">{account.account_type}</p></div></div><p className="text-sm font-semibold">{rupiah(account.opening_balance)}</p></div>) : <p className="rounded-xl border border-dashed border-slate-800 p-5 text-center text-sm text-slate-500">Belum ada akun.</p>}</div></div>
      </section>

      <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-6"><div className="flex items-center justify-between"><div><h2 className="font-semibold">Transaksi Terbaru</h2><p className="mt-1 text-xs text-slate-500">Aktivitas keuangan terbaru di workspace</p></div><button className="flex items-center gap-1 text-sm font-medium text-blue-400 hover:text-blue-300">Lihat semua <ChevronDown size={15}/></button></div><div className="mt-4 overflow-x-auto"><table className="w-full min-w-[620px] text-left text-sm"><thead className="border-b border-slate-800 text-xs uppercase text-slate-500"><tr><th className="px-3 py-3">Tanggal</th><th className="px-3 py-3">Keterangan</th><th className="px-3 py-3">Akun</th><th className="px-3 py-3 text-right">Jumlah</th></tr></thead><tbody>{(data?.transactions ?? []).slice(0, 8).map(item => <tr key={item.id} className="border-b border-slate-800/70 last:border-0"><td className="px-3 py-4 text-slate-400">{dateLabel(item.transaction_date)}</td><td className="px-3 py-4"><p className="font-medium">{item.description || item.categories?.name || 'Transaksi'}</p><p className="text-xs text-slate-500">{item.categories?.name || 'Tanpa kategori'}</p></td><td className="px-3 py-4 text-slate-400">{item.cash_accounts?.name || '-'}</td><td className={`px-3 py-4 text-right font-semibold ${item.transaction_type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>{item.transaction_type === 'income' ? '+' : '-'} {rupiah(item.amount)}</td></tr>)}{!(data?.transactions ?? []).length && <tr><td colSpan="4" className="px-3 py-10 text-center text-slate-500">Belum ada transaksi.</td></tr>}</tbody></table></div></section>
    </div>
  </main>
}
