'use client';

import * as React from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
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
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Select,
  Skeleton,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
  useMediaQuery,
} from '@mui/material';
import Paper from '@mui/material/Paper';
import { useTheme } from '@mui/material/styles';
import type { SelectChangeEvent } from '@mui/material/Select';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import ScheduleRoundedIcon from '@mui/icons-material/ScheduleRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import MoreVertRoundedIcon from '@mui/icons-material/MoreVertRounded';
import EventRepeatRoundedIcon from '@mui/icons-material/EventRepeatRounded';
import AssignmentReturnRoundedIcon from '@mui/icons-material/AssignmentReturnRounded';
import CancelRoundedIcon from '@mui/icons-material/CancelRounded';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

import type { CheckoutOut, CheckoutStatus } from '@/app/types/checkouts';
import { listCheckouts, updateCheckout } from '@/app/lib/api/checkouts';
import { HttpError } from '@/app/lib/http';
import { useAuthContext } from '@/app/context/AuthContext';

const SEARCH_DEBOUNCE_MS = 350;
const DEFAULT_PAGE_SIZE = 10;
const PAGE_SIZE_OPTIONS = [5, 10, 20, 50] as const;
const MS_IN_DAY = 86_400_000;

const STATUS_LABELS: Record<CheckoutStatus, string> = {
  requested: 'Requested',
  checked_out: 'Checked Out',
  returned: 'Returned',
  overdue: 'Overdue',
  cancelled: 'Cancelled',
  lost: 'Lost',
};

const STATUS_CHIP_COLOR: Partial<
  Record<CheckoutStatus, 'default' | 'primary' | 'info' | 'success' | 'warning' | 'error'>
> = {
  requested: 'warning',
  checked_out: 'info',
  overdue: 'error',
  returned: 'success',
  cancelled: 'default',
  lost: 'error',
};

type FilterStatus = 'all' | 'active' | 'overdue' | 'returned';

const STATUS_FILTER_TO_QUERY: Record<FilterStatus, CheckoutStatus | undefined> = {
  all: undefined,
  active: 'checked_out',
  overdue: 'overdue',
  returned: 'returned',
};

interface FiltersState {
  search: string;
  status: FilterStatus;
  from: string;
  to: string;
  page: number;
  pageSize: number;
}

interface SnackbarState {
  open: boolean;
  message: string;
  severity: 'success' | 'error';
}

interface ExtendDialogState {
  open: boolean;
  checkout: CheckoutOut | null;
  mode: 'days' | 'date';
  days: string;
  date: string;
  error: string | null;
  submitting: boolean;
}

interface ConfirmDialogState {
  open: boolean;
  checkout: CheckoutOut | null;
  action: 'return' | 'cancel';
  submitting: boolean;
}

interface ActionMenuState {
  anchorEl: HTMLElement | null;
  checkout: CheckoutOut | null;
}

interface LoanRow {
  checkout: CheckoutOut;
  bookTitle: string;
  bookAuthor: string;
  coverImage?: string;
  statusLabel: string;
  statusColor: 'default' | 'primary' | 'info' | 'success' | 'warning' | 'error';
  dueDateLabel: string;
  checkedOutLabel: string;
  daysLeft: number | null;
  dueChip?: {
    label: string;
    color: 'default' | 'success' | 'warning' | 'error';
    icon?: React.ReactNode;
  };
}

function parseIntParam(value: string | null, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function parseFilters(params: URLSearchParams | null): FiltersState {
  const statusParam = params?.get('status') ?? 'all';
  const status: FilterStatus = ['all', 'active', 'overdue', 'returned'].includes(statusParam)
    ? (statusParam as FilterStatus)
    : 'all';

  const page = parseIntParam(params?.get('page'), 0);
  const pageSizeCandidate = parseIntParam(params?.get('pageSize'), DEFAULT_PAGE_SIZE);
  const pageSize = PAGE_SIZE_OPTIONS.includes(pageSizeCandidate as (typeof PAGE_SIZE_OPTIONS)[number])
    ? pageSizeCandidate
    : DEFAULT_PAGE_SIZE;

  return {
    search: params?.get('search') ?? '',
    status,
    from: params?.get('from') ?? '',
    to: params?.get('to') ?? '',
    page,
    pageSize,
  };
}

function buildSearchParams(filters: FiltersState): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.search.trim().length > 0) params.set('search', filters.search.trim());
  if (filters.status !== 'all') params.set('status', filters.status);
  if (filters.from) params.set('from', filters.from);
  if (filters.to) params.set('to', filters.to);
  if (filters.page > 0) params.set('page', String(filters.page));
  if (filters.pageSize !== DEFAULT_PAGE_SIZE) params.set('pageSize', String(filters.pageSize));
  return params;
}

