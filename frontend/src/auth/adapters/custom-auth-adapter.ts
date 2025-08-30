import { AuthModel, UserModel } from '@/auth/lib/models';

const API_BASE_URL = '/api';

export class CustomAuthAdapter {
  private static instance: CustomAuthAdapter;
  private token: string | null = null;

  static getInstance(): CustomAuthAdapter {
    if (!CustomAuthAdapter.instance) {
      CustomAuthAdapter.instance = new CustomAuthAdapter();
    }
    return CustomAuthAdapter.instance;
  }

  private setToken(token: string) {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  private getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem('auth_token');
    }
    return this.token;
  }

  private clearToken() {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  async login(email: string, password: string): Promise<{ user: UserModel; token: string }> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Giriş başarısız');
    }

    const data = await response.json();
    this.setToken(data.token);
    
    return {
      user: this.mapUserData(data.user),
      token: data.token,
    };
  }

  async verifyToken(): Promise<UserModel | null> {
    const token = this.getToken();
    if (!token) {
      return null;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      if (!response.ok) {
        this.clearToken();
        return null;
      }

      const data = await response.json();
      return this.mapUserData(data.user);
    } catch (error) {
      this.clearToken();
      return null;
    }
  }

  async logout(): Promise<void> {
    this.clearToken();
  }

  async updateProfile(userData: Partial<UserModel>): Promise<UserModel> {
    const token = this.getToken();
    if (!token) {
      throw new Error('Token bulunamadı');
    }

    // Bu endpoint'i server'a eklemeniz gerekebilir
    const response = await fetch(`${API_BASE_URL}/auth/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      throw new Error('Profil güncellenemedi');
    }

    const data = await response.json();
    return this.mapUserData(data.user);
  }

  private mapUserData(userData: any): UserModel {
    return {
      id: userData.id,
      email: userData.email,
      first_name: userData.first_name || '',
      last_name: userData.last_name || '',
      username: userData.username || '',
      occupation: userData.occupation || '',
      company_name: userData.company_name || '',
      phone: userData.phone || '',
      pic: userData.pic || '',
      language: userData.language || 'tr',
      is_admin: userData.is_admin || false,
      roles: userData.roles || [],
      created_at: userData.created_at,
      updated_at: userData.updated_at,
    };
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}
