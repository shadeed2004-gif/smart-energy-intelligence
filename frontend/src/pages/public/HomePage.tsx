import { Link } from 'react-router-dom';

export function HomePage() {
  return (
    <div className="min-h-screen bg-surface text-text-primary flex flex-col">
      <header className="border-b border-border/40 backdrop-blur sticky top-0 z-50 bg-surface/80">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-surface font-bold text-lg">
              ⚡
            </div>
            <span className="font-bold text-title-md tracking-tight">Smart Energy Intelligence</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-body-sm text-text-secondary">
            <Link to="/features" className="hover:text-primary transition-colors">Features</Link>
            <Link to="/how-it-works" className="hover:text-primary transition-colors">How It Works</Link>
            <Link to="/about" className="hover:text-primary transition-colors">Architecture & About</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link to="/signin" className="btn btn-secondary">Sign In</Link>
            <Link to="/app/overview" className="btn btn-primary">Open Dashboard</Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="py-20 md:py-28 px-6 text-center max-w-5xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-body-xs font-semibold uppercase tracking-wider">
            <span>● Live Telemetry & IoT AI Layer</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-text-primary leading-tight">
            Residential Energy Intelligence <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-teal-400">
              Powered by Real-Time AI
            </span>
          </h1>
          <p className="text-body-lg text-text-secondary max-w-2xl mx-auto">
            Autonomous anomaly detection, predictive load forecasting, Home Assistant integration,
            and explainable recommendations to minimize grid consumption and carbon footprint.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link to="/app/overview" className="btn btn-primary text-base px-6 py-3">
              Explore Live Demo
            </Link>
            <Link to="/how-it-works" className="btn btn-outline text-base px-6 py-3">
              View System Flow
            </Link>
          </div>
        </section>

        <section className="py-16 bg-surface-elevated/40 border-y border-border">
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-surface border border-border space-y-3">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center text-xl font-bold">
                📊
              </div>
              <h3 className="text-title-md font-bold">Submetered Telemetry</h3>
              <p className="text-body-sm text-text-secondary">
                Sub-second sampling of voltage, current, active power, and reactive factor across critical circuits.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-surface border border-border space-y-3">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center text-xl font-bold">
                🧠
              </div>
              <h3 className="text-title-md font-bold">Hybrid AI Forecasting</h3>
              <p className="text-body-sm text-text-secondary">
                Combines statistical baseline regression with Isolation Forest and threshold ensembles for early warning.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-surface border border-border space-y-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-xl font-bold">
                🏠
              </div>
              <h3 className="text-title-md font-bold">Home Assistant Ready</h3>
              <p className="text-body-sm text-text-secondary">
                Bidirectional REST and WebSocket sync with smart plugs, relays, and localized edge Raspberry Pi setups.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8 text-center text-text-secondary text-body-xs">
        <p>© 2026 Smart Energy Intelligence Platform. Built for College Main Project & IoT Edge Deployment.</p>
      </footer>
    </div>
  );
}
