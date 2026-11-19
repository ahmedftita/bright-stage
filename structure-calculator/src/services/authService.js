import { API_URL } from '../config';

const DEV_FALLBACK_USER = {
  _id: '000000000000000000000001',
  name: 'Jilani Wahi',
  email: 'jilani.wahi@gmail.com',
  role: 'Founder'
};

export const authService = {
  getToken: () => {
    return localStorage.getItem('token') || null;
  },

  getCurrentUser: () => {
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },

  login: async (email, password) => {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || 'Identifiants invalides');
      }

      const data = await response.json();
      if (data.token && data.user) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        return { success: true, user: data.user, token: data.token };
      }
      throw new Error('Réponse invalide du serveur');
    } catch (err) {
      // Offline fallback for known dev/admin credentials
      if (
        (email === 'jilani.wahi@gmail.com' && password === 'brightstage123') ||
        (email === 'admin@brightstage.com' && password === 'admin123')
      ) {
        const fallbackUser = {
          ...DEV_FALLBACK_USER,
          email,
          name: email.includes('jilani') ? 'Jilani Wahi' : 'Administrateur Bright Stage'
        };
        const mockToken = 'mock_jwt_token_' + Date.now();
        localStorage.setItem('token', mockToken);
        localStorage.setItem('user', JSON.stringify(fallbackUser));
        return { success: true, user: fallbackUser, token: mockToken, isOffline: true };
      }
      throw err;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
};
