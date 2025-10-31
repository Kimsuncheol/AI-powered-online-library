'use client';

import * as React from 'react';

import type { Member } from '@/app/interfaces/member';
import {
  type MemberCreatePayload,
  type MemberLoginPayload,
  readCurrentMember,
  signIn as apiSignIn,
  signOut as apiSignOut,
  signUp as apiSignUp,
} from '@/app/lib/api/auth';
import { subscribeUnauthorized } from '@/app/lib/http';

export interface AuthContextType {
  member: Member | null;
  isLoading: boolean;
  isInitialized: boolean;
  signIn: (payload: MemberLoginPayload) => Promise<Member>;
  signUp: (payload: MemberCreatePayload) => Promise<Member>;
  signOut: () => Promise<void>;
  refreshMember: () => Promise<Member | null>;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [member, setMember] = React.useState<Member | null>(null);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [isInitialized, setIsInitialized] = React.useState<boolean>(false);

  const pendingRequests = React.useRef(0);
  const isMounted = React.useRef(false);

  React.useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  React.useEffect(() => {
    const unsubscribe = subscribeUnauthorized(() => {
      pendingRequests.current = 0;
      if (isMounted.current) {
        setMember(null);
        setIsLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  const updateLoadingState = React.useCallback((loading: boolean) => {
    if (!isMounted.current) return;
    setIsLoading(loading);
  }, []);

  const startLoading = React.useCallback(() => {
    pendingRequests.current += 1;
    updateLoadingState(true);
  }, [updateLoadingState]);

  const stopLoading = React.useCallback(() => {
    pendingRequests.current = Math.max(0, pendingRequests.current - 1);
    if (pendingRequests.current === 0) {
      updateLoadingState(false);
    }
  }, [updateLoadingState]);

  const refreshMember = React.useCallback(async (): Promise<Member | null> => {
    startLoading();
    try {
      const currentMember = await readCurrentMember();
      if (isMounted.current) {
        setMember(currentMember);
      }
      return currentMember;
    } finally {
      stopLoading();
    }
  }, [startLoading, stopLoading]);

  const signIn = React.useCallback(
    async (payload: MemberLoginPayload): Promise<Member> => {
      startLoading();
      try {
        const authenticatedMember = await apiSignIn(payload);
        if (isMounted.current) {
          setMember(authenticatedMember);
        }
        return authenticatedMember;
      } finally {
        stopLoading();
      }
    },
    [startLoading, stopLoading],
  );

  const signUp = React.useCallback(
    async (payload: MemberCreatePayload): Promise<Member> => {
      startLoading();
      try {
        await apiSignUp(payload);
        const authenticatedMember = await apiSignIn({ email: payload.email, password: payload.password });
        if (isMounted.current) {
          setMember(authenticatedMember);
        }
        return authenticatedMember;
      } finally {
        stopLoading();
      }
    },
    [startLoading, stopLoading],
  );

  const signOut = React.useCallback(async () => {
    startLoading();
    try {
      await apiSignOut();
      if (isMounted.current) {
        setMember(null);
      }
    } finally {
      stopLoading();
    }
  }, [startLoading, stopLoading]);

  React.useEffect(() => {
    refreshMember()
      .catch((error) => {
        if (process.env.NODE_ENV !== 'production') {
          console.error('Failed to refresh member session', error);
        }
      })
      .finally(() => {
        if (isMounted.current) {
          setIsInitialized(true);
        }
      });
  }, [refreshMember]);

  const contextValue = React.useMemo<AuthContextType>(
    () => ({
      member,
      isLoading,
      isInitialized,
      signIn,
      signUp,
      signOut,
      refreshMember,
    }),
    [member, isLoading, isInitialized, signIn, signUp, signOut, refreshMember],
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthContextType {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
