import { useEffect, useRef } from 'react';
import { CircleHelp } from 'lucide-react';
import Tooltip from 'bootstrap/js/dist/tooltip';
import './fwi-tooltips.css';

const definitions = {
  FFMC: 'Fine Fuel Moisture Code: describes moisture in surface litter and small dead fuels. Higher values indicate drier fine fuels.',
  DMC: 'Duff Moisture Code: describes moisture in loosely compacted organic material below the surface and medium-sized woody fuels. Higher values indicate drier fuels.',
  DC: 'Drought Code: describes moisture in deep, compact organic layers. It tracks longer-term drying; higher values indicate drier deep fuels.',
};

export function FwiCodeHelp({ label }: { label: string }) {
  const ref = useRef<HTMLButtonElement>(null);
  const code = label.match(/\b(FFMC|DMC|DC)\b/)?.[1] as keyof typeof definitions | undefined;
  useEffect(() => {
    if (!ref.current || !code) return;
    const tooltip = new Tooltip(ref.current, {
      title: definitions[code], trigger: 'hover focus', container: document.body,
      placement: 'top', customClass: 'fwi-code-tooltip', animation: false,
    });
    return () => tooltip.dispose();
  }, [code]);
  if (!code) return null;
  return <button ref={ref} type="button" aria-label={`What does ${code} stand for?`}
    className="ml-1 inline-flex shrink-0 align-middle text-slate-400 hover:text-blue-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-400"
    data-bs-toggle="tooltip"><CircleHelp size={13} aria-hidden="true" /></button>;
}
