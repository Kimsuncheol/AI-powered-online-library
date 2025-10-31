'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';
import { Box } from '@mui/material';

import Header from './Header';
import { AuthProvider as AuthUIProvider, useAuth } from './AuthProvider';
import { AuthProvider as AuthSessionProvider } from '@/app/context/AuthContext';

const LoginModal = dynamic(() => import('../auth/LoginModal'), {
  loading: () => null,
  ssr: false,
});

const SignupModal = dynamic(() => import('../auth/SignupModal'), {
  loading: () => null,
  ssr: false,
});

interface AppShellProps {
  readonly children: React.ReactNode;
}

function ShellContent({ children }: { children: React.ReactNode }) {
  const { loginOpen, signupOpen, closeLogin, closeSignup, openSignup, openLogin, completeLogin, completeSignup } =
    useAuth();

  const handleLoginSuccess = React.useCallback(
    (nextUser: { name: string; email: string; avatarUrl?: string }) => {
      completeLogin(nextUser);
    },
    [completeLogin],
  );

  const handleSignupSuccess = React.useCallback(
    (nextUser: { name: string; email: string; avatarUrl?: string }) => {
      completeSignup(nextUser);
    },
    [completeSignup],
  );

  return (
    <>
      <Header />
      <Box
        component="main"
        sx={{
          minHeight: '100vh',
          backgroundColor: 'background.default',
          pt: { xs: 9, md: 10 },
          px: { xs: 2, md: 4 },
          pb: { xs: 6, md: 8 },
        }}
      >
        {children}
      </Box>
      <React.Suspense fallback={null}>
        <LoginModal open={loginOpen} onClose={closeLogin} onSwitchToSignup={openSignup} onSuccess={handleLoginSuccess} />
        <SignupModal open={signupOpen} onClose={closeSignup} onSwitchToLogin={openLogin} onSuccess={handleSignupSuccess} />
      </React.Suspense>
    </>
  );
}

export default function AppShell({ children }: AppShellProps) {
  return (
    <AuthSessionProvider>
      <AuthUIProvider>
        <ShellContent>{children}</ShellContent>
      </AuthUIProvider>
    </AuthSessionProvider>
  );
}
