import { useEffect, useState } from 'react'
import { Check, RefreshCw, Shield, User, UserCheck, UserX } from 'lucide-react'
import { getWorkspaceMembers, setMemberActive, updateMemberRole, updateProfile } from '../../lib/workspace'

export default function Workspace({ user }) {
  const [data, setData] = useState({ workspace: null, myRole: null, members: [] })
  const [name, setName] = useState(user.user_metadata?.full_name || '')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [busyId, setBusyId] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true); setError('')
    try { setData(await getWorkspaceMembers(user.id)) }
    catch (e) { setError(e.message || 'Gagal memuat anggota workspace.') }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [user.id])

  const save = async () => {
    if (!name.trim()) return
    setSaving(true); setMessage(''); setError('')
    try { await updateProfile(user.id, name); setMessage('Profil berhasil diperbarui.'); await load() }
    catch (e) { setError(e.message || 'Gagal menyimpan profil.') }
    finally { setSaving(false) }
  }
  const admin = data.myRole === 'admin'
  const role = async (id, next) => { setBusyId(id); setError(''); try { await updateMemberRole(data.workspace.id, id, next); setMessage('Role anggota diperbarui.'); await load() } catch (e) { setError(e.message || 'Gagal memperbarui role.') } finally { setBusyId('') } }
  const active = async (id, value) => { setBusyId(id); setError(''); try { await setMemberActive(data.workspace.id, id, value); setMessage(value ? 'Anggota diaktifkan.' : 'Anggota dinonaktifkan.'); await load() } catch (e) { setError(e.message || 'Gagal memperbarui status anggota.') } finally { setBusyId('') } }

  return <main className="min-h-screen bg-slate-950 text-slate-100"><div className="mx-auto max-w-6xl px-4 py-6 md:px-6">
    <div className="flex items-start justify-between gap-4"><div><p className="text-sm text-slate-500">Workspace</p><h1 className="text-2xl font-bold">Pengaturan & Pengguna</h1><p className="mt-1 text-sm text-slate-500">Kelola profil dan akses anggota workspace.</p></div><button onClick={load} disabled={loading} className="rounded-xl border border-slate-800 p-2 text-slate-400 hover:bg-slate-900"><RefreshCw size={18} className={loading?'animate-spin':''}/></button></div>
    {error && <div className="mt-4 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-300">{error}</div>}
    {message && <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-300">{message}</div>}
    <section className="mt-6 grid gap-4 lg:grid-cols-[.8fr_1.2fr]">
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5"><div className="flex items-center gap-3"><div className="rounded-xl bg-blue-600 p-3"><User size={19}/></div><div><h2 className="font-semibold">Profil Saya</h2><p className="text-xs text-slate-500">Informasi akun aktif</p></div></div>
        <label className="mt-6 block text-sm text-slate-400">Nama lengkap<input value={name} onChange={e=>setName(e.target.value)} maxLength={120} className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-slate-100"/></label>
        <label className="mt-4 block text-sm text-slate-400">Email<input value={user.email||''} disabled className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-3 text-sm text-slate-500"/></label>
        <button onClick={save} disabled={saving || !name.trim()} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold disabled:opacity-50"><Check size={17}/>{saving?'Menyimpan...':'Simpan Profil'}</button>
      </div>
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5"><div className="flex items-center gap-3"><div className="rounded-xl bg-slate-800 p-3"><Shield size={19}/></div><div><h2 className="font-semibold">Workspace</h2><p className="text-xs text-slate-500">{data.workspace?.workspace_type||'-'} · Peran saya: <b className="text-slate-300">{data.myRole||'-'}</b></p></div></div><div className="mt-5 rounded-xl border border-slate-800 bg-slate-950 p-4"><p className="font-semibold">{data.workspace?.name||'Memuat...'}</p><p className="mt-1 text-sm text-slate-500">{data.workspace?.description||'Workspace keuangan WSaku Pro.'}</p></div></div>
    </section>
    <section className="mt-6 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900"><div className="border-b border-slate-800 p-5"><h2 className="font-semibold">Anggota Workspace</h2><p className="text-xs text-slate-500">{data.members.length} anggota · status berlaku khusus workspace ini</p></div>{loading?<div className="p-8 text-center text-slate-500">Memuat anggota...</div>:<div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="border-b border-slate-800 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Pengguna</th><th className="px-4 py-3">Role</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Bergabung</th><th className="px-4 py-3 text-right">Aksi</th></tr></thead><tbody>{data.members.map(m=><tr key={m.user_id} className="border-b border-slate-800/70"><td className="px-4 py-4"><div className="font-medium">{m.full_name||'Tanpa nama'}</div><div className="text-xs text-slate-500">{m.email}</div></td><td className="px-4 py-4">{admin&&m.user_id!==user.id?<select disabled={busyId===m.user_id} value={m.role} onChange={e=>role(m.user_id,e.target.value)} className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-2 text-xs"><option value="admin">Admin</option><option value="user">User</option></select>:<span className="rounded-lg bg-slate-800 px-2 py-1 text-xs">{m.role}</span>}</td><td className="px-4 py-4"><span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs ${m.is_active?'bg-emerald-500/10 text-emerald-400':'bg-slate-800 text-slate-500'}`}>{m.is_active?<UserCheck size={13}/>:<UserX size={13}/>} {m.is_active?'Aktif':'Nonaktif'}</span></td><td className="px-4 py-4 text-slate-500">{m.joined_at?.slice(0,10)||'-'}</td><td className="px-4 py-4 text-right">{admin&&m.user_id!==user.id&&<button disabled={busyId===m.user_id} onClick={()=>active(m.user_id,!m.is_active)} className="rounded-lg border border-slate-700 px-3 py-2 text-xs disabled:opacity-50">{busyId===m.user_id?'Memproses...':m.is_active?'Nonaktifkan':'Aktifkan'}</button>}</td></tr>)}</tbody></table></div>}</section>
    <p className="mt-4 text-xs text-slate-600">Penambahan pengguna baru belum menggunakan service-role di browser. Undangan pengguna akan dibuat pada tahap server-side agar kredensial rahasia tidak pernah masuk ke frontend.</p>
  </div></main>
}
