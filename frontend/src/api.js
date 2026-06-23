const API_BASE = '/api';

async function request(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const config = {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  };

  const res = await fetch(url, config);
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || `Request failed: ${res.status}`);
  }

  return data;
}

export const api = {
  // Health
  health: () => request('/health'),

  // Auth
  register: (body) => request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  getUser: (id) => request(`/auth/me/${id}`),

  // Leads
  listLeads: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/leads${qs ? `?${qs}` : ''}`);
  },
  uploadLeads: (body) => request('/leads/upload', { method: 'POST', body: JSON.stringify(body) }),
  getLead: (id) => request(`/leads/${id}`),
  updateLead: (id, body) => request(`/leads/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteLead: (id) => request(`/leads/${id}`, { method: 'DELETE' }),

  // Campaigns
  listCampaigns: (userId) => request(`/campaigns${userId ? `?userId=${userId}` : ''}`),
  createCampaign: (body) => request('/campaigns', { method: 'POST', body: JSON.stringify(body) }),
  getCampaign: (id) => request(`/campaigns/${id}`),
  updateCampaign: (id, body) => request(`/campaigns/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteCampaign: (id) => request(`/campaigns/${id}`, { method: 'DELETE' }),
};