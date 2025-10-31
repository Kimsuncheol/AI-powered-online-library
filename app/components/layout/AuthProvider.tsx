'use client';

import * as React from 'react';

export interface AuthUser {
  name: string;
  email: string;
  avatarUrl?: string;
}

export interface AuthContextValue {
  user: AuthUser | null;
  loginOpen: boolean;
  signupOpen: boolean;
  openLogin: () => void;
  closeLogin: () => void;
  openSignup: () => void;
  closeSignup: () => void;
  completeLogin: (user: AuthUser) => void;
  completeSignup: (user: AuthUser) => void;
  logout: () => void;
}

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined);

export function useAuth() {
  const value = React.useContext(AuthContext);
  if (!value) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return value;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<AuthUser | null>(null);
  const [loginOpen, setLoginOpen] = React.useState(false);
  const [signupOpen, setSignupOpen] = React.useState(false);

  const contextValue = React.useMemo<AuthContextValue>(
    () => ({
      user,
      loginOpen,
      signupOpen,
      openLogin: () => {
        setSignupOpen(false);
        setLoginOpen(true);
      },
      closeLogin: () => setLoginOpen(false),
      openSignup: () => {
        setLoginOpen(false);
        setSignupOpen(true);
      },
      closeSignup: () => setSignupOpen(false),
      completeLogin: (nextUser) => {
        setUser(nextUser);
        setLoginOpen(false);
      },
      completeSignup: (nextUser) => {
        setUser(nextUser);
        setSignupOpen(false);
      },
      logout: () => setUser(null),
    }),
    [user, loginOpen, signupOpen],
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}
