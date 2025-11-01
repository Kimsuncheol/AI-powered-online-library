'use client';

import * as React from 'react';
import NextLink from 'next/link';
import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardMedia,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  LinearProgress,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import AutorenewRoundedIcon from '@mui/icons-material/AutorenewRounded';
import AssignmentReturnRoundedIcon from '@mui/icons-material/AssignmentReturnRounded';
import CancelScheduleSendRoundedIcon from '@mui/icons-material/CancelScheduleSendRounded';
import HourglassBottomRoundedIcon from '@mui/icons-material/HourglassBottomRounded';

import { useAuthContext } from '@/app/context/AuthContext';
import type { BookOut } from '@/app/interfaces/book';
import type { CheckoutOut } from '@/app/types/checkouts';
import { listCheckouts, updateCheckout } from '@/app/lib/api/checkouts';
import { getBook } from '@/app/lib/api/books';
import { useHeartbeat } from '@/app/lib/heartbeat';

type CheckoutWithBook = CheckoutOut & { bookDetails?: BookOut | null };

interface ExtensionDialogState {
  open: boolean;
  checkout: CheckoutWithBook | null;
  dueDate: string;
  error: string | null;
  submitting: boolean;
}

type CheckoutWithComputed = CheckoutWithBook & {
  book?: BookOut | null;
  dueDateLabel: string;
  daysRemaining: number | null;
  isOverdue: boolean;
};

const STATUS_COLOR: Record<string, 'default' | 'primary' | 'success' | 'warning' | 'error'> = {
  checked_out: 'primary',
  returned: 'success',
  overdue: 'error',
  lost: 'error',
  cancelled: 'default',
  requested: 'warning',
};

const DEFAULT_LIMIT = 60;

