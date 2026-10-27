import { useState, useEffect } from 'react';
import { PageHeader, DeviceStatusChip } from '../../components/ui/index';
import api from '../../services/api';
import type { Device } from '../../types';

export function DevicesPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<Device[]>('/devices')
      .then((res) => setDevices(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Hardware Device Inventory"
          subtitle="Registered CT sensor clamps, smart switches, and smart plugs."
        />
        <button className="btn btn-primary text-body-sm">
          + Add New Device
        </button>
      </div>

      {loading ? (
        <div className="text-text-secondary text-body-sm">Loading devices…</div>
      ) : (
        <div className="bg-surface-elevated rounded-2xl border border-border overflow-hidden">
          <table className="w-full text-left text-body-sm">
            <thead className="bg-surface/50 text-text-secondary border-b border-border text-xs uppercase font-semibold">
              <tr>
                <th className="px-6 py-3">Device Name</th>
                <th className="px-6 py-3">Entity ID</th>
                <th className="px-6 py-3">Location / Room</th>
                <th className="px-6 py-3">Type</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Current Draw</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {devices.map((d) => (
                <tr key={d.id} className="hover:bg-surface/30">
                  <td className="px-6 py-4 font-semibold text-text-primary">{d.name}</td>
                  <td className="px-6 py-4 font-mono text-xs text-text-secondary">{d.entity_id || d.id}</td>
                  <td className="px-6 py-4 text-text-secondary">{d.room?.name || 'General'}</td>
                  <td className="px-6 py-4 text-xs font-mono capitalize">{d.device_type}</td>
                  <td className="px-6 py-4">
                    <DeviceStatusChip status={d.status} />
                  </td>
                  <td className="px-6 py-4 font-semibold text-text-primary">
                    {d.current_power_w ?? 0} W
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
