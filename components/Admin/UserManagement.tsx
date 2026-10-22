import React, { useEffect, useState } from 'react';
import { Loader2, Lock, Plus, Search, Unlock, UserPlus } from 'lucide-react';
import { Language } from '../../types';
import { createUser, listUsers, setUserDisabled, updateUser, type AdminRole, type AdminUser } from '../../services/userAdminService';

const TEXT = {
  en: {
    help: 'Create accounts, assign institutional roles and disable access. Only a super-admin can grant the super-admin role.',
    search: 'Search name, username or e-mail', allRoles: 'All roles', allStatuses: 'All accounts', active: 'Active', disabled: 'Disabled',
    newUser: 'New user', name: 'Full name', username: 'Username', email: 'E-mail', role: 'Role', password: 'Initial password (min. 12, letters and numbers)',
    create: 'Create account', cancel: 'Cancel', disable: 'Disable', enable: 'Enable', status: 'Status', created: 'Created', saved: 'Saved', empty: 'No users match the filters.',
  },
  bs: {
    help: 'Kreirajte naloge, dodijelite institucionalne uloge i onemogućite pristup. Ulogu super-admina može dodijeliti samo super-admin.',
    search: 'Pretraga po imenu, korisničkom imenu ili e-mailu', allRoles: 'Sve uloge', allStatuses: 'Svi nalozi', active: 'Aktivan', disabled: 'Onemogućen',
    newUser: 'Novi korisnik', name: 'Ime i prezime', username: 'Korisničko ime', email: 'E-mail', role: 'Uloga', password: 'Početna lozinka (min. 12, slova i brojevi)',
    create: 'Kreiraj nalog', cancel: 'Odustani', disable: 'Onemogući', enable: 'Omogući', status: 'Status', created: 'Kreiran', saved: 'Sačuvano', empty: 'Nijedan korisnik ne odgovara filterima.',
  },
};

