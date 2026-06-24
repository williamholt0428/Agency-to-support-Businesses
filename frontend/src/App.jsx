import { useState } from 'react';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import CampaignBuilder from './pages/CampaignBuilder';
import LeadImport from './pages/LeadImport';
import Auth from './pages/Auth';
import { ToastProvider } from './hooks/useToast';

export default function App() {
  const [view, setView] = useState('dashboard');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  if (!isAuthenticated) {
    return (
      <Auth onLogin={() => setIsAuthenticated(true)} />
    );
  }

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
