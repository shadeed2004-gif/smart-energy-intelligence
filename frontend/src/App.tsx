import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { AppLayout } from './components/layout/AppLayout';

// Public Pages
import { HomePage }          from './pages/public/HomePage';
import { FeaturesPage }      from './pages/public/FeaturesPage';
import { HowItWorksPage }    from './pages/public/HowItWorksPage';
import { AboutPage }         from './pages/public/AboutPage';
import { SignInPage }        from './pages/public/SignInPage';

// Onboarding
import { WelcomePage }       from './pages/onboarding/WelcomePage';
import { SetupPage }         from './pages/onboarding/SetupPage';

// App Pages
import { OverviewPage }      from './pages/app/OverviewPage';
import { AnalyticsPage }     from './pages/app/AnalyticsPage';
import { AppliancesPage }    from './pages/app/AppliancesPage';
import { ApplianceDetailPage } from './pages/app/ApplianceDetailPage';
import { AIInsightsPage }    from './pages/app/AIInsightsPage';
import { AnomaliesPage }     from './pages/app/AnomaliesPage';
import { AnomalyDetailPage } from './pages/app/AnomalyDetailPage';
import { RecommendationsPage } from './pages/app/RecommendationsPage';
import { AutomationPage }    from './pages/app/AutomationPage';
import { ReportsPage }       from './pages/app/ReportsPage';
import { NotificationsPage } from './pages/app/NotificationsPage';

// Admin Pages
import { SecurityPage }      from './pages/admin/SecurityPage';
import { SystemHealthPage }  from './pages/admin/SystemHealthPage';
import { DevicesPage }       from './pages/admin/DevicesPage';
import { SettingsPage }      from './pages/admin/SettingsPage';
import { ProfilePage }       from './pages/admin/ProfilePage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return (
    <div className="min-h-screen bg-surface flex items-center justify-center">
      <div className="flex flex-col items-center gap-md">
        <div className="w-12 h-12 border-4 border-primary-container border-t-transparent rounded-full animate-spin" />
        <span className="text-body-md text-secondary">Loading Smart Energy Intelligence…</span>
      </div>
    </div>
  );
  if (!isAuthenticated) return <Navigate to="/signin" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Website */}
          <Route path="/" element={<HomePage />} />
          <Route path="/features" element={<FeaturesPage />} />
          <Route path="/how-it-works" element={<HowItWorksPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/signin" element={<SignInPage />} />

          {/* Onboarding */}
          <Route path="/welcome" element={<WelcomePage />} />
          <Route path="/setup" element={<SetupPage />} />

          {/* Authenticated App */}
          <Route
            path="/app"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="overview" replace />} />
            <Route path="overview"        element={<OverviewPage />} />
            <Route path="analytics"       element={<AnalyticsPage />} />
            <Route path="appliances"      element={<AppliancesPage />} />
            <Route path="appliances/:id"  element={<ApplianceDetailPage />} />
            <Route path="ai-insights"     element={<AIInsightsPage />} />
            <Route path="anomalies"       element={<AnomaliesPage />} />
            <Route path="anomalies/:id"   element={<AnomalyDetailPage />} />
            <Route path="recommendations" element={<RecommendationsPage />} />
            <Route path="automation"      element={<AutomationPage />} />
            <Route path="reports"         element={<ReportsPage />} />
            <Route path="notifications"   element={<NotificationsPage />} />
            <Route path="security"        element={<SecurityPage />} />
            <Route path="health"          element={<SystemHealthPage />} />
            <Route path="devices"         element={<DevicesPage />} />
            <Route path="settings"        element={<SettingsPage />} />
            <Route path="profile"         element={<ProfilePage />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
