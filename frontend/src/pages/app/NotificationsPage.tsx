import { useNotifications } from '../../hooks/useNotifications';
import { PageHeader, EmptyState } from '../../components/ui/index';
import { format, parseISO } from 'date-fns';

export function NotificationsPage() {
  const { notifications, unreadCount, markAllRead, markRead } = useNotifications();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Notification Center"
          subtitle={`Review system alerts, demand response events, and AI anomaly warnings (${unreadCount} unread)`}
        />
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="btn btn-secondary">
            Mark all as read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <EmptyState
          icon="🔔"
          title="No notifications"
          description="Your energy systems are operating normally. Any real-time alerts or recommendations will appear here."
        />
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => !n.is_read && markRead(n.id)}
              className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-4 ${
                n.is_read
                  ? 'bg-surface-elevated/40 border-border opacity-70'
                  : 'bg-surface-elevated border-primary/30 shadow-sm'
              }`}
            >
              <div
                className={`w-3 h-3 rounded-full mt-1.5 flex-shrink-0 ${
                  n.severity === 'critical'
                    ? 'bg-red-500'
                    : n.severity === 'warning'
                    ? 'bg-amber-500'
                    : 'bg-primary'
                }`}
              />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-semibold text-text-primary text-body-md">{n.title}</h4>
                  <span className="text-body-xs text-text-secondary">
                    {n.created_at ? format(parseISO(n.created_at), 'MMM dd, HH:mm') : 'Just now'}
                  </span>
                </div>
                <p className="text-body-sm text-text-secondary">{n.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
