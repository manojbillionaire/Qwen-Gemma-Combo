import axios from 'axios';

// Mock API for demonstration purposes. 
// In a real app, this would point to your backend.
const api = axios.create({
  baseURL: '', // Empty for relative paths or mock
});

// Mocking responses for Agency HQ
api.interceptors.request.use((config) => {
  // Return mock data for specific routes
  if (config.url === '/api/agency/advocates') {
    config.adapter = async () => ({
      data: [
        { _id: '2', name: 'Elena Rodriguez', email: 'elena@example.com', phone: '+1 555-0199', barCouncilNo: 'NY/9988/2010', specialisation: 'Cooperative', plan: 'Pro', status: 'active', joinedAt: '2026-02-15' }
      ],
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    });
  }
  
  if (config.url === '/api/agency/subscriptions') {
    config.adapter = async () => ({
      data: [
        { _id: '2', name: 'Elena Rodriguez', email: 'elena@example.com', plan: 'Pro', computedStatus: 'active', daysLeft: 12, paymentHistory: [{ paidAt: '2026-03-10', amount: 1500 }] }
      ],
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    });
  }

  if (config.url === '/api/agency/pending') {
    config.adapter = async () => ({
      data: [],
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    });
  }

  if (config.url === '/api/agency/affiliates') {
    config.adapter = async () => ({
      data: [
        { _id: 'aff1', name: 'Kerala Bar Assoc.', email: 'kba@example.com', code: 'KBA10', subscribers: ['1'], totalEarned: 500, state: 'Kerala', joined: '2026-01-01' }
      ],
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    });
  }

  if (config.url === '/api/agency/broadcasts') {
    config.adapter = async () => ({
      data: [
        { _id: 'b1', message: 'System maintenance scheduled for Sunday.', sentAt: '2026-03-20', tier: 'All', sentBy: 'Admin' }
      ],
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    });
  }

  if (config.url === '/api/agency/stats') {
    config.adapter = async () => ({
      data: { totalAdvocates: 2, pending: 1, affiliates: 1, broadcasts: 1, totalCases: 45 },
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    });
  }

  if (config.url === '/api/ai/consult') {
    config.adapter = async () => ({
      data: { reply: "Based on the current platform metrics, advocate engagement is up by 15% this month. The property law section is seeing the highest query volume from the Aluva region." },
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    });
  }

  if (config.url?.startsWith('/api/agency/approve/')) {
    config.adapter = async () => ({
      data: { success: true },
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    });
  }

  if (config.url?.startsWith('/api/agency/reject/')) {
    config.adapter = async () => ({
      data: { success: true },
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    });
  }

  if (config.url?.includes('/renew')) {
    config.adapter = async () => ({
      data: { success: true },
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    });
  }

  if (config.url?.includes('/reset-devices')) {
    config.adapter = async () => ({
      data: { success: true },
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    });
  }

  if (config.url?.includes('/suspend')) {
    config.adapter = async () => ({
      data: { success: true },
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    });
  }

  if (config.url === '/api/agency/broadcast' && config.method === 'post') {
    config.adapter = async () => ({
      data: { success: true },
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    });
  }

  if (config.url?.includes('/generate-link')) {
    config.adapter = async () => ({
      data: { link: `${window.location.origin}/signup?ref=MOCK${Math.floor(Math.random()*1000)}` },
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    });
  }

  if (config.url === '/api/agency/affiliates/create') {
    config.adapter = async () => ({
      data: { 
        success: true, 
        aff: { name: 'New Affiliate', code: 'NEW123' },
        link: `${window.location.origin}/signup?ref=NEW123`
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    });
  }

  return config;
});

export default api;
