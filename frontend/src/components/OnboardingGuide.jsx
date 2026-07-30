import React from 'react';
import { useToast } from '../hooks/useToast';

const OnboardingGuide = ({ setView }) => {
  const { addToast } = useToast();

  const steps = [
    {
      number: 1,
      title: "Import Your Leads",
      description: "Upload a CSV or connect your CRM to get started with high-quality prospects.",
      action: "Import Leads",
      view: "leads",
      icon: "📥"
    },
    {
      number: 2,
      title: "Build Your First Campaign",
      description: "Use the visual builder to create multi-step personalized sequences.",
      action: "Create Campaign",
      view: "campaigns",
      icon: "🚀"
    },
    {
      number: 3,
      title: "Launch & Monitor",
      description: "Send campaigns and let our AI handle replies while you track hot leads.",
      action: "Go to Dashboard",
      view: "dashboard",
      icon: "📊"
    }
  ];

  const handleStepClick = (view) => {
    setView(view);
    addToast('Opening view – get started now!', 'success');
  };

  return (
    <div className="onboarding-guide card" style={{ marginTop: '32px', padding: '40px' }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div className="badge badge-info" style={{ marginBottom: '16px' }}>🚀 Getting Started</div>
        <h2 className="section-title" style={{ fontSize: '2rem' }}>Your 3-Step Launch Plan</h2>
        <p className="page-subtitle">Follow these steps to start booking meetings with AI-powered outreach.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {steps.map((step) => (
          <div key={step.number} className="step-card" style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '20px',
            padding: '24px',
            background: 'var(--bg-surface)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--glass-border)'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              background: 'var(--primary)',
              color: 'white',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              flexShrink: 0
            }}>
              {step.icon}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>Step {step.number}</div>
                <h3 style={{ margin: 0, fontSize: '1.25rem' }}>{step.title}</h3>
              </div>
              <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>{step.description}</p>
              <button 
                onClick={() => handleStepClick(step.view)}
                className="btn btn-primary"
                style={{ padding: '8px 20px', fontSize: '0.9rem' }}
              >
                {step.action} →
              </button>
            </div>
          </div>
        ))}
      </div>

      <p style={{ textAlign: 'center', marginTop: '32px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
        Your AI sales rep is ready — let's build pipeline together.
      </p>
    </div>
  );
};

export default OnboardingGuide;
