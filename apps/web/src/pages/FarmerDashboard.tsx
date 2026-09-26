import { useEffect, useState } from 'react';
import { api, getName, clearSession } from '../api';
import type { HardwareBatchReport, FarmerLabReport } from '../types';
import HardwareReportCard from '../components/ReportCards';
import LabUploadForm from '../components/LabUploadForm';

export default function FarmerDashboard() {
  const [reports, setReports] = useState<HardwareBatchReport[]>([]);
  const [labReports, setLabReports] = useState<FarmerLabReport[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api.get<HardwareBatchReport[]>('/hardware-reports'),
      api.get<FarmerLabReport[]>('/lab-reports'),
    ])
      .then(([h, l]) => {
        setReports(h);
        setLabReports(l);
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'failed to load'));
  }, []);

  const latest = reports[0];

  return (
    <>
      <div className="topbar">
        <strong>Honey Chain - Farmer</strong>
        <span>
          {getName()}
          <button onClick={() => { clearSession(); window.location.href = '/'; }}>Logout</button>
        </span>
      </div>
      <div className="container">
        {error && <p className="error-text">{error}</p>}
        {!error && reports.length === 0 && <div className="card"><p className="muted">No hive data yet.</p></div>}
        {latest && <HardwareReportCard report={latest} />}
        {reports.length > 0 && (
          <div className="card">
            <h2>Hive Sensor History</h2>
            <table>
              <thead>
                <tr>
                  <th>Batch</th>
                  <th>Acoustic state</th>
                  <th>Varroa</th>
                  <th>Climate score</th>
                  <th>Orientation</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((r) => (
                  <tr key={r.report_id}>
                    <td>{r.batch_id}</td>
                    <td><span className={`pill ${r.tinyml_predictions.acoustic_state}`}>{r.tinyml_predictions.acoustic_state}</span></td>
                    <td>{r.tinyml_predictions.varroa_infestation_rate.toFixed(1)}%</td>
                    <td>{(r.tinyml_predictions.brood_climate_score * 100).toFixed(0)}</td>
                    <td><span className={`pill ${r.tinyml_predictions.orientation_status}`}>{r.tinyml_predictions.orientation_status}</span></td>
                    <td>{new Date(r.timestamp).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <LabUploadForm onUploaded={(report) => setLabReports((prev) => [report, ...prev])} />
        {labReports.length > 0 && (
          <div className="card">
            <h2>My Lab Reports</h2>
            <table>
              <thead>
                <tr>
                  <th>Batch</th>
                  <th>Moisture</th>
                  <th>HMF</th>
                  <th>C3/C4</th>
                  <th>SMR/TMR</th>
                  <th>Uploaded</th>
                </tr>
              </thead>
              <tbody>
                {labReports.map((l) => (
                  <tr key={l.lab_report_id}>
                    <td>{l.batch_id}</td>
                    <td>{l.lab_parameters.moisture_content.toFixed(1)}%</td>
                    <td>{l.lab_parameters.hmf_content.toFixed(1)}</td>
                    <td>{l.lab_parameters.c3_c4_syrups.toFixed(1)}%</td>
                    <td>{l.lab_parameters.smr_tmr_status ? 'Negative' : 'Positive'}</td>
                    <td>{new Date(l.upload_timestamp).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