export default function MyLibraryPage() {
  const { member, isLoading: authLoading, isInitialized } = useAuthContext();
  const memberId = member?.id ?? null;
  const hasSession = Boolean(memberId);

  useHeartbeat({ intervalMs: 5 * 60 * 1000, enabled: hasSession });

  const [checkouts, setCheckouts] = React.useState<CheckoutWithBook[]>([]);
  const [fetching, setFetching] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);
  const [extensionDialog, setExtensionDialog] = React.useState<ExtensionDialogState>({
    open: false,
    checkout: null,
    dueDate: '',
    error: null,
    submitting: false,
  });

  const attachBookDetailIfMissing = React.useCallback(async (checkout: CheckoutOut): Promise<CheckoutWithBook> => {
    if ('bookDetails' in checkout) {
      return checkout as CheckoutWithBook;
    }

    if ((checkout as CheckoutWithBook).bookDetails) {
      return {
        ...checkout,
        bookDetails: (checkout as CheckoutWithBook).bookDetails ?? null,
      };
    }

    try {
      const bookDetails = await getBook(checkout.bookId);
      return {
        ...checkout,
        bookDetails,
      };
    } catch {
      return {
        ...checkout,
        bookDetails: null,
      };
    }
  }, []);

  const attachBookDetails = React.useCallback(
    async (items: CheckoutOut[]): Promise<CheckoutWithBook[]> => Promise.all(items.map((item) => attachBookDetailIfMissing(item))),
    [attachBookDetailIfMissing],
  );

  const refreshCheckoutInState = React.useCallback(
    async (updated: CheckoutOut) => {
      const enriched = await attachBookDetailIfMissing(updated);
      setCheckouts((prev) => {
        const next = prev.some((item) => item.id === enriched.id)
          ? prev.map((item) => (item.id === enriched.id ? { ...item, ...enriched } : item))
          : [...prev, enriched];
        return sortCheckouts(next);
      });
    },
    [attachBookDetailIfMissing],
  );

  const loadCheckouts = React.useCallback(async () => {
    if (!memberId) return;
    setFetching(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const response = await listCheckouts({ memberId, limit: DEFAULT_LIMIT });
      const enriched = await attachBookDetails(response);
      setCheckouts(sortCheckouts(enriched));
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : 'Unable to load your library right now.';
      setError(message);
    } finally {
      setFetching(false);
    }
  }, [memberId, attachBookDetails]);

  React.useEffect(() => {
    if (memberId) {
      void loadCheckouts();
    } else if (!authLoading && isInitialized) {
      setCheckouts([]);
    }
  }, [memberId, authLoading, isInitialized, loadCheckouts]);

  const handleOpenExtension = React.useCallback((checkout: CheckoutWithBook) => {
    const nextDue = checkout.dueAt ? formatDateInput(addDays(new Date(checkout.dueAt), 1)) : formatDateInput(addDays(new Date(), 7));
    setExtensionDialog({
      open: true,
      checkout,
      dueDate: nextDue,
      error: null,
      submitting: false,
    });
  }, []);

  const handleCloseExtension = React.useCallback(() => {
    setExtensionDialog({
      open: false,
      checkout: null,
      dueDate: '',
      error: null,
      submitting: false,
    });
  }, []);

  const handleExtensionSubmit = React.useCallback(async () => {
    if (!extensionDialog.checkout) return;
    const { checkout, dueDate } = extensionDialog;

    const requestedDate = new Date(dueDate);
    if (Number.isNaN(requestedDate.getTime())) {
      setExtensionDialog((prev) => ({ ...prev, error: 'Please select a valid due date.' }));
      return;
    }

    if (checkout.dueAt) {
      const currentDue = new Date(checkout.dueAt);
      if (requestedDate <= currentDue) {
        setExtensionDialog((prev) => ({ ...prev, error: 'Choose a date after the current due date to request an extension.' }));
        return;
      }
    }

    setExtensionDialog((prev) => ({ ...prev, submitting: true, error: null }));
    try {
      const updated = await updateCheckout(checkout.id, {
        action: 'extend',
        newDueAt: toEndOfDayIso(requestedDate),
      });
      await refreshCheckoutInState(updated);
      setSuccessMessage('Extension request submitted.');
      handleCloseExtension();
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : 'Unable to request an extension right now.';
      setExtensionDialog((prev) => ({ ...prev, submitting: false, error: message }));
    }
  }, [extensionDialog, refreshCheckoutInState, handleCloseExtension]);

  const handleAction = React.useCallback(
    async (checkout: CheckoutWithBook, action: 'return' | 'cancel') => {
      try {
        setFetching(true);
        setError(null);
        const updated = await updateCheckout(checkout.id, { action });
        await refreshCheckoutInState(updated);
        setSuccessMessage(action === 'return' ? 'Return recorded successfully.' : 'Checkout cancelled.');
      } catch (actionError) {
        const message =
          actionError instanceof Error ? actionError.message : 'We could not complete that action. Please try again.';
        setError(message);
      } finally {
        setFetching(false);
      }
    },
    [refreshCheckoutInState],
  );

  const computedCheckouts = React.useMemo<CheckoutWithComputed[]>(() => {
    return checkouts.map((checkout) => {
      const book = checkout.bookDetails ?? (checkout.bookDetails as BookOut | undefined) ?? null;
      return {
        ...checkout,
        book,
        dueDateLabel: checkout.dueAt ? formatDisplayDate(checkout.dueAt) : 'No due date',
        daysRemaining: checkout.dueAt ? calculateDaysRemaining(checkout.dueAt) : null,
        isOverdue: checkout.dueAt ? isPastDue(checkout.dueAt) : false,
      };
    });
  }, [checkouts]);

  const emptyStateActive = computedCheckouts.length === 0 && !fetching && !error;

  if (!isInitialized || authLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: { xs: 6, md: 8 } }}>
        <LinearProgress />
      </Container>
    );
  }

  if (!hasSession) {
    return (
      <Container maxWidth="sm" sx={{ py: { xs: 8, md: 10 }, textAlign: 'center' }}>
        <Stack spacing={3} alignItems="center">
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Sign in to access My Library
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Your borrowed books, due dates, and extension requests live here. Please sign in to manage your checkouts.
          </Typography>
          <Button component={NextLink} href="/login" variant="contained" size="large">
            Sign in
          </Button>
        </Stack>
      </Container>
    );
  }

  return (
    <Container
      maxWidth="lg"
      sx={{
        py: { xs: 6, md: 8 },
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
    >
      <Stack spacing={1.5}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Typography variant="h3" sx={{ fontWeight: 700 }}>
            My Library
          </Typography>
          <Tooltip title="Track your loans, manage due dates, and request extensions from one hub.">
            <IconButton size="small" color="primary">
              <InfoOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 640 }}>
          Review every book you&rsquo;ve borrowed and keep ahead of due dates with minimalist clarity and gentle reminders.
        </Typography>
      </Stack>

      {fetching ? <LinearProgress /> : null}
      {error ? (
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      ) : null}
      {successMessage ? (
        <Alert severity="success" onClose={() => setSuccessMessage(null)}>
          {successMessage}
        </Alert>
      ) : null}

      {emptyStateActive ? (
        <EmptyState onRefresh={loadCheckouts} />
      ) : (
        <Grid container spacing={{ xs: 3, md: 4 }}>
          {computedCheckouts.map((checkout) => (
            <Grid key={checkout.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <CheckoutCard
                checkout={checkout}
                onExtension={() => handleOpenExtension(checkout)}
                onReturn={() => handleAction(checkout, 'return')}
                onCancel={() => handleAction(checkout, 'cancel')}
              />
            </Grid>
          ))}
        </Grid>
      )}

      <ExtensionDialog
        state={extensionDialog}
        onClose={handleCloseExtension}
        onSubmit={handleExtensionSubmit}
        onDateChange={(value) =>
          setExtensionDialog((prev) => ({
            ...prev,
            dueDate: value,
            error: null,
          }))
        }
      />

      <Stack spacing={2} sx={{ pt: 4 }}>
        <Divider />
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'flex-start', sm: 'center' }}>
          <Typography variant="subtitle2" color="text.secondary">
            Need something new to read?
          </Typography>
          <Stack direction="row" spacing={2}>
            <Button component={NextLink} href="/" variant="outlined">
              Browse featured books
            </Button>
            <Button variant="text" onClick={() => void loadCheckouts()}>
              Refresh list
            </Button>
          </Stack>
        </Stack>
      </Stack>
    </Container>
  );
}

