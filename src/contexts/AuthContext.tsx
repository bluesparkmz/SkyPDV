import React, { createContext, useCallback, useContext, ReactNode, useEffect, useState } from "react";
import { ACCOUNTS_URL, API_URL, PRODUCT_CODE } from "@/config";

const BASE_URL = API_URL;

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
  verification_status?: "approved" | "pending" | "rejected" | "verified" | "unverified" | null;
  wallet_balance?: number | null;
};

export type UnifiedProfile = {
  context: "public" | "self" | string;
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
  accountsUrl: string;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  loginWithBlueSpark: (nextPath?: string) => void;
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
  const accountsUrl = ACCOUNTS_URL;

  const fetchUser = async (authToken: string) => {
    try {
      const response = await fetch(`${BASE_URL}/user/profile`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data);
        return;
      }

      if (response.status === 401) {
        setToken(null);
        setUser(null);
        localStorage.removeItem(TOKEN_STORAGE_KEY);
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

  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (storedToken) {
      setToken(storedToken);
      void fetchUser(storedToken);
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<void> => {
    const identifier = username.trim();
    if (!identifier || !password.trim()) {
      throw new Error("Informe o email/utilizador e a senha.");
    }

    const response = await fetch(`${ACCOUNTS_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        identifier,
        password,
        product_code: PRODUCT_CODE,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      let errorMessage = errorData.detail || errorData.message;

      if (response.status === 401 || response.status === 403) {
        errorMessage = "Credenciais inválidas. Verifique seu email/utilizador e senha.";
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
  };

  const loginWithBlueSpark = (nextPath: string = "/") => {
    const callbackUrl = `${window.location.origin}/auth/skypdv?next=${encodeURIComponent(nextPath)}`;
    const loginUrl =
      `${ACCOUNTS_URL}/auth/google/start` +
      `?product_code=${encodeURIComponent(PRODUCT_CODE)}` +
      `&next=${encodeURIComponent(callbackUrl)}`;
    window.location.href = loginUrl;
  };

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }, []);

  useEffect(() => {
    const handleLogout = () => {
      logout();
    };
    window.addEventListener("skypdv:logout", handleLogout);
    return () => {
      window.removeEventListener("skypdv:logout", handleLogout);
    };
  }, [logout]);

  const getAuthHeaders = (): HeadersInit => {
    if (!token) {
      return {
        "Content-Type": "application/json",
      };
    }

    return {
      Authorization: `Bearer ${token}`,
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
        accountsUrl,
        isAuthenticated,
        isLoading,
        login,
        loginWithBlueSpark,
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
