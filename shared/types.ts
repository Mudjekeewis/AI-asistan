// Shared types between frontend and backend

export interface User {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  username?: string;
  occupation?: string;
  company_name?: string;
  phone?: string;
  pic?: string;
  language: string;
  is_admin: boolean;
  roles: string[];
  created_at?: string;
  updated_at?: string;
}

export interface AuthResponse {
  success: boolean;
  user: User;
  token: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
}
