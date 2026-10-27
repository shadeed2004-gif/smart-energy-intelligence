import { useState, useEffect } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine
} from 'recharts';
import { format, parseISO, addHours } from 'date-fns';
import api from '../../services/api';
import { PageHeader, EmptyState, ErrorState, Skeleton } from '../../components/ui/index';
import type { Forecast } from '../../types';

export function AIInsightsPage() {
  const [forecast, setForecast] = useState<Forecast | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchForecast = async () => {
    try {
      const res = await api.get<Forecast>('/ai/forecast?horizon_hours=24');
      setForecast(res.data);
    } catch { setError('Failed to load forecast data.'); }
    finally { setLoading(false); }
  };

  const generateForecast = async () => {
    setGenerating(true);
    try {
      await api.post('/ai/forecast/generate', { horizon_hours: 24 });
      await fetchForecast();
    } catch { setError('Forecast generation failed. Insufficient historical data may be the cause.'); }
    finally { setGenerating(false); }
  };

  useEffect(() => { fetchForecast(); }, []);

  const now = new Date();
  const chartData = forecast?.predictions.map(p => ({
    time: format(parseISO(p.timestamp), 'HH:mm'),
    predicted: p.predicted_kwh,
    lower: p.lower_bound,
    upper: p.upper_bound,
    isPast: parseISO(p.timestamp) < now,
  })) || [];

  return (
    <div className="flex flex-col gap-xl">
      <PageHeader
        title="AI Predictions & Insights"
        subtitle="Evidence-based energy forecasting using historical consumption patterns."
        badge="ML Forecasting"
        isDemo={forecast?.is_demo}
        actions={
          <button onClick={generateForecast} disabled={generating} className="btn-primary">
            <span className={`material-symbols-outlined text-[18px] ${generating ? 'animate-spin' : ''}`}>
              {generating ? 'autorenew' : 'auto_awesome'}
            </span>
            {generating ? 'Generating…' : 'Generate Forecast'}
          </button>
        }
      />

      {error && <ErrorState message={error} onRetry={fetchForecast} />}

      {/* Model Info */}
      {forecast && !forecast.insufficient_data && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-md">
          <div className="card p-lg">
            <div className="text-label-md text-secondary mb-xs">Forecasting Method</div>
            <div className="text-headline-sm text-on-surface font-semibold capitalize">{forecast.method?.replace(/_/g, ' ')}</div>
            <div className="text-label-sm text-secondary mt-xs">Interpretable statistical baseline</div>
          </div>
          <div className="card p-lg">
            <div className="text-label-md text-secondary mb-xs">Training Samples</div>
            <div className="metric-num text-headline-sm text-on-surface font-semibold">{forecast.training_samples ?? '—'}</div>
            <div className="text-label-sm text-secondary mt-xs">Historical hourly readings</div>
          </div>
          <div className="card p-lg">
            <div className="text-label-md text-secondary mb-xs">Validation MAE</div>
            <div className="metric-num text-headline-sm text-on-surface font-semibold">
              {forecast.mae != null ? `${forecast.mae.toFixed(3)} kWh` : 'N/A'}
            </div>
            <div className="text-label-sm text-secondary mt-xs">
              {forecast.evaluation_period ? `Eval period: ${forecast.evaluation_period}` : 'Not evaluated on held-out set'}
            </div>
          </div>
        </div>
      )}

      {/* Forecast Chart */}
      <div className="card p-lg">
        <div className="section-header mb-md">
          <h2 className="text-headline-sm text-on-surface font-semibold">24-Hour Energy Forecast</h2>
          {forecast && (
            <div className="text-label-sm text-secondary">
              Generated: {format(parseISO(forecast.generated_at), 'MMM d, HH:mm')}
            </div>
          )}
        </div>

        {loading ? (
          <Skeleton className="h-64 w-full" />
        ) : forecast?.insufficient_data ? (
          <EmptyState
            icon="auto_awesome"
            title="Insufficient data for forecasting"
            description={forecast.notes || "At least 7 days of continuous hourly readings are needed before a reliable forecast can be generated."}
            action={<button onClick={generateForecast} className="btn-primary">Try with available data</button>}
          />
        ) : chartData.length > 0 ? (
          <>
            <div className="flex items-center gap-md mb-sm">
              <div className="flex items-center gap-2xs text-label-sm text-secondary">
                <span className="w-4 h-0.5 bg-[#28583c] inline-block" /> Historical Actual
              </div>
              <div className="flex items-center gap-2xs text-label-sm text-secondary">
                <span className="w-4 h-0.5 border-t-2 border-dashed border-[#9fd2ae] inline-block" /> Predicted (kWh)
              </div>
              <div className="flex items-center gap-2xs text-label-sm text-secondary">
                <span className="w-4 h-0.5 bg-[#9fd2ae] opacity-30 inline-block" /> Confidence Band
              </div>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="predGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#9fd2ae" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#9fd2ae" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8f0e4" />
                <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#717972' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#717972' }} tickLine={false} axisLine={false} unit=" kWh" />
                <Tooltip />
                <ReferenceLine x={format(now, 'HH:mm')} stroke="#717972" strokeDasharray="4 2" label={{ value: 'Now', fill: '#717972', fontSize: 11 }} />
                <Area type="monotone" dataKey="upper" stroke="none" fill="url(#predGrad)" connectNulls />
                <Area type="monotone" dataKey="predicted" name="Predicted (kWh)" stroke="#9fd2ae" strokeWidth={2} strokeDasharray="6 3" fill="none" connectNulls />
              </AreaChart>
            </ResponsiveContainer>
          </>
        ) : (
          <EmptyState icon="show_chart" title="No forecast available" description="Click Generate Forecast to create a new prediction." />
        )}
      </div>

      {/* Method explanation */}
      <div className="card p-lg">
        <h2 className="text-headline-sm text-on-surface font-semibold mb-sm">How This Forecast Works</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-md text-body-md text-on-surface-variant">
          <div className="flex gap-sm">
            <span className="material-symbols-outlined text-primary shrink-0">timeline</span>
            <div>
              <div className="text-label-lg text-on-surface font-semibold mb-2xs">Seasonal Naive / Moving Average</div>
              The model uses the same hour from recent days as a baseline, adjusted by a rolling weekly average. No external data or cloud API required.
            </div>
          </div>
          <div className="flex gap-sm">
            <span className="material-symbols-outlined text-primary shrink-0">verified</span>
            <div>
              <div className="text-label-lg text-on-surface font-semibold mb-2xs">Evaluation Methodology</div>
              When sufficient data exists, the model is evaluated on a held-out test period (last 20% of readings). Random split is never used for time-series data to prevent leakage.
            </div>
          </div>
          <div className="flex gap-sm">
            <span className="material-symbols-outlined text-primary shrink-0">warning</span>
            <div>
              <div className="text-label-lg text-on-surface font-semibold mb-2xs">Limitations</div>
              Forecasts cannot account for unplanned events, unusual occupancy, or sudden appliance failures. Treat as an estimate only.
            </div>
          </div>
          <div className="flex gap-sm">
            <span className="material-symbols-outlined text-primary shrink-0">privacy_tip</span>
            <div>
              <div className="text-label-lg text-on-surface font-semibold mb-2xs">Local Processing</div>
              All computation runs on-device (Raspberry Pi). No energy data is sent to external APIs.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
