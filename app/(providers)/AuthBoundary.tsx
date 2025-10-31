'use client';

import * as React from 'react';
import { Snackbar } from '@mui/material';
import { useRouter } from 'next/navigation';

import type { UnauthorizedEventDetail } from '@/app/lib/http';
import { initializeUnauthorizedHandler } from '@/app/lib/unauthorized';

interface AuthBoundaryProps {
  children: React.ReactNode;
}

const SNACKBAR_MESSAGE = 'Your session expired. Please sign in again.';
const INTERACTION_DELAY_MS = 2000;

export default function AuthBoundary({ children }: AuthBoundaryProps) {
  const router = useRouter();
  const [snackbarState, setSnackbarState] = React.useState<{ open: boolean; key: number }>(() => ({ open: false, key: 0 }));

  const closeSnackbar = React.useCallback(() => {
    setSnackbarState((prev) => ({ ...prev, open: false }));
  }, []);

  const beforeRedirect = React.useCallback(async (detail: UnauthorizedEventDetail) => {
    if (!detail.fromInteraction) {
      closeSnackbar();
      return;
    }

    setSnackbarState({ open: true, key: detail.timestamp });

    await new Promise<void>((resolve) => {
      window.setTimeout(() => {
        closeSnackbar();
        resolve();
      }, INTERACTION_DELAY_MS);
    });
  }, [closeSnackbar]);

  React.useEffect(() => {
    initializeUnauthorizedHandler({
      router,
      clearState: closeSnackbar,
      beforeRedirect,
    });
  }, [router, closeSnackbar, beforeRedirect]);

  return (
    <>
      {children}
      <Snackbar
        key={snackbarState.key}
        open={snackbarState.open}
        message={SNACKBAR_MESSAGE}
        autoHideDuration={INTERACTION_DELAY_MS}
        onClose={closeSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      />
    </>
  );
}

