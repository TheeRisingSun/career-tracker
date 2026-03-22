import { config } from './config.js';
const BASE = `${config.apiBase}/api`.replace(/\/+/g, '/');

async function request(path, options = {}) {
  const url = path.startsWith('/') ? `${BASE}${path}` : `${BASE}/${path}`;
  const token = localStorage.getItem('token');
  const headers = { 
    'Content-Type': 'application/json', 
    ...options.headers 
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    ...options,
    headers,
  });

  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));

  if (res.status === 401) {
    localStorage.removeItem('token');
    window.location.href = '/login';
  }

  if (!res.ok) {
    const message = data?.error || res.statusText || 'Request failed';
    const err = new Error(message);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export const api = {
  auth: {
    login: async (email, password) => {
      const data = await request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      localStorage.setItem('token', data.token);
      return data;
    },
    signup: async (email, password, name) => {
      const data = await request('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ email, password, name }),
      });
      localStorage.setItem('token', data.token);
      return data;
    },
    me: async () => {
      const user = await request('/auth/me');
      localStorage.setItem('user', JSON.stringify(user));
      return user;
    },
    logout: () => {
      localStorage.removeItem('token');
      window.location.href = '/login';
    },
  },
  todos: {
    list: () => request('/todos'),
    add: (text) => request('/todos', { method: 'POST', body: JSON.stringify({ text }) }),
    update: (id, body) => request(`/todos/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    remove: (id) => request(`/todos/${id}`, { method: 'DELETE' }),
  },
  daily: {
    hours: () => request('/daily/hours'),
    logHours: (date, hours) => request('/daily/hours', { method: 'POST', body: JSON.stringify({ date, hours }) }),
    streak: () => request('/daily/streak'),
    sessions: () => request('/daily/sessions'),
    logSession: (body) => request('/daily/sessions', { method: 'POST', body: JSON.stringify(body) }),
  },
  syllabus: {
    get: () => request('/syllabus'),
    config: () => request('/syllabus/config'),
    setTopicCompleted: (topicId, completed) =>
      request(`/syllabus/topics/${topicId}`, { method: 'PATCH', body: JSON.stringify({ completed }) }),
    stats: () => request('/syllabus/stats'),
  },
  records: {
    list: () => request('/records'),
    add: (body) => request('/records', { method: 'POST', body: JSON.stringify(body) }),
    update: (id, body) => request(`/records/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    remove: (id) => request(`/records/${id}`, { method: 'DELETE' }),
  },
  dashboard: () => request('/dashboard'),
  notes: {
    gsPapers: () => request('/notes/gs-papers'),
    structure: () => request('/notes/structure'),
    upload: (formData) =>
      fetch(`${BASE}/notes/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData,
      }).then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || res.statusText);
        return data;
      }),
    downloadPath: (relativePath) => `${BASE}/notes/download?path=${encodeURIComponent(relativePath)}`,
    downloadBlob: (relativePath) => fetch(`${BASE}/notes/download?path=${encodeURIComponent(relativePath)}`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    }).then(res => {
      if (!res.ok) throw new Error('Download failed');
      return res.blob();
    }),
    getContent: (relativePath) => request(`/notes/content?path=${encodeURIComponent(relativePath)}`),
    saveContent: (relativePath, content) => request('/notes/content', {
      method: 'POST',
      body: JSON.stringify({ path: relativePath, content })
    }),
  },
  links: {
    list: () => request('/links'),
    add: (body) => request('/links', { method: 'POST', body: JSON.stringify(body) }),
    remove: (id) => request(`/links/${id}`, { method: 'DELETE' }),
    gsPapers: () => request('/links/gs-papers'),
  },
  boards: {
    list: () => request('/boards'),
    get: (id) => request(`/boards/${id}`),
    create: (body) => request('/boards', { method: 'POST', body: JSON.stringify(body) }),
    update: (id, body) => request(`/boards/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    remove: (id) => request(`/boards/${id}`, { method: 'DELETE' }),
  },
  routine: {
    get: () => request('/routine'),
    update: (data) => request('/routine', { method: 'PUT', body: JSON.stringify(data) }),
  },
  docs: {
    roadmapPdf: () => `${BASE}/docs/roadmap`,
    roadmapBlob: () => fetch(`${BASE}/docs/roadmap`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    }).then(res => {
      if (!res.ok) throw new Error('Failed to load PDF');
      return res.blob();
    }),
  },
};
