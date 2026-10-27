import { useAuth } from '../../hooks/useAuth';
import { PageHeader } from '../../components/ui/index';

export function ProfilePage() {
  const { user, logout } = useAuth();
  const displayName = user?.full_name || user?.username || 'Administrator';

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Profile & Account"
        subtitle="Manage personal settings, session details, and interface appearance."
      />

      <div className="max-w-2xl bg-surface-elevated p-8 rounded-2xl border border-border space-y-6">
        <div className="flex items-center gap-4 pb-6 border-b border-border">
          <div className="w-16 h-16 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-2xl">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="text-xl font-bold text-text-primary">{displayName}</h3>
            <p className="text-body-sm text-text-secondary">{user?.email || 'admin@smartenergy.local'}</p>
            <span className="inline-block mt-1 text-xs uppercase tracking-wider font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded">
              Role: {user?.role || 'System Operator'}
            </span>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-title-sm font-semibold text-text-primary">Session Info</h4>
          <div className="grid grid-cols-2 gap-4 text-body-sm">
            <div className="p-3 bg-surface rounded-xl border border-border">
              <span className="text-text-secondary text-xs">Auth Strategy</span>
              <p className="font-semibold text-text-primary mt-0.5">JWT Bearer (HS256)</p>
            </div>
            <div className="p-3 bg-surface rounded-xl border border-border">
              <span className="text-text-secondary text-xs">Account Status</span>
              <p className="font-semibold text-text-primary mt-0.5">
                {user?.is_active ? 'Active' : 'Pending'}
              </p>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-border flex gap-4">
          <button onClick={logout} className="btn btn-secondary text-red-400 hover:text-red-300">
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
