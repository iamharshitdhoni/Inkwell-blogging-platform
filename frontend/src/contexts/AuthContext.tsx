import React, { createContext, useContext, useEffect, useState } from 'react';
import { authAPI } from '@/lib/api';

interface AuthUser {
  _id: string;
  name: string;
  email: string;
  username?: string;
  avatar?: string | null;
  role?: 'reader' | 'author' | 'admin';
  isActive?: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  // Role-based signup methods
  signUpAsUser: (name: string, email: string, password: string) => Promise<{ error: Error | null }>;
  signUpAsAuthor: (name: string, email: string, password: string) => Promise<{ error: Error | null }>;
  // Legacy signup (defaults to user role)
  signUp: (email: string, password: string, name: string) => Promise<{ error: Error | null }>;
  // Login - Same for all roles
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  // OTP-based authentication
  sendOTPForSignup: (email: string) => Promise<{ error: Error | null; expiresAt?: string }>;
  verifyOTPForSignup: (email: string, otp: string, name: string, username?: string, role?: string) => Promise<{ error: Error | null; token?: string; user?: AuthUser }>;
  sendOTPForLogin: (email: string) => Promise<{ error: Error | null; expiresAt?: string }>;
  verifyOTPForLogin: (email: string, otp: string) => Promise<{ error: Error | null; token?: string; user?: AuthUser }>;
  hasRole: (role: string) => boolean;
  isAuthor: () => boolean;
  isUser: () => boolean;
  isAdmin: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize from localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem('auth_token');
    const savedUser = localStorage.getItem('auth_user');
    if (savedToken) {
      setToken(savedToken);
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch (error) {
          console.error('Failed to parse saved user:', error);
        }
      } else {
        // Fallback: decode JWT to extract minimal user info
        try {
          const payload = JSON.parse(atob(savedToken.split('.')[1]));
          const userId = payload.id || payload.userId || payload._id || payload.user_id;
          setUser({
            _id: userId,
            name: '',
            email: payload.email || '',
            role: payload.role || 'reader', // Ensure role is set from JWT
          });
          console.log(`[AUTH CONTEXT] Loaded user from JWT fallback with role: '${payload.role}'`);
        } catch (error) {
          console.error('Failed to decode token:', error);
          localStorage.removeItem('auth_token');
        }
      }
    }
    setLoading(false);
  }, []);

  const signUp = async (email: string, password: string, name: string) => {
    // Legacy method - defaults to user role signup
    return signUpAsUser(name, email, password);
  };

  // Sign up as regular user (reader/viewer)
  const signUpAsUser = async (name: string, email: string, password: string) => {
    try {
      const response = await authAPI.signupUser({ name, email, password });
      
      // Don't auto-login - user must verify email first
      if (response && response.user) {
        // Store email temporarily for verification flow (optional)
        sessionStorage.setItem('pendingVerificationEmail', email);
      }

      return { error: null };
    } catch (error) {
      return { error: error instanceof Error ? error : new Error('User registration failed') };
    }
  };

  // Sign up as author (writer/content creator)
  const signUpAsAuthor = async (name: string, email: string, password: string) => {
    try {
      const response = await authAPI.signupAuthor({ name, email, password });
      
      // Don't auto-login - user must verify email first
      if (response && response.user) {
        // Store email temporarily for verification flow (optional)
        sessionStorage.setItem('pendingVerificationEmail', email);
      }

      return { error: null };
    } catch (error) {
      return { error: error instanceof Error ? error : new Error('Author registration failed') };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const response = await authAPI.login({ email, password });

      if (!response.token) {
        return { error: new Error(response.message || 'Login failed') };
      }

      // Save token and user data
      localStorage.setItem('auth_token', response.token);
      localStorage.setItem('auth_user', JSON.stringify(response.user));
      setToken(response.token);
      setUser(response.user);

      return { error: null };
    } catch (error) {
      const typedError = error instanceof Error ? error : new Error('Login failed');
      return { error: typedError };
    }
  };

  const signOut = async () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    setToken(null);
    setUser(null);
  };

  // ============================================================================
  // OTP-BASED AUTHENTICATION METHODS
  // ============================================================================

  const sendOTPForSignup = async (email: string) => {
    try {
      const result = await authAPI.sendSignupOTP(email);
      return { error: null, expiresAt: result.expiresAt };
    } catch (error) {
      const typedError = error instanceof Error ? error : new Error('Failed to send OTP');
      return { error: typedError };
    }
  };

  const verifyOTPForSignup = async (email: string, otp: string, name: string, username?: string, role?: string) => {
    try {
      const result = await authAPI.verifySignupOTP(email, otp, name, username, role);
      
      if (!result.token || !result.user) {
        return { 
          error: new Error(result.message || 'Verification failed') 
        };
      }

      // Save token and user data
      localStorage.setItem('auth_token', result.token);
      localStorage.setItem('auth_user', JSON.stringify(result.user));
      setToken(result.token);
      setUser(result.user);

      return { error: null, token: result.token, user: result.user };
    } catch (error) {
      const typedError = error instanceof Error ? error : new Error('OTP verification failed');
      return { error: typedError };
    }
  };

  const sendOTPForLogin = async (email: string) => {
    try {
      const result = await authAPI.sendLoginOTP(email);
      return { error: null, expiresAt: result.expiresAt };
    } catch (error) {
      const typedError = error instanceof Error ? error : new Error('Failed to send OTP');
      return { error: typedError };
    }
  };

  const verifyOTPForLogin = async (email: string, otp: string) => {
    try {
      const result = await authAPI.verifyLoginOTP(email, otp);
      
      if (!result.token || !result.user) {
        return { 
          error: new Error(result.message || 'Login verification failed') 
        };
      }

      // Save token and user data
      localStorage.setItem('auth_token', result.token);
      localStorage.setItem('auth_user', JSON.stringify(result.user));
      setToken(result.token);
      setUser(result.user);

      return { error: null, token: result.token, user: result.user };
    } catch (error) {
      const typedError = error instanceof Error ? error : new Error('OTP verification failed');
      return { error: typedError };
    }
  };

  const hasRole = (role: string) => {
    if (!user) return false;
    return user.role === role;
  };

  // Helper methods for common role checks
  const isAuthor = () => hasRole('writer');  // 'writer' is the new author role
  const isUser = () => hasRole('reader');    // 'reader' is the new user role
  const isAdmin = () => hasRole('admin');

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      loading, 
      signUpAsUser,
      signUpAsAuthor,
      signUp, 
      signIn, 
      signOut,
      sendOTPForSignup,
      verifyOTPForSignup,
      sendOTPForLogin,
      verifyOTPForLogin,
      hasRole,
      isAuthor,
      isUser,
      isAdmin,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
