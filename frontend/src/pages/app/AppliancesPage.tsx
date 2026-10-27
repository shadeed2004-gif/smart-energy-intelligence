import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { PageHeader, DeviceStatusChip, EmptyState, ErrorState, Skeleton } from '../../components/ui/index';
import type { Device, ApplianceConsumption } from '../../types';

const DEVICE_ICONS: Record<string, string> = {
  climate: 'ac_unit',
  light: 'light',
  switch: 'electrical_services',
  sensor: 'sensors',
  other: 'devices_other',
};

export function AppliancesPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [consumptions, setConsumptions] = useState<ApplianceConsumption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetch = async () => {
      try {
        const [devRes, consRes] = await Promise.allSettled([
          api.get<Device[]>('/devices'),
          api.get<ApplianceConsumption[]>('/energy/appliances?period=today'),
        ]);
        if (devRes.status === 'fulfilled') setDevices(devRes.value.data);
        if (consRes.status === 'fulfilled') setConsumptions(consRes.value.data);
      } catch { setError('Failed to load appliances.'); }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  const filtered = filter === 'all' ? devices : devices.filter(d => d.device_type === filter);
  const getConsumption = (deviceId: number) => consumptions.find(c => c.device_id === deviceId);

  if (loading) return <div className="grid grid-cols-3 gap-md">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-48" />)}</div>;
  if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />;

  return (
    <div className="flex flex-col gap-xl">
      <PageHeader
        title="Appliances"
        subtitle="All monitored devices with real-time status and energy consumption."
        actions={
          <div className="flex gap-xs">
            {['all','switch','light','climate','sensor'].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-sm py-xs rounded-lg text-label-md font-medium capitalize transition-colors ${
                  filter === f ? 'bg-primary-container text-on-primary' : 'btn-ghost'
                }`}
              >{f === 'all' ? 'All Devices' : f}</button>
            ))}
          </div>
        }
      />

      {filtered.length === 0 ? (
        <EmptyState icon="bolt" title="No devices found"
          description="Connect Home Assistant to discover your devices."
          action={<Link to="/app/devices" className="btn-primary">Setup Devices</Link>}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-md">
          {filtered.map(device => {
            const cons = getConsumption(device.id);
            return (
              <Link to={`/app/appliances/${device.id}`} key={device.id}
                className="card p-lg hover:shadow-card-hover transition-shadow flex flex-col gap-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-surface-container-low flex items-center justify-center">
                    <span className="material-symbols-outlined text-[22px] text-primary">
                      {DEVICE_ICONS[device.device_type] || 'device_unknown'}
                    </span>
                  </div>
                  <DeviceStatusChip status={device.status} />
                </div>
                <div>
                  <h3 className="text-label-lg text-on-surface font-semibold">{device.name}</h3>
                  <p className="text-label-sm text-secondary">{device.room?.name || 'Unassigned Room'}</p>
                </div>
                <div className="flex justify-between items-end">
                  <div>
                    <div className="text-label-sm text-secondary">Current Power</div>
                    <div className="metric-num text-headline-md text-primary">
                      {device.current_power_w != null ? `${device.current_power_w.toLocaleString('en-IN')} W` : '—'}
                    </div>
                  </div>
                  {cons && (
                    <div className="text-right">
                      <div className="text-label-sm text-secondary">Today</div>
                      <div className="text-label-lg text-on-surface font-semibold">{cons.energy_kwh.toFixed(1)} kWh</div>
                    </div>
                  )}
                </div>
                {cons && (
                  <div className="mt-xs">
                    <div className="flex justify-between text-label-sm text-secondary mb-2xs">
                      <span>{cons.percentage_of_total.toFixed(1)}% of total</span>
                    </div>
                    <div className="h-1.5 bg-surface-container rounded-full">
                      <div className="h-full bg-primary-container rounded-full" style={{ width: `${Math.min(cons.percentage_of_total, 100)}%` }} />
                    </div>
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
