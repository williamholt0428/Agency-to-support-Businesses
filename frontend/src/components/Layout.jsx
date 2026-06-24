import React from 'react';

const Sidebar = ({ currentView, setView }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'campaigns', label: 'Campaigns', icon: '🚀' },
    { id: 'leads', label: 'Leads', icon: '👥' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ];

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
          <div className="avatar">JD</div>
          <div className="user-info">
            <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>Jane Doe</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Pro Plan</div>
          </div>
        </div>
      </div>
    </aside>
  );
};

const Layout = ({ children, currentView, setView }) => {
  return (
    <div className="app-layout">
      <Sidebar currentView={currentView} setView={setView} />
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
