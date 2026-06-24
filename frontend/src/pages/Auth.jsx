import React, { useState } from 'react';
import { api } from '../api';

const Auth = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    company: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      let result;

      if (isLogin) {
        // Login — find user by email
        result = await api.login({ email: formData.email });
      } else {
        // Register — create new user with 14-day trial
        result = await api.register({
          email: formData.email,
          name: formData.name,
          company: formData.company || undefined,
        });

        // Show trial success message briefly before proceeding
        const trialEnd = new Date(result.user.trial_ends_at);
        const daysLeft = Math.ceil((trialEnd - new Date()) / (1000 * 60 * 60 * 24));
        setSuccessMessage(
          `🎉 Account created! Your 14-day free trial is active (ends ${trialEnd.toLocaleDateString()}).`
        );

        // Brief pause so user sees the success message
        await new Promise(resolve => setTimeout(resolve, 1500));
      }

      // Pass the full user object to the app
      onLogin(result.user);
    } catch (err) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      padding: '24px'
    }}>
      <div className="card" style={{ width: '100%', maxWidth: '400px', padding: '40px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <img src="/logo.svg" alt="LeadFlow AI" style={{ width: '48px', height: '48px', marginBottom: '16px' }} />
          <h1 style={{ fontSize: '1.5rem' }}>{isLogin ? 'Welcome Back' : 'Create Account'}</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            {isLogin ? 'Enter your credentials to access LeadFlow AI' : 'Start your 14-day free trial today'}
          </p>
        </div>

        {/* Success message (e.g., after registration) */}
        {successMessage && (
          <div style={{
            padding: '12px 16px',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: 'var(--success)',
            fontSize: '0.875rem',
            marginBottom: '20px',
            textAlign: 'center',
          }}>
            {successMessage}
          </div>
        )}

        {/* Error message */}
        {error && (
          <div style={{
            padding: '12px 16px',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: 'var(--error)',
            fontSize: '0.875rem',
            marginBottom: '20px',
            textAlign: 'center',
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <>
              <div className="form-group">
                <label className="label">Full Name</label>
                <input 
                  type="text" 
                  className="input" 
                  placeholder="John Doe" 
                  required 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label className="label">Company (optional)</label>
                <input 
                  type="text" 
                  className="input" 
                  placeholder="Acme Corp" 
                  value={formData.company}
                  onChange={(e) => setFormData({...formData, company: e.target.value})}
                />
              </div>
            </>
          )}
          <div className="form-group">
            <label className="label">Email Address</label>
            <input 
              type="email" 
              className="input" 
              placeholder="name@company.com" 
              required 
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
          </div>
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <label className="label" style={{ marginBottom: 0 }}>Password</label>
              {isLogin && <a href="#forgot" style={{ fontSize: '0.75rem' }}>Forgot password?</a>}
            </div>
            <input 
              type="password" 
              className="input" 
              placeholder="••••••••" 
              required 
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', marginTop: '8px', opacity: loading ? 0.7 : 1 }}
            disabled={loading}
          >
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px', margin: 0 }}></span>
                {isLogin ? 'Signing in...' : 'Creating account...'}
              </span>
            ) : (
              isLogin ? 'Sign In' : 'Create Account'
            )}
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.875rem' }}>
          <span style={{ color: 'var(--text-muted)' }}>
            {isLogin ? "Don't have an account?" : "Already have an account?"}
          </span>{' '}
          <button 
            onClick={() => { setIsLogin(!isLogin); setError(null); setSuccessMessage(null); }}
            style={{ 
              background: 'none', 
              border: 'none', 
              color: 'var(--primary-light)', 
              fontWeight: 600, 
              cursor: 'pointer',
              padding: 0
            }}
          >
            {isLogin ? 'Sign Up' : 'Log In'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;