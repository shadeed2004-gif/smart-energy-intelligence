import { useState } from 'react';
import { PageHeader } from '../../components/ui/index';

export function SettingsPage() {
  const [currency, setCurrency] = useState('₹');
  const [ratePerKwh, setRatePerKwh] = useState('7.50');
  const [carbonFactor, setCarbonFactor] = useState('0.82');
  const [retentionDays, setRetentionDays] = useState('90');
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="System Preferences & Tariff Parameters"
        subtitle="Configure currency formats, carbon emission factors, and historical data retention policies."
      />

      <form onSubmit={handleSave} className="max-w-2xl bg-surface-elevated p-8 rounded-2xl border border-border space-y-6">
        {saved && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-body-sm rounded-lg">
            Preferences updated successfully!
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-body-xs font-semibold text-text-secondary mb-1">
              Currency Symbol
            </label>
            <input
              type="text"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-body-xs font-semibold text-text-secondary mb-1">
              Electricity Rate ({currency}/kWh)
            </label>
            <input
              type="number"
              step="0.01"
              value={ratePerKwh}
              onChange={(e) => setRatePerKwh(e.target.value)}
              className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        <div>
          <label className="block text-body-xs font-semibold text-text-secondary mb-1">
            Grid Carbon Emission Factor (kg CO₂ / kWh)
          </label>
          <input
            type="number"
            step="0.01"
            value={carbonFactor}
            onChange={(e) => setCarbonFactor(e.target.value)}
            className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-primary"
          />
          <p className="text-body-xs text-text-secondary mt-1">
            Standard regional emission intensity for scope 2 calculation. Default: 0.82 kg/kWh.
          </p>
        </div>

        <div>
          <label className="block text-body-xs font-semibold text-text-secondary mb-1">
            Telemetry Retention Period (Days)
          </label>
          <input
            type="number"
            value={retentionDays}
            onChange={(e) => setRetentionDays(e.target.value)}
            className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-primary"
          />
        </div>

        <button type="submit" className="btn btn-primary py-2.5 px-6">
          Save Preferences
        </button>
      </form>
    </div>
  );
}
