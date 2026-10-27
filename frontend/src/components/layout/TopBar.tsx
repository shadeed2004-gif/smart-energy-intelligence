import { Link } from 'react-router-dom';
import { clsx } from 'clsx';
import { useNotifications } from '../../hooks/useNotifications';

interface TopBarProps {
  breadcrumbs: { label: string; to?: string }[];
  haConnected: boolean;
  isDemo: boolean;
  onNotificationsClick?: () => void;
  onProfileClick?: () => void;
}

export function TopBar({ breadcrumbs, haConnected, isDemo, onNotificationsClick, onProfileClick }: TopBarProps) {
  const { unreadCount } = useNotifications();

  return (
    <header className="fixed top-0 left-[232px] right-0 h-16 bg-surface-container-lowest/90 backdrop-blur-xl shadow-nav z-40 flex items-center justify-between px-gutter-desktop">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-xs text-on-surface-variant" aria-label="Breadcrumb">
        {breadcrumbs.map((crumb, i) => (
          <span key={i} className="flex items-center gap-xs">
            {i > 0 && (
              <span className="material-symbols-outlined text-[16px] text-outline">chevron_right</span>
            )}
            {crumb.to && i < breadcrumbs.length - 1 ? (
              <Link to={crumb.to} className="text-body-md text-on-surface-variant hover:text-on-surface transition-colors">
                {crumb.label}
              </Link>
            ) : (
              <span className={clsx(
                i === breadcrumbs.length - 1
                  ? 'text-label-lg text-on-surface font-semibold'
                  : 'text-body-md'
              )}>
                {crumb.label}
              </span>
            )}
          </span>
        ))}
      </nav>

      {/* Status + Actions */}
      <div className="flex items-center gap-sm">
        {/* HA Connection */}
        <div className={clsx(
          'hidden sm:flex items-center gap-2xs px-sm py-1 rounded-full text-label-sm font-semibold',
          haConnected
            ? 'bg-surface-container-low text-primary'
            : 'bg-status-red-bg text-status-red-text'
        )}>
          <span className={clsx(
            'w-2 h-2 rounded-full',
            haConnected ? 'bg-primary-container animate-pulse' : 'bg-status-red-text'
          )} />
          <span>{haConnected ? 'Home Assistant • Connected' : 'Home Assistant • Offline'}</span>
        </div>

        {/* Demo Badge */}
        {isDemo && (
          <div className="hidden md:flex items-center px-sm py-1 rounded-full bg-surface-container text-secondary border border-outline-variant">
            <span className="text-label-sm font-semibold">Demo Data Active</span>
          </div>
        )}

        {/* Notifications Bell */}
        <button
          id="notifications-btn"
          onClick={onNotificationsClick}
          className="relative p-xs rounded-full hover:bg-surface-container transition-colors text-on-surface-variant hover:text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
          aria-label={`Notifications (${unreadCount} unread)`}
        >
          <span className="material-symbols-outlined text-[22px]">notifications</span>
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-error text-on-error text-[10px] flex items-center justify-center font-bold">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* Profile Avatar */}
        <button
          id="profile-btn"
          onClick={onProfileClick}
          className="w-8 h-8 rounded-full bg-primary flex items-center justify-center cursor-pointer hover:bg-primary-container transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          aria-label="Open profile menu"
        >
          <span className="material-symbols-outlined text-on-primary text-[18px]">person</span>
        </button>
      </div>
    </header>
  );
}
