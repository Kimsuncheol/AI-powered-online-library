'use client';

import * as React from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Slide,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import type { TransitionProps } from '@mui/material/transitions';

export interface SignupModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (user: { name: string; email: string }) => void;
  onSwitchToLogin?: () => void;
}

type SignupFormState = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
};

type SignupFormErrors = Partial<Record<keyof SignupFormState, string>>;

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & { children: React.ReactElement },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const defaultState: SignupFormState = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
};

export default function SignupModal({ open, onClose, onSuccess, onSwitchToLogin }: SignupModalProps) {
  const [values, setValues] = React.useState<SignupFormState>(defaultState);
  const [errors, setErrors] = React.useState<SignupFormErrors>({});
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setValues(defaultState);
      setErrors({});
      setSubmitting(false);
    }
  }, [open]);

  const handleChange =
    (field: keyof SignupFormState) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setValues((prev) => ({ ...prev, [field]: event.target.value }));
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    };

  const validate = () => {
    const nextErrors: SignupFormErrors = {};
    if (!values.name.trim()) {
      nextErrors.name = 'Name is required.';
    }
    if (!values.email.trim()) {
      nextErrors.email = 'Email is required.';
    }
    if (!values.password.trim()) {
      nextErrors.password = 'Password is required.';
    } else if (values.password.trim().length < 6) {
      nextErrors.password = 'Password must be at least 6 characters.';
    }
    if (!values.confirmPassword.trim()) {
      nextErrors.confirmPassword = 'Please confirm your password.';
    } else if (values.confirmPassword !== values.password) {
      nextErrors.confirmPassword = 'Passwords do not match.';
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) {
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      onSuccess({
        name: values.name.trim(),
        email: values.email.trim(),
      });
      setSubmitting(false);
    }, 400);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      TransitionComponent={Transition}
      keepMounted
      fullWidth
      maxWidth="xs"
      aria-labelledby="signup-dialog-title"
      aria-describedby="signup-dialog-description"
    >
      <DialogTitle id="signup-dialog-title">Create your AI Library account</DialogTitle>
      <DialogContent dividers>
        <Stack component="form" onSubmit={handleSubmit} spacing={2.5} id="signup-dialog-description">
          <TextField
            required
            fullWidth
            label="Name"
            value={values.name}
            onChange={handleChange('name')}
            error={Boolean(errors.name)}
            helperText={errors.name}
            autoFocus
          />
          <TextField
            required
            fullWidth
            label="Email"
            type="email"
            value={values.email}
            onChange={handleChange('email')}
            error={Boolean(errors.email)}
            helperText={errors.email}
          />
          <TextField
            required
            fullWidth
            label="Password"
            type="password"
            value={values.password}
            onChange={handleChange('password')}
            error={Boolean(errors.password)}
            helperText={errors.password}
          />
          <TextField
            required
            fullWidth
            label="Confirm password"
            type="password"
            value={values.confirmPassword}
            onChange={handleChange('confirmPassword')}
            error={Boolean(errors.confirmPassword)}
            helperText={errors.confirmPassword}
          />
          <DialogActions sx={{ px: 0 }}>
            <Button onClick={onClose} color="inherit">
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={submitting}>
              Sign up
            </Button>
          </DialogActions>
        </Stack>
      </DialogContent>
      <DialogActions
        sx={{
          justifyContent: 'center',
          gap: 1,
          py: 2,
          bgcolor: 'background.default',
        }}
      >
        <Typography variant="body2" color="text.secondary">
          Already have an account?
        </Typography>
        <Button color="primary" onClick={onSwitchToLogin}>
          Log in
        </Button>
      </DialogActions>
    </Dialog>
  );
}
