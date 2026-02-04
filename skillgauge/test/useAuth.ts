import { useState, useCallback, useEffect } from 'react';
import {
  User,
  loginUser,
  registerUser,
  getStoredToken,
  setStoredToken,
  clearStoredToken,
  getStoredUser,
  setStoredUser,
  clearStoredUser,
} from '@/services/api';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // Check for existing session on mount
  useEffect(() => {
    const token = getStoredToken();
    const user = getStoredUser();
    
    if (token && user) {
      setState({
        user,
        isAuthenticated: true,
        isLoading: false,
      });
    } else {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const { user, token } = await loginUser(email, password);
      setStoredToken(token);
      setStoredUser(user);
      
      setState({
        user,
        isAuthenticated: true,
        isLoading: false,
      });
      
      return { success: true };
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }));
      return { success: false, error: 'Login failed' };
    }
  }, []);

  const register = useCallback(async (email: string, password: string) => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const { user, token } = await registerUser(email, password);
      setStoredToken(token);
      setStoredUser(user);
      
      setState({
        user,
        isAuthenticated: true,
        isLoading: false,
      });
      
      return { success: true };
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }));
      return { success: false, error: 'Registration failed' };
    }
  }, []);

  const logout = useCallback(() => {
    clearStoredToken();
    clearStoredUser();
    setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
  }, []);

  return {
    ...state,
    login,
    register,
    logout,
  };
}
