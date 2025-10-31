'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, Container, Snackbar } from '@mui/material';
import type { NewBook } from '@/app/interfaces/book';
import { BookForm } from '@/app/admin/books/new/BookForm';
import { createBook } from '@/app/lib/api/books';
import { HttpError } from '@/app/lib/http';

type SnackbarState = {
  open: boolean;
  severity: 'success' | 'error';
  message: string;
};

const initialSnackbarState: SnackbarState = {
  open: false,
  severity: 'success',
  message: '',
};

export default function NewBookPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<SnackbarState>(initialSnackbarState);
  const redirectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
      }
    };
  }, []);

  const handleCloseSnackbar = useCallback(() => {
    setSnackbar((prev) => ({
      ...prev,
      open: false,
    }));
  }, []);

  const scheduleRedirect = useCallback(
    (bookId?: string) => {
      const target = bookId ? `/books/${bookId}` : '/books';
      redirectTimeoutRef.current = setTimeout(() => {
        router.push(target);
      }, 1200);
    },
    [router],
  );

  const handleSubmit = useCallback(
    async (payload: NewBook) => {
      setIsSubmitting(true);
      setValidationError(null);

      try {
        const created = await createBook(payload);
        setSnackbar({
          open: true,
          severity: 'success',
          message: 'Book created successfully. Redirecting…',
        });
        scheduleRedirect(created?.id);
      } catch (error) {
        if (error instanceof HttpError) {
          if (error.status === 400 || error.status === 422) {
            const message = error.message || 'Please review the provided details.';
            setValidationError(message);
            setSnackbar({
              open: true,
              severity: 'error',
              message,
            });
            return;
          }

          setSnackbar({
            open: true,
            severity: 'error',
            message: error.message || 'Unable to create the book.',
          });
          return;
        }

        setSnackbar({
          open: true,
          severity: 'error',
          message: 'Unexpected error occurred. Please try again.',
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [scheduleRedirect],
  );

  const handleReset = useCallback(() => {
    setValidationError(null);
  }, []);

  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <BookForm
        onSubmit={handleSubmit}
        onReset={handleReset}
        isSubmitting={isSubmitting}
        validationError={validationError}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={snackbar.severity === 'success' ? 3000 : 6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          elevation={6}
          variant="filled"
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
