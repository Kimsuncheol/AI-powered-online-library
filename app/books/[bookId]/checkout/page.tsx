'use client';

import * as React from 'react';
import NextLink from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Fade,
  LinearProgress,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import { ArrowBack, CheckCircle, Replay } from '@mui/icons-material';

import type { BookOut } from '@/app/interfaces/book';
import type { CheckoutOut } from '@/app/types/checkouts';
import { useAuthContext } from '@/app/context/AuthContext';
import { getBook } from '@/app/lib/api/books';
import { createCheckout, listCheckouts } from '@/app/lib/api/checkouts';

interface FetchState {
  loading: boolean;
  error: string | null;
}

const DEFAULT_LOAN_DAYS = 14;

export default function BookCheckoutPage() {
  const params = useParams<{ bookId: string }>();
  const router = useRouter();
  const { member, isLoading: authLoading } = useAuthContext();

  const bookId = params?.bookId;

  const [book, setBook] = React.useState<BookOut | null>(null);
  const [activeCheckout, setActiveCheckout] = React.useState<CheckoutOut | null>(null);
  const [fetchState, setFetchState] = React.useState<FetchState>({ loading: true, error: null });

  const [dueDate, setDueDate] = React.useState<string>(() => formatDate(addDays(new Date(), DEFAULT_LOAN_DAYS)));
  const [notes, setNotes] = React.useState<string>('');
  const [formError, setFormError] = React.useState<string | null>(null);
  const [formSuccess, setFormSuccess] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);

  const isCheckoutInProgress = React.useMemo(() => {
    if (!activeCheckout) return false;
    return activeCheckout.status !== 'returned' && activeCheckout.status !== 'cancelled';
  }, [activeCheckout]);

  const availabilityLabel = React.useMemo(() => {
    if (!book) return 'Loading';
    if (isCheckoutInProgress) {
      if (activeCheckout?.status === 'overdue') return 'Overdue';
      if (activeCheckout?.status === 'requested') return 'Requested';
      return 'Checked Out';
    }
    return 'Available';
  }, [book, isCheckoutInProgress, activeCheckout]);

  const availabilityColor = React.useMemo<'default' | 'primary' | 'success' | 'warning' | 'error'>(() => {
    if (!book) return 'default';
    if (isCheckoutInProgress) {
      if (activeCheckout?.status === 'overdue') return 'error';
      if (activeCheckout?.status === 'requested') return 'warning';
      return 'warning';
    }
    return 'success';
  }, [book, isCheckoutInProgress, activeCheckout]);

  React.useEffect(() => {
    let isCancelled = false;

    async function loadData() {
      if (!bookId) {
        setFetchState({ loading: false, error: 'Unable to identify the selected book.' });
        return;
      }

      setFetchState({ loading: true, error: null });
      try {
        const [bookDetails, checkoutList] = await Promise.all([
          getBook(bookId),
          listCheckouts({ bookId, limit: 1 }).catch(() => [] as CheckoutOut[]),
        ]);

        if (isCancelled) return;

        setBook(bookDetails);

        if (checkoutList.length > 0) {
          setActiveCheckout(checkoutList[0]);
        } else {
          setActiveCheckout(null);
        }

        setFetchState({ loading: false, error: null });
      } catch (error) {
        if (isCancelled) return;
        const message = error instanceof Error ? error.message : 'Unable to load book information.';
        setFetchState({ loading: false, error: message });
      }
    }

    loadData().catch((error) => {
      if (process.env.NODE_ENV !== 'production') {
        console.error('Failed to load checkout page data', error);
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [bookId]);

  const handleSubmit = React.useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      event.stopPropagation();
      setFormError(null);
      setFormSuccess(null);

      if (!book) {
        setFormError('Book information is not available yet. Please try again in a moment.');
        return;
      }

      if (!member) {
        setFormError('Please sign in to checkout this book.');
        return;
      }

      if (isCheckoutInProgress) {
        setFormError('This book is currently checked out. Please try again later.');
        return;
      }

      const dueDateValue = new Date(dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (Number.isNaN(dueDateValue.getTime())) {
        setFormError('Please choose a valid due date.');
        return;
      }

      if (dueDateValue <= today) {
        setFormError('The due date must be in the future.');
        return;
      }

      const dueAtIso = toEndOfDayIso(dueDateValue);

      setIsSubmitting(true);
      try {
        const checkout = await createCheckout({
          bookId: book.id,
          memberId: member.id,
          dueAt: dueAtIso,
          notes: notes.trim().length > 0 ? notes.trim() : undefined,
        });

        setActiveCheckout(checkout);
        setFormSuccess('Book checked out successfully! Enjoy your reading.');
        setNotes('');
        if (checkout.dueAt) {
          setDueDate(formatDate(new Date(checkout.dueAt)));
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to complete checkout.';
        setFormError(message);
      } finally {
        setIsSubmitting(false);
      }
    },
    [book, member, notes, dueDate, isCheckoutInProgress],
  );

  const handleGoBack = React.useCallback(() => {
    router.back();
  }, [router]);

  const statusDetails = React.useMemo(() => {
    if (!activeCheckout) {
      return null;
    }

    const dueOn = activeCheckout.dueAt ? formatDisplayDate(activeCheckout.dueAt) : null;
    const returnedOn = activeCheckout.returnedAt ? formatDisplayDate(activeCheckout.returnedAt) : null;

    return {
      status: activeCheckout.status,
      dueOn,
      returnedOn,
    };
  }, [activeCheckout]);

  const minDueDate = React.useMemo(() => formatDate(addDays(new Date(), 1)), []);

  return (
    <Container
      maxWidth="lg"
      sx={{
        minHeight: '100vh',
        py: { xs: 6, md: 8 },
      }}
    >
      <Stack spacing={4}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Button color="inherit" variant="text" startIcon={<ArrowBack />} onClick={handleGoBack}>
            Back
          </Button>
          {book ? (
            <Chip
              label={availabilityLabel}
              color={availabilityColor}
              variant="filled"
              icon={availabilityColor === 'success' ? <CheckCircle /> : <Replay />}
            />
          ) : null}
        </Stack>

        {fetchState.loading && <LinearProgress />}

        {fetchState.error ? (
          <Alert severity="error">{fetchState.error}</Alert>
        ) : (
          <Fade in timeout={320}>
            <Box>
              <Grid container spacing={{ xs: 4, md: 6 }}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Card
                    elevation={0}
                    sx={{
                      borderRadius: 4,
                      bgcolor: 'background.paper',
                      border: (theme) => `1px solid ${theme.palette.divider}`,
                      overflow: 'hidden',
                    }}
                  >
                    {book?.coverImageUrl ? (
                      <CardMedia
                        component="img"
                        src={book.coverImageUrl}
                        alt={`${book.title} cover`}
                        sx={{
                          height: { xs: 320, md: 380 },
                          objectFit: 'cover',
                          transition: 'transform 0.6s ease',
                          '&:hover': { transform: 'scale(1.02)' },
                        }}
                      />
                    ) : (
                      <Box
                        sx={{
                          height: { xs: 320, md: 380 },
                          bgcolor: 'action.hover',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Typography variant="subtitle2" color="text.secondary">
                          Cover unavailable
                        </Typography>
                      </Box>
                    )}
                    <CardContent
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2,
                      }}
                    >
                      <Stack spacing={1}>
                        <Typography variant="h4" sx={{ fontWeight: 700 }}>
                          {book?.title ?? 'Loading title'}
                        </Typography>
                        <Typography variant="subtitle1" color="text.secondary">
                          {book?.author}
                        </Typography>
                      </Stack>
                      <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                        {book?.category ? <Chip label={book.category} size="small" /> : null}
                        {book?.publisher ? <Chip label={book.publisher} size="small" variant="outlined" /> : null}
                        {book?.language ? <Chip label={book.language.toUpperCase()} size="small" variant="outlined" /> : null}
                      </Stack>
                      {book?.description ? (
                        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                          {book.description}
                        </Typography>
                      ) : (
                        <Typography variant="body2" color="text.disabled">
                          No description available for this title yet.
                        </Typography>
                      )}
                      <Divider />
                      <Stack spacing={1}>
                        <Typography variant="overline" color="text.secondary">
                          Checkout Status
                        </Typography>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <Chip label={availabilityLabel} color={availabilityColor} />
                          {statusDetails?.dueOn ? (
                            <Typography variant="body2" color="text.secondary">
                              Due on {statusDetails.dueOn}
                            </Typography>
                          ) : null}
                          {statusDetails?.returnedOn ? (
                            <Typography variant="body2" color="text.secondary">
                              Returned on {statusDetails.returnedOn}
                            </Typography>
                          ) : null}
                        </Stack>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <Card
                    elevation={1}
                    sx={{
                      borderRadius: 4,
                      backdropFilter: 'blur(10px)',
                      border: (theme) => `1px solid ${theme.palette.divider}`,
                      boxShadow: (theme) => theme.shadows[4],
                      bgcolor: 'background.paper',
                    }}
                  >
                    <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                      <Stack spacing={3} component="form" onSubmit={handleSubmit}>
                        <Stack spacing={1}>
                          <Typography variant="h5" sx={{ fontWeight: 600 }}>
                            Checkout Details
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Confirm your loan period and leave optional notes for librarians.
                          </Typography>
                        </Stack>

                        {formError ? <Alert severity="error">{formError}</Alert> : null}
                        {formSuccess ? <Alert severity="success">{formSuccess}</Alert> : null}

                        <TextField
                          label="Due date"
                          type="date"
                          value={dueDate}
                          onChange={(event) => setDueDate(event.target.value)}
                          InputLabelProps={{ shrink: true }}
                          inputProps={{ min: minDueDate }}
                          required
                        />

                        <TextField
                          label="Notes (optional)"
                          multiline
                          minRows={3}
                          placeholder="Share any access needs or reminders you'd like us to know."
                          value={notes}
                          onChange={(event) => setNotes(event.target.value)}
                          InputLabelProps={{ shrink: true }}
                        />

                        <Divider />

                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
                          <Button
                            type="submit"
                            variant="contained"
                            size="large"
                            disabled={isSubmitting || fetchState.loading || !!fetchState.error || isCheckoutInProgress}
                            sx={{
                              borderRadius: 999,
                              px: 4,
                              py: 1.5,
                            }}
                          >
                            {isSubmitting ? (
                              <CircularProgress size={22} color="inherit" />
                            ) : isCheckoutInProgress ? (
                              'Currently Unavailable'
                            ) : (
                              'Confirm Checkout'
                            )}
                          </Button>
                          {!member && !authLoading ? (
                            <Typography variant="body2" color="text.secondary">
                              <Button component={NextLink} href="/login" variant="text">
                                Sign in
                              </Button>{' '}
                              to complete your checkout.
                            </Typography>
                          ) : null}
                        </Stack>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          </Fade>
        )}
      </Stack>
    </Container>
  );
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function toEndOfDayIso(date: Date): string {
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  return endOfDay.toISOString();
}

function formatDisplayDate(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return isoDate;
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
