import { useState } from 'react';
import { PageHeader } from '../../components/ui/index';
import api from '../../services/api';

export function ReportsPage() {
  const [reportType, setReportType] = useState('monthly');
  const [startDate, setStartDate] = useState(new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [exporting, setExporting] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState('');

  const handleExport = async (format: 'csv' | 'json') => {
    setExporting(true);
    setDownloadSuccess('');
    try {
      if (format === 'csv') {
        const res = await api.get(`/energy/export?format=csv&start_date=${startDate}&end_date=${endDate}`, {
          responseType: 'blob'
        });
        const url = window.URL.createObjectURL(new Blob([res.data]));
        const a = document.createElement('a');
        a.href = url;
        a.download = `energy_report_${startDate}_to_${endDate}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
      } else {
        const res = await api.get(`/energy/history?period=mtd`);
        const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `energy_report_${startDate}_to_${endDate}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
      }
      setDownloadSuccess(`Successfully exported ${format.toUpperCase()} report!`);
    } catch {
      setDownloadSuccess('Failed to generate export file. Please check server status.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Energy & Carbon Reports"
        subtitle="Generate verifiable audit reports, carbon disclosures, and consumption breakdowns."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-surface-elevated p-6 rounded-2xl border border-border space-y-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
            1
          </div>
          <h3 className="text-title-md font-semibold text-text-primary">Executive Summary</h3>
          <p className="text-body-sm text-text-secondary">
            High-level energy usage, peak tariff load shifting index, and carbon offset benchmarks.
          </p>
          <div className="pt-2">
            <button
              onClick={() => handleExport('csv')}
              disabled={exporting}
              className="btn btn-secondary w-full"
            >
              Export Summary CSV
            </button>
          </div>
        </div>

        <div className="bg-surface-elevated p-6 rounded-2xl border border-border space-y-4">
          <div className="w-10 h-10 rounded-xl bg-accent-green/10 text-accent-green flex items-center justify-center font-bold text-lg">
            2
          </div>
          <h3 className="text-title-md font-semibold text-text-primary">Compliance & Carbon</h3>
          <p className="text-body-sm text-text-secondary">
            Scope 2 greenhouse gas calculations based on local grid emission factor (0.82 kg CO₂/kWh).
          </p>
          <div className="pt-2">
            <button
              onClick={() => handleExport('json')}
              disabled={exporting}
              className="btn btn-secondary w-full"
            >
              Download GHG Dataset
            </button>
          </div>
        </div>

        <div className="bg-surface-elevated p-6 rounded-2xl border border-border space-y-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold text-lg">
            3
          </div>
          <h3 className="text-title-md font-semibold text-text-primary">Appliance Breakdown</h3>
          <p className="text-body-sm text-text-secondary">
            Detailed submetered logs per circuit, idle phantom loads, and anomaly cost impacts.
          </p>
          <div className="pt-2">
            <button
              onClick={() => handleExport('csv')}
              disabled={exporting}
              className="btn btn-secondary w-full"
            >
              Export Appliance CSV
            </button>
          </div>
        </div>
      </div>

      <div className="bg-surface-elevated p-6 rounded-2xl border border-border space-y-6">
        <h3 className="text-title-lg font-semibold text-text-primary">Custom Report Builder</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-body-sm font-medium text-text-secondary mb-1">Report Cadence</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-primary"
            >
              <option value="daily">Daily Granular Profile</option>
              <option value="weekly">Weekly Operational Digest</option>
              <option value="monthly">Monthly Utility Reconciliation</option>
              <option value="custom">Custom Date Range</option>
            </select>
          </div>

          <div>
            <label className="block text-body-sm font-medium text-text-secondary mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-body-sm font-medium text-text-secondary mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        {downloadSuccess && (
          <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg text-primary text-body-sm">
            {downloadSuccess}
          </div>
        )}

        <div className="flex gap-4">
          <button
            onClick={() => handleExport('csv')}
            disabled={exporting}
            className="btn btn-primary"
          >
            {exporting ? 'Generating Report…' : 'Generate & Download CSV'}
          </button>
          <button
            onClick={() => handleExport('json')}
            disabled={exporting}
            className="btn btn-outline"
          >
            Export as JSON
          </button>
        </div>
      </div>
    </div>
  );
}
