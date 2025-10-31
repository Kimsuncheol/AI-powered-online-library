'use client';

import * as React from 'react';

import type { Member } from '@/app/interfaces/member';
import { useAuthContext } from '@/app/context/AuthContext';

export interface AuthUser {
  name: string;
  email: string;
  role?: Member['role'];
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
  logout: () => Promise<void>;
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
  const { member, signOut, isInitialized } = useAuthContext();
  const [loginOpen, setLoginOpen] = React.useState(false);
  const [signupOpen, setSignupOpen] = React.useState(false);

  const user = React.useMemo<AuthUser | null>(() => (member ? mapMemberToAuthUser(member) : null), [member]);

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
        void nextUser;
        setLoginOpen(false);
      },
      completeSignup: (nextUser) => {
        void nextUser;
        setSignupOpen(false);
      },
      logout: async () => {
        await signOut();
      },
    }),
    [user, loginOpen, signupOpen, signOut],
  );

  if (!isInitialized) {
    return null;
  }

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

function mapMemberToAuthUser(member: Member): AuthUser {
  return {
    name: member.displayName || member.email,
    email: member.email,
    role: member.role,
    avatarUrl: member.avatarUrl,
  };
}
