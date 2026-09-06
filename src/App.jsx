import { LogOut, WalletCards } from 'lucide-react'
import AuthScreen from './components/auth/AuthScreen'
import { useAuth } from './hooks/useAuth'
import { signOut } from './lib/auth'

export default function App() {
  const { user, loading, configured } = useAuth()

  if (loading) return <div className="grid min-h-screen place-items-center bg-slate-950 text-slate-400">Memuat WSaku Pro...</div>
  if (!configured) return <div className="grid min-h-screen place-items-center bg-slate-950 p-6 text-slate-200"><div className="max-w-lg rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6"><h1 className="font-bold">Supabase belum dikonfigurasi</h1><p className="mt-2 text-sm text-slate-400">Salin .env.example menjadi .env.local lalu isi VITE_SUPABASE_URL dan VITE_SUPABASE_PUBLISHABLE_KEY.</p></div></div>
  if (!user) return <AuthScreen />

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900/80 px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3 font-bold"><WalletCards className="text-blue-400" /> WSaku Pro</div>
          <button onClick={signOut} className="flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-2 text-sm hover:bg-slate-800"><LogOut size={16} /> Keluar</button>
        </div>
      </header>
      <section className="mx-auto max-w-7xl px-6 py-10">
        <p className="text-sm text-slate-400">Login sebagai</p>
        <h1 className="mt-1 text-3xl font-bold">{user.email}</h1>
        <div className="mt-8 rounded-3xl border border-slate-800 bg-slate-900 p-6"><h2 className="text-xl font-semibold">Workspace siap digunakan</h2><p className="mt-2 text-slate-400">Autentikasi Supabase berhasil. Dashboard keuangan akan dibangun pada tahap berikutnya.</p></div>
      </section>
    </main>
  )
}
