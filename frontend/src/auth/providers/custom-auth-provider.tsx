import { PropsWithChildren, useEffect, useState } from 'react';
import { CustomAuthAdapter } from '@/auth/adapters/custom-auth-adapter';
import { AuthContext } from '@/auth/context/auth-context';
import * as authHelper from '@/auth/lib/helpers';
import { AuthModel, UserModel } from '@/auth/lib/models';

// Define the Custom Auth Provider
export function CustomAuthProvider({ children }: PropsWithChildren) {
  const [loading, setLoading] = useState(true);
  const [auth, setAuth] = useState<AuthModel | undefined>(authHelper.getAuth());
  const [currentUser, setCurrentUser] = useState<UserModel | undefined>();
  const [isAdmin, setIsAdmin] = useState(false);

  const adapter = CustomAuthAdapter.getInstance();

  // Check if user is admin
  useEffect(() => {
    setIsAdmin(currentUser?.is_admin === true);
  }, [currentUser]);

  const verify = async () => {
    try {
      const user = await adapter.verifyToken();
      if (user) {
        setCurrentUser(user);
        // Update auth with user info
        const currentAuth = authHelper.getAuth();
        if (currentAuth) {
          saveAuth({
            ...currentAuth,
            user: user,
          });
        }
      } else {
        saveAuth(undefined);
        setCurrentUser(undefined);
      }
    } catch (error) {
      saveAuth(undefined);
      setCurrentUser(undefined);
    } finally {
      setLoading(false);
    }
  };

  const saveAuth = (auth: AuthModel | undefined) => {
    setAuth(auth);
    if (auth) {
      authHelper.setAuth(auth);
    } else {
      authHelper.removeAuth();
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const result = await adapter.login(email, password);
      const authData: AuthModel = {
        token: result.token,
        user: result.user,
      };
      saveAuth(authData);
      setCurrentUser(result.user);
    } catch (error) {
      saveAuth(undefined);
      setCurrentUser(undefined);
      throw error;
    }
  };

  const register = async (
    email: string,
    password: string,
    password_confirmation: string,
    firstName?: string,
    lastName?: string,
  ) => {
    // Bu fonksiyonu server'a eklemeniz gerekebilir
    throw new Error('Kayıt fonksiyonu henüz implement edilmedi');
  };

  const requestPasswordReset = async (email: string) => {
    // Bu fonksiyonu server'a eklemeniz gerekebilir
    throw new Error('Şifre sıfırlama henüz implement edilmedi');
  };

  const resetPassword = async (
    password: string,
    password_confirmation: string,
  ) => {
    // Bu fonksiyonu server'a eklemeniz gerekebilir
    throw new Error('Şifre sıfırlama henüz implement edilmedi');
  };

  const resendVerificationEmail = async (email: string) => {
    // Bu fonksiyonu server'a eklemeniz gerekebilir
    throw new Error('Email doğrulama henüz implement edilmedi');
  };

  const getUser = async () => {
    return await adapter.verifyToken();
  };

  const updateProfile = async (userData: Partial<UserModel>) => {
    try {
      const updatedUser = await adapter.updateProfile(userData);
      setCurrentUser(updatedUser);
      return updatedUser;
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    await adapter.logout();
    saveAuth(undefined);
    setCurrentUser(undefined);
  };

  // Initial verification on mount
  useEffect(() => {
    verify();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        loading,
        setLoading,
        auth,
        saveAuth,
        user: currentUser,
        setUser: setCurrentUser,
        login,
        register,
        requestPasswordReset,
        resetPassword,
        resendVerificationEmail,
        getUser,
        updateProfile,
        logout,
        verify,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
