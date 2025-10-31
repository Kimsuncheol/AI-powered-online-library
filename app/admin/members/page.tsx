'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormHelperText,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Toolbar,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SearchIcon from '@mui/icons-material/Search';
import type { ChangeEvent, FormEvent, MouseEvent } from 'react';
import type { SelectChangeEvent } from '@mui/material/Select';

import type { Member } from '@/app/interfaces/member';
import type { MemberCreate, MemberOut, MemberUpdate } from '@/app/lib/api/members';
import { createMember, deleteMember, listMembers, updateMember } from '@/app/lib/api/members';

const DEFAULT_ROWS_PER_PAGE = 20;
const SEARCH_DEBOUNCE_MS = 300;

interface SnackbarState {
  open: boolean;
  message: string;
  severity: 'success' | 'error';
}

interface MemberFormValues {
  id?: string;
  email: string;
  displayName: string;
  role: Member['role'];
  avatarUrl?: string;
  bio?: string;
  location?: string;
}

interface MembersTableProps {
  members: MemberOut[];
  loading: boolean;
  page: number;
  rowsPerPage: number;
  total: number;
  onPageChange: (event: MouseEvent<HTMLButtonElement> | null, newPage: number) => void;
  onEdit: (member: MemberOut) => void;
  onDelete: (member: MemberOut) => void;
}

interface MemberDialogProps {
  open: boolean;
  mode: 'create' | 'edit';
  values: MemberFormValues;
  errors: Partial<Record<keyof MemberFormValues, string>>;
  onChange: (field: keyof MemberFormValues, value: string) => void;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  submitting: boolean;
}

const emptyForm: MemberFormValues = {
  email: '',
  displayName: '',
  role: 'user',
  avatarUrl: '',
  bio: '',
  location: '',
};

const roleOptions: Array<{ label: string; value: Member['role'] }> = [
  { label: 'User', value: 'user' },
  { label: 'Admin', value: 'admin' },
];

