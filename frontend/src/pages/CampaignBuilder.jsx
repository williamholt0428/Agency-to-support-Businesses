import React, { useState } from 'react';
import { useToast } from '../hooks/useToast';

const CampaignBuilder = () => {
  const { addToast } = useToast();
  const [steps, setSteps] = useState([
    { id: 1, type: 'email', title: 'Initial Outreach', delay: 0, content: 'Hi {{name}}, noticed your work at {{company}}...' },
    { id: 2, type: 'delay', title: 'Wait 3 days', delay: 3 },
    { id: 3, type: 'email', title: 'Follow-up', delay: 3, content: 'Just circling back on my previous email...' },
  ]);

  const addStep = (type) => {
    const newStep = type === 'email' 
      ? { id: Date.now(), type: 'email', title: 'New Email', delay: 0, content: '' }
      : { id: Date.now(), type: 'delay', title: 'Wait 2 days', delay: 2 };
    setSteps([...steps, newStep]);
    addToast('Step added to campaign', 'success');
  };

  const removeStep = (id) => {
    setSteps(steps.filter(s => s.id !== id));
  };

  return (
    <div className="page">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 className="page-title">Campaign Builder</h1>
          <p className="page-subtitle">Design your multi-step outreach sequence.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-secondary">Save Draft</button>
          <button className="btn btn-primary" onClick={() => addToast('Campaign published!', 'success')}>Publish Campaign</button>
        </div>
      </div>

      <div className="card" style={{ background: 'var(--bg)', borderStyle: 'dashed', borderWidth: '2px', padding: '40px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
          {steps.map((step, index) => (
            <React.Fragment key={step.id}>
              <div className="card glass-card" style={{ width: '100%', maxWidth: '600px', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: step.type === 'email' ? 'var(--primary)' : 'var(--bg-surface)', display: 'flex', alignItems: 'center', justifyCenter: 'center', fontSize: '1rem' }}>
                      {step.type === 'email' ? '✉️' : '⏳'}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600 }}>{step.title}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {step.type === 'email' ? 'Automatic Email' : `Wait Period: ${step.delay} days`}
                      </div>
                    </div>
                  </div>
                  <button onClick={() => removeStep(step.id)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>✕</button>
                </div>

                {step.type === 'email' && (
                  <textarea 
                    className="input" 
                    placeholder="Email content..." 
                    rows="3" 
                    defaultValue={step.content}
                    style={{ background: 'rgba(0,0,0,0.2)', fontSize: '0.8125rem' }}
                  ></textarea>
                )}
              </div>
              
              {index < steps.length - 1 && (
                <div style={{ width: '2px', height: '30px', background: 'var(--border-strong)' }}></div>
              )}
            </React.Fragment>
          ))}

          <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
            <button className="btn btn-secondary" onClick={() => addStep('email')}>+ Add Email</button>
            <button className="btn btn-secondary" onClick={() => addStep('delay')}>+ Add Delay</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampaignBuilder;
