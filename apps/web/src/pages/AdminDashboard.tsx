import { useEffect, useState } from 'react';
import { api, getName, clearSession } from '../api';
import type { HardwareBatchReport, FarmerLabReport, FinalVerifiedReport } from '../types';
import { LabReportCard } from '../components/ReportCards';

export default function AdminDashboard() {
  const [hardware, setHardware] = useState<HardwareBatchReport[]>([]);
  const [labs, setLabs] = useState<FarmerLabReport[]>([]);
  const [finals, setFinals] = useState<FinalVerifiedReport[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busyBatch, setBusyBatch] = useState<string | null>(null);
  const [qrCodes, setQrCodes] = useState<Record<string, string>>({});

  useEffect(() => {
    Promise.all([
      api.get<HardwareBatchReport[]>('/hardware-reports'),
      api.get<FarmerLabReport[]>('/lab-reports'),
      api.get<FinalVerifiedReport[]>('/final-reports'),
    ])
      .then(([h, l, f]) => {
        setHardware(h);
        setLabs(l);
        setFinals(f);
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'failed to load'));
  }, []);

  const pendingBatches = labs
    .filter((l) => !finals.some((f) => f.batch_id === l.batch_id))
    .map((l) => l.batch_id);

  const reconcile = async (batchId: string) => {
    setBusyBatch(batchId);
    setError(null);
    try {
      await api.post(`/reconcile/${batchId}`, {});
      const finalsFresh = await api.get<FinalVerifiedReport[]>('/final-reports');
      setFinals(finalsFresh);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'reconciliation failed');
    }
    setBusyBatch(null);
  };

  const loadQr = async (batchId: string) => {
    try {
      const { qr_code_uri } = await api.get<{ qr_code_uri: string }>(`/qr/${batchId}`);
      setQrCodes((prev) => ({ ...prev, [batchId]: qr_code_uri }));
    } catch {
      setQrCodes((prev) => ({ ...prev, [batchId]: '' }));
    }
  };

  const scanQr = async (batchId: string) => {
    const { dag_check_status, anomalies } = await api.post<{ dag_check_status: string; anomalies: string[] }>(
      `/dag/${batchId}/evaluate`,
      {},
    );
    const verdict = finals.find((f) => f.batch_id === batchId)?.ai_comparison_metrics.purity_verdict;
    if (dag_check_status === 'CLEAN' && (verdict === 'PASSED' || verdict === 'PARTIAL_PASSED')) {
      await loadQr(batchId);
    } else {
      setError(`QR blocked for ${batchId}: dag ${dag_check_status}${anomalies.length ? ` (${anomalies.join('; ')})` : ''}, verdict ${verdict ?? 'missing'}`);
    }
  };

  return (
    <>
      <div className="topbar">
        <strong>Honey Chain - Admin</strong>
        <span>
          {getName()}
          <button onClick={() => { clearSession(); window.location.href = '/'; }}>Logout</button>
        </span>
      </div>
      <div className="container">
        {error && <p className="error-text">{error}</p>}
        {pendingBatches.length > 0 && (
          <div className="card">
            <h2>Batches Ready for Reconciliation</h2>
            {pendingBatches.map((b) => (
              <p key={b}>
                {b} <button className="action-btn" onClick={() => reconcile(b)} disabled={busyBatch === b}>
                  {busyBatch === b ? 'Synthesizing...' : 'Run AI Reconciliation'}
                </button>
              </p>
            ))}
          </div>
        )}
        {finals.length > 0 && (
          <div className="card">
            <h2>Final Verified Reports</h2>
            <table>
              <thead>
                <tr><th>Batch</th><th>Verdict</th><th>Consistency</th><th>DAG</th><th>QR</th></tr>
              </thead>
              <tbody>
                {finals.map((f) => {
                  const verdict = f.ai_comparison_metrics.purity_verdict;
                  const qrEligible = verdict === 'PASSED' || verdict === 'PARTIAL_PASSED';
                  return (
                    <tr key={f.final_report_id}>
                      <td>{f.batch_id}</td>
                      <td><span className={`pill ${verdict}`}>{verdict}</span></td>
                      <td>{(f.ai_comparison_metrics.data_consistency_score * 100).toFixed(1)}%</td>
                      <td>
                        <button className="action-btn" onClick={() => scanQr(f.batch_id)}>
                          Check + Issue QR
                        </button>
                      </td>
                      <td>
                        {qrCodes[f.batch_id] ? (
                          <img src={qrCodes[f.batch_id]} alt={`QR for ${f.batch_id}`} width={96} height={96} />
                        ) : qrEligible ? (
                          <span className="muted">not issued</span>
                        ) : (
                          <span className="muted">blocked</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <details className="card">
          <summary><h2 style={{ display: 'inline' }}>Lab Reports</h2></summary>
          {labs.length === 0 && <p className="muted">No lab reports uploaded.</p>}
          {labs.map((l) => <LabReportCard key={l.lab_report_id} report={l} />)}
        </details>
        <details className="card">
          <summary><h2 style={{ display: 'inline' }}>Hardware Reports</h2></summary>
          {hardware.length === 0 && <p className="muted">No hardware reports yet.</p>}
          <table>
            <thead>
              <tr><th>Batch</th><th>Device</th><th>Acoustic</th><th>Varroa</th><th>Confidence</th><th>Time</th></tr>
            </thead>
            <tbody>
              {hardware.map((h) => (
                <tr key={h.report_id}>
                  <td>{h.batch_id}</td>
                  <td>{h.device_id}</td>
                  <td><span className={`pill ${h.tinyml_predictions.acoustic_state}`}>{h.tinyml_predictions.acoustic_state}</span></td>
                  <td>{h.tinyml_predictions.varroa_infestation_rate.toFixed(1)}%</td>
                  <td>{(h.tinyml_confidence * 100).toFixed(0)}%</td>
                  <td>{new Date(h.timestamp).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      </div>
    </>
  );
}
