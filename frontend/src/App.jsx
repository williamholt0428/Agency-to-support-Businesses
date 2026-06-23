import { useState, useEffect } from 'react';
import { api } from './api.js';

function Dashboard() {
  const [health, setHealth] = useState(null);
  const [leads, setLeads] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const [healthData, leadsData, campaignsData] = await Promise.all([
          api.health(),
          api.listLeads({ limit: 10 }),
          api.listCampaigns(),
        ]);
        setHealth(healthData);
        setLeads(leadsData.leads || []);
        setCampaigns(campaignsData.campaigns || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Compute stats
  const totalLeads = leads.length;
  const interestedLeads = leads.filter(l => l.status === 'interested' || l.status === 'hot').length;
  const contactedLeads = leads.filter(l => l.status === 'contacted').length;
  const pendingLeads = leads.filter(l => l.status === 'pending').length;

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        Connecting to LeadFlow AI...
      </div>
    );
  }

  if (error) {
    return (
      <div className="placeholder">
        <h3>⚠️ Connection Error</h3>
        <p>{error}</p>
        <button className="btn btn-primary" onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Stats Overview */}
      <div className="stats-grid">
        <div className="card">
          <div className="card-title">Total Leads</div>
          <div className="card-value">{totalLeads}</div>
        </div>
        <div className="card">
          <div className="card-title">Contacted</div>
          <div className="card-value">{contactedLeads}</div>
        </div>
        <div className="card">
          <div className="card-title">Interested</div>
          <div className="card-value">{interestedLeads}</div>
        </div>
        <div className="card">
          <div className="card-title">Pending</div>
          <div className="card-value">{pendingLeads}</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '32px' }}>
        <button className="btn btn-primary" onClick={() => alert('Lead import coming soon!')}>
          + Import Leads
        </button>
        <button className="btn btn-secondary" onClick={() => alert('Campaign builder coming soon!')}>
          New Campaign
        </button>
      </div>

      {/* Recent Leads */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="section-header">
          <h2 className="section-title">Recent Leads</h2>
          {totalLeads > 0 && (
            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              {totalLeads} total
            </span>
          )}
        </div>
        {leads.length === 0 ? (
          <div className="placeholder" style={{ padding: '40px 24px' }}>
            <h3>No leads yet</h3>
            <p>Import your first leads to get started with outreach campaigns.</p>
            <button className="btn btn-primary" onClick={() => alert('Lead import coming soon!')}>
              Import CSV
            </button>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Name</th>
                <th>Company</th>
                <th>Status</th>
                <th>Score</th>
              </tr>
            </thead>
            <tbody>
              {leads.map(lead => (
                <tr key={lead.id}>
                  <td>{lead.email}</td>
                  <td>{lead.name || '—'}</td>
                  <td>{lead.company || '—'}</td>
                  <td>
                    <span className={`badge badge-${lead.status === 'interested' || lead.status === 'hot' ? 'success' : lead.status === 'contacted' ? 'info' : lead.status === 'pending' ? 'warning' : 'info'}`}>
                      {lead.status}
                    </span>
                  </td>
                  <td>{lead.score ? lead.score.toFixed(1) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Campaigns Overview */}
      <div className="card">
        <div className="section-header">
          <h2 className="section-title">Campaigns</h2>
          {campaigns.length > 0 && (
            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              {campaigns.length} active
            </span>
          )}
        </div>
        {campaigns.length === 0 ? (
          <div className="placeholder" style={{ padding: '40px 24px' }}>
            <h3>No campaigns yet</h3>
            <p>Create your first multi-step outreach campaign.</p>
            <button className="btn btn-primary" onClick={() => alert('Campaign builder coming soon!')}>
              Create Campaign
            </button>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map(c => (
                <tr key={c.id}>
                  <td>{c.name}</td>
                  <td>
                    <span className={`badge badge-${c.status === 'active' ? 'success' : 'info'}`}>
                      {c.status}
                    </span>
                  </td>
                  <td>{new Date(c.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [view, setView] = useState('dashboard');

  return (
    <div className="app-container">
      <header className="header">
        <div className="header-logo">
          <img src="/favicon.svg" alt="LeadFlow AI" />
          <span>LeadFlow AI</span>
        </div>
        <nav className="header-nav">
          <a
            href="#dashboard"
            className={view === 'dashboard' ? 'active' : ''}
            onClick={(e) => { e.preventDefault(); setView('dashboard'); }}
          >
            Dashboard
          </a>
          <a
            href="#campaigns"
            className={view === 'campaigns' ? 'active' : ''}
            onClick={(e) => { e.preventDefault(); setView('campaigns'); }}
          >
            Campaigns
          </a>
          <a
            href="#leads"
            className={view === 'leads' ? 'active' : ''}
            onClick={(e) => { e.preventDefault(); setView('leads'); }}
          >
            Leads
          </a>
        </nav>
      </header>

      <main>
        {view === 'dashboard' && <Dashboard />}
        {view === 'campaigns' && (
          <div className="placeholder">
            <h3>Campaign Builder</h3>
            <p>Design multi-step outreach campaigns with drag-and-drop workflows.</p>
            <button className="btn btn-primary" onClick={() => alert('Campaign builder coming soon!')}>
              Create Campaign
            </button>
          </div>
        )}
        {view === 'leads' && (
          <div className="placeholder">
            <h3>Lead Management</h3>
            <p>Import, manage, and score your leads from a single interface.</p>
            <button className="btn btn-primary" onClick={() => alert('Lead import coming soon!')}>
              Import CSV
            </button>
          </div>
        )}
      </main>
    </div>
  );
}