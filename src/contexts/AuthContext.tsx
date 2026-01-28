import React, { createContext, useContext, ReactNode, useState, useEffect } from "react";

// Configuração
const BASE_URL = "https://api.skyvenda.com";

// Types for unified profile response from /user/profile
export type ProfileStats = {
  total_products: number;
  total_followers: number;
  total_following: number;
};

export type ProfileUser = {
  id: number;
  username: string;
  email?: string | null;
  name?: string | null;
  phone?: string | null;
  whatsapp_number?: string | null;
  blocked?: boolean | null;
  unique_identifier?: string | null;
  pro_account?: boolean | null;
  user_type?: string | null;
  referrals?: string | null;
  bio?: string | null;
  gender?: string | null;
  page_name?: string | null;
  active?: boolean | null;
  profile_image?: string | null;
  verification_status?: 'approved' | 'pending' | 'rejected' | 'verified' | 'unverified' | null;
  wallet_balance?: number | null;
};

export type UnifiedProfile = {
  context: 'public' | 'self' | string;
  is_authenticated: boolean;
  is_me: boolean;
  can_edit: boolean;
  is_following: boolean;
  is_follower: boolean;
  user: ProfileUser;
  stats: ProfileStats;
};

interface LoginResponse {
  access_token: string;
  token_type: string;
  id?: number;
}

interface AuthContextType {
  token: string | null;
  user: UnifiedProfile | null;
  baseUrl: string;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  getAuthHeaders: () => HeadersInit;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

const TOKEN_STORAGE_KEY = "skypdv_token";

export function AuthProvider({ children }: AuthProviderProps) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UnifiedProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const baseUrl = BASE_URL;

  const fetchUser = async (authToken: string) => {
    try {
      const response = await fetch(`${BASE_URL}/user/profile`, {
        headers: {
          "Authorization": `Bearer ${authToken}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setUser(data);
      }
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
    }
  };

  const refreshUser = async () => {
    if (token) {
      await fetchUser(token);
    }
  };

  // Carregar token do localStorage na inicialização
  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (storedToken) {
      setToken(storedToken);
      fetchUser(storedToken);
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<void> => {
    try {
      // Use x-www-form-urlencoded format as required by OAuth2PasswordRequestForm
      const params = new URLSearchParams();
      params.append('grant_type', 'password');
      params.append('username', username);
      params.append('password', password);
      params.append('scope', '');
      params.append('client_id', 'string');
      params.append('client_secret', 'string');

      const response = await fetch(`${BASE_URL}/user/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        let errorMessage = errorData.detail || errorData.message;

        if (response.status === 401 || response.status === 403) {
          errorMessage = "Credenciais inválidas. Verifique seu usuário e senha.";
        } else if (response.status === 404) {
          errorMessage = "Usuário não encontrado";
        } else if (response.status === 422) {
          errorMessage = "Dados inválidos. Verifique seu usuário e senha.";
        } else if (!errorMessage) {
          errorMessage = `Erro ao fazer login: ${response.status} ${response.statusText}`;
        }

        throw new Error(errorMessage);
      }

      const data: LoginResponse = await response.json();
      const accessToken = data.access_token;

      if (!accessToken) {
        throw new Error("Token de acesso não recebido");
      }

      setToken(accessToken);
      localStorage.setItem(TOKEN_STORAGE_KEY, accessToken);
      await fetchUser(accessToken);
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Erro desconhecido ao fazer login");
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  };

  const getAuthHeaders = (): HeadersInit => {
    if (!token) {
      return {
        "Content-Type": "application/json",
      };
    }
    return {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  };

  const isAuthenticated = !!token;

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        baseUrl,
        isAuthenticated,
        isLoading,
        login,
        logout,
        getAuthHeaders,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
