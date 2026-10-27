import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import api from '../../services/api';
import { SeverityBadge, ErrorState } from '../../components/ui/index';
import type { AnomalyEvent } from '../../types';

export function AnomalyDetailPage() {
  const { id } = useParams();
  const [anomaly, setAnomaly] = useState<AnomalyEvent | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<AnomalyEvent>(`/anomalies/${id}`).then(r => setAnomaly(r.data)).catch(() => setError('Anomaly not found.'));
  }, [id]);

  if (error) return <ErrorState message={error} />;
  if (!anomaly) return <div className="animate-pulse h-64 bg-surface-container rounded-lg" />;

  return (
    <div className="flex flex-col gap-xl max-w-3xl">
      <div className="flex items-center gap-xs">
        <Link to="/app/anomalies" className="text-secondary hover:text-on-surface">
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
        <h1 className="text-headline-lg text-primary font-semibold">Anomaly Detail</h1>
      </div>

      <div className="card p-lg flex flex-col gap-md">
        <div className="flex items-center gap-xs flex-wrap">
          <SeverityBadge severity={anomaly.severity} />
          <span className="chip-neutral capitalize">{anomaly.status}</span>
          {anomaly.is_demo && <span className="demo-badge">Demo Data</span>}
        </div>
        <h2 className="text-headline-sm text-on-surface font-semibold">{anomaly.title}</h2>
        <p className="text-body-lg text-on-surface-variant">{anomaly.explanation}</p>

        <div className="grid grid-cols-2 gap-sm bg-surface-container rounded-lg p-md">
          {[
            ['Detected At', format(parseISO(anomaly.detected_at), 'MMM d, yyyy HH:mm')],
            ['Entity', anomaly.entity_id || '—'],
            ['Observed Value', anomaly.observed_value != null ? anomaly.observed_value.toFixed(2) : '—'],
            ['Baseline Value', anomaly.baseline_value != null ? anomaly.baseline_value.toFixed(2) : '—'],
            ['Deviation', anomaly.deviation_pct != null ? `+${anomaly.deviation_pct.toFixed(1)}%` : '—'],
            ['Detection Method', anomaly.detection_method || '—'],
          ].map(([label, value]) => (
            <div key={label}>
              <div className="text-label-sm text-secondary">{label}</div>
              <div className="text-label-lg text-on-surface font-medium">{value}</div>
            </div>
          ))}
        </div>

        {anomaly.acknowledged_at && (
          <div className="flex items-center gap-xs text-label-sm text-status-amber-text bg-status-amber-bg rounded-lg px-sm py-xs">
            <span className="material-symbols-outlined text-[16px]">check_circle</span>
            Acknowledged at {format(parseISO(anomaly.acknowledged_at), 'MMM d, HH:mm')}
          </div>
        )}
        {anomaly.resolved_at && (
          <div className="flex items-center gap-xs text-label-sm text-status-green-text bg-status-green-bg rounded-lg px-sm py-xs">
            <span className="material-symbols-outlined text-[16px]">check_circle</span>
            Resolved at {format(parseISO(anomaly.resolved_at), 'MMM d, HH:mm')}
          </div>
        )}
      </div>
    </div>
  );
}
