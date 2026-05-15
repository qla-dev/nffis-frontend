import React from 'react';
import {
  Building2,
  Globe2,
  Mail,
  MapIcon,
  MapPin,
  Phone,
  Shield,
  Truck,
  Users,
  X,
} from 'lucide-react';
import { Language } from '../../types';
import { TRANSLATIONS } from '../../constants';
import { FIREFIGHTER_STATION_STYLE } from './firefighterStationUi';
import type { FirefighterStation } from '../../firefighterData';
import { RS_FIREFIGHTER_UNION } from '../../firefighterData';

interface FirefighterStationModalProps {
  station: FirefighterStation;
  language: Language;
  onClose: () => void;
}

const formatValue = (value?: string | number | null) => {
  if (value === undefined || value === null || value === '') return '—';
  return String(value);
};

export const FirefighterStationModal: React.FC<FirefighterStationModalProps> = ({
  station,
  language,
  onClose,
}) => {
  const t = TRANSLATIONS[language];
  const fs = t.firefighterStation;
  const style = FIREFIGHTER_STATION_STYLE[station.stationType];

  const statCards = [
    { label: fs.memberCount, value: station.capacity, icon: Users, color: 'text-orange-400' },
    { label: fs.vehicleCount, value: station.vehicleCount, icon: Truck, color: 'text-amber-400' },
    { label: fs.phone, value: station.phone, icon: Phone, color: 'text-cyan-400' },
    { label: fs.mobile, value: station.mobile, icon: Phone, color: 'text-blue-400' },
    { label: fs.phoneAlt, value: station.phoneAlt, icon: Phone, color: 'text-slate-400' },
    { label: fs.email, value: station.email, icon: Mail, color: 'text-emerald-400' },
  ];

  return (
    <div className="fixed inset-0 z-[3000] h-[100dvh] min-h-[100dvh] bg-slate-950/95 backdrop-blur-sm flex flex-col animate-in fade-in duration-300 md:pl-[60px]">
      <div className="flex-none flex items-center justify-center px-6 pt-[max(1.5rem,env(safe-area-inset-top))] pb-6 border-b border-slate-800 bg-slate-900/50 relative min-h-[120px]">
        <div className="flex flex-col items-center gap-4 animate-in slide-in-from-bottom-4 duration-500 max-w-4xl text-center">
          <div className="flex items-center gap-5 justify-center flex-wrap">
            <div
              className="flex items-center justify-center w-14 h-14 rounded-full border-2 font-black text-lg text-white shadow-xl"
              style={{ borderColor: style.color, boxShadow: `0 0 0 6px ${style.glow}` }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 512 512" fill={style.color}>
                <path d="M447.914,152.582c7.106-21.525-11.432-27.796-32.816-25.646c-13.67,1.371-34.454,10.077-44.728,5.034 c0,0-5.791-92.214-82.374-107.625v34.745h-7.524c-0.78-0.157-1.529-0.331-2.324-0.464V7.784c0-4.302-4.168-7.784-9.297-7.784H256 h-12.85c-5.129,0-9.297,3.482-9.297,7.784v50.843c-0.796,0.134-1.544,0.307-2.324,0.464h-7.524V24.346 c-76.582,15.41-82.374,107.625-82.374,107.625c-10.274,5.042-31.058-3.664-44.728-5.034c-21.384-2.151-39.923,4.12-32.816,25.646 c4.9,14.852,24.55,27.284,46.359,36.857c9.809,4.302,20.572,7.769,30.854,10.519c-0.433,2.032-0.678,4.215-0.678,6.555 c0,4.325,0.741,9.186,2.34,14.772c4.215,14.686,8.021,24.172,12.953,31.13c2.458,3.458,5.263,6.232,8.321,8.344 c1.851,1.292,3.773,2.285,5.712,3.16c4.436,20.524,13.914,34.95,22.36,45.295l-0.275-0.032c-4.46-0.007-8.588,1.142-12.031,3.026 c-5.193,2.853-8.833,7.138-11.228,11.566c-2.38,4.475-3.64,9.076-3.664,13.552c0,6.106,0,15.49,0,21.352 c-7.383,2.308-21.596,7.076-36.771,13.914c-10.96,4.956-22.407,10.976-32.24,18.106c-9.793,7.169-18.192,15.395-22.36,25.7 c-5.563,13.977-7.335,25.614-7.335,34.636c-0.008,13.536,3.986,21.052,4.49,21.903l0.733,1.3l1.198,0.899 c0.969,0.756,26.11,19.13,90.268,29.324c26.512,4.531,57.878,7.532,92.907,7.54c34.438,0,65.316-2.923,91.552-7.319 c65.166-10.156,90.647-28.79,91.616-29.546l1.206-0.899l0.732-1.3c0.504-0.858,4.492-8.367,4.484-21.903 c0.008-9.022-1.765-20.659-7.328-34.636c-4.168-10.305-12.566-18.531-22.36-25.7c-14.749-10.684-33.162-18.925-48.021-24.677 c-8.808-3.396-16.27-5.862-20.99-7.336c0-5.87,0-15.253,0-21.36c-0.008-2.994-0.59-6.012-1.663-9.045 c-1.622-4.522-4.348-9.1-8.54-12.787c-4.152-3.688-10.006-6.343-16.719-6.312l-0.276,0.032 c8.447-10.345,17.925-24.771,22.36-45.295c1.938-0.875,3.861-1.868,5.712-3.16c4.609-3.176,8.517-7.792,11.834-14.072 c3.333-6.303,6.287-14.371,9.439-25.401c1.6-5.594,2.332-10.447,2.332-14.78c0.008-2.332-0.244-4.523-0.67-6.555 c10.282-2.758,21.044-6.209,30.853-10.511C423.363,179.866,443.013,167.434,447.914,152.582z M221.672,113.298 C247.672,106.01,256,87.282,256,87.282s8.328,18.728,34.328,26.016v33.296c0,0-14.56,22.88-34.328,26.008 c-19.768-3.128-34.328-26.008-34.328-26.008V113.298z M150.738,185.965c-1.993,1.229-3.884,3.16-5.554,5.436 c-7.627-3.396-13.354-6.5-16.294-8.58c-9.384-6.642-3.948-12.661,11.677-4.412c4.175,2.206,8.375,4.302,12.63,6.287 C152.393,185.043,151.581,185.452,150.738,185.965z M246.16,492.121c-27.742-0.473-54.561-2.773-79.758-7.066 c-47.43-7.54-71.555-19.619-79.112-24.015c-0.551-2.001-1.197-5.358-1.197-9.999c0-7.366,1.678-15.529,4.83-24.235 c46.225,9.29,99.038,14.757,155.238,15.34V492.121z M246.16,375.83c-21.525-0.496-42.184-2.482-61.361-5.902v-32.602 c0.008-1.111,0.488-2.671,1.355-4.302c0.858-1.591,1.993-2.829,3.309-3.545c0.489-0.268,1.339-0.606,2.498-0.606 c0.85,0,2.088,0.134,3.806,0.74c5.112,1.804,11.582,2.93,16.104,3.561c5.058,0.701,10.935,1.276,17.444,1.686 c6.358,0.402,12.33,0.59,16.845,0.693V375.83z M421.086,426.798c3.136,8.682,4.821,16.852,4.821,24.219 c0,4.632-0.645,7.974-1.212,10.022c-7.628,4.444-32.083,16.695-80.176,24.188c-25.102,4.207-51.504,6.437-78.679,6.893v-49.975 C322.04,441.563,374.86,436.095,421.086,426.798z M319.914,328.872c1.993,0,3.254,0.945,3.702,1.347 c1.686,1.488,2.608,3.38,3.081,4.704c0.323,0.906,0.504,1.781,0.504,2.45v32.555c-19.178,3.42-39.836,5.406-61.361,5.902v-40.285 c8.698-0.189,22.636-0.732,34.328-2.379c4.499-0.623,10.991-1.757,16.12-3.577C317.581,329.132,318.866,328.872,319.914,328.872z M355.155,217.331c-3.978,14.008-7.548,22.171-10.826,26.694c-1.638,2.292-3.136,3.718-4.806,4.884 c-1.67,1.158-3.584,2.08-6.098,2.978l-3.956,1.402l-0.725,4.136c-4.617,25.867-17.948,40.426-27.796,51.386l-1.852,2.065v2.537 l-1.671,0.26c-11.487,1.615-25.787,2.095-34.21,2.237L256,315.966l-7.218-0.056c-4.727-0.071-11.306-0.26-18.231-0.701 c-5.389-0.339-10.976-0.843-15.978-1.536l-1.67-0.26v-2.537l-1.852-2.065c-9.849-10.96-23.18-25.519-27.797-51.386l-0.732-4.136 l-3.948-1.402c-2.513-0.899-4.428-1.82-6.099-2.978c-2.474-1.741-4.704-4.12-7.319-8.99c-2.584-4.846-5.318-12.086-8.312-22.588 c-1.315-4.601-1.78-8.17-1.78-10.818c0-3.081,0.591-4.877,1.198-6.012c0.906-1.654,2.025-2.363,3.435-2.93 c1.158-0.442,2.355-0.56,2.836-0.584l7.714,0.954v-6.036c23.731,8.919,50.448,14.276,85.754,14.276 c35.306,0,62.022-5.357,85.754-14.276v5.626l7.524-0.544c0.354-0.031,2.781,0.197,4.342,1.237c0.827,0.528,1.496,1.142,2.12,2.277 c0.598,1.135,1.189,2.931,1.197,6.004C356.936,209.168,356.463,212.73,355.155,217.331z M383.11,182.821 c-2.923,2.064-8.62,5.161-16.215,8.541c-2.364-3.262-5.334-5.405-8.107-6.658c4.262-1.993,8.462-4.089,12.646-6.295 C387.057,170.16,392.493,176.179,383.11,182.821z" />
              </svg>
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight uppercase drop-shadow-[0_0_15px_rgba(0,0,0,0.5)] leading-tight">
              {station.name}
            </h2>
          </div>

          <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-2 text-[10px] md:text-xs font-bold text-slate-400 bg-slate-950/60 px-6 py-2 rounded-full border border-slate-800/60 shadow-inner backdrop-blur-md">
            <span className="flex items-center gap-2 text-orange-300">
              <Building2 size={14} className="opacity-70" />
              <span>{fs.types[station.stationType]}</span>
            </span>
            <div className="hidden md:block w-px h-3 bg-slate-800" />
            <span className="flex items-center gap-2 text-blue-300">
              <MapIcon size={14} className="opacity-70" />
              <span className="font-mono">
                {fs.coordinates}: {station.coordinates[0].toFixed(3)}, {station.coordinates[1].toFixed(3)}
              </span>
            </span>
            {station.postalCode && (
              <>
                <div className="hidden md:block w-px h-3 bg-slate-800" />
                <span className="flex items-center gap-2 text-purple-400">
                  <Globe2 size={14} className="opacity-70" />
                  <span>
                    {fs.postalCode}: {station.postalCode}
                  </span>
                </span>
              </>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="absolute right-6 top-6 md:top-1/2 md:-translate-y-1/2 w-12 h-12 flex items-center justify-center rounded-full bg-slate-900/80 text-slate-400 hover:text-white hover:bg-red-500/20 hover:border-red-500 border border-slate-800 transition-all shadow-2xl z-50 group backdrop-blur-sm"
        >
          <X size={24} className="group-hover:rotate-90 transition-transform duration-300" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:p-8 scrollbar-thin scrollbar-thumb-slate-700">
        <div className="max-w-[1200px] mx-auto space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-orange-950/40 to-slate-900 border border-slate-800 rounded-3xl p-8">
              <div className="text-orange-400 font-bold uppercase tracking-widest text-xs mb-4">
                {t.dashboard.fullData}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {statCards.map((stat) => (
                  <div
                    key={stat.label}
                    className="bg-slate-950/50 border border-slate-800/50 rounded-xl p-3 backdrop-blur-sm"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <stat.icon size={14} className={stat.color} />
                      <span className="text-[10px] uppercase font-bold text-slate-500">{stat.label}</span>
                    </div>
                    <div className="text-sm font-bold text-white break-all">{formatValue(stat.value)}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
                <h3 className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-4 flex items-center gap-2">
                  <MapPin size={14} /> {fs.address}
                </h3>
                <p className="text-white text-lg font-medium leading-relaxed">{station.address}</p>
                <p className="mt-3 text-sm text-slate-400">
                  <span className="font-bold text-slate-500 uppercase text-[10px] tracking-wider">
                    {fs.municipality}:{' '}
                  </span>
                  {station.municipality}
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
                <h3 className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-4 flex items-center gap-2">
                  <Shield size={14} /> {fs.supervisor}
                </h3>
                <p className="text-white text-lg font-bold">{station.supervisor}</p>
                {station.stationType === 'territorial' && (
                  <div className="mt-4 space-y-2 text-sm text-slate-400 border-t border-slate-800 pt-4">
                    <p>{RS_FIREFIGHTER_UNION.address}</p>
                    <p>
                      {fs.phone}: {RS_FIREFIGHTER_UNION.phone}
                    </p>
                    <p>
                      {fs.email}: {RS_FIREFIGHTER_UNION.email}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
              <span className="text-[10px] uppercase font-bold text-slate-500">{fs.stationType}</span>
              <p className="text-white font-bold mt-1">{fs.types[station.stationType]}</p>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
              <span className="text-[10px] uppercase font-bold text-slate-500">{fs.locationPrecision}</span>
              <p className="text-white font-bold mt-1">
                {fs.locationPrecisions[station.locationPrecision]}
              </p>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
              <span className="text-[10px] uppercase font-bold text-slate-500">{fs.capacitySource}</span>
              <p className="text-white font-bold mt-1">{fs.capacitySources[station.capacitySource]}</p>
            </div>
          </div>

          {station.note && (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 text-sm text-slate-400">
              {station.note}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
