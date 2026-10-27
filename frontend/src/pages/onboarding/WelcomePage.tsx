import { Link } from 'react-router-dom';

export function WelcomePage() {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-6">
      <div className="w-full max-w-lg bg-surface-elevated border border-border rounded-2xl p-8 space-y-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto text-3xl font-bold">
          ⚡
        </div>
        <h1 className="text-3xl font-extrabold text-text-primary">Welcome to Smart Energy</h1>
        <p className="text-body-md text-text-secondary">
          Let’s set up your home energy monitoring network. We’ll link your Home Assistant instance,
          configure tariff zones, and calibrate baseline appliance profiles.
        </p>

        <div className="grid grid-cols-3 gap-3 text-left py-2">
          <div className="p-3 bg-surface rounded-xl border border-border">
            <span className="text-xs text-primary font-bold">Step 1</span>
            <p className="text-xs font-semibold mt-1">Connect HA</p>
          </div>
          <div className="p-3 bg-surface rounded-xl border border-border">
            <span className="text-xs text-primary font-bold">Step 2</span>
            <p className="text-xs font-semibold mt-1">Set Tariffs</p>
          </div>
          <div className="p-3 bg-surface rounded-xl border border-border">
            <span className="text-xs text-primary font-bold">Step 3</span>
            <p className="text-xs font-semibold mt-1">AI Setup</p>
          </div>
        </div>

        <div className="pt-4 flex flex-col gap-3">
          <Link to="/setup" className="btn btn-primary py-3">
            Start Guided Setup
          </Link>
          <Link to="/app/overview" className="btn btn-outline py-2 text-body-sm">
            Skip to Dashboard (Demo Mode)
          </Link>
        </div>
      </div>
    </div>
  );
}
