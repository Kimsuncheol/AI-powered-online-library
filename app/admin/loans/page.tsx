'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  Alert,
  Box,
  Button,
  Card,
  Checkbox,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import AssignmentTurnedInRoundedIcon from '@mui/icons-material/AssignmentTurnedInRounded';
import BlockRoundedIcon from '@mui/icons-material/BlockRounded';
import ReportProblemRoundedIcon from '@mui/icons-material/ReportProblemRounded';

import type { CheckoutOut, CheckoutStatus } from '@/app/types/checkouts';
import { listCheckouts, updateCheckout, getCheckout } from '@/app/lib/api/checkouts';
import { HttpError } from '@/app/lib/http';
import { useAuth } from '@/app/components/layout/AuthProvider';
import { useAuthContext } from '@/app/context/AuthContext';

const FETCH_LIMIT = 50;
const SEARCH_DEBOUNCE_MS = 300;

type BulkAction = 'return' | 'mark_lost' | 'cancel';

interface SnackbarState {
  open: boolean;
  message: string;
  severity: 'success' | 'error';
}

const defaultSnackbarState: SnackbarState = {
  open: false,
  message: '',
  severity: 'success',
};

const checkoutStatusOrder: CheckoutStatus[] = [
  'checked_out',
  'overdue',
  'returned',
  'lost',
  'cancelled',
  'requested',
];

const statusLabels: Record<CheckoutStatus, string> = {
  requested: 'Requested',
  checked_out: 'Checked Out',
  returned: 'Returned',
  overdue: 'Overdue',
  cancelled: 'Cancelled',
  lost: 'Lost',
};

const statusChipColor: Partial<Record<CheckoutStatus, 'default' | 'primary' | 'info' | 'success' | 'warning' | 'error'>> =
  {
    checked_out: 'info',
    overdue: 'warning',
    returned: 'success',
    lost: 'error',
    cancelled: 'default',
  };

function formatDate(input?: string | null): string {
  if (!input) return '—';
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString();
}

function getStatusColor(status: CheckoutStatus): 'default' | 'primary' | 'info' | 'success' | 'warning' | 'error' {
  return statusChipColor[status] ?? 'primary';
}

