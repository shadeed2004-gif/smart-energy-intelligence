import { useState, useEffect } from 'react';
import api from '../../services/api';
import { PageHeader, PriorityBadge, EmptyState, ErrorState } from '../../components/ui/index';
import type { Recommendation } from '../../types';

export function RecommendationsPage() {
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('active');

  const fetch = async () => {
    try {
      const res = await api.get<Recommendation[]>(`/recommendations?status=${filter}`);
      setRecs(res.data);
    } catch { setError('Failed to load recommendations.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, [filter]);

  const dismiss = async (id: number) => {
    await api.patch(`/recommendations/${id}/dismiss`);
    fetch();
  };
  const apply = async (id: number) => {
    await api.patch(`/recommendations/${id}/apply`);
    fetch();
  };

  const sym = '₹';

  return (
    <div className="flex flex-col gap-xl">
      <PageHeader
        title="Recommendations"
        subtitle="Evidence-based suggestions calculated from your actual energy usage patterns."
        actions={
          <div className="flex gap-xs">
            {['active','applied','dismissed'].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-sm py-xs rounded-lg text-label-md font-medium capitalize transition-colors ${
                  filter === f ? 'bg-primary-container text-on-primary' : 'btn-ghost'
                }`}
              >{f}</button>
            ))}
          </div>
        }
      />

      {error && <ErrorState message={error} onRetry={fetch} />}

      {!loading && recs.length === 0 ? (
        <EmptyState icon="lightbulb" title="No recommendations"
          description="Recommendations are generated from your energy data. More data means better suggestions."
        />
      ) : (
        <div className="flex flex-col gap-md">
          {recs.map(rec => (
            <div key={rec.id} className="card p-lg">
              <div className="flex items-start justify-between gap-md">
                <div className="flex items-start gap-sm flex-1">
                  <div className="w-10 h-10 rounded-lg bg-surface-container-low flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[20px] text-primary">lightbulb</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-xs flex-wrap mb-xs">
                      <h3 className="text-label-lg text-on-surface font-semibold">{rec.title}</h3>
                      <PriorityBadge priority={rec.priority} />
                      {rec.is_demo && <span className="demo-badge">Demo</span>}
                    </div>
                    <p className="text-body-md text-on-surface-variant mb-sm">{rec.description}</p>

                    {rec.evidence && (
                      <div className="bg-surface-container rounded-lg p-sm mb-sm">
                        <div className="text-label-sm text-secondary mb-2xs font-semibold">EVIDENCE</div>
                        <p className="text-body-md text-on-surface-variant">{rec.evidence}</p>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-md text-label-sm text-secondary">
                      {rec.estimated_saving_inr_month != null && (
                        <span className="text-status-green-text font-semibold">
                          Potential saving: ~{sym}{rec.estimated_saving_inr_month.toFixed(0)}/month
                          {rec.saving_confidence && ` (${rec.saving_confidence} confidence)`}
                        </span>
                      )}
                      {!rec.estimated_saving_inr_month && (
                        <span className="text-secondary">Savings not quantified — insufficient measurement data</span>
                      )}
                    </div>

                    {rec.suggested_action && (
                      <div className="mt-sm text-label-md text-on-surface">
                        <span className="font-semibold">Suggested action: </span>{rec.suggested_action}
                      </div>
                    )}
                  </div>
                </div>
                {rec.status === 'active' && (
                  <div className="flex flex-col gap-xs shrink-0">
                    <button onClick={() => apply(rec.id)} className="btn-primary py-2xs text-label-sm">Apply</button>
                    <button onClick={() => dismiss(rec.id)} className="btn-ghost text-label-sm py-2xs">Dismiss</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
