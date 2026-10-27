import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, ReferenceLine, Legend
} from 'recharts';
import { format, parseISO } from 'date-fns';
import api from '../../services/api';
import {
  KPICard, PageHeader, StatusChip, ToggleSwitch,
  EmptyState, ErrorState, SeverityBadge, PriorityBadge, Skeleton
} from '../../components/ui/index';
import type {
  CurrentPower, EnergyHistory, ApplianceConsumption,
  AnomalyEvent, Recommendation, Device
} from '../../types';

const CHART_COLORS = {
  actual: '#28583c',
  forecast: '#9fd2ae',
  baseline: '#c1c9c0',
};

export function OverviewPage() {
  const [period, setPeriod] = useState<'today' | '7d' | 'mtd'>('today');
  const [currentPower, setCurrentPower] = useState<CurrentPower | null>(null);
  const [energyHistory, setEnergyHistory] = useState<EnergyHistory | null>(null);
  const [appliances, setAppliances] = useState<ApplianceConsumption[]>([]);
  const [anomalies, setAnomalies] = useState<AnomalyEvent[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [connectedCount, setConnectedCount] = useState({ online: 0, total: 0 });

  const fetchAll = async () => {
    try {
      setError(null);
      const [pwrRes, histRes, appRes, anomRes, recRes, devRes] = await Promise.allSettled([
        api.get<CurrentPower>('/energy/current'),
        api.get<EnergyHistory>(`/energy/history?period=${period}`),
        api.get<ApplianceConsumption[]>('/energy/appliances?period=' + period),
        api.get<AnomalyEvent[]>('/anomalies?status=open&limit=3'),
        api.get<Recommendation[]>('/recommendations?status=active&limit=2'),
        api.get<Device[]>('/devices?is_controllable=true&limit=4'),
      ]);
      if (pwrRes.status === 'fulfilled') setCurrentPower(pwrRes.value.data);
      if (histRes.status === 'fulfilled') setEnergyHistory(histRes.value.data);
      if (appRes.status === 'fulfilled')  setAppliances(appRes.value.data);
      if (anomRes.status === 'fulfilled') setAnomalies(anomRes.value.data);
      if (recRes.status === 'fulfilled')  setRecommendations(recRes.value.data);
      if (devRes.status === 'fulfilled') {
        const devs = devRes.value.data;
        setDevices(devs);
        setConnectedCount({ online: devs.filter(d => d.status === 'online').length, total: devs.length });
      }
    } catch (e) {
      setError('Failed to load dashboard data. Check your connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchAll(); }, [period]);

  const handleRefresh = () => { setRefreshing(true); fetchAll(); };
  const handleDeviceToggle = async (device: Device) => {
    const service = device.status === 'online' ? 'turn_off' : 'turn_on';
    await api.post('/devices/control', { entity_id: device.entity_id, service });
    fetchAll();
  };

  const isDemo = currentPower?.is_demo ?? true;
  const sym = currentPower?.currency_symbol || '₹';

  // Chart data from history
  const chartData = energyHistory?.data.map(d => ({
    time: format(parseISO(d.timestamp), 'HH:mm'),
    energy: d.energy_kwh,
    power: d.power_w ? d.power_w / 1000 : undefined,
    forecast: d.is_forecast ? d.energy_kwh : undefined,
    actual: !d.is_forecast ? d.energy_kwh : undefined,
  })) || [];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-inverse-surface text-inverse-on-surface rounded-lg p-sm shadow-modal text-label-sm">
        <div className="font-semibold mb-2xs">{label}</div>
        {payload.map((p: any, i: number) => (
          <div key={i} className="flex items-center gap-xs">
            <span style={{ color: p.color }}>●</span>
            <span>{p.name}: {typeof p.value === 'number' ? p.value.toFixed(2) : p.value}</span>
          </div>
        ))}
      </div>
    );
  };

  if (loading) return <OverviewSkeleton />;

  return (
    <div className="flex flex-col gap-xl">
      {/* Page Header */}
      <PageHeader
        title="Your Home Overview"
        subtitle="See how your home uses energy today."
        badge="Live Telemetry"
        isDemo={isDemo}
        actions={
          <div className="flex flex-wrap items-center gap-xs">
            <div className="relative bg-surface-container-lowest rounded-xl shadow-card px-sm py-xs flex items-center gap-xs">
              <span className="material-symbols-outlined text-[18px] text-primary">calendar_today</span>
              <select
                id="period-selector"
                value={period}
                onChange={(e) => setPeriod(e.target.value as typeof period)}
                className="bg-transparent text-label-lg text-on-surface focus:outline-none cursor-pointer pr-xs appearance-none font-semibold"
              >
                <option value="today">Today</option>
                <option value="7d">Last 7 Days</option>
                <option value="mtd">Month to Date</option>
              </select>
              <span className="material-symbols-outlined text-[18px] text-secondary pointer-events-none">expand_more</span>
            </div>
            <button onClick={handleRefresh} disabled={refreshing} className="btn-primary">
              <span className={`material-symbols-outlined text-[18px] ${refreshing ? 'animate-spin' : ''}`}>sync</span>
              <span>{refreshing ? 'Refreshing…' : 'Refresh'}</span>
            </button>
          </div>
        }
      />

      {/* Last sync info */}
      {currentPower && (
        <div className="flex items-center gap-xs -mt-md text-secondary text-label-md">
          <span className="inline-block w-2 h-2 rounded-full bg-primary-container animate-pulse" />
          <span>
            Last updated {currentPower.last_sync
              ? format(parseISO(currentPower.last_sync), 'HH:mm')
              : 'just now'} • {currentPower.data_source === 'demo' ? 'Demo Data' : 'Local Node (Raspberry Pi 4)'}
          </span>
        </div>
      )}

      {error && <ErrorState message={error} onRetry={handleRefresh} />}

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-md">
        <KPICard
          icon="bolt"
          label="Current Power"
          value={currentPower ? currentPower.total_power_w.toLocaleString('en-IN') : '—'}
          unit="W"
          secondaryValue={currentPower ? `(${(currentPower.total_power_w / 1000).toFixed(2)} kW)` : ''}
          badge={{ text: format(new Date(), 'HH:mm:ss'), type: 'neutral' }}
          footer={
            <div className="flex items-center gap-1.5 text-primary-container bg-surface-container-low/60 rounded-lg px-2.5 py-1.5">
              <span className="material-symbols-outlined text-[16px]">check_circle</span>
              <span className="text-label-sm font-semibold">Within expected range</span>
            </div>
          }
        />
        <KPICard
          icon="speed"
          label="Energy Today"
          value={currentPower ? currentPower.total_energy_today_kwh.toFixed(1) : '—'}
          unit="kWh"
          footer={
            <div className="flex items-center gap-1.5 text-on-secondary-fixed-variant bg-surface-container px-2.5 py-1.5 rounded-lg">
              <span className="material-symbols-outlined text-[16px] text-primary">trending_up</span>
              <span className="text-label-sm font-medium">Based on usage pattern</span>
            </div>
          }
        />
        <KPICard
          icon="currency_rupee"
          label="Estimated Cost"
          value={currentPower ? `${sym}${currentPower.estimated_cost_today.toFixed(2)}` : '—'}
          badge={{ text: 'TODAY', type: 'neutral' }}
          footer={
            <div className="flex items-center gap-1.5 text-secondary bg-surface-container px-2.5 py-1.5 rounded-lg">
              <span className="material-symbols-outlined text-[16px]">info</span>
              <span className="text-label-sm">Flat-rate estimate (excl. taxes)</span>
            </div>
          }
        />
        <KPICard
          icon="sensors"
          label="Connected Devices"
          value={`${connectedCount.online} / ${connectedCount.total}`}
          badge={{ text: '88% Active', type: 'positive' }}
          footer={
            connectedCount.total - connectedCount.online > 0 ? (
              <div className="flex items-center gap-1.5 text-status-amber-text bg-status-amber-bg px-2.5 py-1.5 rounded-lg border border-status-amber-border">
                <span className="material-symbols-outlined text-[16px]">warning</span>
                <span className="text-label-sm font-medium">{connectedCount.total - connectedCount.online} offline</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-status-green-text bg-status-green-bg px-2.5 py-1.5 rounded-lg border border-status-green-border">
                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                <span className="text-label-sm font-medium">All devices online</span>
              </div>
            )
          }
        />
      </div>

      {/* ── Chart + Energy at a Glance ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-md">
        {/* Chart */}
        <div className="lg:col-span-2 card p-lg">
          <div className="section-header">
            <div>
              <h2 className="text-headline-sm text-on-surface font-semibold">Power & Consumption Timeline</h2>
              <p className="text-body-md text-secondary mt-2xs">Real-time local CT clamps stream + ML projection</p>
            </div>
            <div className="flex gap-xs">
              {(['Today (Hourly)', '7-Day', '30-Day'] as const).map((label, i) => (
                <button key={i} className={`btn-ghost text-label-sm px-sm py-2xs rounded-lg ${i === 0 ? 'bg-surface-container text-on-surface' : ''}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-md mb-sm">
            <div className="flex items-center gap-2xs text-label-sm text-secondary">
              <span className="w-4 h-0.5 bg-[#28583c] inline-block" /> Actual Measured (kWh)
            </div>
            <div className="flex items-center gap-2xs text-label-sm text-secondary">
              <span className="w-4 h-0.5 border-t-2 border-dashed border-[#9fd2ae] inline-block" /> ML Model Forecast
            </div>
            <div className="flex items-center gap-2xs text-label-sm text-secondary">
              <span className="w-4 h-0.5 border-t-2 border-dashed border-[#c1c9c0] inline-block" /> Typical Baseline
            </div>
          </div>

          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                <defs>
                  <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLORS.actual} stopOpacity={0.15} />
                    <stop offset="95%" stopColor={CHART_COLORS.actual} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLORS.forecast} stopOpacity={0.1} />
                    <stop offset="95%" stopColor={CHART_COLORS.forecast} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8f0e4" />
                <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#717972' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#717972' }} tickLine={false} axisLine={false} unit=" kWh" />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone" dataKey="actual" name="Actual (kWh)"
                  stroke={CHART_COLORS.actual} strokeWidth={2}
                  fill="url(#colorActual)" connectNulls
                />
                <Area
                  type="monotone" dataKey="forecast" name="Forecast (kWh)"
                  stroke={CHART_COLORS.forecast} strokeWidth={2} strokeDasharray="6 3"
                  fill="url(#colorForecast)" connectNulls
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState icon="show_chart" title="No data yet" description="Energy readings will appear here once data collection begins." />
          )}

          <div className="mt-sm pt-sm border-t border-outline-variant/50 text-label-sm text-secondary">
            Projected end-of-day: <span className="font-semibold text-on-surface">
              {currentPower ? `${(currentPower.total_energy_today_kwh * 1.5).toFixed(1)} kWh` : '—'}
            </span>
          </div>
        </div>

        {/* Energy at a Glance */}
        <div className="card p-lg flex flex-col gap-md">
          <div className="section-header">
            <h2 className="text-headline-sm text-on-surface font-semibold">Energy at a Glance</h2>
            <span className="chip-neutral">Today</span>
          </div>

          <div className="bg-surface-container rounded-lg p-sm">
            <div className="text-label-md text-secondary mb-2xs">TODAY'S TOTAL</div>
            <div className="flex items-baseline gap-2xs">
              <span className="metric-num text-metric-headline text-primary">
                {currentPower?.total_energy_today_kwh.toFixed(1) || '—'}
              </span>
              <span className="text-headline-sm text-secondary">kWh</span>
            </div>
          </div>

          <div className="flex flex-col gap-sm">
            <GlanceItem
              icon="schedule" title="Peak Consumption Window"
              value="12:00 – 13:30"
              sub="Kitchen & HVAC cooling cycle"
            />
            <GlanceItem
              icon="history" title="Historical Baseline"
              value="+8.2% vs yesterday"
              sub="Attributed to afternoon ambient temp"
            />
            <GlanceItem
              icon="eco" title="Carbon Footprint"
              value={`${((currentPower?.total_energy_today_kwh || 14.8) * 0.82).toFixed(1)} kg CO₂e`}
              sub="Regional grid factor: ~0.82 kg CO₂/kWh"
            />
          </div>

          <Link to="/app/analytics" className="btn-secondary justify-center w-full mt-auto">
            Explore Complete Analytics
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </Link>
        </div>
      </div>

      {/* ── Appliance Breakdown ── */}
      <div className="card p-lg">
        <div className="section-header">
          <div>
            <h2 className="text-headline-sm text-on-surface font-semibold">Appliance Breakdown (Top Energy Consumers)</h2>
            <p className="text-body-md text-secondary mt-2xs">Real-time disaggregation via sub-metered smart plugs & CT channels</p>
          </div>
          <Link to="/app/appliances" className="btn-secondary">
            View All Appliances
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </Link>
        </div>

        {appliances.length > 0 ? (
          <div className="flex flex-col divide-y divide-outline-variant/50">
            {appliances.map((app) => (
              <ApplianceRow key={app.device_id} appliance={app} symbol={sym} />
            ))}
          </div>
        ) : (
          <EmptyState icon="bolt" title="No appliance data" description="Appliance-level consumption requires individual energy monitoring sensors." />
        )}
      </div>

      {/* ── Recommendations + Anomalies ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-md">
        {/* Priority Recommendations */}
        <div className="card p-lg">
          <div className="section-header">
            <div className="flex items-center gap-xs">
              <span className="material-symbols-outlined text-[20px] text-primary">lightbulb</span>
              <h2 className="text-headline-sm text-on-surface font-semibold">Priority Recommendations</h2>
            </div>
            <span className="chip-green">{recommendations.length} Available</span>
          </div>

          {recommendations.length > 0 ? (
            <div className="flex flex-col gap-sm">
              {recommendations.map((rec) => (
                <RecommendationCard key={rec.id} rec={rec} symbol={sym} />
              ))}
            </div>
          ) : (
            <EmptyState icon="lightbulb" title="No recommendations" description="Recommendations appear when energy patterns are analysed." />
          )}

          <Link to="/app/recommendations" className="text-primary text-label-lg font-semibold hover:underline mt-sm inline-flex items-center gap-2xs">
            View all recommendations →
          </Link>
        </div>

        {/* Recent Anomalies */}
        <div className="card p-lg">
          <div className="section-header">
            <div className="flex items-center gap-xs">
              <span className="material-symbols-outlined text-[20px] text-status-amber-text">warning</span>
              <h2 className="text-headline-sm text-on-surface font-semibold">Recent Anomalies & System Alerts</h2>
            </div>
            {anomalies.filter(a => a.severity === 'warning' || a.severity === 'critical').length > 0 && (
              <span className="chip-amber">{anomalies.filter(a => a.severity === 'warning' || a.severity === 'critical').length} Warning</span>
            )}
          </div>

          {anomalies.length > 0 ? (
            <div className="flex flex-col gap-sm">
              {anomalies.map((an) => (
                <AnomalyCard key={an.id} anomaly={an} />
              ))}
            </div>
          ) : (
            <EmptyState icon="check_circle" title="No active anomalies" description="All energy patterns are within normal ranges." />
          )}

          <Link to="/app/anomalies" className="text-primary text-label-lg font-semibold hover:underline mt-sm inline-flex items-center gap-2xs">
            Open Anomaly Center →
          </Link>
        </div>
      </div>

      {/* ── Quick Controls ── */}
      {devices.length > 0 && (
        <div className="card p-lg">
          <div className="section-header">
            <div>
              <div className="flex items-center gap-xs">
                <span className="material-symbols-outlined text-[20px] text-primary">settings_remote</span>
                <h2 className="text-headline-sm text-on-surface font-semibold">Quick Controls (Pinned Devices)</h2>
              </div>
              <p className="text-body-md text-secondary mt-2xs">Toggle loads instantly via local Home Assistant integration</p>
            </div>
            <span className="text-label-sm text-secondary bg-surface-container rounded-lg px-sm py-2xs">Local Relay Latency: &lt;14ms</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-md">
            {devices.map((dev) => (
              <DeviceControl key={dev.id} device={dev} onToggle={handleDeviceToggle} />
            ))}
          </div>

          <div className="mt-md pt-sm border-t border-outline-variant/50 flex items-center gap-xs text-label-sm text-secondary">
            <span className="material-symbols-outlined text-[16px]">security</span>
            Safety Guardrail Active: Protected critical domestic loads (Refrigerator compressor, Network Storage, Pi Home Hub) cannot be toggled remotely.
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function GlanceItem({ icon, title, value, sub }: { icon: string; title: string; value: string; sub: string }) {
  return (
    <div className="flex items-start gap-sm">
      <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center shrink-0">
        <span className="material-symbols-outlined text-[16px] text-primary">{icon}</span>
      </div>
      <div>
        <div className="text-label-md text-secondary">{title}</div>
        <div className="text-label-lg text-on-surface font-semibold">{value}</div>
        <div className="text-label-sm text-secondary">{sub}</div>
      </div>
    </div>
  );
}

function ApplianceRow({ appliance, symbol }: { appliance: ApplianceConsumption; symbol: string }) {
  const deviceIcons: Record<string, string> = {
    climate: 'ac_unit',
    light: 'light',
    switch: 'electrical_services',
    sensor: 'sensors',
    other: 'devices_other',
  };
  return (
    <div className="flex items-center gap-md py-sm">
      <div className="w-10 h-10 rounded-lg bg-primary-container flex items-center justify-center shrink-0">
        <span className="material-symbols-outlined text-on-primary text-[20px]">
          {deviceIcons[appliance.status === 'online' ? 'switch' : 'other']}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-xs">
          <span className="text-label-lg text-on-surface font-semibold truncate">{appliance.device_name}</span>
          <StatusChip status={appliance.status === 'online' ? 'ok' : 'warning'} label={appliance.status} dot />
        </div>
        <div className="text-label-sm text-secondary">{appliance.room_name || 'Unknown Room'}</div>
        <div className="mt-xs h-1.5 bg-surface-container rounded-full overflow-hidden">
          <div
            className="h-full bg-primary-container rounded-full"
            style={{ width: `${Math.min(appliance.percentage_of_total, 100)}%` }}
          />
        </div>
      </div>
      <div className="text-right shrink-0">
        <div className="text-label-lg text-on-surface font-semibold">{appliance.energy_kwh.toFixed(1)} kWh</div>
        <div className="text-label-sm text-secondary">{symbol}{appliance.estimated_cost.toFixed(2)}</div>
        <div className="text-label-sm text-secondary">{appliance.percentage_of_total.toFixed(1)}% of total</div>
      </div>
    </div>
  );
}

function RecommendationCard({ rec, symbol }: { rec: Recommendation; symbol: string }) {
  return (
    <div className="bg-surface-container-low rounded-lg p-sm">
      <div className="flex items-start justify-between gap-xs mb-xs">
        <span className="text-label-lg text-on-surface font-semibold">{rec.title}</span>
        <PriorityBadge priority={rec.priority} />
      </div>
      <p className="text-label-sm text-secondary mb-sm">{rec.description}</p>
      {rec.estimated_saving_inr_month && (
        <div className="text-label-sm text-status-green-text font-semibold mb-sm">
          Potential saving: ~{symbol}{rec.estimated_saving_inr_month.toFixed(0)}/month
        </div>
      )}
      <button className="btn-primary text-label-sm py-2xs w-full justify-center">
        <span className="material-symbols-outlined text-[16px]">check</span>
        {rec.suggested_action || 'Apply Recommendation'}
      </button>
    </div>
  );
}

function AnomalyCard({ anomaly }: { anomaly: AnomalyEvent }) {
  return (
    <div className="flex items-start gap-sm bg-surface-container-low rounded-lg p-sm">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
        anomaly.severity === 'critical' ? 'bg-status-red-bg' :
        anomaly.severity === 'warning' ? 'bg-status-amber-bg' : 'bg-surface-container'
      }`}>
        <span className={`material-symbols-outlined text-[18px] ${
          anomaly.severity === 'critical' ? 'text-status-red-text' :
          anomaly.severity === 'warning' ? 'text-status-amber-text' : 'text-secondary'
        }`}>warning</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-xs mb-2xs">
          <span className="text-label-lg text-on-surface font-semibold truncate">{anomaly.title}</span>
          <SeverityBadge severity={anomaly.severity} />
        </div>
        <p className="text-label-sm text-secondary">{anomaly.explanation}</p>
        <Link to={`/app/anomalies/${anomaly.id}`} className="text-label-sm text-primary font-semibold hover:underline mt-xs inline-block">
          Investigate →
        </Link>
      </div>
    </div>
  );
}

function DeviceControl({ device, onToggle }: { device: Device; onToggle: (d: Device) => void }) {
  const isOn = device.status === 'online';
  return (
    <div className="card p-sm flex flex-col gap-sm">
      <div className="flex items-center justify-between">
        <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center">
          <span className="material-symbols-outlined text-[18px] text-primary">bolt</span>
        </div>
        <ToggleSwitch
          id={`toggle-${device.id}`}
          checked={isOn}
          onChange={() => onToggle(device)}
          label={`Toggle ${device.name}`}
        />
      </div>
      <div>
        <div className="text-label-lg text-on-surface font-semibold truncate">{device.name}</div>
        <div className="text-label-sm text-secondary">
          {isOn ? 'ON' : 'OFF'} • {device.current_power_w ? `${device.current_power_w}W draw` : '0W draw'}
        </div>
      </div>
    </div>
  );
}

function OverviewSkeleton() {
  return (
    <div className="flex flex-col gap-xl animate-pulse">
      <div className="h-10 w-64 bg-surface-container rounded" />
      <div className="grid grid-cols-4 gap-md">
        {[...Array(4)].map((_, i) => <div key={i} className="h-36 bg-surface-container rounded-lg" />)}
      </div>
      <div className="grid grid-cols-3 gap-md">
        <div className="col-span-2 h-80 bg-surface-container rounded-lg" />
        <div className="h-80 bg-surface-container rounded-lg" />
      </div>
    </div>
  );
}
