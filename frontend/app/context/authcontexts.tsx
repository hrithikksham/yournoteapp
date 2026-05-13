
import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  FC,
  PropsWithChildren,
} from 'react';

import * as SecureStore from 'expo-secure-store';

import authApi from '../../api/auth';
import apiClient from '../../api/client';

interface AuthContextType {
  token: string | null;
  user: any;
  isLoading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  token: null,
  user: null,
  isLoading: true,
  login: async () => {},
  logout: async () => {},
});

export const AuthProvider: FC<PropsWithChildren<{}>> = ({
  children,
}) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = async () => {
    setToken(null);
    setUser(null);

    delete apiClient.defaults.headers.common['Authorization'];

    await SecureStore.deleteItemAsync('access_token');
    await SecureStore.deleteItemAsync('refresh_token');
  };

  const restoreSession = async () => {
    try {
      let accessToken =
        await SecureStore.getItemAsync('access_token');

      const refreshToken =
        await SecureStore.getItemAsync('refresh_token');

      if (!accessToken && !refreshToken) {
        return;
      }

      // Try existing access token first
      if (accessToken) {
        try {
          apiClient.defaults.headers.common[
            'Authorization'
          ] = `Bearer ${accessToken}`;

          const response = await authApi.getMe();

          setToken(accessToken);
          setUser(response.data);

          return;
        } catch (error) {
          console.log(
            'Access token expired, trying refresh...'
          );
        }
      }

      // Refresh token flow
      if (refreshToken) {
        const refreshResponse =
          await authApi.refreshToken(refreshToken);

        const {
          access_token: newAccessToken,
          refresh_token: newRefreshToken,
        } = refreshResponse.data;

        // Save new tokens
        await SecureStore.setItemAsync(
          'access_token',
          newAccessToken
        );

        if (newRefreshToken) {
          await SecureStore.setItemAsync(
            'refresh_token',
            newRefreshToken
          );
        }

        apiClient.defaults.headers.common[
          'Authorization'
        ] = `Bearer ${newAccessToken}`;

        setToken(newAccessToken);

        // Retry user fetch
        const userResponse = await authApi.getMe();

        setUser(userResponse.data);

        return;
      }

      // If refresh token missing
      await logout();
    } catch (error) {
      console.log('Session restore failed:', error);

      await logout();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    restoreSession();
  }, []);

  const login = async (
    identifier: string,
    password: string
  ) => {
    const response = await authApi.login({
      identifier,
      password,
    });

    const {
      access_token,
      refresh_token,
    } = response.data;

    apiClient.defaults.headers.common[
      'Authorization'
    ] = `Bearer ${access_token}`;

    await SecureStore.setItemAsync(
      'access_token',
      access_token
    );

    await SecureStore.setItemAsync(
      'refresh_token',
      refresh_token
    );

    setToken(access_token);

    const userResponse = await authApi.getMe();

    setUser(userResponse.data);
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

export const useAuth = () => useContext(AuthContext);
