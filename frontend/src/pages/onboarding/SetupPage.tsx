import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function SetupPage() {
  const navigate = useNavigate();
  const [haUrl, setHaUrl] = useState('http://homeassistant.local:8123');
  const [haToken, setHaToken] = useState('');
  const [currency, setCurrency] = useState('₹');
  const [ratePerKwh, setRatePerKwh] = useState('7.50');
  const [submitting, setSubmitting] = useState(false);

  const handleFinish = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      navigate('/app/overview');
    }, 800);
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-6">
      <div className="w-full max-w-xl bg-surface-elevated border border-border rounded-2xl p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold text-text-primary">System Configuration</h1>
          <p className="text-body-sm text-text-secondary mt-1">
            Configure integration parameters and electricity tariff pricing.
          </p>
        </div>

        <form onSubmit={handleFinish} className="space-y-4">
          <div>
            <label className="block text-body-xs font-semibold text-text-secondary mb-1">
              Home Assistant Instance URL
            </label>
            <input
              type="text"
              value={haUrl}
              onChange={(e) => setHaUrl(e.target.value)}
              required
              className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-body-xs font-semibold text-text-secondary mb-1">
              Long-Lived Access Token (Optional for demo)
            </label>
            <input
              type="password"
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
              value={haToken}
              onChange={(e) => setHaToken(e.target.value)}
              className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-body-xs font-semibold text-text-secondary mb-1">
                Currency Symbol
              </label>
              <input
                type="text"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                required
                className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-body-xs font-semibold text-text-secondary mb-1">
                Base Tariff (Cost per kWh)
              </label>
              <input
                type="number"
                step="0.01"
                value={ratePerKwh}
                onChange={(e) => setRatePerKwh(e.target.value)}
                required
                className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary flex-1 py-2.5 font-semibold"
            >
              {submitting ? 'Applying Settings…' : 'Save & Launch Dashboard'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