function CheckoutCard({
  checkout,
  onExtension,
  onReturn,
  onCancel,
}: {
  checkout: CheckoutWithComputed;
  onExtension: () => void;
  onReturn: () => void;
  onCancel: () => void;
}) {
  const { book, status, dueDateLabel, daysRemaining, isOverdue, notes } = checkout;
  const statusColor = STATUS_COLOR[status] ?? 'default';
  const canExtend = status === 'checked_out' || status === 'overdue';
  const canReturn = status === 'checked_out' || status === 'overdue';
  const canCancel = status === 'requested';

  const dueTone =
    isOverdue || (typeof daysRemaining === 'number' && daysRemaining < 0)
      ? 'error.main'
      : typeof daysRemaining === 'number' && daysRemaining <= 3
      ? 'warning.main'
      : 'text.secondary';

  const dueCaption =
    typeof daysRemaining !== 'number'
      ? 'No due date'
      : daysRemaining < 0
      ? `${Math.abs(daysRemaining)} day${Math.abs(daysRemaining) === 1 ? '' : 's'} overdue`
      : `${daysRemaining} day${daysRemaining === 1 ? '' : 's'} remaining`;

  return (
    <Card
      elevation={0}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 4,
        border: (theme) => `1px solid ${theme.palette.divider}`,
        bgcolor: 'background.paper',
      }}
    >
      {book?.coverImageUrl ? (
        <CardMedia component='img' src={book.coverImageUrl} alt={`${book.title} cover`} sx={{ height: 220, objectFit: 'cover' }} />
      ) : (
        <Box
          sx={{
            height: 220,
            display: 'grid',
            placeItems: 'center',
            bgcolor: 'action.hover',
          }}
        >
          <Typography variant="subtitle2" color="text.secondary">
            Cover unavailable
          </Typography>
        </Box>
      )}

      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Stack spacing={0.5}>
          <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {book?.title ?? 'Untitled Book'}
            </Typography>
            <Chip size="small" color={statusColor} label={formatStatus(status)} />
          </Stack>
          <Typography variant="body2" color="text.secondary">
            {book?.author ?? 'Unknown author'}
          </Typography>
          {book?.category ? <Chip size="small" label={book.category} variant="outlined" sx={{ alignSelf: 'flex-start' }} /> : null}
        </Stack>

        <Stack direction="row" spacing={1.5} alignItems="center">
          <HourglassBottomRoundedIcon
            fontSize="small"
            color={
              isOverdue || (typeof daysRemaining === 'number' && daysRemaining < 0)
                ? 'error'
                : typeof daysRemaining === 'number' && daysRemaining <= 3
                ? 'warning'
                : 'action'
            }
          />
          <Stack spacing={0.25}>
            <Typography variant="body2" sx={{ color: dueTone }}>
              Due {dueDateLabel}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {dueCaption}
            </Typography>
          </Stack>
        </Stack>

        {notes ? (
          <Alert severity="info" variant="outlined">
            {notes}
          </Alert>
        ) : null}
      </CardContent>

      <CardActions
        sx={{
          px: 3,
          pb: 3,
          pt: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch',
          gap: 1,
        }}
      >
        <Button
          fullWidth
          variant="contained"
          startIcon={<AutorenewRoundedIcon />}
          onClick={onExtension}
          disabled={!canExtend}
          sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 600 }}
        >
          Request extension
        </Button>
        <Stack direction="row" spacing={1.25}>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<AssignmentReturnRoundedIcon />}
            onClick={onReturn}
            disabled={!canReturn}
            sx={{ borderRadius: 999, textTransform: 'none' }}
          >
            Mark as returned
          </Button>
          <Button
            fullWidth
            variant="text"
            startIcon={<CancelScheduleSendRoundedIcon />}
            onClick={onCancel}
            disabled={!canCancel}
            sx={{ borderRadius: 999, textTransform: 'none' }}
          >
            Cancel
          </Button>
        </Stack>
      </CardActions>
    </Card>
  );
}

