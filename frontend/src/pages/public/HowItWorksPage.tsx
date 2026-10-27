import { Link } from 'react-router-dom';

export function HowItWorksPage() {
  const steps = [
    {
      step: '01',
      title: 'Edge Ingestion & ESP32 / CT Clamps',
      desc: 'Hardware nodes sample mains lines using non-invasive SCT-013 current transformers and voltage divider circuits, publishing telemetry over MQTT or HTTP.'
    },
    {
      step: '02',
      title: 'Home Assistant Aggregation',
      desc: 'Local Home Assistant OS aggregates smart plug states (Sonoff/Shelly/Tuya) and mains meters, exposing standardized state endpoints.'
    },
    {
      step: '03',
      title: 'FastAPI Telemetry Engine & Store',
      desc: 'The Python backend ingests readings, calculates sliding averages, logs time-series data to SQLite/Timescale, and evaluates safety threshold limits.'
    },
    {
      step: '04',
      title: 'Autonomous AI Inference',
      desc: 'Machine learning workers compute rolling 24-hour demand forecasts, scan for anomalous consumption footprints, and formulate tariff-optimized shift advice.'
    },
    {
      step: '05',
      title: 'Interactive Dashboard & Actuation',
      desc: 'Users view live telemetry, acknowledge alerts, execute load-shedding commands, and trigger automated energy-saving schedules.'
    }
  ];

  return (
    <div className="min-h-screen bg-surface text-text-primary p-6 md:p-12">
      <div className="max-w-4xl mx-auto space-y-10">
        <div className="flex items-center justify-between border-b border-border pb-6">
          <div>
            <h1 className="text-3xl font-extrabold">System Architecture & Pipeline</h1>
            <p className="text-text-secondary text-body-md mt-1">
              How data flows from hardware sensors to real-time machine intelligence.
            </p>
          </div>
          <Link to="/app/overview" className="btn btn-primary">Open App</Link>
        </div>

        <div className="space-y-6">
          {steps.map((s, idx) => (
            <div key={idx} className="p-6 bg-surface-elevated rounded-2xl border border-border flex items-start gap-6">
              <div className="text-2xl font-black text-primary/40 font-mono">{s.step}</div>
              <div>
                <h3 className="text-title-md font-bold text-text-primary">{s.title}</h3>
                <p className="text-body-sm text-text-secondary mt-2 leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
