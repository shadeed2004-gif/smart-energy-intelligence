import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, parseISO } from 'date-fns';
import api from '../../services/api';
import { PageHeader, DeviceStatusChip, ToggleSwitch, EmptyState, ErrorState, ConfirmDialog } from '../../components/ui/index';
import type { Device, EnergyHistory } from '../../types';

export function ApplianceDetailPage() {
  const { id } = useParams();
  const [device, setDevice] = useState<Device | null>(null);
  const [history, setHistory] = useState<EnergyHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmToggle, setConfirmToggle] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [devRes, histRes] = await Promise.allSettled([
          api.get<Device>(`/devices/${id}`),
          api.get<EnergyHistory>(`/energy/history?device_id=${id}&period=7d`),
        ]);
        if (devRes.status === 'fulfilled') setDevice(devRes.value.data);
        if (histRes.status === 'fulfilled') setHistory(histRes.value.data);
      } catch { setError('Failed to load appliance details.'); }
      finally { setLoading(false); }
    };
    fetch();
  }, [id]);

  const handleToggle = async () => {
    if (!device) return;
    const service = device.status === 'online' ? 'turn_off' : 'turn_on';
    await api.post('/devices/control', { entity_id: device.entity_id, service });
    setConfirmToggle(false);
    window.location.reload();
  };

  const chartData = history?.data.map(d => ({
    time: format(parseISO(d.timestamp), 'MM/dd HH:mm'),
    kWh: d.energy_kwh,
  })) || [];

  if (loading) return <div className="animate-pulse"><div className="h-10 w-64 bg-surface-container rounded mb-lg" /><div className="h-64 bg-surface-container rounded" /></div>;
  if (error || !device) return <ErrorState message={error || 'Device not found.'} />;

  return (
    <div className="flex flex-col gap-xl">
      <div className="flex items-center gap-xs">
        <Link to="/app/appliances" className="text-secondary hover:text-on-surface transition-colors">
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
        </Link>
        <PageHeader
          title={device.name}
          subtitle={`${device.entity_id} • ${device.room?.name || 'No room assigned'}`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-md">
        {/* Device Info */}
        <div className="card p-lg flex flex-col gap-md">
          <div className="flex items-center justify-between">
            <h2 className="text-headline-sm text-on-surface font-semibold">Device Status</h2>
            <DeviceStatusChip status={device.status} />
          </div>

          <div className="flex flex-col gap-sm">
            <InfoRow label="Entity ID" value={device.entity_id} />
            <InfoRow label="Device Type" value={device.device_type} />
            <InfoRow label="Room" value={device.room?.name || '—'} />
            <InfoRow label="Power Monitoring" value={device.has_power_monitoring ? 'Yes' : 'No'} />
            {device.current_power_w != null && (
              <InfoRow label="Current Power" value={`${device.current_power_w} W`} highlight />
            )}
            <InfoRow label="Last Seen" value={device.last_seen ? format(parseISO(device.last_seen), 'MMM d, HH:mm') : '—'} />
          </div>

          {device.is_controllable && (
            <div className="mt-auto pt-md border-t border-outline-variant/50">
              <div className="flex items-center justify-between">
                <span className="text-label-lg text-on-surface font-medium">Power State</span>
                <ToggleSwitch
                  checked={device.status === 'online'}
                  onChange={() => setConfirmToggle(true)}
                  label={`Toggle ${device.name}`}
                />
              </div>
              <p className="text-label-sm text-secondary mt-xs">
                Toggles the device via Home Assistant. Confirm before executing.
              </p>
            </div>
          )}
        </div>

        {/* History Chart */}
        <div className="lg:col-span-2 card p-lg">
          <h2 className="text-headline-sm text-on-surface font-semibold mb-md">7-Day Energy History</h2>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="devGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#28583c" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#28583c" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8f0e4" />
                <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#717972' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#717972' }} tickLine={false} axisLine={false} unit=" kWh" />
                <Tooltip />
                <Area type="monotone" dataKey="kWh" name="Energy (kWh)" stroke="#28583c" strokeWidth={2} fill="url(#devGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState icon="show_chart" title="No history" description="Energy data will appear after the device has been monitored for some time." />
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmToggle}
        title={`${device.status === 'online' ? 'Turn Off' : 'Turn On'} ${device.name}?`}
        message={`This will ${device.status === 'online' ? 'turn off' : 'turn on'} ${device.name} via Home Assistant. Confirm this action.`}
        confirmLabel={device.status === 'online' ? 'Turn Off' : 'Turn On'}
        isDangerous={device.status === 'online'}
        onConfirm={handleToggle}
        onCancel={() => setConfirmToggle(false)}
      />
    </div>
  );
}

function InfoRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between items-center py-2xs border-b border-outline-variant/30">
      <span className="text-label-md text-secondary">{label}</span>
      <span className={`text-label-md font-medium ${highlight ? 'text-primary' : 'text-on-surface'}`}>{value}</span>
    </div>
  );
}
