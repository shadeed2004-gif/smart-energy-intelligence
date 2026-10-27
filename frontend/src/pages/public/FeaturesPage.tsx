import { Link } from 'react-router-dom';

export function FeaturesPage() {
  const features = [
    {
      title: 'High-Frequency Energy Telemetry',
      desc: 'Ingests real-time power (W), current (A), voltage (V), and daily energy (kWh) with submetered device attribution.',
      tag: 'IoT Telemetry'
    },
    {
      title: 'ML Load Forecasting (24h Ahead)',
      desc: 'Predicts diurnal peak consumption windows and baseline loads using time-series features and environmental covariates.',
      tag: 'Machine Learning'
    },
    {
      title: 'Multi-Tier Anomaly Detection',
      desc: 'Flags vampire loads, sudden spikes, sustained overcurrent, and degraded appliance signatures with explainable scoring.',
      tag: 'AI Diagnostics'
    },
    {
      title: 'Home Assistant Integration',
      desc: 'Native REST integration with Home Assistant entities for non-intrusive monitoring and automated switch actuator control.',
      tag: 'Edge Computing'
    },
    {
      title: 'Safety Guardrails & Confirmations',
      desc: 'Strict software interlocking to protect essential devices (refrigerators, medical gear) from unintended automatic shutoff.',
      tag: 'Cybersecurity'
    },
    {
      title: 'Audit Trails & Carbon Accounting',
      desc: 'Automatic Scope 2 emissions estimation, carbon intensity awareness, and CSV/JSON reporting for audit readiness.',
      tag: 'Sustainability'
    }
  ];

  return (
    <div className="min-h-screen bg-surface text-text-primary p-6 md:p-12">
      <div className="max-w-6xl mx-auto space-y-10">
        <div className="flex items-center justify-between border-b border-border pb-6">
          <div>
            <h1 className="text-3xl font-extrabold">Platform Capabilities</h1>
            <p className="text-text-secondary text-body-md mt-1">
              End-to-end architecture bridging embedded edge sensors with intelligent cloud analytics.
            </p>
          </div>
          <Link to="/app/overview" className="btn btn-primary">Go to Dashboard</Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <div key={i} className="bg-surface-elevated p-6 rounded-2xl border border-border flex flex-col justify-between space-y-4">
              <div>
                <span className="text-xs uppercase font-bold tracking-wider text-primary bg-primary/10 px-2 py-1 rounded">
                  {f.tag}
                </span>
                <h3 className="text-title-md font-bold mt-3 text-text-primary">{f.title}</h3>
                <p className="text-body-sm text-text-secondary mt-2 leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
