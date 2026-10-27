import { useState } from 'react';
import { PageHeader } from '../../components/ui/index';

export function SecurityPage() {
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [auditLogs] = useState([
    { id: 1, action: 'User Login', ip: '192.168.1.45', status: 'Success', timestamp: '2026-10-27 21:14:02' },
    { id: 2, action: 'Actuator Switch: AC', ip: '192.168.1.10 (Automation)', status: 'Success', timestamp: '2026-10-27 20:30:00' },
    { id: 3, action: 'Tariff Config Update', ip: '192.168.1.45', status: 'Success', timestamp: '2026-10-27 18:22:15' },
    { id: 4, action: 'API Token Validation', ip: '127.0.0.1 (Internal)', status: 'Success', timestamp: '2026-10-27 14:00:10' }
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Security & Access Control"
        subtitle="Manage authentication tokens, API key scopes, and inspect security audit logs."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-surface-elevated p-6 rounded-2xl border border-border space-y-4">
          <h3 className="text-title-md font-bold text-text-primary">Two-Factor Authentication</h3>
          <p className="text-body-sm text-text-secondary">
            Enforce TOTP authenticator validation for device switching and critical automation changes.
          </p>
          <div className="flex items-center justify-between pt-2">
            <span className="text-body-sm font-semibold text-text-primary">
              Status: {mfaEnabled ? 'Active' : 'Disabled'}
            </span>
            <button
              onClick={() => setMfaEnabled(!mfaEnabled)}
              className={`btn ${mfaEnabled ? 'btn-secondary' : 'btn-primary'}`}
            >
              {mfaEnabled ? 'Disable 2FA' : 'Enable 2FA'}
            </button>
          </div>
        </div>

        <div className="bg-surface-elevated p-6 rounded-2xl border border-border space-y-4">
          <h3 className="text-title-md font-bold text-text-primary">API Token Scope</h3>
          <p className="text-body-sm text-text-secondary">
            Manage granular tokens for Home Assistant and external telemetry ingestion.
          </p>
          <div className="flex items-center justify-between pt-2">
            <span className="font-mono text-xs bg-surface px-3 py-1.5 rounded border border-border text-text-secondary">
              sei_live_98ab****c412
            </span>
            <button className="btn btn-outline text-xs">Regenerate Key</button>
          </div>
        </div>
      </div>

      <div className="bg-surface-elevated rounded-2xl border border-border overflow-hidden">
        <div className="p-6 border-b border-border">
          <h3 className="text-title-md font-bold text-text-primary">System Audit Log</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-body-sm">
            <thead className="bg-surface/50 text-text-secondary border-b border-border text-xs uppercase font-semibold">
              <tr>
                <th className="px-6 py-3">Timestamp</th>
                <th className="px-6 py-3">Action</th>
                <th className="px-6 py-3">Origin IP / Source</th>
                <th className="px-6 py-3">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-surface/30">
                  <td className="px-6 py-4 font-mono text-xs text-text-secondary">{log.timestamp}</td>
                  <td className="px-6 py-4 font-medium text-text-primary">{log.action}</td>
                  <td className="px-6 py-4 text-text-secondary">{log.ip}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/10 text-emerald-400">
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