/** User management (CRD FC_PDR15). */
export default function UserManagement({ language, isDarkMode, currentUserId, canCreate, canUpdate }: { language: Language; isDarkMode: boolean; currentUserId: number; canCreate: boolean; canUpdate: boolean }) {
  const t = language === Language.BS ? TEXT.bs : TEXT.en;
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [roles, setRoles] = useState<AdminRole[]>([]);
  const [filters, setFilters] = useState({ q: '', role_id: '', status: '' });
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: '', username: '', email: '', role_id: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const panel = isDarkMode ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white';
  const input = `w-full rounded-lg border px-3 py-2 text-sm ${isDarkMode ? 'border-slate-700 bg-slate-950 text-slate-100' : 'border-slate-300 bg-white text-slate-900'}`;

  const load = () => listUsers(filters).then(response => { setUsers(response.data); setRoles(response.roles); }).catch(reason => setError(message(reason)));
  useEffect(() => { const timer = window.setTimeout(() => { void load(); }, filters.q ? 250 : 0); return () => window.clearTimeout(timer); }, [filters.q, filters.role_id, filters.status]);

  const run = async (action: () => Promise<unknown>) => { setBusy(true); setError(''); try { await action(); await load(); } catch (reason) { setError(message(reason)); } finally { setBusy(false); } };

  return (
    <div className={`space-y-4 ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`} data-testid="user-management">
      <p className="text-sm text-slate-500">{t.help}</p>
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-56 flex-1"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={filters.q} onChange={event => setFilters(current => ({ ...current, q: event.target.value }))} placeholder={t.search} aria-label={t.search} className={`${input} pl-9`} /></div>
        <select value={filters.role_id} onChange={event => setFilters(current => ({ ...current, role_id: event.target.value }))} aria-label={t.allRoles} className={`${input} w-auto`}><option value="">{t.allRoles}</option>{roles.map(role => <option key={role.id} value={role.id}>{role.name}</option>)}</select>
        <select value={filters.status} onChange={event => setFilters(current => ({ ...current, status: event.target.value }))} aria-label={t.allStatuses} className={`${input} w-auto`}><option value="">{t.allStatuses}</option><option value="active">{t.active}</option><option value="disabled">{t.disabled}</option></select>
        {canCreate && <button type="button" onClick={() => setCreating(value => !value)} className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white"><Plus size={15} />{t.newUser}</button>}
      </div>
      {error && <div role="alert" className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-600">{error}</div>}

      {creating && (
        <form className={`grid gap-3 rounded-xl border p-4 sm:grid-cols-2 lg:grid-cols-3 ${panel}`} onSubmit={event => { event.preventDefault(); void run(async () => { await createUser({ ...form, role_id: Number(form.role_id) }); setCreating(false); setForm({ name: '', username: '', email: '', role_id: '', password: '' }); }); }}>
          {(['name', 'username', 'email'] as const).map(field => <label key={field} className="text-xs font-bold text-slate-500">{t[field]}<input name={field} required value={form[field]} type={field === 'email' ? 'email' : 'text'} onChange={event => setForm(current => ({ ...current, [field]: event.target.value }))} className={`${input} mt-1`} /></label>)}
          <label className="text-xs font-bold text-slate-500">{t.role}<select name="role_id" required value={form.role_id} onChange={event => setForm(current => ({ ...current, role_id: event.target.value }))} className={`${input} mt-1`}><option value="" />{roles.map(role => <option key={role.id} value={role.id}>{role.name}</option>)}</select></label>
          <label className="text-xs font-bold text-slate-500 sm:col-span-2">{t.password}<input name="password" required type="password" autoComplete="new-password" value={form.password} onChange={event => setForm(current => ({ ...current, password: event.target.value }))} className={`${input} mt-1`} /></label>
          <div className="flex gap-2 sm:col-span-2 lg:col-span-3"><button type="submit" disabled={busy} className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-60"><UserPlus size={15} />{t.create}</button><button type="button" onClick={() => setCreating(false)} className="rounded-lg bg-slate-500/10 px-4 py-2 text-sm font-bold">{t.cancel}</button></div>
        </form>
      )}

      {!users ? <Loader2 className="animate-spin text-slate-400" /> : (
        <div className={`overflow-x-auto rounded-xl border ${panel}`}>
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">{t.name}</th><th>{t.username}</th><th>{t.email}</th><th>{t.role}</th><th>{t.status}</th><th className="px-4 text-right" /></tr></thead>
            <tbody>
              {users.length === 0 && <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-500">{t.empty}</td></tr>}
              {users.map(user => (
                <tr key={user.id} className="border-t border-slate-500/15">
                  <td className="px-4 py-2 font-semibold">{user.name}</td>
                  <td className="font-mono text-xs">{user.username}</td>
                  <td className="text-xs">{user.email}</td>
                  <td>
                    <select aria-label={`${t.role} ${user.username}`} disabled={!canUpdate || busy || user.id === currentUserId} value={user.role_id} onChange={event => run(() => updateUser(user.id, { role_id: Number(event.target.value) }))} className={`${input} w-auto py-1 text-xs`}>
                      {roles.map(role => <option key={role.id} value={role.id}>{role.name}</option>)}
                    </select>
                  </td>
                  <td><span className={`rounded-full px-2 py-0.5 text-xs font-bold ${user.disabled_at ? 'bg-red-500/15 text-red-600' : 'bg-emerald-500/15 text-emerald-600'}`}>{user.disabled_at ? t.disabled : t.active}</span></td>
                  <td className="px-4 text-right">
                    {canUpdate && user.id !== currentUserId && (
                      <button type="button" disabled={busy} onClick={() => run(() => setUserDisabled(user.id, !user.disabled_at))} className="inline-flex items-center gap-1 rounded-lg bg-slate-500/10 px-3 py-1 text-xs font-bold">
                        {user.disabled_at ? <><Unlock size={13} />{t.enable}</> : <><Lock size={13} />{t.disable}</>}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function message(reason: unknown): string {
  const error = reason as { message?: string; errors?: Record<string, string[]> };
  return (error.errors && Object.values(error.errors).flat().join(' ')) || error.message || 'Error';
}
