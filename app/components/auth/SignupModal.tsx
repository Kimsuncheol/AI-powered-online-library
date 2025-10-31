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

import { HttpError } from '@/app/lib/http';
import { useAuthContext } from '@/app/context/AuthContext';

export interface SignupModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (user: { name: string; email: string; avatarUrl?: string }) => void;
  onSwitchToLogin?: () => void;
}

type SignupFormState = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
};

type SignupFormErrors = Partial<Record<keyof SignupFormState, string>>;

const autofillSx = (theme: Theme) => ({
  '& input:-webkit-autofill': {
    boxShadow: `0 0 0 1000px ${theme.palette.background.paper} inset`,
    WebkitBoxShadow: `0 0 0 1000px ${theme.palette.background.paper} inset`,
    WebkitTextFillColor: theme.palette.text.primary,
    transition: 'background-color 9999s ease-in-out 0s',
  },
});

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/;
const PASSWORD_HELPER_TEXT =
  'Password must be at least 8 characters and include upper, lower, number, and special character (!@#$%^&*).';

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
  const [apiError, setApiError] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const { signUp: signUpMember } = useAuthContext();

  const getPasswordError = React.useCallback((password: string) => {
    if (!password.trim()) {
      return 'Password is required.';
    }
    if (!passwordRegex.test(password)) {
      return PASSWORD_HELPER_TEXT;
    }
    return undefined;
  }, []);

  const handleChange =
    (field: keyof SignupFormState) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const nextValue = event.target.value;
      setValues((prev) => {
        const next = { ...prev, [field]: nextValue };
        setErrors((prevErrors) => {
          const nextErrors: SignupFormErrors = { ...prevErrors };

          if (field === 'password') {
            nextErrors.password = getPasswordError(nextValue);
            if (next.confirmPassword) {
              nextErrors.confirmPassword =
                next.confirmPassword !== nextValue ? 'Passwords do not match.' : undefined;
            }
          } else if (field === 'confirmPassword') {
            nextErrors.confirmPassword =
              !nextValue.trim()
                ? 'Please confirm your password.'
                : nextValue !== next.password
                  ? 'Passwords do not match.'
                  : undefined;
          } else {
            nextErrors[field] = undefined;
          }

          return nextErrors;
        });
        return next;
      });
    };

  React.useEffect(() => {
    if (open) {
      setValues(defaultState);
      setErrors({});
      setSubmitting(false);
      setApiError(null);
      setSuccessMessage(null);
    }
  }, [open]);

  const passwordIsValid = React.useMemo(() => passwordRegex.test(values.password), [values.password]);
  const passwordHelperText =
    errors.password ??
    (values.password
      ? passwordIsValid
        ? 'Strong password'
        : PASSWORD_HELPER_TEXT
      : PASSWORD_HELPER_TEXT);

  const validate = () => {
    const nextErrors: SignupFormErrors = {};
    if (!values.name.trim()) {
      nextErrors.name = 'Name is required.';
    }
    if (!values.email.trim()) {
      nextErrors.email = 'Email is required.';
    }
    const passwordError = getPasswordError(values.password);
    if (passwordError) {
      nextErrors.password = passwordError;
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
    setApiError(null);

    const trimmedEmail = values.email.trim();
    const trimmedName = values.name.trim();

    signUpMember({
      email: trimmedEmail,
      password: values.password,
      displayName: trimmedName,
    })
      .then((member) => {
        onSuccess({
          name: member.displayName ?? member.email,
          email: member.email,
          avatarUrl: member.avatarUrl,
        });
        setSuccessMessage('Account created successfully.');
      })
      .catch((error: unknown) => {
        if (error instanceof HttpError) {
          if (error.status === 422) {
            setApiError('We could not create your account. Check your details and try again.');
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
            sx={autofillSx}
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
            helperText={passwordHelperText}
            FormHelperTextProps={{
              sx: {
                color: errors.password
                  ? 'error.main'
                  : values.password && passwordIsValid
                    ? 'success.main'
                    : 'text.secondary',
              },
            }}
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
          <Typography variant="caption" color={passwordRegex.test(values.password) ? 'success.main' : 'text.secondary'}>
            {values.password ? (passwordRegex.test(values.password) ? 'Strong password' : PASSWORD_HELPER_TEXT) : PASSWORD_HELPER_TEXT}
          </Typography>
          <TextField
            required
            fullWidth
            label="Confirm password"
            type={showConfirmPassword ? 'text' : 'password'}
            value={values.confirmPassword}
            onChange={handleChange('confirmPassword')}
            error={Boolean(errors.confirmPassword)}
            helperText={errors.confirmPassword}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label={showConfirmPassword ? 'Hide password confirmation' : 'Show password confirmation'}
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    onMouseDown={(event) => event.preventDefault()}
                    edge="end"
                  >
                    {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={autofillSx}
          />
          <DialogActions sx={{ px: 0 }}>
            <Button onClick={onClose} color="inherit">
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={submitting}>
              Sign up
            </Button>
          </DialogActions>
          {apiError ? (
            <Typography variant="body2" color="error">
              {apiError}
            </Typography>
          ) : null}
          {successMessage ? (
            <Typography variant="body2" color="success.main">
              {successMessage}
            </Typography>
          ) : null}
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
