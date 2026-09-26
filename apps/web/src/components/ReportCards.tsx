import { HardwareBatchReport, FarmerLabReport } from '../types';

const pct = (v: number) => `${v.toFixed(1)}%`;

export default function HardwareReportCard({ report }: { report: HardwareBatchReport }) {
  const p = report.tinyml_predictions;
  return (
    <div className="card">
      <h2>TinyML Predictions</h2>
      <div className="grid-2">
        <div>
          <div className="kv"><span>Acoustic state</span><span className={`pill ${p.acoustic_state}`}>{p.acoustic_state}</span></div>
          <div className="kv"><span>Varroa infestation</span><span>{pct(p.varroa_infestation_rate)}</span></div>
          <div className="kv"><span>Brood climate score</span><span>{(p.brood_climate_score * 100).toFixed(0)} / 100</span></div>
          <div className="kv"><span>Orientation</span><span className={`pill ${p.orientation_status}`}>{p.orientation_status}</span></div>
        </div>
        <div>
          <div className="kv"><span>Batch</span><span>{report.batch_id}</span></div>
          <div className="kv"><span>Device</span><span>{report.device_id}</span></div>
          <div className="kv"><span>Timestamp</span><span>{new Date(report.timestamp).toLocaleString()}</span></div>
          <div className="kv"><span>Confidence</span><span>{(report.tinyml_confidence * 100).toFixed(0)}%</span></div>
        </div>
      </div>
    </div>
  );
}

export function LabReportCard({ report }: { report: FarmerLabReport }) {
  const p = report.lab_parameters;
  const rows: Array<[string, string]> = [
    ['Moisture', `${p.moisture_content.toFixed(1)}% (max 20.0%)`],
    ['HMF', `${p.hmf_content.toFixed(1)} mg/kg (max 40.0)`],
    ['Reducing sugars', `${p.reducing_sugars.toFixed(1)}% (min 65.0%)`],
    ['Sucrose', `${p.sucrose_content.toFixed(1)}% (max 5.0%)`],
    ['C3/C4 syrups', `${p.c3_c4_syrups.toFixed(1)}% (max 7.0%)`],
    ['SMR/TMR markers', p.smr_tmr_status ? 'Negative' : 'Positive'],
    ['Diastase', `${p.diastase_activity.toFixed(1)} Schade (min 8.0)`],
  ];
  return (
    <div className="card">
      <h2>Lab Report</h2>
      <div className="kv"><span>Batch</span><span>{report.batch_id}</span></div>
      <div className="kv"><span>Document</span><span className="code-text">{report.document_uri}</span></div>
      {rows.map(([k, v]) => (
        <div className="kv" key={k}><span>{k}</span><span>{v}</span></div>
      ))}
      <p className="muted">Uploaded {new Date(report.upload_timestamp).toLocaleString()}</p>
    </div>
  );
}
