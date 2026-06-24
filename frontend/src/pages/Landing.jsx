import React from 'react';

const Landing = ({ onStart }) => {
  const features = [
    {
      title: 'Lead Finder',
      description: 'Automatically discover high-quality B2B leads tailored to your ideal customer profile.',
      icon: '🔍'
    },
    {
      title: 'AI Personalization',
      description: 'Every outreach message is unique, researched, and personalized by our advanced AI engine.',
      icon: '✍️'
    },
    {
      title: 'Multi-Step Campaigns',
      description: 'Build complex, automated follow-up sequences that feel completely human.',
      icon: '🚀'
    },
    {
      title: 'Smart Reply Handler',
      description: 'AI intelligently categorizes replies and handles basic questions so you only talk to hot leads.',
      icon: '📥'
    },
    {
      title: 'Hot Lead Detection',
      description: 'Get real-time alerts the moment a lead shows high intent or asks for a meeting.',
      icon: '🔥'
    },
    {
      title: 'Dashboard Analytics',
      description: 'Track every open, click, and reply with deep insights into your campaign performance.',
      icon: '📊'
    }
  ];

  const pricing = [
    {
      name: 'Starter',
      price: '$49',
      features: ['Up to 500 leads/mo', 'Basic AI personalization', 'Email support', 'Standard campaigns'],
      cta: 'Start Free Trial',
      popular: false
    },
    {
      name: 'Growth',
      price: '$129',
      features: ['Up to 2,500 leads/mo', 'Advanced AI personalization', 'Smart reply handler', 'Multi-step sequences'],
      cta: 'Start Free Trial',
      popular: true
    },
    {
      name: 'Scale',
      price: '$299',
      features: ['Unlimited leads', 'CRM Integrations', 'Custom AI training', 'Priority 24/7 support'],
      cta: 'Contact Sales',
      popular: false
    }
  ];

  return (
    <div className="landing-page">
      {/* Navigation */}
      <nav className="landing-nav fade-in">
        <div className="container">
          <div className="nav-content">
            <div className="sidebar-logo" style={{ padding: 0 }}>
              <img src="/logo.svg" alt="LeadFlow AI" />
              <span>LeadFlow AI</span>
            </div>
            <div className="nav-links">
              <a href="#features">Features</a>
              <a href="#pricing">Pricing</a>
              <button className="btn btn-secondary" onClick={onStart}>Sign In</button>
              <button className="btn btn-primary" onClick={onStart}>Get Started</button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section container">
        <div className="hero-content fade-in">
          <div className="badge badge-info" style={{ marginBottom: '24px', padding: '8px 16px' }}>
            ✨ Now with GPT-4o Powered Personalization
          </div>
          <h1 className="hero-title">
            Your AI Sales Rep <br />
            <span className="text-gradient">That Works 24/7</span>
          </h1>
          <p className="hero-subtitle">
            LeadFlow AI finds leads, crafts deeply personalized outreach, sends multi-step campaigns, 
            and handles replies. Save hours daily while never dropping a follow-up.
          </p>
          <div className="hero-ctas">
            <button className="btn btn-primary btn-lg" onClick={onStart}>Start 14-Day Free Trial</button>
            <button className="btn btn-secondary btn-lg">See How It Works</button>
          </div>
        </div>
        
        <div className="hero-preview fade-in" style={{ animationDelay: '0.2s' }}>
          <div className="card glass-card preview-card">
            <div className="preview-header">
              <div className="preview-dots">
                <span></span><span></span><span></span>
              </div>
            </div>
            <img src="/logo-mark.png" alt="App Preview" style={{ width: '100%', opacity: 0.8, borderRadius: '0 0 12px 12px' }} />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features-section container">
        <div className="section-header text-center">
          <h2 className="section-title">Everything you need to scale</h2>
          <p className="section-subtitle">Powerful AI tools designed to help you book more meetings with less effort.</p>
        </div>
        <div className="features-grid">
          {features.map((f, i) => (
            <div key={i} className="card feature-card">
              <div className="feature-icon">{f.icon}</div>
              <h3 className="feature-title">{f.title}</h3>
              <p className="feature-description">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="how-it-works container">
        <div className="section-header text-center">
          <h2 className="section-title">How LeadFlow Works</h2>
        </div>
        <div className="steps-container">
          <div className="step-item">
            <div className="step-number">1</div>
            <h3 className="step-title">Import Leads</h3>
            <p className="step-text">Upload your CSV or use our lead finder to build your target list.</p>
          </div>
          <div className="step-connector"></div>
          <div className="step-item">
            <div className="step-number">2</div>
            <h3 className="step-title">AI Crafts Outreach</h3>
            <p className="step-text">Our AI researches each lead to write truly personalized messages.</p>
          </div>
          <div className="step-connector"></div>
          <div className="step-item">
            <div className="step-number">3</div>
            <h3 className="step-title">AI Handles Replies</h3>
            <p className="step-text">LeadFlow handles the back-and-forth and notifies you of hot leads.</p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="pricing-section container">
        <div className="section-header text-center">
          <h2 className="section-title">Simple, transparent pricing</h2>
          <p className="section-subtitle">Choose the plan that's right for your stage of growth.</p>
        </div>
        <div className="pricing-grid">
          {pricing.map((p, i) => (
            <div key={i} className={`card pricing-card ${p.popular ? 'pricing-popular' : ''}`}>
              {p.popular && <div className="popular-badge">Most Popular</div>}
              <div className="pricing-name">{p.name}</div>
              <div className="pricing-price">
                <span className="price-value">{p.price}</span>
                <span className="price-period">/mo</span>
              </div>
              <ul className="pricing-features">
                {p.features.map((f, j) => (
                  <li key={j}><span>✓</span> {f}</li>
                ))}
              </ul>
              <button className={`btn ${p.popular ? 'btn-primary' : 'btn-secondary'} pricing-cta`} onClick={onStart}>
                {p.cta}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="container">
          <div className="footer-content">
            <div className="sidebar-logo" style={{ padding: 0 }}>
              <img src="/logo.svg" alt="LeadFlow AI" />
              <span>LeadFlow AI</span>
            </div>
            <div className="footer-links">
              <a href="#">Privacy Policy</a>
              <a href="#">Terms of Service</a>
              <a href="#">Contact</a>
            </div>
            <div className="footer-copyright">
              © 2026 LeadFlow AI. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
