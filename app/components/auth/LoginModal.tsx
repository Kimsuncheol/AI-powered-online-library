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

export interface LoginModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (user: { name: string; email: string }) => void;
  onSwitchToSignup?: () => void;
}

type LoginFormState = {
  email: string;
  password: string;
};

type LoginFormErrors = Partial<Record<keyof LoginFormState | 'general', string>>;

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & { children: React.ReactElement },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const defaultState: LoginFormState = {
  email: '',
  password: '',
};

export default function LoginModal({ open, onClose, onSuccess, onSwitchToSignup }: LoginModalProps) {
  const [values, setValues] = React.useState<LoginFormState>(defaultState);
  const [errors, setErrors] = React.useState<LoginFormErrors>({});
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setValues(defaultState);
      setErrors({});
      setSubmitting(false);
    }
  }, [open]);

  const handleChange =
    (field: keyof LoginFormState) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setValues((prev) => ({ ...prev, [field]: event.target.value }));
      setErrors((prev) => ({ ...prev, [field]: undefined, general: undefined }));
    };

  const validate = () => {
    const nextErrors: LoginFormErrors = {};
    if (!values.email.trim()) {
      nextErrors.email = 'Email is required.';
    }
    if (!values.password.trim()) {
      nextErrors.password = 'Password is required.';
    } else if (values.password.trim().length < 6) {
      nextErrors.password = 'Password must be at least 6 characters.';
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
      const derivedName = values.email.split('@')[0] || 'Reader';
      onSuccess({
        name: derivedName.charAt(0).toUpperCase() + derivedName.slice(1),
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
      aria-labelledby="login-dialog-title"
      aria-describedby="login-dialog-description"
    >
      <DialogTitle id="login-dialog-title">Log in to AI Library</DialogTitle>
      <DialogContent dividers>
        <Stack component="form" onSubmit={handleSubmit} spacing={2.5} id="login-dialog-description">
          <TextField
            required
            fullWidth
            label="Email"
            type="email"
            value={values.email}
            onChange={handleChange('email')}
            error={Boolean(errors.email)}
            helperText={errors.email}
            autoFocus
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
          {errors.general ? (
            <Typography variant="body2" color="error">
              {errors.general}
            </Typography>
          ) : null}
          <DialogActions sx={{ px: 0 }}>
            <Button onClick={onClose} color="inherit">
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={submitting}>
              Log in
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
          {"Don't have an account?"}
        </Typography>
        <Button color="primary" onClick={onSwitchToSignup}>
          Sign up
        </Button>
      </DialogActions>
    </Dialog>
  );
}
