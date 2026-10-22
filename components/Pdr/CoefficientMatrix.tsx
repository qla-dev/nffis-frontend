import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Loader2, Plus, Save } from 'lucide-react';
import { Language } from '../../types';
import {
  approveCoefficientSet, createCoefficientSet, listCoefficientSets, updateCoefficientSet,
  type CoefficientCatalogue, type CoefficientSet,
} from '../../services/pdrService';
import { bilingual, pdrText } from '../../lib/pdr/i18n';
import { ErrorBox, errorText } from './PdrReportPage';

type Coefficients = CoefficientSet['coefficients'];

/** Economic coefficient matrix maintained by the methodological team (PDR04, acceptance PDR2). */
export function CoefficientMatrix({ language, isDarkMode, canEdit }: { language: Language; isDarkMode: boolean; canEdit: boolean }) {
  const t = pdrText(language);
  const [catalogue, setCatalogue] = useState<CoefficientCatalogue | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [draft, setDraft] = useState<Coefficients | null>(null);
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const panel = isDarkMode ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white';

  const load = async (select?: number) => {
    const response = await listCoefficientSets();
    setCatalogue(response);
    const chosen = response.data.find(set => set.id === (select ?? selectedId)) || response.data[0] || null;
    setSelectedId(chosen?.id ?? null);
  };
  useEffect(() => { void load().catch(reason => setError(errorText(reason))); }, []);

  const selected = useMemo(() => catalogue?.data.find(set => set.id === selectedId) || null, [catalogue, selectedId]);
  useEffect(() => {
    if (!selected) return;
    setDraft(structuredClone(selected.coefficients));
    setName(selected.name);
    setNotes(selected.notes || '');
  }, [selected?.id, selected?.updated_at]);

  const editable = canEdit && selected?.status === 'draft';
  const run = async (action: () => Promise<void>) => { setBusy(true); setError(''); try { await action(); } catch (reason) { setError(errorText(reason)); } finally { setBusy(false); } };
  const setRate = (section: keyof Coefficients, key: string | null, raw: string, nullable = false) => setDraft(current => {
    if (!current) return current;
    const value = raw === '' ? (nullable ? null : 0) : Number(raw);
    const next = structuredClone(current) as Record<string, unknown>;
    if (key === null) next[section] = value; else next[section] = { ...(next[section] as Record<string, unknown>), [key]: value };
    return next as Coefficients;
  });

  if (!catalogue) return error ? <ErrorBox message={error} /> : <Loader2 className="animate-spin text-slate-400" />;

  return (
    <div className="space-y-4" data-testid="pdr-coefficients">
      <p className="text-sm text-slate-500">{t.matrixHelp}</p>
      {error && <ErrorBox message={error} />}
      <div className="flex flex-wrap items-center gap-2">
        {catalogue.data.map(set => (
          <button key={set.id} type="button" onClick={() => setSelectedId(set.id)} className={`rounded-lg border px-3 py-2 text-left text-xs font-bold ${set.id === selectedId ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-500/30'}`}>
            {t.version} {set.version} · <span className="uppercase">{set.status}</span>
          </button>
        ))}
        {canEdit && <button type="button" disabled={busy} onClick={() => run(async () => { const created = await createCoefficientSet({ name: `${selected?.name || 'Coefficients'} (revision)` }); await load(created.data.id); })} className="inline-flex items-center gap-1 rounded-lg bg-slate-700 px-3 py-2 text-xs font-bold text-white"><Plus size={14} />{t.newVersion}</button>}
      </div>

      {selected && draft && (
        <div className={`space-y-5 rounded-xl border p-4 ${panel}`}>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-bold text-slate-500">{t.title}<input disabled={!editable} value={name} onChange={event => setName(event.target.value)} className="pdr-input mt-1" /></label>
            <div className="text-xs text-slate-500">{selected.status === 'approved' ? <span className="font-bold text-emerald-600"><CheckCircle2 size={14} className="mr-1 inline" />{selected.approved_by_name} · {selected.approved_at && new Date(selected.approved_at).toLocaleString()}</span> : <span className="font-bold uppercase">{selected.status}</span>}<div className="mt-1">{t.formula}: {catalogue.formula}</div></div>
          </div>

          <Section title={`${t.landCoverGroups} (${selected.currency} ${t.perHa})`}>
            {catalogue.land_cover_groups.map(group => (
              <RateInput key={group.key} label={bilingual(group.label, language)} hint={group.codes.join(', ')} value={draft.land_cover_groups[group.key]} disabled={!editable} onChange={value => setRate('land_cover_groups', group.key, value)} />
            ))}
          </Section>

          <Section title={`${t.codeOverrides} (${selected.currency} ${t.perHa})`}>
            {catalogue.land_cover_codes.filter(code => ['forest', 'agricultural', 'low_vegetation'].includes(code.group)).map(code => (
              <RateInput key={code.code} label={`${code.code} · ${bilingual(code.label, language)}`} value={draft.land_cover_codes[code.code] ?? null} placeholder={String(draft.land_cover_groups[code.group] ?? 0)} disabled={!editable} onChange={value => setDraft(current => {
                if (!current) return current;
                const codes = { ...current.land_cover_codes };
                if (value === '') delete codes[code.code]; else codes[code.code] = Number(value);
                return { ...current, land_cover_codes: codes };
              })} />
            ))}
          </Section>

          <Section title={`${t.roads} (${selected.currency} ${t.perKm})`}>
            {Object.keys(draft.roads).map(key => (
              <RateInput key={key} label={key} value={draft.roads[key]} placeholder={key === 'default' ? '0' : `${t.inheritDefault} (${draft.roads.default ?? 0})`} disabled={!editable} onChange={value => setRate('roads', key, value, key !== 'default')} />
            ))}
          </Section>

          <Section title={`${t.buildings} (${selected.currency} ${t.perBuilding}) · ${t.protectedRate}`}>
            {Object.keys(draft.buildings).map(key => <RateInput key={key} label={key} value={draft.buildings[key]} disabled={!editable} onChange={value => setRate('buildings', key, value)} />)}
            <RateInput label={`${t.protectedRate} (${t.perHa})`} value={draft.protected_area_eur_per_ha} disabled={!editable} onChange={value => setRate('protected_area_eur_per_ha', null, value)} />
          </Section>

          <label className="block text-xs font-bold text-slate-500">{t.notes}<textarea disabled={!editable} rows={2} value={notes} onChange={event => setNotes(event.target.value)} className="pdr-input mt-1" /></label>

          {editable && (
            <div className="flex flex-wrap gap-2">
              <button type="button" disabled={busy} onClick={() => run(async () => { await updateCoefficientSet(selected.id, { name, notes, coefficients: draft }); await load(selected.id); })} className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white"><Save size={15} />{t.save}</button>
              <button type="button" disabled={busy} onClick={() => run(async () => { await updateCoefficientSet(selected.id, { name, notes, coefficients: draft }); await approveCoefficientSet(selected.id); await load(selected.id); })} className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white"><CheckCircle2 size={15} />{t.approveVersion}</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section><h3 className="mb-2 text-xs font-black uppercase tracking-wider text-slate-500">{title}</h3><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{children}</div></section>;
}

function RateInput({ label, hint, value, placeholder, disabled, onChange }: { label: string; hint?: string; value: number | null | undefined; placeholder?: string; disabled: boolean; onChange: (value: string) => void }) {
  return (
    <label className="block rounded-lg bg-slate-500/5 px-3 py-2 text-xs">
      <span className="block font-semibold">{label}</span>
      {hint && <span className="block text-[10px] text-slate-500">{hint}</span>}
      <input type="number" min={0} step="any" disabled={disabled} value={value ?? ''} placeholder={placeholder} onChange={event => onChange(event.target.value)} className="pdr-input mt-1 text-right tabular-nums" />
    </label>
  );
}
