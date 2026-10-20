import React from 'react';
import { AlertTriangle, Building2, Coins, Database, Flame, Leaf, Route, ShieldCheck, Users } from 'lucide-react';
import { Language } from '../../types';
import type { PdrResults } from '../../services/pdrService';
import { bilingual, formatMoney, formatNumber, pdrText } from '../../lib/pdr/i18n';

const GROUP_COLORS: Record<string, string> = {
  forest: '#15803d', agricultural: '#ca8a04', low_vegetation: '#84cc16', bare_and_burnt: '#78716c',
  artificial: '#dc2626', wetlands_and_water: '#0284c7', unclassified: '#94a3b8',
};

interface Props { results: PdrResults; language: Language; isDarkMode: boolean }

/** Dynamic damage visualization (FC_PDR04): cards, bar charts and tables of the calculated statistics. */
export function PdrResultsView({ results, language, isDarkMode }: Props) {
  const t = pdrText(language);
  const panel = isDarkMode ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white';
  const muted = isDarkMode ? 'text-slate-400' : 'text-slate-500';
  const n = (value: number | null | undefined, digits = 2) => formatNumber(value, digits, language);
  const damage = results.damage;

  return (
    <div className="space-y-5" data-testid="pdr-results">
      {results.warnings.length > 0 && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-300">
          <AlertTriangle size={15} className="mr-1 inline" />{results.warnings.join(' ')}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card icon={Flame} color="text-orange-500" label={t.area} value={`${n(results.perimeter.area_ha)} ha`} panel={panel} muted={muted} />
        <Card icon={Coins} color="text-emerald-500" label={t.damage} value={damage.available ? formatMoney(damage.total, damage.currency, language) : '—'} hint={damage.available ? `${t.coefficientSet} v${damage.coefficient_set?.version}` : t.damageUnavailable} panel={panel} muted={muted} />
        <Card icon={Building2} color="text-red-500" label={t.buildingsInside} value={n(results.buildings?.inside_count, 0)} hint={`${n(results.buildings?.buffer_count, 0)} ${t.buffer} ${results.exposure_buffer_m} m`} panel={panel} muted={muted} />
        <Card icon={Users} color="text-blue-500" label={t.populationInside} value={n(results.population?.inside_estimate, 0)} hint={`${n(results.population?.buffer_estimate, 0)} ${t.buffer}`} panel={panel} muted={muted} />
      </div>

      {results.land_cover && (
        <section className={`rounded-xl border p-4 ${panel}`}>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-black uppercase tracking-wider"><Leaf size={15} className="text-green-600" />{t.landCover}</h3>
          <div className="mb-4 flex h-5 w-full overflow-hidden rounded-full" role="img" aria-label={t.landCoverGroups}>
            {results.land_cover.groups.map(group => <div key={group.key} title={`${bilingual(group.label, language)} ${n(group.area_ha)} ha`} style={{ width: `${Math.max(group.share * 100, 0.5)}%`, backgroundColor: GROUP_COLORS[group.key] || '#64748b' }} />)}
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {results.land_cover.groups.map(group => (
              <div key={group.key} className="flex items-center justify-between gap-2 rounded-lg bg-slate-500/5 px-3 py-2 text-sm">
                <span className="flex items-center gap-2"><i className="inline-block h-3 w-3 rounded-sm" style={{ backgroundColor: GROUP_COLORS[group.key] || '#64748b' }} />{bilingual(group.label, language)}</span>
                <span className="font-bold tabular-nums">{n(group.area_ha)} ha <span className={`text-xs ${muted}`}>({n(group.share * 100, 1)}%)</span></span>
              </div>
            ))}
          </div>
          <table className="mt-4 w-full text-left text-sm">
            <thead className={`text-xs uppercase ${muted}`}><tr><th className="py-1">CLC</th><th>{t.landCoverClass}</th><th className="text-right">ha</th><th className="text-right">{t.share}</th></tr></thead>
            <tbody>
              {results.land_cover.classes.map(item => (
                <tr key={item.code} className="border-t border-slate-500/15">
                  <td className="py-1.5 font-mono text-xs">{item.code}</td>
                  <td>{bilingual(item.label, language)}</td>
                  <td className="text-right tabular-nums">{n(item.area_ha)}</td>
                  <td className="w-40 text-right"><Bar share={item.share} color={GROUP_COLORS[item.group]} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        <section className={`rounded-xl border p-4 ${panel}`}>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-black uppercase tracking-wider"><Route size={15} className="text-slate-500" />{t.infrastructure}</h3>
          <div className="mb-3 grid grid-cols-2 gap-2 text-sm">
            <Stat label={t.roadsInside} value={`${n(results.roads?.inside_km, 2)} km`} />
            <Stat label={`${t.roadsBuffer} (${results.exposure_buffer_m} m)`} value={`${n(results.roads?.buffer_km, 2)} km`} />
            <Stat label={t.buildingsInside} value={n(results.buildings?.inside_count, 0)} />
            <Stat label={t.buildingsBuffer} value={n(results.buildings?.buffer_count, 0)} />
          </div>
          <table className="w-full text-left text-sm">
            <tbody>
              {(results.roads?.by_class || []).slice(0, 8).map(road => (
                <tr key={road.class} className="border-t border-slate-500/15"><td className="py-1">{road.class}</td><td className="text-right tabular-nums">{n(road.inside_km, 2)} km</td><td className={`text-right text-xs ${muted}`}>+{n(road.buffer_km, 2)} km {t.buffer}</td></tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className={`rounded-xl border p-4 ${panel}`}>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-black uppercase tracking-wider"><ShieldCheck size={15} className="text-emerald-600" />{t.protectedAreas}</h3>
          <Stat label={t.protectedBurnt} value={`${n(results.protected_areas?.total_ha)} ha (${n((results.protected_areas?.share || 0) * 100, 1)}%)`} />
          <table className="mt-3 w-full text-left text-sm">
            <tbody>
              {(results.protected_areas?.sites || []).map(site => (
                <tr key={`${site.name}-${site.site_ha}`} className="border-t border-slate-500/15">
                  <td className="py-1">{site.name}<div className={`text-xs ${muted}`}>{site.designation}</div></td>
                  <td className="text-right tabular-nums">{n(site.burnt_ha)} ha</td>
                  <td className={`text-right text-xs ${muted}`}>{n(site.share_of_site * 100, 1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
          <h3 className="mb-2 mt-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider"><Users size={15} className="text-blue-500" />{t.population}</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <Stat label={t.populationInside} value={n(results.population?.inside_estimate, 0)} />
            <Stat label={t.populationBuffer} value={n(results.population?.buffer_estimate, 0)} />
          </div>
          {results.population && <p className={`mt-2 text-xs ${muted}`}>{results.population.method} · {results.population.persons_per_building}</p>}
        </section>
      </div>

      <section className={`rounded-xl border p-4 ${panel}`}>
        <h3 className="mb-3 flex items-center gap-2 text-sm font-black uppercase tracking-wider"><Coins size={15} className="text-emerald-500" />{t.damage}</h3>
        {damage.available ? (
          <>
            <table className="w-full text-left text-sm">
              <thead className={`text-xs uppercase ${muted}`}><tr><th className="py-1">{t.damageItem}</th><th className="text-right">{t.quantity}</th><th className="text-right">{t.rate}</th><th className="text-right">{t.amount}</th></tr></thead>
              <tbody>
                {(damage.items || []).filter(item => item.amount > 0 || item.category === 'land_cover').map(item => (
                  <tr key={`${item.category}-${item.key}`} className="border-t border-slate-500/15">
                    <td className="py-1.5">{bilingual(item.label, language)}</td>
                    <td className="text-right tabular-nums">{n(item.quantity)} {t.units[item.unit] || item.unit}</td>
                    <td className="text-right tabular-nums">{formatMoney(item.rate, damage.currency, language)}</td>
                    <td className="text-right font-bold tabular-nums">{formatMoney(item.amount, damage.currency, language)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot><tr className="border-t-2 border-slate-500/40 text-base font-black"><td className="py-2" colSpan={3}>Σ</td><td className="text-right">{formatMoney(damage.total, damage.currency, language)}</td></tr></tfoot>
            </table>
            <p className={`mt-2 text-xs ${muted}`}>{t.formula}: {damage.formula} · {t.coefficientSet}: {damage.coefficient_set?.name} (v{damage.coefficient_set?.version}, {damage.coefficient_set?.approved_by})</p>
          </>
        ) : <p className="text-sm text-amber-600">{t.damageUnavailable}: {damage.reason}</p>}
      </section>

      <section className={`rounded-xl border p-4 ${panel}`}>
        <h3 className="mb-3 flex items-center gap-2 text-sm font-black uppercase tracking-wider"><Database size={15} className="text-blue-500" />{t.dataSources}</h3>
        <ul className="space-y-1.5 text-sm">
          {results.data_sources.map(source => (
            <li key={source.dataset} className="flex flex-wrap justify-between gap-2 border-t border-slate-500/15 pt-1.5">
              <span><strong>{source.label}</strong> — {source.source} <span className={`text-xs ${muted}`}>({source.scale.toUpperCase()}, {source.table})</span></span>
              <span className={`text-xs ${muted}`}>{n(source.features_used, 0)} {t.features}{source.data_as_of ? ` · ${t.dataAsOf} ${new Date(source.data_as_of).toLocaleDateString()}` : ''}</span>
            </li>
          ))}
        </ul>
        <p className={`mt-2 text-xs ${muted}`}>{t.calculatedIn} {n(results.duration_ms / 1000, 1)} s · {new Date(results.calculated_at).toLocaleString()}</p>
      </section>
    </div>
  );
}

function Card({ icon: Icon, color, label, value, hint, panel, muted }: { icon: React.ComponentType<{ size?: number; className?: string }>; color: string; label: string; value: string; hint?: string; panel: string; muted: string }) {
  return (
    <div className={`rounded-xl border p-4 ${panel}`}>
      <div className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider ${muted}`}><Icon size={14} className={color} />{label}</div>
      <div className="mt-1 text-2xl font-black tabular-nums">{value}</div>
      {hint && <div className={`text-xs ${muted}`}>{hint}</div>}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg bg-slate-500/5 px-3 py-2"><div className="text-xs text-slate-500">{label}</div><div className="font-bold tabular-nums">{value}</div></div>;
}

function Bar({ share, color }: { share: number; color?: string }) {
  return (
    <div className="ml-auto flex items-center justify-end gap-2">
      <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-500/15"><div className="h-full" style={{ width: `${Math.min(100, share * 100)}%`, backgroundColor: color || '#64748b' }} /></div>
      <span className="w-12 text-right text-xs tabular-nums">{(share * 100).toFixed(1)}%</span>
    </div>
  );
}
