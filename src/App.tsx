import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { ProfileProvider, useProfile } from './hooks/useProfile';
import { TabBar } from './components/TabBar';
import { Welcome } from './screens/Welcome';
import { Onboarding } from './screens/Onboarding';
import { Dashboard } from './screens/Dashboard';
import { FastSetup } from './screens/FastSetup';
import { ActiveFast } from './screens/ActiveFast';
import { Refeed } from './screens/Refeed';
import { History } from './screens/History';
import { Achievements } from './screens/Achievements';
import { Profile } from './screens/Profile';
import { Learn } from './screens/Learn';
import { NotificationHost } from './notify/NotificationHost';

export function App() {
  const { user, loading } = useAuth();

  if (loading) return <SplashScreen />;
  if (!user) {
    return (
      <Routes>
        <Route path="*" element={<Welcome />} />
      </Routes>
    );
  }

  // Signed in (or demo) → load profile and gate onboarding.
  return (
    <ProfileProvider>
      <SignedInApp />
    </ProfileProvider>
  );
}

function SignedInApp() {
  const { profile, loading } = useProfile();
  const location = useLocation();

  if (loading) return <SplashScreen />;

  const onboarded = profile?.onboarded;
  const onOnboarding = location.pathname === '/onboarding';

  if (!onboarded && !onOnboarding) {
    return <Navigate to="/onboarding" replace />;
  }
  if (onboarded && onOnboarding) {
    return <Navigate to="/" replace />;
  }

  if (onOnboarding) {
    return (
      <div className="app-shell">
        <main className="app-main">
          <Onboarding />
        </main>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <NotificationHost />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/fast/new" element={<FastSetup />} />
          <Route path="/fast/:id" element={<ActiveFast />} />
          <Route path="/fast/:id/refeed" element={<Refeed />} />
          <Route path="/history" element={<History />} />
          <Route path="/achievements" element={<Achievements />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/learn" element={<Learn />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <TabBar />
    </div>
  );
}

function SplashScreen() {
  return (
    <div className="center-screen">
      <div className="splash-mark" />
      <p className="muted" style={{ marginTop: 16 }}>
        Puranova
      </p>
    </div>
  );
}
