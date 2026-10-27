import { NavLink, useLocation } from 'react-router-dom';
import { clsx } from 'clsx';

interface NavItem {
  to: string;
  icon: string;
  label: string;
}

const mainNav: NavItem[] = [
  { to: '/app/overview',       icon: 'grid_view',        label: 'Overview'           },
  { to: '/app/analytics',      icon: 'monitoring',       label: 'Energy Analytics'   },
  { to: '/app/appliances',     icon: 'bolt',             label: 'Appliances'         },
  { to: '/app/ai-insights',    icon: 'auto_awesome',     label: 'AI Insights'        },
  { to: '/app/anomalies',      icon: 'warning',          label: 'Anomaly Center'     },
  { to: '/app/recommendations',icon: 'lightbulb',        label: 'Recommendations'    },
  { to: '/app/automation',     icon: 'tune',             label: 'Automation & Control'},
  { to: '/app/reports',        icon: 'description',      label: 'Reports'            },
  { to: '/app/notifications',  icon: 'notifications',    label: 'Notifications'      },
];

const systemNav: NavItem[] = [
  { to: '/app/security',       icon: 'verified_user',    label: 'Security & Audit'   },
  { to: '/app/health',         icon: 'dns',              label: 'System Health'      },
  { to: '/app/devices',        icon: 'power',            label: 'Device Setup'       },
  { to: '/app/settings',       icon: 'settings',         label: 'Settings'           },
];

interface SidebarProps {
  user?: { full_name?: string; username: string; role: string };
  isDemo: boolean;
  haConnected: boolean;
}

export function Sidebar({ user, isDemo, haConnected }: SidebarProps) {
  return (
    <aside className="fixed left-0 top-0 h-full w-[232px] bg-surface-container-lowest z-50 flex flex-col justify-between shadow-nav">
      <div className="flex flex-col flex-1 min-h-0">
        {/* Logo */}
        <div className="h-16 px-md flex items-center gap-xs border-b border-outline-variant/50">
          <div className="w-8 h-8 rounded-lg bg-primary-container flex items-center justify-center">
            <span className="material-symbols-outlined text-on-primary text-[18px]">bolt</span>
          </div>
          <div className="flex flex-col">
            <span className="text-label-lg font-semibold text-primary leading-none">Smart Energy</span>
            <span className="text-label-sm text-secondary tracking-wider uppercase leading-none mt-2xs">Intelligence</span>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto px-xs py-xs">
          <nav className="flex flex-col gap-2xs">
            {mainNav.map((item) => (
              <SidebarLink key={item.to} {...item} />
            ))}

            <div className="pt-md pb-2xs px-sm">
              <span className="text-label-sm uppercase tracking-wider text-secondary font-semibold">System</span>
            </div>

            {systemNav.map((item) => (
              <SidebarLink key={item.to} {...item} />
            ))}
          </nav>
        </div>
      </div>

      {/* User + Status Footer */}
      <div className="p-xs bg-surface-container-low/60 m-xs rounded-xl flex flex-col gap-xs">
        <div className="flex items-center gap-xs px-2xs">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-on-primary text-[18px]">person</span>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-label-md text-on-surface truncate font-medium">
              {user?.full_name || user?.username || 'User'}
            </span>
            <span className="text-label-sm text-secondary truncate capitalize">
              {user?.role || 'viewer'}
            </span>
          </div>
        </div>
        <div className="px-2xs py-2xs rounded bg-surface-container-highest/50 flex items-center gap-2xs">
          <span className={clsx(
            'w-1.5 h-1.5 rounded-full shrink-0',
            haConnected ? 'bg-primary-container' : 'bg-outline'
          )} />
          <span className="text-label-sm text-on-surface-variant truncate">
            {haConnected ? 'RPi Local • Home Assistant' : 'Home Assistant: Offline'}
          </span>
        </div>
        {isDemo && (
          <div className="px-2xs py-1 rounded bg-status-amber-bg border border-status-amber-border flex items-center gap-2xs">
            <span className="material-symbols-outlined text-status-amber-text text-[14px]">science</span>
            <span className="text-label-sm text-status-amber-text font-semibold">Demo Data Active</span>
          </div>
        )}
      </div>
    </aside>
  );
}

function SidebarLink({ to, icon, label }: NavItem) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        clsx(
          'flex items-center gap-xs px-sm py-xs rounded-lg transition-all duration-150',
          isActive
            ? 'bg-surface-container-low text-primary-container font-semibold'
            : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
        )
      }
    >
      <span className="material-symbols-outlined text-[20px]">{icon}</span>
      <span className="text-body-md">{label}</span>
    </NavLink>
  );
}
