import React, { useState } from 'react';
import { useToast } from '../hooks/useToast';

const LeadImport = () => {
  const { addToast } = useToast();
  const [file, setFile] = useState(null);
  const [mapping, setMapping] = useState({
    email: 'email',
    name: 'full_name',
    company: 'company_name'
  });

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      addToast(`File ${selectedFile.name} loaded`, 'success');
    }
  };

  const handleImport = () => {
    addToast('Importing leads... This may take a moment.', 'info');
    setTimeout(() => {
      addToast('Successfully imported 142 leads!', 'success');
      setFile(null);
    }, 2000);
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Import Leads</h1>
        <p className="page-subtitle">Upload a CSV file to add new leads to your database.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
        <div className="card">
          <h2 className="section-title" style={{ marginBottom: '24px' }}>1. Upload CSV</h2>
          <div 
            style={{ 
              border: '2px dashed var(--glass-border)', 
              borderRadius: 'var(--radius-lg)', 
              padding: '60px 40px', 
              textAlign: 'center',
              background: 'rgba(255, 255, 255, 0.02)',
              cursor: 'pointer'
            }}
            onClick={() => document.getElementById('csv-upload').click()}
          >
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📄</div>
            {file ? (
              <div>
                <div style={{ fontWeight: 600, color: 'var(--text)' }}>{file.name}</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{(file.size / 1024).toFixed(1)} KB</div>
              </div>
            ) : (
              <div>
                <div style={{ fontWeight: 600, color: 'var(--text)' }}>Click to upload or drag and drop</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>CSV files only (max 10MB)</div>
              </div>
            )}
            <input 
              id="csv-upload" 
              type="file" 
              accept=".csv" 
              onChange={handleFileChange} 
              style={{ display: 'none' }} 
            />
          </div>
        </div>

        <div className={`card ${!file ? 'disabled' : ''}`} style={{ opacity: file ? 1 : 0.5 }}>
          <h2 className="section-title" style={{ marginBottom: '24px' }}>2. Map Fields</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="form-group">
              <label className="label">Email Column (Required)</label>
              <select className="input" defaultValue="email">
                <option value="email">email</option>
                <option value="contact_email">contact_email</option>
              </select>
            </div>
            <div className="form-group">
              <label className="label">Full Name Column</label>
              <select className="input" defaultValue="full_name">
                <option value="full_name">full_name</option>
                <option value="first_name">first_name</option>
                <option value="name">name</option>
              </select>
            </div>
            <div className="form-group">
              <label className="label">Company Column</label>
              <select className="input" defaultValue="company_name">
                <option value="company_name">company_name</option>
                <option value="organization">organization</option>
              </select>
            </div>
            
            <button 
              className="btn btn-primary" 
              disabled={!file} 
              onClick={handleImport}
              style={{ marginTop: '12px' }}
            >
              Start Import
            </button>
          </div>
        </div>
      </div>

      {file && (
        <div className="card" style={{ marginTop: '32px' }}>
          <h2 className="section-title" style={{ marginBottom: '20px' }}>File Preview</h2>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>email</th>
                  <th>full_name</th>
                  <th>company_name</th>
                  <th>location</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>alex@example.com</td>
                  <td>Alex Rivera</td>
                  <td>TechFlow</td>
                  <td>San Francisco</td>
                </tr>
                <tr>
                  <td>sarah@cloudstack.io</td>
                  <td>Sarah Chen</td>
                  <td>CloudStack</td>
                  <td>Seattle</td>
                </tr>
                <tr>
                  <td>m.rodriguez@vortex.co</td>
                  <td>Maria Rodriguez</td>
                  <td>Vortex Solutions</td>
                  <td>Austin</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadImport;
