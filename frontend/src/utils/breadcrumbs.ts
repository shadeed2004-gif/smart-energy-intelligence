// Page breadcrumb definitions
export const BREADCRUMBS: Record<string, { label: string; to?: string }[]> = {
  '/app/overview':        [{ label: 'Home', to: '/app/overview' }, { label: 'Dashboard Telemetry' }],
  '/app/analytics':       [{ label: 'Home', to: '/app/overview' }, { label: 'Energy Analytics' }],
  '/app/appliances':      [{ label: 'Home', to: '/app/overview' }, { label: 'Appliances' }],
  '/app/ai-insights':     [{ label: 'Home', to: '/app/overview' }, { label: 'AI Predictions & Insights' }],
  '/app/anomalies':       [{ label: 'Home', to: '/app/overview' }, { label: 'Anomaly Center' }],
  '/app/recommendations': [{ label: 'Home', to: '/app/overview' }, { label: 'Recommendations' }],
  '/app/automation':      [{ label: 'Home', to: '/app/overview' }, { label: 'Automation & Control' }],
  '/app/reports':         [{ label: 'Home', to: '/app/overview' }, { label: 'Reports' }],
  '/app/notifications':   [{ label: 'Home', to: '/app/overview' }, { label: 'Notifications' }],
  '/app/security':        [{ label: 'System' }, { label: 'Security & Audit' }],
  '/app/health':          [{ label: 'System' }, { label: 'System Health' }],
  '/app/devices':         [{ label: 'System' }, { label: 'Device Setup' }],
  '/app/settings':        [{ label: 'System' }, { label: 'Settings' }],
  '/app/profile':         [{ label: 'Account' }, { label: 'Profile & Permissions' }],
};
