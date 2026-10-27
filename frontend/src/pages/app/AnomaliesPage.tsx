import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import api from '../../services/api';
import { PageHeader, SeverityBadge, EmptyState, ErrorState } from '../../components/ui/index';
import type { AnomalyEvent, AnomalyStatus } from '../../types';

type StatusFilter = AnomalyStatus | 'all';

export function AnomaliesPage() {
  const [anomalies, setAnomalies] = useState<AnomalyEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [severityFilter, setSeverityFilter] = useState('all');

  const fetchAnomalies = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (severityFilter !== 'all') params.append('severity', severityFilter);
      const res = await api.get<AnomalyEvent[]>(`/anomalies?${params}`);
      setAnomalies(res.data);
    } catch { setError('Failed to load anomalies.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAnomalies(); }, [statusFilter, severityFilter]);

  const handleAcknowledge = async (id: number) => {
    await api.patch(`/anomalies/${id}/acknowledge`);
    fetchAnomalies();
  };
  const handleResolve = async (id: number) => {
    await api.patch(`/anomalies/${id}/resolve`);
    fetchAnomalies();
  };

  const openCount = anomalies.filter(a => a.status === 'open').length;

  return (
    <div className="flex flex-col gap-xl">
      <PageHeader
        title="Anomaly Center"
        subtitle="Unusual consumption patterns detected by statistical analysis of historical baselines."
        actions={
          <div className="flex gap-xs flex-wrap">
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as StatusFilter)}
              className="input-field py-xs w-auto">
              <option value="all">All Status</option>
              <option value="open">Open</option>
              <option value="acknowledged">Acknowledged</option>
              <option value="resolved">Resolved</option>
            </select>
            <select value={severityFilter} onChange={e => setSeverityFilter(e.target.value)}
              className="input-field py-xs w-auto">
              <option value="all">All Severity</option>
              <option value="critical">Critical</option>
              <option value="warning">Warning</option>
              <option value="info">Info</option>
            </select>
          </div>
        }
      />

      {/* Summary Chips */}
      <div className="flex gap-md">
        {[
          { label: 'Open', count: anomalies.filter(a => a.status === 'open').length, color: 'text-status-red-text' },
          { label: 'Acknowledged', count: anomalies.filter(a => a.status === 'acknowledged').length, color: 'text-status-amber-text' },
          { label: 'Resolved', count: anomalies.filter(a => a.status === 'resolved').length, color: 'text-status-green-text' },
        ].map(s => (
          <div key={s.label} className="card p-md flex flex-col">
            <span className="text-label-sm text-secondary">{s.label}</span>
            <span className={`metric-num text-headline-md ${s.color}`}>{s.count}</span>
          </div>
        ))}
      </div>

      {error && <ErrorState message={error} onRetry={fetchAnomalies} />}

      {anomalies.length === 0 && !loading ? (
        <EmptyState icon="check_circle" title="No anomalies found"
          description="All consumption patterns are within normal ranges for the selected filters."
        />
      ) : (
        <div className="flex flex-col gap-sm">
          {anomalies.map(anomaly => (
            <div key={anomaly.id} className="card p-lg">
              <div className="flex items-start justify-between gap-md">
                <div className="flex items-start gap-sm flex-1">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                    anomaly.severity === 'critical' ? 'bg-status-red-bg' :
                    anomaly.severity === 'warning' ? 'bg-status-amber-bg' : 'bg-surface-container'
                  }`}>
                    <span className={`material-symbols-outlined text-[20px] ${
                      anomaly.severity === 'critical' ? 'text-status-red-text' :
                      anomaly.severity === 'warning' ? 'text-status-amber-text' : 'text-secondary'
                    }`}>warning</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-xs flex-wrap mb-xs">
                      <h3 className="text-label-lg text-on-surface font-semibold">{anomaly.title}</h3>
                      <SeverityBadge severity={anomaly.severity} />
                      <span className="chip-neutral capitalize">{anomaly.status}</span>
                      {anomaly.is_demo && <span className="demo-badge">Demo</span>}
                    </div>
                    <p className="text-body-md text-on-surface-variant mb-sm">{anomaly.explanation}</p>
                    <div className="flex flex-wrap gap-md text-label-sm text-secondary">
                      <span>Detected: {format(parseISO(anomaly.detected_at), 'MMM d, HH:mm')}</span>
                      {anomaly.entity_id && <span>Entity: {anomaly.entity_id}</span>}
                      {anomaly.observed_value != null && anomaly.baseline_value != null && (
                        <span>
                          Observed: {anomaly.observed_value.toFixed(2)} vs Baseline: {anomaly.baseline_value.toFixed(2)}
                          {anomaly.deviation_pct != null && ` (+${anomaly.deviation_pct.toFixed(1)}%)`}
                        </span>
                      )}
                      {anomaly.detection_method && <span>Method: {anomaly.detection_method}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-xs shrink-0">
                  <Link to={`/app/anomalies/${anomaly.id}`} className="btn-secondary py-2xs text-label-sm">Details</Link>
                  {anomaly.status === 'open' && (
                    <button onClick={() => handleAcknowledge(anomaly.id)} className="btn-ghost text-label-sm py-2xs">
                      Acknowledge
                    </button>
                  )}
                  {anomaly.status === 'acknowledged' && (
                    <button onClick={() => handleResolve(anomaly.id)} className="btn-primary py-2xs text-label-sm">
                      Resolve
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