function MembersTable({ members, loading, page, rowsPerPage, total, onPageChange, onEdit, onDelete }: MembersTableProps) {
  const showEmptyState = !loading && members.length === 0;

  return (
    <Box>
      <Table size="medium">
        <TableHead>
          <TableRow>
            <TableCell>Avatar</TableCell>
            <TableCell>Email</TableCell>
            <TableCell>Display Name</TableCell>
            <TableCell>Role</TableCell>
            <TableCell>Created</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={6} align="center">
                <Stack direction="row" spacing={2} alignItems="center" justifyContent="center">
                  <CircularProgress size={24} />
                  <Typography variant="body2" color="text.secondary">
                    Loading members…
                  </Typography>
                </Stack>
              </TableCell>
            </TableRow>
          ) : showEmptyState ? (
            <TableRow>
              <TableCell colSpan={6} align="center">
                <Typography variant="body2" color="text.secondary">
                  No members found.
                </Typography>
              </TableCell>
            </TableRow>
          ) : (
            members.map((member) => {
              const createdLabel = member.createdAt
                ? new Date(member.createdAt).toLocaleString()
                : '—';

              return (
                <TableRow key={member.id} hover>
                  <TableCell>
                    <Avatar src={member.avatarUrl ?? undefined} alt={member.displayName}>
                      {member.displayName?.charAt(0)?.toUpperCase() ?? member.email.charAt(0).toUpperCase()}
                    </Avatar>
                  </TableCell>
                  <TableCell>{member.email}</TableCell>
                  <TableCell>{member.displayName}</TableCell>
                  <TableCell sx={{ textTransform: 'capitalize' }}>{member.role}</TableCell>
                  <TableCell>{createdLabel}</TableCell>
                  <TableCell align="right">
                    <IconButton aria-label="Edit" onClick={() => onEdit(member)} size="small">
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton aria-label="Delete" onClick={() => onDelete(member)} size="small" sx={{ ml: 1 }}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
      <TablePagination
        component="div"
        count={total}
        page={page}
        onPageChange={onPageChange}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={() => {
          // Page size selection is handled via the toolbar control.
        }}
        rowsPerPageOptions={[rowsPerPage]}
        showFirstButton
        showLastButton
      />
    </Box>
  );
}

function MemberDialog({ open, mode, values, errors, onChange, onClose, onSubmit, submitting }: MemberDialogProps) {
  const isEdit = mode === 'edit';

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{isEdit ? 'Edit Member' : 'Create Member'}</DialogTitle>
      <Box component="form" onSubmit={onSubmit} noValidate>
        <DialogContent sx={{ display: 'grid', gap: 2 }}>
          <TextField
            label="Email"
            type="email"
            name="email"
            value={values.email}
            onChange={(event) => onChange('email', event.target.value)}
            required={!isEdit}
            InputProps={{ readOnly: isEdit }}
            error={Boolean(errors.email)}
            helperText={errors.email}
            autoFocus={!isEdit}
          />
          <TextField
            label="Display Name"
            name="displayName"
            value={values.displayName}
            onChange={(event) => onChange('displayName', event.target.value)}
            required
            error={Boolean(errors.displayName)}
            helperText={errors.displayName}
          />
          <FormControl required error={Boolean(errors.role)}>
            <InputLabel id="member-role-label">Role</InputLabel>
            <Select
              labelId="member-role-label"
              label="Role"
              value={values.role}
              onChange={(event) => onChange('role', event.target.value as Member['role'])}
            >
              {roleOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
            {errors.role ? <FormHelperText>{errors.role}</FormHelperText> : null}
          </FormControl>
          <TextField
            label="Avatar URL"
            name="avatarUrl"
            value={values.avatarUrl ?? ''}
            onChange={(event) => onChange('avatarUrl', event.target.value)}
          />
          <TextField
            label="Bio"
            name="bio"
            value={values.bio ?? ''}
            onChange={(event) => onChange('bio', event.target.value)}
            multiline
            minRows={3}
          />
          <TextField
            label="Location"
            name="location"
            value={values.location ?? ''}
            onChange={(event) => onChange('location', event.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={submitting}>
            {submitting ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Member'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}

function validateForm(values: MemberFormValues, mode: 'create' | 'edit') {
  const errors: Partial<Record<keyof MemberFormValues, string>> = {};
  const emailPattern = /^(?:[a-zA-Z0-9_'^&/+-])+(?:\.(?:[a-zA-Z0-9_'^&/+-])+)*@(?:(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}|\[(?:\d{1,3}\.){3}\d{1,3}\])$/;

  if (mode === 'create') {
    if (!values.email.trim()) {
      errors.email = 'Email is required.';
    } else if (!emailPattern.test(values.email.trim())) {
      errors.email = 'Enter a valid email address.';
    }
  }

  if (!values.displayName.trim()) {
    errors.displayName = 'Display name is required.';
  }

  if (!values.role) {
    errors.role = 'Role is required.';
  }

  return errors;
}

function toMemberCreatePayload(values: MemberFormValues): MemberCreate {
  const payload: MemberCreate = {
    email: values.email.trim(),
    displayName: values.displayName.trim(),
    role: values.role,
    avatarUrl: values.avatarUrl?.trim() || undefined,
    bio: values.bio?.trim() || undefined,
    location: values.location?.trim() || undefined,
  };

  return payload;
}

function toMemberUpdatePayload(values: MemberFormValues): MemberUpdate {
  const payload: MemberUpdate = {
    displayName: values.displayName.trim(),
    role: values.role,
  };

  if (values.avatarUrl !== undefined) {
    payload.avatarUrl = values.avatarUrl?.trim() || undefined;
  }
  if (values.bio !== undefined) {
    payload.bio = values.bio?.trim() || undefined;
  }
  if (values.location !== undefined) {
    payload.location = values.location?.trim() || undefined;
  }

  return payload;
}

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const handle = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(handle);
  }, [value, delay]);

  return debounced;
}

export default function MembersPage() {
  const [members, setMembers] = useState<MemberOut[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<SnackbarState>({ open: false, message: '', severity: 'success' });
  const [formValues, setFormValues] = useState<MemberFormValues>({ ...emptyForm });
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof MemberFormValues, string>>>({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<MemberOut | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const debouncedSearch = useDebouncedValue(searchTerm, SEARCH_DEBOUNCE_MS);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    const skip = page * rowsPerPage;

    try {
      const result = await listMembers(skip, rowsPerPage, debouncedSearch);
      const meta = (result as MemberOut[] & { total?: number }).total;
      const baseTotal = skip + result.length;
      const derivedTotal =
        typeof meta === 'number' && !Number.isNaN(meta)
          ? meta
          : baseTotal + (result.length === rowsPerPage ? 1 : 0);
      setMembers(result);
      setTotal(Math.max(baseTotal, derivedTotal));
    } catch (error) {
      console.error('Failed to load members', error);
      const message = error instanceof Error ? error.message : 'Failed to load members.';
      setSnackbar({ open: true, message, severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, page, rowsPerPage]);

  useEffect(() => {
    void fetchMembers();
  }, [fetchMembers]);

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  const handlePageChange = (_event: MouseEvent<HTMLButtonElement> | null, newPage: number) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event: SelectChangeEvent) => {
    const value = Number(event.target.value);
    const nextRows = Number.isNaN(value) ? rowsPerPage : value;
    setRowsPerPage(nextRows);
    setPage(0);
  };

  const closeSnackbar = () => setSnackbar((prev) => ({ ...prev, open: false }));

  const openCreateDialog = () => {
    setDialogMode('create');
    setFormValues({ ...emptyForm });
    setFormErrors({});
    setDialogOpen(true);
  };

  const openEditDialog = (member: MemberOut) => {
    setDialogMode('edit');
    setFormValues({
      id: member.id,
      email: member.email,
      displayName: member.displayName,
      role: member.role,
      avatarUrl: member.avatarUrl ?? '',
      bio: member.bio ?? '',
      location: member.location ?? '',
    });
    setFormErrors({});
    setDialogOpen(true);
  };

  const handleDialogChange = (field: keyof MemberFormValues, value: string) => {
    setFormValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleDialogClose = () => {
    if (submitLoading) return;
    setDialogOpen(false);
    setFormErrors({});
  };

  const handleDialogSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const errors = validateForm(formValues, dialogMode);
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitLoading(true);

    try {
      if (dialogMode === 'create') {
        const payload = toMemberCreatePayload(formValues);
        await createMember(payload);
        setSnackbar({ open: true, message: 'Member created successfully.', severity: 'success' });
      } else if (formValues.id) {
        const payload = toMemberUpdatePayload(formValues);
        await updateMember(formValues.id, payload);
        setSnackbar({ open: true, message: 'Member updated successfully.', severity: 'success' });
      }
      setDialogOpen(false);
      setFormErrors({});
      await fetchMembers();
    } catch (error) {
      console.error('Failed to submit member form', error);
      let message = 'Save failed. Please try again.';
      if (error instanceof Error) {
        message = error.message;
      }
      setSnackbar({ open: true, message, severity: 'error' });
    } finally {
      setSubmitLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const shouldMoveBack = members.length === 1 && page > 0;
    try {
      await deleteMember(deleteTarget.id);
      setSnackbar({ open: true, message: 'Member deleted successfully.', severity: 'success' });
      setDeleteTarget(null);
      if (shouldMoveBack) {
        setPage((prev) => Math.max(0, prev - 1));
      }
      await fetchMembers();
    } catch (error) {
      console.error('Failed to delete member', error);
      const message = error instanceof Error ? error.message : 'Delete failed. Please try again.';
      setSnackbar({ open: true, message, severity: 'error' });
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2} sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1">
          Members Management
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreateDialog}>
          Create Member
        </Button>
      </Stack>

      <Paper elevation={1}>
        <Toolbar sx={{ gap: 2, justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <TextField
            placeholder="Search by email or display name"
            value={searchTerm}
            onChange={handleSearchChange}
            size="small"
            sx={{ flexGrow: 1, maxWidth: 360 }}
            InputProps={{
              startAdornment: (
                <Box component="span" sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
                  <SearchIcon fontSize="small" color="action" />
                </Box>
              ),
            }}
          />
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel id="rows-per-page-label">Rows per page</InputLabel>
            <Select
              labelId="rows-per-page-label"
              label="Rows per page"
              value={String(rowsPerPage)}
              onChange={handleRowsPerPageChange}
            >
              {[10, 20, 50].map((size) => (
                <MenuItem key={size} value={size}>
                  {size}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Toolbar>

        <MembersTable
          members={members}
          loading={loading}
          page={page}
          rowsPerPage={rowsPerPage}
          total={total}
          onPageChange={handlePageChange}
          onEdit={openEditDialog}
          onDelete={setDeleteTarget}
        />
      </Paper>

      <MemberDialog
        open={dialogOpen}
        mode={dialogMode}
        values={formValues}
        errors={formErrors}
        onChange={handleDialogChange}
        onClose={handleDialogClose}
        onSubmit={handleDialogSubmit}
        submitting={submitLoading}
      />

      <Dialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)}>
        <DialogTitle>Delete Member</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete{' '}
            <strong>{deleteTarget?.displayName ?? deleteTarget?.email}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button color="error" onClick={confirmDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={closeSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={closeSnackbar} severity={snackbar.severity} variant="filled" sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
