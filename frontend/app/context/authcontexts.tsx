import React, { createContext, useState, useEffect, useContext, FC, PropsWithChildren } from 'react';
import * as SecureStore from 'expo-secure-store';
import authApi from '../../api/auth';
import apiClient from '../../api/client';

// Define the "contract" for your context's value
interface AuthContextType {
  token: string | null;
  user: any; // You can create a more specific User interface later
  isLoading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

// ✅ FIX: Use angle brackets <AuthContextType> for the type definition
const AuthContext = createContext<AuthContextType>({
  token: null,
  user: null,
  isLoading: true,
  login: async () => {}, // Default empty function to satisfy the type
  logout: async () => {}, // Default empty function
});

// The provider component, now correctly typed
export const AuthProvider: FC<PropsWithChildren<{}>> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuthState = async () => {
    try {
      const accessToken = await SecureStore.getItemAsync('access_token');
      if (accessToken) {
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        setToken(accessToken);
        const response = await authApi.getMe();
        setUser(response.data);
      }
    } catch (e) {
      console.log("Session restore failed:", e);
      await logout(); // Clear any invalid tokens
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuthState();
  }, []);

  const login = async (identifier : string, password: string) => {
    const response = await authApi.login({ identifier, password });
    const { access_token, refresh_token } = response.data;
    
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
    
    await SecureStore.setItemAsync('access_token', access_token);
    await SecureStore.setItemAsync('refresh_token', refresh_token);
    
    setToken(access_token);
    const userResponse = await authApi.getMe();
    setUser(userResponse.data);
  };

  const logout = async () => {
    setToken(null);
    setUser(null);
    delete apiClient.defaults.headers.common['Authorization'];
    await SecureStore.deleteItemAsync('access_token');
    await SecureStore.deleteItemAsync('refresh_token');
  };

  const value = {
    token,
    user,
    isLoading,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// This custom hook now correctly returns the AuthContextType
export const useAuth = () => useContext(AuthContext);