export default function LoanHistoryPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { isInitialized } = useAuthContext();

  const [isRedirecting, setIsRedirecting] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [checkouts, setCheckouts] = React.useState<CheckoutOut[]>([]);
  const [error, setError] = React.useState<string | null>(null);

  const [filters, setFilters] = React.useState({
    search: '',
    status: 'all' as CheckoutStatus | 'all',
    from: '',
    to: '',
  });
  const [debouncedSearch, setDebouncedSearch] = React.useState('');

  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());

  const [bulkAction, setBulkAction] = React.useState<BulkAction>('return');
  const [bulkLoading, setBulkLoading] = React.useState(false);

  const [snackbar, setSnackbar] = React.useState<SnackbarState>(defaultSnackbarState);

  const [detailOpen, setDetailOpen] = React.useState(false);
  const [detailLoading, setDetailLoading] = React.useState(false);
  const [detailCheckout, setDetailCheckout] = React.useState<CheckoutOut | null>(null);
  const [extendDays, setExtendDays] = React.useState<string>('7');
  const [extendSubmitting, setExtendSubmitting] = React.useState(false);

  const isAdmin = user?.role === 'admin';
  const readyForRender = isInitialized && isAdmin && !isRedirecting;

  React.useEffect(() => {
    if (!isInitialized) {
      return;
    }

    if (!user) {
      setIsRedirecting(true);
      router.replace('/login');
      return;
    }

    if (user.role !== 'admin') {
      setIsRedirecting(true);
      router.replace('/');
    }
  }, [isInitialized, router, user]);

  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(filters.search.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [filters.search]);

  const handleCloseSnackbar = React.useCallback(() => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  }, []);

  const fetchCheckouts = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        limit: FETCH_LIMIT,
        search: debouncedSearch.length > 0 ? debouncedSearch : undefined,
        status: filters.status !== 'all' ? filters.status : undefined,
        from: filters.from || undefined,
        to: filters.to || undefined,
      };
      const items = await listCheckouts(params);
      setCheckouts(items);
      setSelectedIds(new Set());
    } catch (cause) {
      const message =
        cause instanceof HttpError ? cause.message || 'Unable to fetch loan history.' : 'Unable to fetch loan history.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, filters.from, filters.status, filters.to]);

  React.useEffect(() => {
    if (!isInitialized || !isAdmin) {
      return;
    }
    void fetchCheckouts();
  }, [fetchCheckouts, isAdmin, isInitialized]);

  const handleFilterChange = (field: 'search' | 'status' | 'from' | 'to', value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const toggleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelectedIds(new Set(checkouts.map((item) => item.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectedCount = selectedIds.size;
  const allSelected = selectedCount > 0 && selectedCount === checkouts.length;

  const sortedCheckouts = React.useMemo(() => {
    const order = new Map(checkoutStatusOrder.map((status, index) => [status, index]));
    return [...checkouts].sort((a, b) => {
      const orderA = order.get(a.status) ?? checkoutStatusOrder.length;
      const orderB = order.get(b.status) ?? checkoutStatusOrder.length;
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      const dueA = a.dueAt ?? '';
      const dueB = b.dueAt ?? '';
      return dueA.localeCompare(dueB);
    });
  }, [checkouts]);

  const handleOpenDetail = React.useCallback(
    async (checkout: CheckoutOut) => {
      setDetailCheckout(checkout);
      setDetailOpen(true);
      setExtendDays('7');
      setDetailLoading(true);
      try {
        const fresh = await getCheckout(checkout.id);
        setDetailCheckout(fresh);
      } catch (cause) {
        const message =
          cause instanceof HttpError
            ? cause.message || 'Unable to fetch checkout details.'
            : 'Unable to fetch checkout details.';
        setSnackbar({
          open: true,
          message,
          severity: 'error',
        });
      } finally {
        setDetailLoading(false);
      }
    },
    [],
  );

  const handleCloseDetail = () => {
    setDetailOpen(false);
    setDetailCheckout(null);
    setDetailLoading(false);
  };

  const upsertCheckoutIntoList = React.useCallback((updated: CheckoutOut) => {
    setCheckouts((prev) => {
      const existingIndex = prev.findIndex((item) => item.id === updated.id);
      if (existingIndex === -1) {
        return prev;
      }
      const next = [...prev];
      next[existingIndex] = updated;
      return next;
    });
  }, []);

  const handleUpdateCheckout = React.useCallback(
    async (id: string, payload: Parameters<typeof updateCheckout>[1], successMessage: string) => {
      try {
        const updated = await updateCheckout(id, payload);
        upsertCheckoutIntoList(updated);
        setDetailCheckout(updated);
        setSnackbar({
          open: true,
          message: successMessage,
          severity: 'success',
        });
      } catch (cause) {
        const message =
          cause instanceof HttpError ? cause.message || 'Unable to update checkout.' : 'Unable to update checkout.';
      setSnackbar({
        open: true,
        message,
        severity: 'error',
      });
    }
  },
  [upsertCheckoutIntoList],
);

  const handleBulkApply = async () => {
    if (selectedIds.size === 0) {
      return;
    }
    setBulkLoading(true);
    try {
      for (const id of selectedIds) {
        const payload =
          bulkAction === 'return'
            ? { action: 'return' as const }
            : bulkAction === 'mark_lost'
            ? { action: 'mark_lost' as const }
            : { action: 'cancel' as const };
        const updated = await updateCheckout(id, payload);
        upsertCheckoutIntoList(updated);
      }
      setSnackbar({
        open: true,
        message: 'Bulk action applied successfully.',
        severity: 'success',
      });
      setSelectedIds(new Set());
    } catch (cause) {
      const message =
        cause instanceof HttpError ? cause.message || 'Bulk action failed.' : 'Bulk action failed.';
      setSnackbar({
        open: true,
        message,
        severity: 'error',
      });
    } finally {
      setBulkLoading(false);
    }
  };

  const handleMarkReturned = async () => {
    if (!detailCheckout) return;
    await handleUpdateCheckout(detailCheckout.id, { action: 'return' }, 'Checkout marked as returned.');
  };

  const handleCancel = async () => {
    if (!detailCheckout) return;
    await handleUpdateCheckout(detailCheckout.id, { action: 'cancel' }, 'Checkout cancelled.');
  };

  const handleMarkLost = async () => {
    if (!detailCheckout) return;
    await handleUpdateCheckout(detailCheckout.id, { action: 'mark_lost' }, 'Checkout marked as lost.');
  };

  const handleExtendDueDate = async () => {
    if (!detailCheckout) return;
    const parsedDays = Number.parseInt(extendDays, 10);
    if (!Number.isFinite(parsedDays) || parsedDays <= 0) {
      setSnackbar({
        open: true,
        message: 'Please enter a positive number of days.',
        severity: 'error',
      });
      return;
    }
    setExtendSubmitting(true);
    try {
      await handleUpdateCheckout(detailCheckout.id, { action: 'extend', days: parsedDays }, 'Due date extended.');
    } finally {
      setExtendSubmitting(false);
    }
  };

  if (!readyForRender) {
    return (
      <Box sx={{ display: 'grid', placeItems: 'center', minHeight: '60vh' }}>
        <CircularProgress size={32} />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ pb: 8 }}>
      <Stack spacing={3}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ pt: 4 }}>
          <div>
            <Typography variant="h4" fontWeight={600}>
              Loan History
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Review, track, and manage all book loans across the library.
            </Typography>
          </div>
          <Tooltip title="Refresh">
            <span>
              <Button
                variant="outlined"
                size="small"
                startIcon={<RefreshRoundedIcon />}
                onClick={() => {
                  void fetchCheckouts();
                }}
                disabled={loading}
              >
                Refresh
              </Button>
            </span>
          </Tooltip>
        </Stack>

        <Card sx={{ p: 0 }}>
          <Toolbar
            sx={{
              gap: 2,
              flexWrap: 'wrap',
              alignItems: 'center',
              px: 3,
              py: 2,
            }}
          >
            <TextField
              value={filters.search}
              onChange={(event) => handleFilterChange('search', event.target.value)}
              placeholder="Search by book, member, or notes"
              size="small"
              sx={{ minWidth: { xs: '100%', sm: 240 } }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRoundedIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Status</InputLabel>
              <Select
                label="Status"
                value={filters.status}
                onChange={(event) => handleFilterChange('status', event.target.value)}
              >
                <MenuItem value="all">All statuses</MenuItem>
                {checkoutStatusOrder.map((status) => (
                  <MenuItem key={status} value={status}>
                    {statusLabels[status]}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              type="date"
              label="From"
              size="small"
              InputLabelProps={{ shrink: true }}
              value={filters.from}
              onChange={(event) => handleFilterChange('from', event.target.value)}
            />
            <TextField
              type="date"
              label="To"
              size="small"
              InputLabelProps={{ shrink: true }}
              value={filters.to}
              onChange={(event) => handleFilterChange('to', event.target.value)}
            />
          </Toolbar>

          {selectedCount > 0 && (
            <>
              <Divider />
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={2}
                alignItems={{ xs: 'stretch', sm: 'center' }}
                justifyContent="space-between"
                sx={{ px: 3, py: 2 }}
              >
                <Typography variant="body2">
                  {selectedCount} loan{selectedCount === 1 ? '' : 's'} selected
                </Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'stretch', sm: 'center' }}>
                  <FormControl size="small" sx={{ minWidth: 180 }}>
                    <InputLabel>Bulk action</InputLabel>
                    <Select
                      label="Bulk action"
                      value={bulkAction}
                      onChange={(event) => setBulkAction(event.target.value as BulkAction)}
                    >
                      <MenuItem value="return">
                        <Stack direction="row" spacing={1} alignItems="center">
                          <AssignmentTurnedInRoundedIcon fontSize="small" />
                          <span>Mark as returned</span>
                        </Stack>
                      </MenuItem>
                      <MenuItem value="mark_lost">
                        <Stack direction="row" spacing={1} alignItems="center">
                          <ReportProblemRoundedIcon fontSize="small" />
                          <span>Mark as lost</span>
                        </Stack>
                      </MenuItem>
                      <MenuItem value="cancel">
                        <Stack direction="row" spacing={1} alignItems="center">
                          <BlockRoundedIcon fontSize="small" />
                          <span>Cancel checkout</span>
                        </Stack>
                      </MenuItem>
                    </Select>
                  </FormControl>
                  <Button
                    variant="contained"
                    onClick={() => {
                      void handleBulkApply();
                    }}
                    disabled={bulkLoading}
                  >
                    Apply
                  </Button>
                </Stack>
              </Stack>
            </>
          )}

          <Divider />

          {loading ? (
            <Box sx={{ py: 10, display: 'grid', placeItems: 'center' }}>
              <Stack spacing={2} alignItems="center">
                <CircularProgress size={26} />
                <Typography variant="body2" color="text.secondary">
                  Loading loans…
                </Typography>
              </Stack>
            </Box>
          ) : error ? (
            <Box sx={{ py: 8, px: 3 }}>
              <Alert severity="error" action={<Button onClick={() => void fetchCheckouts()}>Retry</Button>}>
                {error}
              </Alert>
            </Box>
          ) : sortedCheckouts.length === 0 ? (
            <Box sx={{ py: 10, display: 'grid', placeItems: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                No loans found for the selected filters.
              </Typography>
            </Box>
          ) : (
            <Box sx={{ overflowX: 'auto' }}>
              <Table size="small" sx={{ minWidth: 960 }}>
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={allSelected}
                        indeterminate={selectedCount > 0 && selectedCount < sortedCheckouts.length}
                        onChange={toggleSelectAll}
                        inputProps={{ 'aria-label': 'Select all loans' }}
                      />
                    </TableCell>
                    <TableCell>Book</TableCell>
                    <TableCell>Member</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Checked out</TableCell>
                    <TableCell>Due</TableCell>
                    <TableCell>Returned</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sortedCheckouts.map((checkout) => {
                    const isSelected = selectedIds.has(checkout.id);
                    return (
                      <TableRow key={checkout.id} hover selected={isSelected}>
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={isSelected}
                            onChange={() => toggleSelectOne(checkout.id)}
                            inputProps={{ 'aria-label': `Select loan ${checkout.id}` }}
                          />
                        </TableCell>
                        <TableCell>
                          <Stack spacing={0.5}>
                            <Typography variant="body2" fontWeight={600}>
                              {checkout.book?.title ?? 'Untitled book'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {checkout.book?.author ?? 'Unknown author'}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Stack spacing={0.5}>
                            <Typography variant="body2" fontWeight={600}>
                              {checkout.member?.displayName ?? checkout.member?.email ?? 'Unknown member'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {checkout.member?.email ?? '—'}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            color={getStatusColor(checkout.status)}
                            label={statusLabels[checkout.status]}
                            sx={{ textTransform: 'capitalize' }}
                          />
                        </TableCell>
                        <TableCell>{formatDate(checkout.checkedOutAt)}</TableCell>
                        <TableCell>{formatDate(checkout.dueAt)}</TableCell>
                        <TableCell>{formatDate(checkout.returnedAt)}</TableCell>
                        <TableCell align="right">
                          <Tooltip title="Inspect details">
                            <span>
                              <Button
                                size="small"
                                variant="text"
                                startIcon={<VisibilityRoundedIcon fontSize="small" />}
                                onClick={() => {
                                  void handleOpenDetail(checkout);
                                }}
                              >
                                Inspect
                              </Button>
                            </span>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Box>
          )}
        </Card>
      </Stack>

      <Dialog open={detailOpen} onClose={handleCloseDetail} maxWidth="sm" fullWidth>
        <DialogTitle>Loan Details</DialogTitle>
        <DialogContent dividers>
          {detailLoading ? (
            <Box sx={{ display: 'grid', placeItems: 'center', py: 6 }}>
              <CircularProgress size={24} />
            </Box>
          ) : detailCheckout ? (
            <Stack spacing={3}>
              <Stack spacing={0.5}>
                <Typography variant="subtitle2" color="text.secondary">
                  Book
                </Typography>
                <Typography fontWeight={600}>{detailCheckout.book?.title ?? 'Untitled book'}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {detailCheckout.book?.author ?? 'Unknown author'}
                </Typography>
              </Stack>
              <Stack spacing={0.5}>
                <Typography variant="subtitle2" color="text.secondary">
                  Member
                </Typography>
                <Typography fontWeight={600}>
                  {detailCheckout.member?.displayName ?? detailCheckout.member?.email ?? 'Unknown member'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {detailCheckout.member?.email ?? '—'}
                </Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <Chip
                  color={getStatusColor(detailCheckout.status)}
                  label={statusLabels[detailCheckout.status]}
                  size="small"
                  sx={{ textTransform: 'capitalize' }}
                />
                <Typography variant="body2" color="text.secondary">
                  Last updated {formatDate(detailCheckout.updatedAt ?? detailCheckout.createdAt)}
                </Typography>
              </Stack>
              <Stack spacing={1.5}>
                <Typography variant="subtitle2" color="text.secondary">
                  Timeline
                </Typography>
                <Stack spacing={0.75}>
                  <Typography variant="body2">Checked out: {formatDate(detailCheckout.checkedOutAt)}</Typography>
                  <Typography variant="body2">Due: {formatDate(detailCheckout.dueAt)}</Typography>
                  <Typography variant="body2">Returned: {formatDate(detailCheckout.returnedAt)}</Typography>
                </Stack>
              </Stack>
              {detailCheckout.notes && (
                <Stack spacing={0.5}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Notes
                  </Typography>
                  <Typography variant="body2">{detailCheckout.notes}</Typography>
                </Stack>
              )}
              <Stack spacing={2}>
                <Typography variant="subtitle2" color="text.secondary">
                  Extend due date
                </Typography>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <TextField
                    type="number"
                    size="small"
                    label="Days"
                    inputProps={{ min: 1 }}
                    value={extendDays}
                    onChange={(event) => setExtendDays(event.target.value)}
                    sx={{ width: 120 }}
                  />
                  <Button
                    variant="outlined"
                    onClick={() => {
                      void handleExtendDueDate();
                    }}
                    disabled={extendSubmitting}
                  >
                    Extend
                  </Button>
                </Stack>
              </Stack>
            </Stack>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Unable to load checkout details.
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Stack direction="row" spacing={1} justifyContent="space-between" sx={{ width: '100%' }}>
            <Button onClick={handleCloseDetail}>Close</Button>
            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                onClick={() => {
                  void handleCancel();
                }}
                disabled={!detailCheckout || detailCheckout.status === 'cancelled'}
              >
                Cancel
              </Button>
              <Button
                variant="outlined"
                color="warning"
                onClick={() => {
                  void handleMarkLost();
                }}
                disabled={!detailCheckout || detailCheckout.status === 'lost'}
              >
                Mark lost
              </Button>
              <Button
                variant="contained"
                onClick={() => {
                  void handleMarkReturned();
                }}
                disabled={
                  !detailCheckout || detailCheckout.status === 'returned' || detailCheckout.status === 'cancelled'
                }
              >
                Mark returned
              </Button>
            </Stack>
          </Stack>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={snackbar.severity === 'success' ? 3000 : 5000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} onClose={handleCloseSnackbar} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
