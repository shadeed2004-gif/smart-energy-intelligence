import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, LineChart, Line
} from 'recharts';
import { format, parseISO, subDays } from 'date-fns';
import api from '../../services/api';
import {
  PageHeader, KPICard, EmptyState, ErrorState,
  DataQualityBadge, Skeleton
} from '../../components/ui/index';
import type { EnergyAnalyticsSummary, DailyRecord } from '../../types';

type Granularity = 'Hourly' | 'Daily' | 'Monthly';
type ChartMode = 'Daily Energy (kWh)' | 'Power Demand (kW)' | 'Cumulative Cost (₹)';

export function AnalyticsPage() {
  const [dateRange, setDateRange] = useState({
    start: format(subDays(new Date(), 23), 'yyyy-MM-dd'),
    end:   format(new Date(), 'yyyy-MM-dd'),
  });
  const [granularity, setGranularity] = useState<Granularity>('Daily');
  const [chartMode, setChartMode] = useState<ChartMode>('Daily Energy (kWh)');
  const [roomFilter, setRoomFilter] = useState('All Rooms');
  const [summary, setSummary] = useState<EnergyAnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  const fetchData = async () => {
    setLoading(true); setError(null);
    try {
      const res = await api.get<EnergyAnalyticsSummary>(
        `/energy/analytics?start=${dateRange.start}&end=${dateRange.end}&granularity=${granularity.toLowerCase()}`
      );
      setSummary(res.data);
    } catch {
      setError('Failed to load energy analytics. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [dateRange, granularity]);

  const records = summary?.records || [];
  const totalPages = Math.ceil(records.length / PAGE_SIZE);
  const pagedRecords = records.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const chartData = records.map(r => ({
    date:    format(parseISO(r.date + 'T00:00:00'), 'MMM d'),
    energy:  r.total_energy_kwh,
    power:   r.peak_power_w ? r.peak_power_w / 1000 : 0,
    cost:    r.estimated_cost,
  }));

  const sym = summary?.currency_symbol || '₹';

  const handleCsvExport = async () => {
    try {
      const res = await api.get(`/energy/export?start=${dateRange.start}&end=${dateRange.end}&format=csv`, {
        responseType: 'blob'
      });
      const url = URL.createObjectURL(res.data as Blob);
      const a = document.createElement('a'); a.href = url;
      a.download = `energy-${dateRange.start}-${dateRange.end}.csv`;
      a.click(); URL.revokeObjectURL(url);
    } catch { alert('Export failed. Please try again.'); }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-inverse-surface text-inverse-on-surface rounded-lg p-sm shadow-modal text-label-sm min-w-[140px]">
        <div className="font-semibold mb-2xs">{label}</div>
        {payload.map((p: any, i: number) => (
          <div key={i} className="flex justify-between gap-md">
            <span style={{ color: p.color }}>{p.name}</span>
            <span className="font-semibold">{typeof p.value === 'number' ? p.value.toFixed(2) : p.value}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-xl">
      <PageHeader
        title="Energy Analytics"
        subtitle="Deep historical consumption insights, appliance tier analysis, and cost projections calculated on localised edge telemetry."
        badge="Historical Telemetry Core"
        isDemo={summary?.is_demo}
        actions={
          <div className="flex flex-wrap items-center gap-xs">
            {/* Date range */}
            <div className="flex items-center gap-xs bg-surface-container-lowest rounded-xl shadow-card px-sm py-xs border border-outline-variant">
              <span className="material-symbols-outlined text-[16px] text-primary">calendar_today</span>
              <input type="date" value={dateRange.start}
                onChange={e => setDateRange(d => ({...d, start: e.target.value}))}
                className="bg-transparent text-label-md text-on-surface focus:outline-none cursor-pointer"
              />
              <span className="text-secondary">–</span>
              <input type="date" value={dateRange.end}
                onChange={e => setDateRange(d => ({...d, end: e.target.value}))}
                className="bg-transparent text-label-md text-on-surface focus:outline-none cursor-pointer"
              />
            </div>
            {/* Granularity */}
            <div className="flex rounded-xl overflow-hidden border border-outline-variant">
              {(['Hourly','Daily','Monthly'] as Granularity[]).map(g => (
                <button key={g} onClick={() => setGranularity(g)}
                  className={`px-sm py-xs text-label-md font-medium transition-colors ${
                    granularity === g
                      ? 'bg-primary-container text-on-primary'
                      : 'bg-surface-container-lowest text-secondary hover:bg-surface-container-low'
                  }`}
                >{g}</button>
              ))}
            </div>
            <button onClick={handleCsvExport} className="btn-secondary">
              <span className="material-symbols-outlined text-[18px]">download</span>
              CSV
            </button>
          </div>
        }
      />

      {error && <ErrorState message={error} onRetry={fetchData} />}

      {/* ── KPI Summary Cards ── */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-md">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-36" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-md">
          <KPICard icon="electric_meter" label="Total Energy Consumed"
            value={summary ? summary.total_energy_kwh.toFixed(1) : '—'} unit="kWh"
            footer={<div className="text-label-sm text-secondary">vs previous {summary?.period_days} days</div>}
          />
          <KPICard icon="speed" label="Daily Consumption Rate"
            value={summary ? summary.daily_avg_kwh.toFixed(2) : '—'} unit="kWh/day"
            footer={<div className="text-label-sm text-secondary">Median over period</div>}
          />
          <KPICard icon="flash_on" label="Peak Measured Power"
            value={summary?.peak_power_w ? (summary.peak_power_w / 1000).toFixed(2) : '—'} unit="kW"
            footer={<div className="text-label-sm text-secondary">Highest recorded demand</div>}
          />
          <KPICard icon="currency_rupee" label="Estimated Energy Cost"
            value={summary ? `${sym}${summary.estimated_cost.toFixed(2)}` : '—'}
            footer={<div className="text-label-sm text-secondary">Flat-rate estimate. Taxes excluded.</div>}
          />
        </div>
      )}

      {/* ── Consumption Profile Chart ── */}
      <div className="card p-lg">
        <div className="section-header flex-col sm:flex-row items-start sm:items-center gap-sm">
          <div>
            <h2 className="text-headline-sm text-on-surface font-semibold">
              Consumption Profile ({summary?.period_days || 0}-Day Span)
            </h2>
            {summary?.is_demo && (
              <div className="flex items-center gap-xs mt-2xs text-label-sm text-secondary">
                <span className="material-symbols-outlined text-[14px]">info</span>
                100% telemetry coverage across period • 0 missing intervals
              </div>
            )}
          </div>
          <div className="flex gap-xs">
            {(['Daily Energy (kWh)', 'Power Demand (kW)', 'Cumulative Cost (₹)'] as ChartMode[]).map(m => (
              <button key={m} onClick={() => setChartMode(m)}
                className={`px-sm py-2xs rounded-lg text-label-sm font-medium transition-colors ${
                  chartMode === m
                    ? 'bg-primary-container text-on-primary'
                    : 'text-secondary hover:bg-surface-container-high'
                }`}
              >{m}</button>
            ))}
          </div>
        </div>

        {chartData.length > 0 ? (
          <div className="mt-md">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8f0e4" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#717972' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#717972' }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey={chartMode === 'Daily Energy (kWh)' ? 'energy' : chartMode === 'Power Demand (kW)' ? 'power' : 'cost'}
                  name={chartMode}
                  fill="#28583c" radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyState icon="bar_chart" title="No consumption data" description="Set a date range that contains recorded energy readings." />
        )}
      </div>

      {/* ── Detailed Log Table ── */}
      <div className="card">
        <div className="p-lg section-header border-b border-outline-variant/50">
          <div>
            <h2 className="text-headline-sm text-on-surface font-semibold">Detailed Consumption Log</h2>
            <p className="text-body-md text-secondary mt-2xs">Verified interval telemetry with Home Assistant synchronisation</p>
          </div>
          <div className="flex items-center gap-xs">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-[18px] text-outline">search</span>
              <input type="text" placeholder="Search date..." className="input-field pl-10 py-xs w-48" />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-surface-container border-b border-outline-variant/50">
                {['Date','Total Energy','Peak Power','Active Devices','Estimated Cost','Quality Status'].map(h => (
                  <th key={h} className="text-left px-lg py-sm text-label-sm text-secondary uppercase tracking-wider font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/30">
              {pagedRecords.map((record) => (
                <tr key={record.date} className="hover:bg-surface-container-low/50 transition-colors">
                  <td className="px-lg py-sm">
                    <span className="text-label-lg text-on-surface font-medium">
                      {format(parseISO(record.date + 'T00:00:00'), 'MMM d, yyyy')}
                    </span>
                  </td>
                  <td className="px-lg py-sm text-label-lg text-on-surface font-semibold metric-num">
                    {record.total_energy_kwh.toFixed(2)} kWh
                  </td>
                  <td className="px-lg py-sm text-label-md text-on-surface metric-num">
                    {record.peak_power_w ? `${(record.peak_power_w / 1000).toFixed(2)} kW` : '—'}
                  </td>
                  <td className="px-lg py-sm text-label-md text-secondary">
                    {record.active_device_count ? `${record.active_device_count} Monitored` : '—'}
                  </td>
                  <td className="px-lg py-sm text-label-lg text-on-surface font-semibold metric-num">
                    {sym}{record.estimated_cost.toFixed(2)}
                  </td>
                  <td className="px-lg py-sm">
                    <DataQualityBadge quality={record.data_quality} />
                  </td>
                </tr>
              ))}
              {pagedRecords.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-lg py-12 text-center text-secondary text-body-md">
                    No records found for selected period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-lg py-sm border-t border-outline-variant/50 flex items-center justify-between">
            <span className="text-label-sm text-secondary">
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, records.length)} of {records.length} days
            </span>
            <div className="flex gap-xs">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn-secondary py-2xs px-sm disabled:opacity-40">
                <span className="material-symbols-outlined text-[18px]">chevron_left</span>
              </button>
              {[...Array(totalPages)].map((_, i) => (
                <button key={i} onClick={() => setPage(i + 1)}
                  className={`w-8 h-8 rounded-lg text-label-md font-medium ${
                    page === i + 1 ? 'bg-primary-container text-on-primary' : 'btn-ghost'
                  }`}
                >{i + 1}</button>
              ))}
              <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="btn-secondary py-2xs px-sm disabled:opacity-40">
                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
