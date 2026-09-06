import { useState } from 'react'
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, WalletCards } from 'lucide-react'
import { signIn, signUp } from '../../lib/auth'

export default function AuthScreen() {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ fullName: '', email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const submit = async (event) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    setMessage('')
    try {
      const result = mode === 'login'
        ? await signIn(form.email, form.password)
        : await signUp(form.email, form.password, form.fullName)
      if (result.error) throw result.error
      setMessage(mode === 'login' ? 'Login berhasil.' : 'Akun berhasil dibuat. Periksa email jika verifikasi diperlukan.')
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-[2rem] border border-slate-800 bg-slate-900 shadow-2xl lg:grid-cols-2">
          <div className="hidden bg-gradient-to-br from-blue-600 via-indigo-700 to-slate-950 p-12 lg:flex lg:flex-col lg:justify-between">
            <div>
              <div className="flex items-center gap-3 font-bold text-xl"><WalletCards /> WSaku Pro</div>
              <h1 className="mt-20 max-w-md text-5xl font-extrabold leading-tight">Keuangan lebih rapi. Keputusan lebih jelas.</h1>
              <p className="mt-6 max-w-md text-blue-100">Kelola pemasukan, pengeluaran, saldo, dan aktivitas keuangan dalam satu workspace.</p>
            </div>
            <p className="text-sm text-blue-100/70">Personal finance workspace</p>
          </div>

          <div className="p-7 sm:p-10 lg:p-12">
            <div className="mb-8 lg:hidden"><div className="flex items-center gap-3 text-xl font-bold"><WalletCards className="text-blue-400" /> WSaku Pro</div></div>
            <div className="mb-8">
              <h2 className="text-3xl font-bold">{mode === 'login' ? 'Selamat datang' : 'Buat akun'}</h2>
              <p className="mt-2 text-slate-400">{mode === 'login' ? 'Masuk untuk melanjutkan ke workspace Anda.' : 'Mulai kelola keuangan Anda.'}</p>
            </div>

            <form onSubmit={submit} className="space-y-5">
              {mode === 'register' && <Field label="Nama lengkap" value={form.fullName} onChange={(v) => setForm({ ...form, fullName: v })} />}
              <div><label className="mb-2 block text-sm font-medium">Email</label><div className="relative"><Mail className="absolute left-3 top-3.5 text-slate-500" size={18} /><input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-10 py-3 outline-none transition focus:border-blue-500" placeholder="nama@email.com" /></div></div>
              <div><label className="mb-2 block text-sm font-medium">Password</label><div className="relative"><LockKeyhole className="absolute left-3 top-3.5 text-slate-500" size={18} /><input required minLength={6} type={showPassword ? 'text' : 'password'} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-10 py-3 pr-11 outline-none transition focus:border-blue-500" placeholder="Minimal 6 karakter" /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-slate-500">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></div>
              {error && <p className="rounded-xl bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}
              {message && <p className="rounded-xl bg-emerald-500/10 p-3 text-sm text-emerald-300">{message}</p>}
              <button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 font-semibold transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60">{busy ? 'Memproses...' : mode === 'login' ? 'Masuk' : 'Daftar'} <ArrowRight size={18} /></button>
            </form>
            <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); setMessage('') }} className="mt-6 w-full text-sm text-slate-400 hover:text-white">{mode === 'login' ? 'Belum punya akun? ' : 'Sudah punya akun? '}<span className="font-semibold text-blue-400">{mode === 'login' ? 'Daftar' : 'Masuk'}</span></button>
          </div>
        </div>
      </div>
    </main>
  )
}

function Field({ label, value, onChange }) {
  return <div><label className="mb-2 block text-sm font-medium">{label}</label><input required value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-blue-500" placeholder="Nama Anda" /></div>
}
