import React, { useState, useEffect } from 'react';
import { api } from '../api';
import StatusBanner from '../components/StatusBanner';

const Dashboard = ({ user }) => {
  const [data, setData] = useState({
    health: null,
    leads: [],
    campaigns: [],
    loading: true,
    error: null
  });

  useEffect(() => {
    async function load() {
      try {
        const [health, leadsData, campaignsData] = await Promise.all([
          api.health(),
          api.listLeads({ limit: 10 }),
          api.listCampaigns(),
        ]);
        setData({
          health,
          leads: leadsData.leads || [],
          campaigns: campaignsData.campaigns || [],
          loading: false,
          error: null
        });
      } catch (err) {
        setData(prev => ({ ...prev, loading: false, error: err.message }));
      }
    }
    load();
  }, []);

  if (data.loading) return <div className="loading"><div className="spinner"></div>Loading your dashboard...</div>;
  if (data.error) return <div className="card"><h3>Error</h3><p>{data.error}</p></div>;

  const stats = [
    { label: 'Total Leads', value: data.leads.length, trend: '+12%', up: true },
    { label: 'Contacted', value: data.leads.filter(l => l.status === 'contacted').length, trend: '+5%', up: true },
    { label: 'Interested', value: data.leads.filter(l => l.status === 'interested' || l.status === 'hot').length, trend: '+2%', up: true },
    { label: 'Hot Leads', value: data.leads.filter(l => l.status === 'hot').length, trend: '+1%', up: true },
  ];

  return (
    <div className="page">
      <StatusBanner health={data.health} />
      <div className="page-header">
        <h1 className="page-title">Welcome back, {user?.name || 'there'}</h1>
        <p className="page-subtitle">Here's what's happening with your sales pipeline today.</p>
      </div>

      <div className="stats-grid">
        {stats.map((stat, i) => (
          <div key={i} className="card stat-card">
            <div className="stat-label">{stat.label}</div>
            <div className="stat-value">{stat.value}</div>
            <div className={`stat-trend ${stat.up ? 'trend-up' : 'trend-down'}`}>
              {stat.up ? '↑' : '↓'} {stat.trend} <span style={{ color: 'var(--text-muted)' }}>from last week</span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        <div className="card">
          <div className="section-header">
            <h2 className="section-title">Recent Leads</h2>
            <button className="btn btn-secondary">View All</button>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Lead</th>
                  <th>Company</th>
                  <th>Status</th>
                  <th>Score</th>
                </tr>
              </thead>
              <tbody>
                {data.leads.map(lead => (
                  <tr key={lead.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{lead.name || 'Unknown'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{lead.email}</div>
                    </td>
                    <td>{lead.company || '—'}</td>
                    <td>
                      <span className={`badge badge-${lead.status === 'interested' || lead.status === 'hot' ? 'success' : 'info'}`}>
                        {lead.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ flex: 1, height: '4px', background: 'var(--bg-surface)', borderRadius: '2px' }}>
                          <div style={{ width: `${(lead.score || 0) * 10}%`, height: '100%', background: 'var(--primary)', borderRadius: '2px' }}></div>
                        </div>
                        {lead.score ? lead.score.toFixed(1) : '—'}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="section-header">
            <h2 className="section-title">Active Campaigns</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {data.campaigns.map(c => (
              <div key={c.id} style={{ padding: '16px', borderRadius: 'var(--radius-md)', background: 'var(--bg-surface)' }}>
                <div style={{ fontWeight: 600, marginBottom: '4px' }}>{c.name}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                  <span className="badge badge-success">{c.status}</span>
                  <span color="var(--text-muted)">{new Date(c.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
            {data.campaigns.length === 0 && <p>No active campaigns.</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
