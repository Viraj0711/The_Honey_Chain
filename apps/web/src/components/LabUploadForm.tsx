import { useState } from 'react';
import { api } from '../api';
import type { FarmerLabReport } from '../types';

interface FormState {
  batch_id: string;
  document_uri: string;
  moisture_content: string;
  hmf_content: string;
  reducing_sugars: string;
  sucrose_content: string;
  c3_c4_syrups: string;
  smr_tmr_status: boolean;
  diastase_activity: string;
  lab_accreditation_hash: string;
}

const emptyForm: FormState = {
  batch_id: '',
  document_uri: '',
  moisture_content: '',
  hmf_content: '',
  reducing_sugars: '',
  sucrose_content: '',
  c3_c4_syrups: '',
  smr_tmr_status: true,
  diastase_activity: '',
  lab_accreditation_hash: '',
};

const num = (v: string): number | null => (v.trim() === '' || Number.isNaN(Number(v)) ? null : Number(v));

export default function LabUploadForm({ onUploaded }: { onUploaded: (report: FarmerLabReport) => void }) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const set = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const params = {
      moisture_content: num(form.moisture_content),
      hmf_content: num(form.hmf_content),
      reducing_sugars: num(form.reducing_sugars),
      sucrose_content: num(form.sucrose_content),
      c3_c4_syrups: num(form.c3_c4_syrups),
      smr_tmr_status: form.smr_tmr_status,
      diastase_activity: num(form.diastase_activity),
    };

    const missing = Object.entries(params).filter(([, v]) => v === null);
    if (!form.batch_id.trim() || !form.document_uri.trim() || missing.length > 0) {
      setError('batch id, document uri and all lab parameters are required');
      return;
    }

    setBusy(true);
    try {
      const report = await api.post<FarmerLabReport>('/lab-reports', {
        batch_id: form.batch_id.trim(),
        document_uri: form.document_uri.trim(),
        lab_parameters: params,
        lab_accreditation_hash: form.lab_accreditation_hash.trim() || 'pending',
      });
      setForm(emptyForm);
      onUploaded(report);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'upload failed');
    }
    setBusy(false);
  };

  return (
    <form className="card upload-form" onSubmit={submit}>
      <h2>Upload Lab Report</h2>
      <div className="form-grid">
        <label>
          Batch ID
          <input value={form.batch_id} onChange={set('batch_id')} placeholder="HC-2026-8892" required />
        </label>
        <label>
          Document URI
          <input value={form.document_uri} onChange={set('document_uri')} placeholder="storage://lab-reports/report.pdf" required />
        </label>
        <label>
          Moisture % (max 20)
          <input type="number" step="0.1" min="0" max="100" value={form.moisture_content} onChange={set('moisture_content')} required />
        </label>
        <label>
          HMF mg/kg (max 40)
          <input type="number" step="0.1" min="0" value={form.hmf_content} onChange={set('hmf_content')} required />
        </label>
        <label>
          Reducing sugars % (min 65)
          <input type="number" step="0.1" min="0" max="100" value={form.reducing_sugars} onChange={set('reducing_sugars')} required />
        </label>
        <label>
          Sucrose % (max 5)
          <input type="number" step="0.1" min="0" max="100" value={form.sucrose_content} onChange={set('sucrose_content')} required />
        </label>
        <label>
          C3/C4 syrups % (max 7)
          <input type="number" step="0.1" min="0" max="100" value={form.c3_c4_syrups} onChange={set('c3_c4_syrups')} required />
        </label>
        <label>
          Diastase Schade (min 8)
          <input type="number" step="0.1" min="0" value={form.diastase_activity} onChange={set('diastase_activity')} required />
        </label>
        <label>
          SMR/TMR markers
          <select value={form.smr_tmr_status ? 'negative' : 'positive'} onChange={(e) => setForm((prev) => ({ ...prev, smr_tmr_status: e.target.value === 'negative' }))}>
            <option value="negative">Negative (pass)</option>
            <option value="positive">Positive (rice syrup)</option>
          </select>
        </label>
        <label>
          Accreditation hash
          <input value={form.lab_accreditation_hash} onChange={set('lab_accreditation_hash')} placeholder="optional" />
        </label>
      </div>
      {error && <p className="error-text">{error}</p>}
      <button type="submit" className="action-btn" disabled={busy}>
        {busy ? 'Uploading...' : 'Submit Lab Report'}
      </button>
    </form>
  );
}
