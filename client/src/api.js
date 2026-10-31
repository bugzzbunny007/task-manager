const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}/api/tasks${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (res.status === 204) return null;
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const api = {
  list:          (status) => request(status && status !== 'all' ? `?status=${status}` : ''),
  create:        (task)   => request('', { method: 'POST', body: JSON.stringify(task) }),
  update:        (id, patch) => request(`/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  remove:        (id)     => request(`/${id}`, { method: 'DELETE' }),
  addComment:    (id, body, author) => request(`/${id}/comments`, { method: 'POST', body: JSON.stringify({ body, author }) }),
  removeComment: (id, commentId)   => request(`/${id}/comments/${commentId}`, { method: 'DELETE' }),
};