function shallowEqualFilters(a: FiltersState, b: FiltersState): boolean {
  return (
    a.search === b.search &&
    a.status === b.status &&
    a.from === b.from &&
    a.to === b.to &&
    a.page === b.page &&
    a.pageSize === b.pageSize
  );
}

function formatDateTime(iso?: string | null): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatDateOnly(iso?: string | null): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatDateInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function toEndOfDayIso(date: Date): string {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next.toISOString();
}

function computeDaysLeft(dueAt?: string | null): number | null {
  if (!dueAt) return null;
  const dueTime = new Date(dueAt).getTime();
  if (Number.isNaN(dueTime)) return null;
  const diff = dueTime - Date.now();
  return Math.ceil(diff / MS_IN_DAY);
}

function getDueChip(daysLeft: number | null): LoanRow['dueChip'] {
  if (daysLeft === null) return undefined;
  if (daysLeft < 0) {
    const overdueDays = Math.abs(daysLeft);
    return {
      label: `Overdue by ${overdueDays} day${overdueDays === 1 ? '' : 's'}`,
      color: 'error',
      icon: <WarningAmberRoundedIcon fontSize="small" />,
    };
  }
  if (daysLeft === 0) {
    return {
      label: 'Due today',
      color: 'warning',
      icon: <WarningAmberRoundedIcon fontSize="small" />,
    };
  }
  if (daysLeft <= 3) {
    return {
      label: `Due in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`,
      color: 'warning',
      icon: <ScheduleRoundedIcon fontSize="small" />,
    };
  }
  return {
    label: `Due in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`,
    color: 'default',
    icon: <ScheduleRoundedIcon fontSize="small" />,
  };
}

function mapCheckoutToRow(checkout: CheckoutOut): LoanRow {
  const bookTitle = checkout.book?.title ?? 'Untitled book';
  const bookAuthor = checkout.book?.author ?? '';
  const coverImage = checkout.book?.coverImageUrl;
  const statusLabel = STATUS_LABELS[checkout.status] ?? checkout.status;
  const statusColor = STATUS_CHIP_COLOR[checkout.status] ?? 'default';
  const daysLeft = computeDaysLeft(checkout.dueAt);

  return {
    checkout,
    bookTitle,
    bookAuthor,
    coverImage: coverImage && coverImage.length > 0 ? coverImage : undefined,
    statusLabel,
    statusColor,
    dueDateLabel: formatDateOnly(checkout.dueAt),
    checkedOutLabel: formatDateOnly(checkout.checkedOutAt),
    daysLeft,
    dueChip: getDueChip(daysLeft),
  };
}

function canExtend(status: CheckoutStatus): boolean {
  return status === 'checked_out' || status === 'overdue';
}

function canReturn(status: CheckoutStatus): boolean {
  return status === 'checked_out' || status === 'overdue';
}

function canCancel(status: CheckoutStatus): boolean {
  return status === 'requested';
}

const defaultSnackbarState: SnackbarState = {
  open: false,
  message: '',
  severity: 'success',
};

const defaultExtendState: ExtendDialogState = {
  open: false,
  checkout: null,
  mode: 'days',
  days: '7',
  date: '',
  error: null,
  submitting: false,
};

const defaultConfirmState: ConfirmDialogState = {
  open: false,
  checkout: null,
  action: 'return',
  submitting: false,
};

const defaultActionMenu: ActionMenuState = {
  anchorEl: null,
  checkout: null,
};

