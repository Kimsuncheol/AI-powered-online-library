'use client';

import * as React from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  Slide,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import type { TransitionProps } from '@mui/material/transitions';
import { type Theme } from '@mui/material/styles';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

import { APIError } from '@/app/lib/api/auth';
import { useAuthContext } from '@/app/context/AuthContext';

export interface LoginModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (user: { name: string; email: string; avatarUrl?: string }) => void;
  onSwitchToSignup?: () => void;
}

type LoginFormState = {
  email: string;
  password: string;
};

type LoginFormErrors = Partial<Record<keyof LoginFormState | 'general', string>>;

const autofillSx = (theme: Theme) => ({
  '& input:-webkit-autofill': {
    boxShadow: `0 0 0 1000px ${theme.palette.background.paper} inset`,
    WebkitBoxShadow: `0 0 0 1000px ${theme.palette.background.paper} inset`,
    WebkitTextFillColor: theme.palette.text.primary,
    transition: 'background-color 9999s ease-in-out 0s',
  },
});

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
  const [apiError, setApiError] = React.useState<string | null>(null);
  const { signIn: signInMember } = useAuthContext();
  const [showPassword, setShowPassword] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setValues(defaultState);
      setErrors({});
      setSubmitting(false);
      setApiError(null);
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
    setApiError(null);

    signInMember({
      email: values.email.trim(),
      password: values.password,
    })
      .then((member) => {
        onSuccess({
          name: member.displayName ?? member.email,
          email: member.email,
          avatarUrl: member.avatarUrl,
        });
      })
      .catch((error: unknown) => {
        if (error instanceof APIError) {
          if (error.status === 422) {
            setApiError('We could not validate your credentials. Check your email and password.');
          } else if (error.status === 401) {
            setApiError('Invalid credentials. Try again or reset your password.');
          } else {
            setApiError(error.message);
          }
        } else {
          setApiError('Unable to reach the server. Please try again.');
        }
      })
      .finally(() => setSubmitting(false));
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
            sx={autofillSx}
          />
          <TextField
            required
            fullWidth
            label="Password"
            type={showPassword ? 'text' : 'password'}
            value={values.password}
            onChange={handleChange('password')}
            error={Boolean(errors.password)}
            helperText={errors.password}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    onClick={() => setShowPassword((prev) => !prev)}
                    onMouseDown={(event) => event.preventDefault()}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={autofillSx}
          />
          {errors.general ? (
            <Typography variant="body2" color="error">
              {errors.general}
            </Typography>
          ) : null}
          {apiError ? (
            <Typography variant="body2" color="error">
              {apiError}
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
