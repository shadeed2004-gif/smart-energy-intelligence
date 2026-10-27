import { Outlet, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { useAuth } from '../../hooks/useAuth';
import { useSystemStatus } from '../../hooks/useSystemStatus';
import { BREADCRUMBS } from '../../utils/breadcrumbs';
import { useLocation } from 'react-router-dom';

export function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { haConnected, isDemo } = useSystemStatus();

  const crumbs = BREADCRUMBS[location.pathname] || [
    { label: 'Home', to: '/app/overview' },
    { label: 'Page' },
  ];

  return (
    <div className="min-h-screen bg-surface">
      <Sidebar user={user} isDemo={isDemo} haConnected={haConnected} />

      <div className="pl-[232px]">
        <TopBar
          breadcrumbs={crumbs}
          haConnected={haConnected}
          isDemo={isDemo}
          onNotificationsClick={() => navigate('/app/notifications')}
          onProfileClick={() => navigate('/app/profile')}
        />

        <main className="pt-16 min-h-screen">
          <div className="px-gutter-desktop py-lg max-w-[1440px] mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