function ExtensionDialog({
  state,
  onClose,
  onSubmit,
  onDateChange,
}: {
  state: ExtensionDialogState;
  onClose: () => void;
  onSubmit: () => void;
  onDateChange: (value: string) => void;
}) {
  const { open, checkout, dueDate, error, submitting } = state;
  if (!checkout) return null;

  const minDate = checkout.dueAt ? formatDateInput(addDays(new Date(checkout.dueAt), 1)) : formatDateInput(addDays(new Date(), 1));

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Request extension</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <Typography variant="body2">
            Select a new due date that gives you enough time. We&rsquo;ll review the request and confirm shortly.
          </Typography>
          <TextField
            label="New due date"
            type="date"
            value={dueDate}
            onChange={(event) => onDateChange(event.target.value)}
            InputLabelProps={{ shrink: true }}
            inputProps={{ min: minDate }}
            required
          />
          {error ? <Alert severity="error">{error}</Alert> : null}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button onClick={onSubmit} variant="contained" disabled={submitting}>
          {submitting ? 'Submitting…' : 'Submit request'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function EmptyState({ onRefresh }: { onRefresh: () => void }) {
  return (
    <Stack
      spacing={3}
      alignItems="center"
      justifyContent="center"
      sx={{
        borderRadius: 4,
        border: (theme) => `1px dashed ${theme.palette.divider}`,
        py: { xs: 6, md: 8 },
        px: { xs: 3, md: 6 },
        textAlign: 'center',
        bgcolor: 'background.paper',
      }}
    >
      <Typography variant="h5" sx={{ fontWeight: 600 }}>
        No active checkouts yet
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 520 }}>
        Borrow a title from the featured collections or browse recommendations to populate your library.
      </Typography>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <Button component={NextLink} href="/" variant="contained">
          Explore featured books
        </Button>
        <Button variant="text" onClick={onRefresh}>
          Refresh
        </Button>
      </Stack>
    </Stack>
  );
}

function sortCheckouts(checkouts: CheckoutWithBook[]): CheckoutWithBook[] {
  return [...checkouts].sort((a, b) => {
    const aTime = new Date(a.dueAt ?? a.createdAt).getTime();
    const bTime = new Date(b.dueAt ?? b.createdAt).getTime();
    return aTime - bTime;
  });
}

function calculateDaysRemaining(dueAt: string): number {
  const now = new Date();
  const dueDate = new Date(dueAt);
  const diff = dueDate.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function isPastDue(dueAt: string): boolean {
  return new Date(dueAt).getTime() < Date.now();
}

function formatDateInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function toEndOfDayIso(date: Date): string {
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  return endOfDay.toISOString();
}

function formatStatus(status: CheckoutOut['status']): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}
