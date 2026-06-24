import { useState } from 'react';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import CampaignBuilder from './pages/CampaignBuilder';
import LeadImport from './pages/LeadImport';
import Auth from './pages/Auth';
import Landing from './pages/Landing';
import { ToastProvider } from './hooks/useToast';

export default function App() {
  const [view, setView] = useState('dashboard');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAppStarted, setIsAppStarted] = useState(false);

  // If app hasn't started, show landing page
  if (!isAppStarted) {
    return (
      <Landing onStart={() => setIsAppStarted(true)} />
    );
  }

  // If app started but not authenticated, show auth
  if (!isAuthenticated) {
    return (
      <Auth onLogin={() => setIsAuthenticated(true)} />
    );
  }

  // Once authenticated, show main app layout
  return (
    <ToastProvider>
      <Layout currentView={view} setView={setView}>
        {view === 'dashboard' && <Dashboard />}
        {view === 'campaigns' && <CampaignBuilder />}
        {view === 'leads' && <LeadImport />}
        {view === 'settings' && (
          <div className="page">
            <div className="page-header">
              <h1 className="page-title">Settings</h1>
              <p className="page-subtitle">Manage your account and preferences.</p>
            </div>
            <div className="card">
              <p>Account settings coming soon...</p>
            </div>
          </div>
        )}
      </Layout>
    </ToastProvider>
  );
}
