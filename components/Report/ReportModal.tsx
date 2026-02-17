import React, { useState } from 'react';
import { X, Send, MapPin, Loader2, AlertCircle, Wind } from 'lucide-react';
import { IncidentType, Language } from '../../types';
import { TRANSLATIONS } from '../../constants';
import { analyzeIncidentUrgency } from '../../services/geminiService';

interface ReportModalProps {
  language: Language;
  location: { lat: number; lng: number } | null;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({ language, location, onClose, onSubmit }) => {
  const t = TRANSLATIONS[language];
  const [type, setType] = useState<IncidentType>(IncidentType.FIRE);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!location) return;

    setIsSubmitting(true);
    // Use AI to analyze the report for urgency and environmental context
    const aiResult = await analyzeIncidentUrgency(description, type);
    
    // Simulate tactical delay for pro feel
    setTimeout(() => {
      onSubmit({
        type,
        description,
        lat: location.lat,
        lng: location.lng,
        urgency: aiResult.urgency as any,
        windDirection: Math.random() * 360, // Simulate real extraction
        windSpeed: Math.floor(Math.random() * 40)
      });
      setIsSubmitting(false);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 w-full max-w-md rounded-2xl border border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center text-white">
          <h2 className="font-bold text-lg flex items-center gap-2">
            <AlertCircle className="text-red-500" />
            {t.reportIncident}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded-lg text-slate-400">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setType(IncidentType.FIRE)}
              className={`flex-1 py-3 rounded-xl font-bold flex flex-col items-center gap-1 border-2 transition-all ${
                type === IncidentType.FIRE ? 'border-red-600 bg-red-600/10 text-red-500' : 'border-slate-800 text-slate-500 hover:border-slate-700'
              }`}
            >
              <span className="text-xl">🔥</span>
              {t.fireAlert}
            </button>
            <button
              type="button"
              onClick={() => setType(IncidentType.FLOOD)}
              className={`flex-1 py-3 rounded-xl font-bold flex flex-col items-center gap-1 border-2 transition-all ${
                type === IncidentType.FLOOD ? 'border-blue-600 bg-blue-600/10 text-blue-500' : 'border-slate-800 text-slate-500 hover:border-slate-700'
              }`}
            >
              <span className="text-xl">🌊</span>
              {t.floodAlert}
            </button>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t.description}</label>
            <textarea
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detail what you see (e.g. 'Strong wind spreading smoke north')..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[100px] resize-none"
            />
          </div>

          <div className="bg-slate-800/50 p-3 rounded-xl flex items-center gap-3 border border-slate-800">
            <MapPin className="text-emerald-500" size={18} />
            <div className="text-xs">
              <p className="text-slate-500 font-bold uppercase tracking-tighter">{t.location}</p>
              <p className="text-slate-300 font-mono">
                {location ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : 'Select location'}
              </p>
            </div>
          </div>

          <button
            disabled={isSubmitting || !location}
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                Extracting Environmental Data...
              </>
            ) : (
              <>
                <Send size={18} />
                {t.submit}
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};