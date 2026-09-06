import { useState } from 'react'
import { BarChart3, Database, LayoutDashboard, LogOut, Menu, Settings, WalletCards, X } from 'lucide-react'
import AuthScreen from './components/auth/AuthScreen'
import Dashboard from './components/dashboard/Dashboard'
import MasterData from './components/master/MasterData'
import Reports from './components/reports/Reports'
import Workspace from './components/workspace/Workspace'
import { useAuth } from './hooks/useAuth'
import { signOut } from './lib/auth'

export default function App() {
  const { user, loading, configured } = useAuth()
  const [page, setPage] = useState('dashboard')
  const [open, setOpen] = useState(false)
  if (loading) return <div className="grid min-h-screen place-items-center bg-slate-950 text-slate-400">Memuat WSaku Pro...</div>
  if (!configured) return <div className="grid min-h-screen place-items-center bg-slate-950 p-6 text-slate-200"><div className="max-w-lg rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6"><div className="flex items-center gap-3"><WalletCards className="text-amber-400"/><h1 className="font-bold">Supabase belum dikonfigurasi</h1></div><p className="mt-3 text-sm text-slate-400">Salin .env.example menjadi .env.local lalu isi konfigurasi Supabase.</p></div></div>
  if (!user) return <AuthScreen />
  const nav=[['dashboard','Dashboard',LayoutDashboard],['master','Master Data',Database],['reports','Laporan',BarChart3],['workspace','Pengguna',Settings]]
  return <div className="min-h-screen bg-slate-950 text-slate-100"><aside className={`fixed inset-y-0 left-0 z-40 w-64 border-r border-slate-800 bg-slate-900 p-4 transition-transform lg:translate-x-0 ${open?'translate-x-0':'-translate-x-full'}`}><div className="flex items-center justify-between px-2 py-2"><div className="flex items-center gap-3 font-bold"><div className="rounded-xl bg-blue-600 p-2"><WalletCards size={19}/></div>WSaku Pro</div><button onClick={()=>setOpen(false)} className="lg:hidden"><X/></button></div><nav className="mt-8 space-y-2">{nav.map(([id,label,Icon])=><button key={id} onClick={()=>{setPage(id);setOpen(false)}} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium ${page===id?'bg-blue-600 text-white':'text-slate-400 hover:bg-slate-800'}`}><Icon size={18}/>{label}</button>)}</nav><button onClick={signOut} className="absolute bottom-5 left-4 right-4 flex items-center gap-3 rounded-xl border border-slate-800 px-3 py-3 text-sm text-slate-400 hover:bg-slate-800"><LogOut size={18}/>Keluar</button></aside><div className="lg:pl-64"><header className="sticky top-0 z-30 flex items-center gap-3 border-b border-slate-800 bg-slate-950/90 px-4 py-3 backdrop-blur lg:hidden"><button onClick={()=>setOpen(true)} className="rounded-xl border border-slate-800 p-2"><Menu size={19}/></button><span className="font-semibold">WSaku Pro</span></header>{page==='dashboard'?<Dashboard user={user}/>:page==='master'?<MasterData user={user}/>:page==='reports'?<Reports user={user}/>:<Workspace user={user}/>}</div>{open&&<button aria-label="Tutup menu" onClick={()=>setOpen(false)} className="fixed inset-0 z-30 bg-black/60 lg:hidden"/>}</div>
}
