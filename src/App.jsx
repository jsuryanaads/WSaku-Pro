import { useState } from 'react'
import { BarChart3, Database, LayoutDashboard, LogOut, Menu, Settings, WalletCards, X, Archive } from 'lucide-react'
import AuthScreen from './components/auth/AuthScreen'
import Dashboard from './components/dashboard/Dashboard'
import MasterData from './components/master/MasterData'
import Reports from './components/reports/Reports'
import Workspace from './components/workspace/Workspace'
import Backup from './components/backup/Backup'
import { useAuth } from './hooks/useAuth'
import { signOut } from './lib/auth'

const nav = [
  ['dashboard', 'Dashboard', LayoutDashboard],
  ['master', 'Master Data', Database],
  ['reports', 'Laporan', BarChart3],
  ['workspace', 'Pengguna', Settings],
  ['backup', 'Backup', Archive],
]

export default function App() {
  const { user, loading, configured } = useAuth()
  const [page, setPage] = useState('dashboard')
  const [open, setOpen] = useState(false)
  if (loading) return <div className="grid min-h-screen place-items-center bg-slate-950 text-slate-400"><div className="flex items-center gap-3"><WalletCards className="text-blue-400" size={20} />Memuat WSaku Pro...</div></div>
  if (!configured) return <div className="grid min-h-screen place-items-center bg-slate-950 p-6 text-slate-200"><div className="ui-panel max-w-lg p-6"><div className="flex items-center gap-3"><div className="rounded-xl bg-amber-500/10 p-2 text-amber-400"><WalletCards /></div><h1 className="font-bold">Supabase belum dikonfigurasi</h1></div><p className="mt-3 text-sm leading-6 text-slate-400">Salin .env.example menjadi .env.local lalu isi konfigurasi Supabase.</p></div></div>
  if (!user) return <AuthScreen />
  const content = page === 'dashboard' ? <Dashboard user={user} /> : page === 'master' ? <MasterData user={user} /> : page === 'reports' ? <Reports user={user} /> : page === 'workspace' ? <Workspace user={user} /> : <Backup user={user} />
  return <div className="min-h-screen bg-slate-950 text-slate-100"><aside className={`fixed inset-y-0 left-0 z-40 w-64 border-r border-slate-800 bg-slate-900/95 p-4 shadow-2xl shadow-black/20 backdrop-blur transition-transform lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}><div className="flex items-center justify-between px-2 py-2"><div className="flex items-center gap-3 font-bold tracking-tight"><div className="rounded-xl bg-blue-600 p-2 shadow-lg shadow-blue-600/20"><WalletCards size={19} /></div>WSaku Pro</div><button aria-label="Tutup menu" onClick={() => setOpen(false)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 lg:hidden"><X size={18} /></button></div><div className="mx-2 mt-7 rounded-xl border border-slate-800 bg-slate-950/50 p-3"><p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Aplikasi Keuangan</p><p className="mt-1 truncate text-xs text-slate-400">{user.email}</p></div><nav className="mt-5 space-y-1.5">{nav.map(([id,label,Icon]) => <button key={id} onClick={() => {setPage(id);setOpen(false)}} className={`group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${page===id?'bg-blue-600 text-white shadow-lg shadow-blue-600/10':'text-slate-400 hover:bg-slate-800 hover:text-slate-100'}`}><Icon size={18}/>{label}</button>)}</nav><button onClick={signOut} className="absolute bottom-5 left-4 right-4 flex items-center gap-3 rounded-xl border border-slate-800 px-3 py-3 text-sm text-slate-400 transition hover:border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-300"><LogOut size={18}/>Keluar</button></aside><div className="lg:pl-64"><header className="sticky top-0 z-30 flex items-center gap-3 border-b border-slate-800/80 bg-slate-950/90 px-4 py-3 backdrop-blur lg:hidden"><button aria-label="Buka menu" onClick={()=>setOpen(true)} className="rounded-xl border border-slate-800 p-2 text-slate-300 hover:bg-slate-900"><Menu size={19}/></button><div className="flex items-center gap-2 font-semibold"><div className="rounded-lg bg-blue-600 p-1.5"><WalletCards size={15}/></div>WSaku Pro</div></header>{content}</div><nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-800/90 bg-slate-900/95 px-2 pb-[max(8px,env(safe-area-inset-bottom))] pt-2 shadow-2xl shadow-black/30 backdrop-blur lg:hidden"><div className="mx-auto grid max-w-md grid-cols-5 gap-1">{nav.map(([id,label,Icon])=><button key={id} onClick={()=>setPage(id)} className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-medium transition ${page===id?'bg-blue-600/15 text-blue-400':'text-slate-500 active:bg-slate-800'}`}><Icon size={19}/><span>{label}</span></button>)}</div></nav>{open&&<button aria-label="Tutup menu" onClick={()=>setOpen(false)} className="fixed inset-0 z-30 bg-black/60 backdrop-blur-[1px] lg:hidden"/>}</div>
}
