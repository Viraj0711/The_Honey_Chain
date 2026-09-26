import { useEffect, useState } from 'react';
import { api } from '../api';
import type { PassportPayload } from '../types';
import { LabReportCard } from '../components/ReportCards';

const VerdictBanner = ({ verdict, score }: { verdict: string; score: number }) => (
  <div className="card">
    <div className="kv"><span>Purity verdict</span><span className={`pill ${verdict}`}>{verdict}</span></div>
    <div className="kv"><span>AI consistency match</span><span>{(score * 100).toFixed(1)}%</span></div>
  </div>
);

export default function PassportPage({ batchId }: { batchId: string }) {
  const [data, setData] = useState<PassportPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<PassportPayload>(`/passport/${batchId}`)
      .then(setData)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'failed to load'));
  }, [batchId]);

  if (error) {
    return (
      <div className="login-wrap">
        <div className="card login-card">
          <h1>Honey Passport</h1>
          <p className="error-text">{error}</p>
          <a href="/">Go to login</a>
        </div>
      </div>
    );
  }

  if (!data) return <div className="container"><p className="muted">Loading passport...</p></div>;

  const final = data.final_verified_report;
  const hw = data.hardware_batch_report;

  return (
    <div className="container">
      <div className="card">
        <h1>Honey Passport</h1>
        <div className="kv"><span>Batch ID</span><span className="code-text">{final.batch_id}</span></div>
        {final.blockchain_tx_hash && (
          <div className="kv"><span>Blockchain anchor</span><span className="code-text">{final.blockchain_tx_hash}</span></div>
        )}
      </div>
      <VerdictBanner verdict={final.ai_comparison_metrics.purity_verdict} score={final.ai_comparison_metrics.data_consistency_score} />
      {final.ai_comparison_metrics.detected_discrepancies.length > 0 && (
        <div className="card">
          <h2>Detected Discrepancies</h2>
          <ul className="discrepancy-list">
            {final.ai_comparison_metrics.detected_discrepancies.map((d) => <li key={d}>{d}</li>)}
          </ul>
        </div>
      )}
      {hw && (
        <div className="card">
          <h2>Hardware Telemetry (TinyML)</h2>
          <div className="kv"><span>Acoustic state</span><span className={`pill ${hw.tinyml_predictions.acoustic_state}`}>{hw.tinyml_predictions.acoustic_state}</span></div>
          <div className="kv"><span>Varroa infestation</span><span>{hw.tinyml_predictions.varroa_infestation_rate.toFixed(1)}%</span></div>
          <div className="kv"><span>Brood climate score</span><span>{(hw.tinyml_predictions.brood_climate_score * 100).toFixed(0)} / 100</span></div>
          <div className="kv"><span>Orientation</span><span className={`pill ${hw.tinyml_predictions.orientation_status}`}>{hw.tinyml_predictions.orientation_status}</span></div>
          <p className="muted">Recorded {new Date(hw.timestamp).toLocaleString()} by {hw.device_id}</p>
        </div>
      )}
      {data.farmer_lab_report && <LabReportCard report={data.farmer_lab_report} />}
      <div className="card">
        <h2>AI Summary</h2>
        <p>{final.summary_insights}</p>
        <p className="muted">Synthesized {new Date(final.synthesis_timestamp).toLocaleString()}</p>
      </div>
    </div>
  );
}
