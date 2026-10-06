import React, { useId, useRef, useState } from 'react';
import { UploadCloud, X } from 'lucide-react';
import { inspectAwsFile, uploadAwsFile, type AwsUploadPreview } from '../services/awsUploadService';

export function AwsUploadPanel({ onClose }: { onClose: () => void }) {
  const input = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<AwsUploadPreview | null>(null);
  const [error, setError] = useState('');
  const [result, setResult] = useState('');
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);

  async function selectFile(candidate?: File) {
    setFile(null); setPreview(null); setError(''); setResult('');
    if (!candidate) return;
    try { setPreview(await inspectAwsFile(candidate)); setFile(candidate); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to inspect file.'); }
  }

  async function submit() {
    if (!file || !preview || busy) return;
    setBusy(true); setError('');
    try {
      const response = await uploadAwsFile(file);
      setResult(`Archived ${file.name} as file #${response.history_id}. The map now reads this upload.`);
      setFile(null); setPreview(null);
      if (input.current) input.current.value = '';
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'AWS upload failed.'); }
    finally { setBusy(false); }
  }

  return <div className="fixed inset-0 z-[6000] hidden md:flex items-center justify-center bg-slate-950/75 p-6" role="dialog" aria-modal="true" aria-label="Upload AWS data">
    <section className="w-full max-w-lg rounded-xl border border-slate-700 bg-slate-900 p-6 text-slate-100 shadow-2xl">
      <div className="mb-5 flex items-center justify-between"><h2 className="text-xl font-bold">Upload AWS data</h2><button type="button" onClick={onClose} aria-label="Close AWS upload"><X /></button></div>
      <p className="mb-4 text-sm text-slate-400">Upload station JSON, CSV or DAT. Each file is kept in AWS history; the map reads the newest upload.</p>
      <label htmlFor={inputId} tabIndex={0} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); input.current?.click(); } }} onDragEnter={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={(event) => { event.preventDefault(); setDragging(false); }} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); setDragging(false); void selectFile(event.dataTransfer.files[0]); }} className={`block cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-400 ${dragging ? 'border-blue-400 bg-blue-500/10' : 'border-slate-600 hover:border-blue-400 hover:bg-slate-800/50'}`}>
        <UploadCloud className="mx-auto mb-2 text-blue-400" size={32} />
        <p className="text-sm">Drop a JSON, CSV or DAT file here, or click to browse</p>
        <input id={inputId} ref={input} type="file" accept=".json,.csv,.dat,application/json,text/csv" className="sr-only" aria-label="AWS JSON, CSV or DAT file" onChange={(event) => void selectFile(event.target.files?.[0])} />
      </label>
      <p className="mt-3 text-xs text-slate-400">For FHMZ CSV, the station column identifies each station. For date/time sensor CSV and DAT, the filename identifies the station. Your account is recorded as the uploader; units remain unclassified.</p>
      {preview && <div className="mt-4 text-sm"><p className="font-semibold">{file?.name} · {preview.total} entries</p><p className="text-slate-400">{preview.groups.map((group) => `${group.name}: ${group.count}`).join(' · ')}</p></div>}
      {error && <p role="alert" className="mt-4 text-sm text-red-300">{error}</p>}
      {result && <p role="status" className="mt-4 text-sm text-green-300">{result}</p>}
      <button type="button" disabled={!preview || busy} onClick={() => void submit()} className="mt-6 w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">{busy ? 'Uploading…' : 'Archive and display latest'}</button>
    </section>
  </div>;
}
