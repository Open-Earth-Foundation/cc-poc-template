export interface User {
  id: string;
  email: string;
  name: string;
  title?: string;
  projects: string[];
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface OAuthResponse {
  authUrl: string;
  state: string;
}

export interface LoginResponse {
  user: User;
}
