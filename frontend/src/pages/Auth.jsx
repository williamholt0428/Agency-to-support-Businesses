import React, { useState } from 'react';

const Auth = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // In a real app, we'd call the API here
    onLogin();
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

        <form onSubmit={handleSubmit}>
          {!isLogin && (
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

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }}>
            {isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.875rem' }}>
          <span style={{ color: 'var(--text-muted)' }}>
            {isLogin ? "Don't have an account?" : "Already have an account?"}
          </span>{' '}
          <button 
            onClick={() => setIsLogin(!isLogin)}
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
