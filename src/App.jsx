import { WalletCards } from 'lucide-react'

export default function App() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <section className="mx-auto flex min-h-screen max-w-5xl items-center justify-center px-6 py-12">
        <div className="w-full max-w-xl rounded-3xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl">
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600">
            <WalletCards size={28} />
          </div>
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-blue-400">WSaku Pro</p>
          <h1 className="text-3xl font-bold tracking-tight">Fondasi baru dimulai.</h1>
          <p className="mt-3 leading-7 text-slate-400">
            Project ini dibangun dari nol. Modul autentikasi, database, dashboard,
            transaksi, laporan, dan pengaturan akan ditambahkan secara bertahap.
          </p>
          <div className="mt-8 rounded-2xl border border-dashed border-slate-700 p-5 text-sm text-slate-400">
            Tahap 1 · React + Vite + Tailwind CSS
          </div>
        </div>
      </section>
    </main>
  )
}
