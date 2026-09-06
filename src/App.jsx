import { WalletCards } from 'lucide-react'
import AuthScreen from './components/auth/AuthScreen'
import Dashboard from './components/dashboard/Dashboard'
import { useAuth } from './hooks/useAuth'

export default function App() {
  const { user, loading, configured } = useAuth()

  if (loading) return <div className="grid min-h-screen place-items-center bg-slate-950 text-slate-400">Memuat WSaku Pro...</div>
  if (!configured) return <div className="grid min-h-screen place-items-center bg-slate-950 p-6 text-slate-200"><div className="max-w-lg rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6"><div className="flex items-center gap-3"><WalletCards className="text-amber-400" /><h1 className="font-bold">Supabase belum dikonfigurasi</h1></div><p className="mt-3 text-sm text-slate-400">Salin .env.example menjadi .env.local lalu isi VITE_SUPABASE_URL dan VITE_SUPABASE_PUBLISHABLE_KEY.</p></div></div>
  if (!user) return <AuthScreen />
  return <Dashboard user={user} />
}
