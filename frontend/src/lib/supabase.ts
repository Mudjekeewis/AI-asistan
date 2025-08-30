// Custom API client instead of Supabase
const API_BASE_URL = 'http://localhost:3001/api';

export const apiClient = {
  async request(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(error.message || 'Request failed');
    }

    return response.json();
  },

  async get(endpoint: string) {
    return this.request(endpoint);
  },

  async post(endpoint: string, data: any) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async put(endpoint: string, data: any) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async delete(endpoint: string) {
    return this.request(endpoint, {
      method: 'DELETE',
    });
  },
};

// For backward compatibility, export a dummy supabase object
export const supabase = {
  auth: {
    signInWithPassword: async () => {
      throw new Error('Supabase is not available. Use custom auth instead.');
    },
    signUp: async () => {
      throw new Error('Supabase is not available. Use custom auth instead.');
    },
    signOut: async () => {
      throw new Error('Supabase is not available. Use custom auth instead.');
    },
    getUser: async () => {
      throw new Error('Supabase is not available. Use custom auth instead.');
    },
    getSession: async () => {
      throw new Error('Supabase is not available. Use custom auth instead.');
    },
    onAuthStateChange: () => {
      throw new Error('Supabase is not available. Use custom auth instead.');
    },
    resetPasswordForEmail: async () => {
      throw new Error('Supabase is not available. Use custom auth instead.');
    },
    updateUser: async () => {
      throw new Error('Supabase is not available. Use custom auth instead.');
    },
    resend: async () => {
      throw new Error('Supabase is not available. Use custom auth instead.');
    },
  },
};