export default function UserLoanHistoryPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { member, isInitialized } = useAuthContext();

  const [isRedirecting, setIsRedirecting] = React.useState(false);
  const [filters, setFilters] = React.useState<FiltersState>(() => parseFilters(searchParams));
  const [loading, setLoading] = React.useState(false);
  const [loans, setLoans] = React.useState<CheckoutOut[]>([]);
  const [totalCount, setTotalCount] = React.useState<number | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [snackbar, setSnackbar] = React.useState<SnackbarState>(defaultSnackbarState);
  const [extendDialog, setExtendDialog] = React.useState<ExtendDialogState>(defaultExtendState);
  const [confirmDialog, setConfirmDialog] = React.useState<ConfirmDialogState>(defaultConfirmState);
  const [actionMenu, setActionMenu] = React.useState<ActionMenuState>(defaultActionMenu);

  const [debouncedSearch, setDebouncedSearch] = React.useState(filters.search);

  const skipQuerySync = React.useRef(false);

  const ready =
    isInitialized && Boolean(member) && member?.role !== 'admin' && !isRedirecting;

  React.useEffect(() => {
    if (!isInitialized || isRedirecting) {
      return;
    }

    if (!member) {
      setIsRedirecting(true);
      router.replace('/login?next=/loans');
      return;
    }

    if (member.role === 'admin') {
      setIsRedirecting(true);
      router.replace('/admin/loans');
    }
  }, [isInitialized, member, router, isRedirecting]);

  React.useEffect(() => {
    const next = parseFilters(searchParams);
    setFilters((prev) => {
      if (shallowEqualFilters(prev, next)) {
        return prev;
      }
      skipQuerySync.current = true;
      return next;
    });
  }, [searchParams]);

  React.useEffect(() => {
    if (skipQuerySync.current) {
      skipQuerySync.current = false;
      return;
    }

    if (!ready) {
      return;
    }

    const params = buildSearchParams(filters);
    const query = params.toString();
    router.replace(query.length > 0 ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [filters, ready, router, pathname]);

  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(filters.search);
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      window.clearTimeout(timer);
    };
  }, [filters.search]);

  const handleUnauthorized = React.useCallback(
    (status: number): boolean => {
      if (status === 401 || status === 403) {
        setIsRedirecting(true);
        router.replace('/login?next=/loans');
        return true;
      }
      return false;
    },
    [router],
  );

  const fetchLoans = React.useCallback(async () => {
    if (!ready) return;

    setLoading(true);
    setError(null);

    try {
      const response = await listCheckouts({
        skip: filters.page * filters.pageSize,
        limit: filters.pageSize,
        search: debouncedSearch.trim().length > 0 ? debouncedSearch.trim() : undefined,
        status: STATUS_FILTER_TO_QUERY[filters.status] ?? undefined,
        from: filters.from || undefined,
        to: filters.to || undefined,
      });

      const total = (response as typeof response & { total?: number }).total;
      setTotalCount(typeof total === 'number' ? total : null);
      setLoans(response);
    } catch (cause) {
      if (cause instanceof HttpError) {
        if (handleUnauthorized(cause.status)) {
          return;
        }
        setError(cause.message || 'Unable to load your loans right now.');
      } else {
        setError('Unable to load your loans right now.');
      }
    } finally {
      setLoading(false);
    }
  }, [ready, filters.page, filters.pageSize, filters.status, filters.from, filters.to, debouncedSearch, handleUnauthorized]);

  React.useEffect(() => {
    void fetchLoans();
  }, [fetchLoans]);

  const handleSnackbarClose = React.useCallback(() => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  }, []);

  const loanRows = React.useMemo<LoanRow[]>(() => loans.map(mapCheckoutToRow), [loans]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setFilters((prev) => ({
      ...prev,
      page: 0,
      search: value,
    }));
  };

  const handleStatusChange = (event: SelectChangeEvent<FilterStatus>) => {
    const value = event.target.value as FilterStatus;
    setFilters((prev) => ({
      ...prev,
      status: value,
      page: 0,
    }));
  };

  const handleDateChange = (field: 'from' | 'to') => (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setFilters((prev) => ({
      ...prev,
      [field]: value,
      page: 0,
    }));
  };

  const handlePageSizeChange = (event: SelectChangeEvent<string>) => {
    const nextSize = Number(event.target.value);
    setFilters((prev) => ({
      ...prev,
      pageSize: nextSize,
      page: 0,
    }));
  };

  const handlePageChange = (direction: 'prev' | 'next') => {
    setFilters((prev) => {
      const nextPage = direction === 'next' ? prev.page + 1 : Math.max(0, prev.page - 1);
      return {
        ...prev,
        page: nextPage,
      };
    });
  };

  const handleOpenActionMenu = (event: React.MouseEvent<HTMLElement>, checkout: CheckoutOut) => {
    setActionMenu({
      anchorEl: event.currentTarget,
      checkout,
    });
  };

  const handleCloseActionMenu = () => {
    setActionMenu(defaultActionMenu);
  };

  const handleOpenExtendDialog = (checkout: CheckoutOut) => {
    const baseDate = checkout.dueAt ? new Date(checkout.dueAt) : new Date();
    const suggestedDate = new Date(baseDate);
    suggestedDate.setDate(suggestedDate.getDate() + 7);

    setExtendDialog({
      open: true,
      checkout,
      mode: 'days',
      days: '7',
      date: formatDateInput(suggestedDate),
      error: null,
      submitting: false,
    });
    handleCloseActionMenu();
  };

  const handleCloseExtendDialog = () => {
    setExtendDialog(defaultExtendState);
  };

  const handleExtendModeChange = (_: React.MouseEvent<HTMLElement>, nextMode: ExtendDialogState['mode'] | null) => {
    if (!nextMode) return;
    setExtendDialog((prev) => ({
      ...prev,
      mode: nextMode,
      error: null,
    }));
  };

  const handleExtendFieldChange = (field: 'days' | 'date') => (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setExtendDialog((prev) => ({
      ...prev,
      [field]: value,
      error: null,
    }));
  };

  const applyUpdatedCheckout = React.useCallback((updated: CheckoutOut) => {
    setLoans((prev) =>
      prev.some((item) => item.id === updated.id) ? prev.map((item) => (item.id === updated.id ? updated : item)) : prev,
    );
  }, []);

  const handleExtendSubmit = async () => {
    if (!extendDialog.checkout) return;

    const { checkout, mode, days, date } = extendDialog;

    if (mode === 'days') {
      const parsedDays = Number.parseInt(days, 10);
      if (!Number.isFinite(parsedDays) || parsedDays <= 0) {
        setExtendDialog((prev) => ({ ...prev, error: 'Enter a positive number of days.' }));
        return;
      }

      setExtendDialog((prev) => ({ ...prev, submitting: true, error: null }));
      try {
        const updated = await updateCheckout(checkout.id, { action: 'extend', days: parsedDays });
        applyUpdatedCheckout(updated);
        setSnackbar({ open: true, message: 'Loan extended successfully.', severity: 'success' });
        setExtendDialog(defaultExtendState);
        void fetchLoans();
      } catch (cause) {
        if (cause instanceof HttpError) {
          if (handleUnauthorized(cause.status)) return;
          setExtendDialog((prev) => ({ ...prev, submitting: false, error: cause.message || 'Unable to extend loan.' }));
        } else {
          setExtendDialog((prev) => ({ ...prev, submitting: false, error: 'Unable to extend loan.' }));
        }
      }
      return;
    }

    if (mode === 'date') {
      if (!date) {
        setExtendDialog((prev) => ({ ...prev, error: 'Pick a new due date.' }));
        return;
      }
      const pickedDate = new Date(date);
      if (Number.isNaN(pickedDate.getTime())) {
        setExtendDialog((prev) => ({ ...prev, error: 'Select a valid date.' }));
        return;
      }
      const now = new Date();
      if (pickedDate <= now) {
        setExtendDialog((prev) => ({ ...prev, error: 'Select a future date.' }));
        return;
      }

      setExtendDialog((prev) => ({ ...prev, submitting: true, error: null }));
      try {
        const updated = await updateCheckout(checkout.id, { action: 'extend', newDueAt: toEndOfDayIso(pickedDate) });
        applyUpdatedCheckout(updated);
        setSnackbar({ open: true, message: 'Loan extended successfully.', severity: 'success' });
        setExtendDialog(defaultExtendState);
        void fetchLoans();
      } catch (cause) {
        if (cause instanceof HttpError) {
          if (handleUnauthorized(cause.status)) return;
          setExtendDialog((prev) => ({ ...prev, submitting: false, error: cause.message || 'Unable to extend loan.' }));
        } else {
          setExtendDialog((prev) => ({ ...prev, submitting: false, error: 'Unable to extend loan.' }));
        }
      }
    }
  };

  const handleOpenConfirmDialog = (checkout: CheckoutOut, action: ConfirmDialogState['action']) => {
    setConfirmDialog({
      open: true,
      checkout,
      action,
      submitting: false,
    });
    handleCloseActionMenu();
  };

  const handleCloseConfirmDialog = () => {
    setConfirmDialog(defaultConfirmState);
  };

  const handleConfirmSubmit = async () => {
    if (!confirmDialog.checkout) return;
    const { checkout, action } = confirmDialog;

    setConfirmDialog((prev) => ({ ...prev, submitting: true }));

    try {
      const updated = await updateCheckout(checkout.id, { action });
      applyUpdatedCheckout(updated);
      setSnackbar({
        open: true,
        message: action === 'return' ? 'Book marked as returned.' : 'Loan cancelled.',
        severity: 'success',
      });
      setConfirmDialog(defaultConfirmState);
      void fetchLoans();
    } catch (cause) {
      if (cause instanceof HttpError) {
        if (handleUnauthorized(cause.status)) return;
        setConfirmDialog((prev) => ({ ...prev, submitting: false }));
        setSnackbar({
          open: true,
          message: cause.message || 'Unable to update loan.',
          severity: 'error',
        });
      } else {
        setConfirmDialog((prev) => ({ ...prev, submitting: false }));
        setSnackbar({
          open: true,
          message: 'Unable to update loan.',
          severity: 'error',
        });
      }
    }
  };

  if (!ready) {
    return (
      <Box sx={{ display: 'grid', placeItems: 'center', minHeight: '60vh', px: 2 }}>
        <Stack spacing={2} alignItems="center">
          <CircularProgress size={28} />
          <Typography variant="body2" color="text.secondary">
            Preparing your loan history…
          </Typography>
        </Stack>
      </Box>
    );
  }

  const hasNextPage =
    totalCount !== null
      ? (filters.page + 1) * filters.pageSize < totalCount
      : loans.length === filters.pageSize;

  const showingFrom = filters.page * filters.pageSize + 1;
  const showingTo = filters.page * filters.pageSize + loans.length;

  return (
    <Container maxWidth="lg" sx={{ pb: 8 }}>
      <Stack spacing={3} sx={{ pt: { xs: 4, md: 6 } }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h4" fontWeight={600}>
              My Loans
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Track active, overdue, and past returns at a glance.
            </Typography>
          </Box>
          <Tooltip title="Refresh">
            <span>
              <Button
                variant="outlined"
                size="small"
                onClick={() => {
                  void fetchLoans();
                }}
                disabled={loading}
              >
                Refresh
              </Button>
            </span>
          </Tooltip>
        </Stack>

        <Paper
          elevation={0}
          sx={{
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            overflow: 'hidden',
          }}
        >
          <Stack
            spacing={2}
            direction={{ xs: 'column', lg: 'row' }}
            alignItems={{ xs: 'stretch', lg: 'center' }}
            justifyContent="space-between"
            sx={{ px: { xs: 2.5, md: 3 }, py: 2.5, gap: { xs: 2, lg: 3 } }}
          >
            <TextField
              value={filters.search}
              onChange={handleSearchChange}
              placeholder="Search by book title or author"
              size="small"
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRoundedIcon fontSize="small" />
                  </InputAdornment>
                ),
                sx: { borderRadius: 2 },
              }}
            />
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ flexShrink: 0 }}>
              <FormControl size="small" sx={{ minWidth: 160 }}>
                <InputLabel>Status</InputLabel>
                <Select label="Status" value={filters.status} onChange={handleStatusChange}>
                  <MenuItem value="all">All statuses</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="overdue">Overdue</MenuItem>
                  <MenuItem value="returned">Returned</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="Due from"
                type="date"
                size="small"
                value={filters.from}
                onChange={handleDateChange('from')}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="Due to"
                type="date"
                size="small"
                value={filters.to}
                onChange={handleDateChange('to')}
                InputLabelProps={{ shrink: true }}
              />
              <FormControl size="small" sx={{ minWidth: 140 }}>
                <InputLabel>Per page</InputLabel>
                <Select label="Per page" value={filters.pageSize} onChange={handlePageSizeChange}>
                  {PAGE_SIZE_OPTIONS.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option} rows
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
          </Stack>

          <Divider />

          {error ? (
            <Box sx={{ px: { xs: 2.5, md: 3 }, py: 6 }}>
              <Alert
                severity="error"
                action={
                  <Button color="inherit" size="small" onClick={() => void fetchLoans()}>
                    Retry
                  </Button>
                }
              >
                {error}
              </Alert>
            </Box>
          ) : loading ? (
            <Box sx={{ px: { xs: 2.5, md: 3 }, py: 4 }}>
              <Stack spacing={3}>
                {Array.from({ length: 3 }).map((_, index) =>
                  isMobile ? (
                    <Card
                      key={index}
                      variant="outlined"
                      sx={{
                        borderRadius: 2,
                        borderColor: 'divider',
                      }}
                    >
                      <CardContent sx={{ display: 'flex', gap: 2 }}>
                        <Skeleton variant="rectangular" width={64} height={96} />
                        <Stack spacing={1} flex={1}>
                          <Skeleton variant="text" width="70%" />
                          <Skeleton variant="text" width="40%" />
                          <Skeleton variant="text" width="60%" />
                        </Stack>
                      </CardContent>
                    </Card>
                  ) : (
                    <Stack key={index} direction="row" spacing={2} alignItems="center">
                      <Skeleton variant="rectangular" width="100%" height={56} />
                    </Stack>
                  ),
                )}
              </Stack>
            </Box>
          ) : loanRows.length === 0 ? (
            <Box sx={{ px: { xs: 2.5, md: 3 }, py: 8, textAlign: 'center' }}>
              <Stack spacing={2} alignItems="center">
                <InfoOutlinedIcon color="action" fontSize="large" />
                <Typography variant="subtitle1" fontWeight={600}>
                  No loans found
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 360 }}>
                  You don’t have any loans matching the selected filters yet. Check out a book to see it appear here.
                </Typography>
              </Stack>
            </Box>
          ) : isMobile ? (
            <Stack spacing={2.5} sx={{ px: { xs: 2.5, md: 3 }, py: 3 }}>
              {loanRows.map((row) => (
                <Card
                  key={row.checkout.id}
                  variant="outlined"
                  sx={{
                    borderRadius: 2,
                    borderColor: 'divider',
                  }}
                >
                  <CardContent sx={{ display: 'flex', gap: 2 }}>
                    {row.coverImage ? (
                      <CardMedia
                        component="img"
                        image={row.coverImage}
                        alt={row.bookTitle}
                        sx={{
                          width: 72,
                          height: 108,
                          objectFit: 'cover',
                          borderRadius: 1.5,
                        }}
                      />
                    ) : (
                      <Box
                        sx={{
                          width: 72,
                          height: 108,
                          borderRadius: 1.5,
                          bgcolor: 'background.default',
                          border: '1px dashed',
                          borderColor: 'divider',
                          display: 'grid',
                          placeItems: 'center',
                          fontSize: 12,
                          color: 'text.secondary',
                          textAlign: 'center',
                          px: 1,
                        }}
                      >
                        No cover
                      </Box>
                    )}
                    <Stack spacing={1} flex={1}>
                      <Stack spacing={0.5}>
                        <Typography fontWeight={600}>{row.bookTitle}</Typography>
                        {row.bookAuthor && (
                          <Typography variant="body2" color="text.secondary">
                            {row.bookAuthor}
                          </Typography>
                        )}
                      </Stack>
                      <Chip
                        label={row.statusLabel}
                        size="small"
                        color={row.statusColor}
                        sx={{ alignSelf: 'flex-start', textTransform: 'capitalize' }}
                      />
                      <Stack spacing={0.5}>
                        <Typography variant="body2" color="text.secondary">
                          Checked out: {row.checkedOutLabel}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Due: {row.dueDateLabel}
                        </Typography>
                        {row.dueChip && (
                          <Chip
                            size="small"
                            label={row.dueChip.label}
                            color={row.dueChip.color}
                            icon={row.dueChip.icon}
                            sx={{ width: 'fit-content' }}
                          />
                        )}
                      </Stack>
                      <Divider sx={{ my: 1 }} />
                      <Stack direction="row" spacing={1}>
                        {canExtend(row.checkout.status) && (
                          <Button
                            size="small"
                            startIcon={<EventRepeatRoundedIcon fontSize="small" />}
                            onClick={() => handleOpenExtendDialog(row.checkout)}
                          >
                            Extend
                          </Button>
                        )}
                        {canReturn(row.checkout.status) && (
                          <Button
                            size="small"
                            startIcon={<AssignmentReturnRoundedIcon fontSize="small" />}
                            onClick={() => handleOpenConfirmDialog(row.checkout, 'return')}
                          >
                            Return
                          </Button>
                        )}
                        {canCancel(row.checkout.status) && (
                          <Button
                            size="small"
                            startIcon={<CancelRoundedIcon fontSize="small" />}
                            onClick={() => handleOpenConfirmDialog(row.checkout, 'cancel')}
                          >
                            Cancel
                          </Button>
                        )}
                      </Stack>
                    </Stack>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          ) : (
            <TableContainer component={Paper} elevation={0}>
              <Table size="medium">
                <TableHead>
                  <TableRow>
                    <TableCell>Book</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Checked Out</TableCell>
                    <TableCell>Due</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loanRows.map((row) => (
                    <TableRow key={row.checkout.id} hover>
                      <TableCell>
                        <Stack direction="row" spacing={2} alignItems="center">
                          {row.coverImage ? (
                            <Box
                              component="img"
                              src={row.coverImage}
                              alt={row.bookTitle}
                              sx={{
                                width: 56,
                                height: 80,
                                objectFit: 'cover',
                                borderRadius: 1.5,
                              }}
                            />
                          ) : (
                            <Box
                              sx={{
                                width: 56,
                                height: 80,
                                borderRadius: 1.5,
                                bgcolor: 'background.default',
                                border: '1px dashed',
                                borderColor: 'divider',
                                display: 'grid',
                                placeItems: 'center',
                                fontSize: 11,
                                color: 'text.secondary',
                                px: 1,
                                textAlign: 'center',
                              }}
                            >
                              No cover
                            </Box>
                          )}
                          <Stack spacing={0.5}>
                            <Typography fontWeight={600}>{row.bookTitle}</Typography>
                            {row.bookAuthor && (
                              <Typography variant="body2" color="text.secondary">
                                {row.bookAuthor}
                              </Typography>
                            )}
                          </Stack>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={row.statusLabel}
                          color={row.statusColor}
                          size="small"
                          sx={{ textTransform: 'capitalize' }}
                        />
                      </TableCell>
                      <TableCell>
                        <Stack spacing={0.5}>
                          <Typography variant="body2">{row.checkedOutLabel}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatDateTime(row.checkout.checkedOutAt)}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Stack spacing={0.5}>
                          <Typography variant="body2">{row.dueDateLabel}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatDateTime(row.checkout.dueAt)}
                          </Typography>
                          {row.dueChip && (
                            <Chip
                              size="small"
                              label={row.dueChip.label}
                              color={row.dueChip.color}
                              icon={row.dueChip.icon}
                              sx={{ width: 'fit-content' }}
                            />
                          )}
                        </Stack>
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          aria-label={`Manage loan for ${row.bookTitle}`}
                          onClick={(event) => handleOpenActionMenu(event, row.checkout)}
                          size="small"
                        >
                          <MoreVertRoundedIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          <Divider />

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            alignItems={{ xs: 'flex-start', sm: 'center' }}
            justifyContent="space-between"
            sx={{ px: { xs: 2.5, md: 3 }, py: 2.5 }}
          >
            <Typography variant="body2" color="text.secondary">
              Showing {showingFrom}–{showingTo}
              {totalCount !== null ? ` of ${totalCount}` : ''}
            </Typography>
            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                size="small"
                disabled={filters.page === 0 || loading}
                onClick={() => handlePageChange('prev')}
              >
                Previous
              </Button>
              <Button
                variant="outlined"
                size="small"
                disabled={!hasNextPage || loading}
                onClick={() => handlePageChange('next')}
              >
                Next
              </Button>
            </Stack>
          </Stack>
        </Paper>
      </Stack>

      <Menu
        anchorEl={actionMenu.anchorEl}
        open={Boolean(actionMenu.anchorEl) && Boolean(actionMenu.checkout)}
        onClose={handleCloseActionMenu}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        {actionMenu.checkout && canExtend(actionMenu.checkout.status) && (
          <MenuItem
            onClick={() => {
              if (!actionMenu.checkout) return;
              handleOpenExtendDialog(actionMenu.checkout);
            }}
          >
            <ListItemIcon>
              <EventRepeatRoundedIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Extend loan" />
          </MenuItem>
        )}
        {actionMenu.checkout && canReturn(actionMenu.checkout.status) && (
          <MenuItem
            onClick={() => {
              if (!actionMenu.checkout) return;
              handleOpenConfirmDialog(actionMenu.checkout, 'return');
            }}
          >
            <ListItemIcon>
              <AssignmentReturnRoundedIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Mark as returned" />
          </MenuItem>
        )}
        {actionMenu.checkout && canCancel(actionMenu.checkout.status) && (
          <MenuItem
            onClick={() => {
              if (!actionMenu.checkout) return;
              handleOpenConfirmDialog(actionMenu.checkout, 'cancel');
            }}
          >
            <ListItemIcon>
              <CancelRoundedIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Cancel request" />
          </MenuItem>
        )}
      </Menu>

      <Dialog open={extendDialog.open} onClose={extendDialog.submitting ? undefined : handleCloseExtendDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Extend loan</DialogTitle>
        <DialogContent dividers sx={{ display: 'grid', gap: 2.5 }}>
          {extendDialog.checkout && (
            <>
              <Stack spacing={0.5}>
                <Typography variant="subtitle2" color="text.secondary">
                  Book
                </Typography>
                <Typography fontWeight={600}>{extendDialog.checkout.book?.title ?? 'Untitled book'}</Typography>
                {extendDialog.checkout.book?.author && (
                  <Typography variant="body2" color="text.secondary">
                    {extendDialog.checkout.book.author}
                  </Typography>
                )}
              </Stack>
              <Typography variant="body2" color="text.secondary">
                Current due date: {formatDateTime(extendDialog.checkout.dueAt)}
              </Typography>
            </>
          )}

          <Stack spacing={1.5}>
            <Typography variant="subtitle2" color="text.secondary">
              Extension mode
            </Typography>
            <ToggleButtonGroup
              value={extendDialog.mode}
              exclusive
              onChange={handleExtendModeChange}
              size="small"
              color="primary"
            >
              <ToggleButton value="days">Add days</ToggleButton>
              <ToggleButton value="date">Pick new date</ToggleButton>
            </ToggleButtonGroup>

            {extendDialog.mode === 'days' ? (
              <TextField
                label="Additional days"
                type="number"
                inputProps={{ min: 1 }}
                value={extendDialog.days}
                onChange={handleExtendFieldChange('days')}
                fullWidth
              />
            ) : (
              <TextField
                label="New due date"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={extendDialog.date}
                onChange={handleExtendFieldChange('date')}
                fullWidth
              />
            )}
          </Stack>

          {extendDialog.error && (
            <Alert severity="error" variant="outlined">
              {extendDialog.error}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseExtendDialog} disabled={extendDialog.submitting}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              void handleExtendSubmit();
            }}
            disabled={extendDialog.submitting}
          >
            {extendDialog.submitting ? 'Saving…' : 'Apply'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={confirmDialog.open}
        onClose={confirmDialog.submitting ? undefined : handleCloseConfirmDialog}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          {confirmDialog.action === 'return' ? 'Mark as returned?' : 'Cancel this loan request?'}
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary">
            {confirmDialog.action === 'return'
              ? 'Confirming will mark this book as returned.'
              : 'Cancelling will remove this pending checkout request.'}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConfirmDialog} disabled={confirmDialog.submitting}>
            Back
          </Button>
          <Button
            variant="contained"
            color={confirmDialog.action === 'return' ? 'primary' : 'error'}
            onClick={() => {
              void handleConfirmSubmit();
            }}
            disabled={confirmDialog.submitting}
          >
            {confirmDialog.submitting ? 'Working…' : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={snackbar.severity === 'success' ? 3000 : 5000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} onClose={handleSnackbarClose} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
