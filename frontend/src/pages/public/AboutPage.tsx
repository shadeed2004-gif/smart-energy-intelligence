import { Link } from 'react-router-dom';

export function AboutPage() {
  return (
    <div className="min-h-screen bg-surface text-text-primary p-6 md:p-12">
      <div className="max-w-4xl mx-auto space-y-10">
        <div className="flex items-center justify-between border-b border-border pb-6">
          <div>
            <h1 className="text-3xl font-extrabold">About the Project</h1>
            <p className="text-text-secondary text-body-md mt-1">
              Final Year Computer Science & Data Science Capstone Project.
            </p>
          </div>
          <Link to="/app/overview" className="btn btn-primary">Dashboard</Link>
        </div>

        <div className="bg-surface-elevated p-8 rounded-2xl border border-border space-y-6">
          <h2 className="text-xl font-bold text-text-primary">Abstract & Motivation</h2>
          <p className="text-body-md text-text-secondary leading-relaxed">
            Unregulated peak residential electricity demand stresses distribution grids and inflates household utility bills.
            Traditional smart meters provide delayed billing information rather than actionable real-time telemetry.
            This project provides an open-source, edge-compatible energy intelligence platform that pairs non-invasive IoT hardware
            with local AI inference engines to detect anomalous consumption, predict day-ahead load curves, and automate load shedding.
          </p>

          <h3 className="text-lg font-semibold text-text-primary pt-2">Technology Stack</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="p-3 bg-surface rounded-xl border border-border">
              <span className="text-xs text-text-secondary uppercase">Backend</span>
              <p className="font-bold text-sm mt-1">FastAPI / Python</p>
            </div>
            <div className="p-3 bg-surface rounded-xl border border-border">
              <span className="text-xs text-text-secondary uppercase">Frontend</span>
              <p className="font-bold text-sm mt-1">React / Vite / TS</p>
            </div>
            <div className="p-3 bg-surface rounded-xl border border-border">
              <span className="text-xs text-text-secondary uppercase">AI / ML</span>
              <p className="font-bold text-sm mt-1">Scikit-Learn / Stats</p>
            </div>
            <div className="p-3 bg-surface rounded-xl border border-border">
              <span className="text-xs text-text-secondary uppercase">IoT Bridge</span>
              <p className="font-bold text-sm mt-1">Home Assistant</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
