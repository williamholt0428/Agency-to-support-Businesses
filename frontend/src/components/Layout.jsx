import React from 'react';

const Sidebar = ({ currentView, setView, user }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'campaigns', label: 'Campaigns', icon: '🚀' },
    { id: 'leads', label: 'Leads', icon: '👥' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ];

  // Generate initials from user name
  const getInitials = (name) => {
    if (!name) return '??';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // Format subscription tier for display
  const formatTier = (tier) => {
    if (!tier) return 'Free Trial';
    return tier === 'trial' ? 'Free Trial' : tier.charAt(0).toUpperCase() + tier.slice(1);
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <img src="/logo.svg" alt="LeadFlow AI" />
        <span>LeadFlow AI</span>
      </div>
      
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            className={`nav-item ${currentView === item.id ? 'active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              setView(item.id);
            }}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </a>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-profile">
          <div className="avatar">{user ? getInitials(user.name) : '?'}</div>
          <div className="user-info">
            <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{user?.name || 'User'}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {formatTier(user?.subscription_tier)}
              {user?.trial_ends_at && user.subscription_tier === 'trial' && (
                <span> — ends {new Date(user.trial_ends_at).toLocaleDateString()}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

const Layout = ({ children, currentView, setView, user }) => {
  return (
    <div className="app-layout">
      <Sidebar currentView={currentView} setView={setView} user={user} />
      <main className="main-content">
        <header className="header-top">
          <button className="btn btn-secondary">
            <span>🔔</span>
          </button>
          <button className="btn btn-primary">
            + New Campaign
          </button>
        </header>
        <div className="fade-in">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;