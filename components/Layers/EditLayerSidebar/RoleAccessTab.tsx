import React, { useEffect, useMemo, useState } from 'react';
import { Check, Loader2, ShieldCheck } from 'lucide-react';
import {
  fetchDatasetLayerRoleAccess,
  saveDatasetLayerRoleAccess,
  type DatasetAccessRole,
  type DatasetLayer,
  type DatasetRoleMap,
} from '../../../services/datasetService';

interface RoleAccessTabProps {
  layer: DatasetLayer;
}

const SUPER_ADMIN_SLUG = 'super-admin';

function isOn(map: DatasetRoleMap, roleId: number): boolean {
  return map[String(roleId)] === true;
}

function withRole(map: DatasetRoleMap, roleId: number, value: boolean): DatasetRoleMap {
  return { ...map, [String(roleId)]: value };
}

export const RoleAccessTab: React.FC<RoleAccessTabProps> = ({ layer }) => {
  const [roles, setRoles] = useState<DatasetAccessRole[]>([]);
  const [accessibility, setAccessibility] = useState<DatasetRoleMap>({});
  const [visibility, setVisibility] = useState<DatasetRoleMap>({});
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    let isMounted = true;

    setIsLoading(true);
    setLoadError(null);
    setMessage(null);

    fetchDatasetLayerRoleAccess(layer.id)
      .then((data) => {
        if (!isMounted) return;
        setRoles(data.roles);
        setAccessibility(data.accessibility || {});
        setVisibility(data.visibility || {});
      })
      .catch(() => {
        if (!isMounted) return;
        setRoles([]);
        setLoadError('Role access could not be loaded from the backend.');
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [layer.id]);

  // Super Admin always keeps access, so it is listed but not editable.
  const editableRoles = useMemo(
    () => roles.filter((role) => role.slug !== SUPER_ADMIN_SLUG),
    [roles]
  );

  const setAllAccessibility = (value: boolean) => {
    setAccessibility(editableRoles.reduce<DatasetRoleMap>(
      (map, role) => ({ ...map, [String(role.id)]: value }),
      { ...accessibility }
    ));
    setMessage(null);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);

    try {
      const saved = await saveDatasetLayerRoleAccess(layer.id, { accessibility, visibility });
      setAccessibility(saved.accessibility || {});
      setVisibility(saved.visibility || {});
      setMessage({ kind: 'success', text: 'Role access saved.' });
    } catch {
      setMessage({ kind: 'error', text: 'Role access could not be saved.' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-md border border-slate-800 bg-slate-950/60 px-3 py-8 text-xs font-bold text-slate-400">
        <Loader2 size={16} className="animate-spin text-blue-400" />
        Loading role access...
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-xs font-bold text-red-200">
        {loadError}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <section className="rounded-md border border-slate-800 bg-slate-950/60 p-3">
        <h3 className="text-[11px] font-black uppercase tracking-[0.16em] text-blue-300">Role access</h3>
        <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
          <span className="font-bold text-slate-300">Access</span> decides whether a role may see this
          layer at all. <span className="font-bold text-slate-300">Default on</span> only decides whether
          it starts switched on — the user can still toggle it.
        </p>
      </section>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled={isSaving || editableRoles.length === 0}
          onClick={() => setAllAccessibility(true)}
          className="h-9 rounded-md border border-emerald-500/40 bg-emerald-500/10 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-200 transition-colors hover:bg-emerald-500/20 disabled:opacity-40"
        >
          Allow all
        </button>
        <button
          type="button"
          disabled={isSaving || editableRoles.length === 0}
          onClick={() => setAllAccessibility(false)}
          className="h-9 rounded-md border border-red-500/40 bg-red-500/10 text-[10px] font-black uppercase tracking-[0.12em] text-red-200 transition-colors hover:bg-red-500/20 disabled:opacity-40"
        >
          Deny all
        </button>
      </div>

      <section className="overflow-hidden rounded-md border border-slate-800">
        <div className="grid grid-cols-[1fr_64px_72px] items-center gap-2 border-b border-slate-800 bg-slate-950/80 px-3 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
          <span>Role</span>
          <span className="text-center">Access</span>
          <span className="text-center">Default on</span>
        </div>

        <div className="divide-y divide-slate-800/70">
          {roles.length === 0 && (
            <div className="px-3 py-4 text-xs font-bold text-slate-600">No roles available.</div>
          )}

          {roles.map((role) => {
            const superAdmin = role.slug === SUPER_ADMIN_SLUG;
            const hasAccess = superAdmin || isOn(accessibility, role.id);
            const startsOn = isOn(visibility, role.id);

            return (
              <div
                key={role.id}
                className="grid grid-cols-[1fr_64px_72px] items-center gap-2 bg-slate-950/40 px-3 py-2"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    {superAdmin && <ShieldCheck size={12} className="shrink-0 text-blue-400" />}
                    <span className="truncate text-xs font-bold text-slate-200">{role.name}</span>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-600">
                    Level {role.level}
                  </span>
                </div>

                <div className="flex justify-center">
                  <RoleCheckbox
                    checked={hasAccess}
                    disabled={superAdmin || isSaving}
                    title={superAdmin ? 'Super Admin always has access' : 'Allow this role to see the layer'}
                    onChange={(value) => {
                      setAccessibility((map) => withRole(map, role.id, value));
                      // A role that cannot see the layer must not have it on by default.
                      if (!value) setVisibility((map) => withRole(map, role.id, false));
                      setMessage(null);
                    }}
                  />
                </div>

                <div className="flex justify-center">
                  <RoleCheckbox
                    checked={startsOn}
                    disabled={!hasAccess || isSaving}
                    title={hasAccess ? 'Start switched on for this role' : 'Grant access first'}
                    onChange={(value) => {
                      setVisibility((map) => withRole(map, role.id, value));
                      setMessage(null);
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <button
        type="button"
        disabled={isSaving || roles.length === 0}
        onClick={handleSave}
        className="h-10 w-full rounded-md bg-blue-600 text-xs font-black uppercase tracking-[0.14em] text-white transition-colors hover:bg-blue-500 disabled:opacity-50"
      >
        {isSaving ? 'Saving...' : 'Save role access'}
      </button>

      {message && (
        <div
          className={`rounded-md border p-2 text-center text-xs font-bold ${
            message.kind === 'success'
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
              : 'border-red-500/30 bg-red-500/10 text-red-200'
          }`}
        >
          {message.text}
        </div>
      )}
    </div>
  );
};

function RoleCheckbox({
  checked,
  disabled,
  title,
  onChange,
}: {
  checked: boolean;
  disabled?: boolean;
  title?: string;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      disabled={disabled}
      title={title}
      onClick={() => onChange(!checked)}
      className={`flex h-5 w-5 items-center justify-center rounded border transition-colors ${
        checked ? 'border-blue-500 bg-blue-600 text-white' : 'border-slate-700 bg-slate-950'
      } ${disabled ? 'cursor-not-allowed opacity-40' : 'hover:border-blue-400'}`}
    >
      {checked && <Check size={12} />}
    </button>
  );
}
