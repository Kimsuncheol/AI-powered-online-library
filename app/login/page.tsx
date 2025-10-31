'use client';

import * as React from 'react';
import NextLink from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  IconButton,
  InputAdornment,
  LinearProgress,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { type Theme } from '@mui/material/styles';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

import { useAuthContext } from '@/app/context/AuthContext';
import { HttpError } from '@/app/lib/http';

type LoginFormState = {
  email: string;
  password: string;
};

type LoginFormErrors = Partial<Record<keyof LoginFormState, string>> & { general?: string };

const defaultState: LoginFormState = {
  email: '',
  password: '',
};

const autofillSx = (theme: Theme) => ({
  '& input:-webkit-autofill': {
    boxShadow: `0 0 0 1000px ${theme.palette.background.paper} inset`,
    WebkitBoxShadow: `0 0 0 1000px ${theme.palette.background.paper} inset`,
    WebkitTextFillColor: theme.palette.text.primary,
    transition: 'background-color 9999s ease-in-out 0s',
  },
});

function resolveNext(searchParams: ReturnType<typeof useSearchParams>) {
  const nextParam = searchParams?.get('next');
  if (!nextParam) return '/';
  if (nextParam.startsWith('/') && !nextParam.startsWith('//')) {
    return nextParam;
  }
  return '/';
}

export default function LoginPage() {
  const { member, isLoading, signIn } = useAuthContext();
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextDestination = React.useMemo(() => resolveNext(searchParams), [searchParams]);

  const [values, setValues] = React.useState<LoginFormState>(defaultState);
  const [errors, setErrors] = React.useState<LoginFormErrors>({});
  const [apiError, setApiError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);

  React.useEffect(() => {
    if (!isLoading && member) {
      router.replace(nextDestination);
      router.refresh();
    }
  }, [member, isLoading, router, nextDestination]);

  const handleChange =
    (field: keyof LoginFormState) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setValues((prev) => ({ ...prev, [field]: event.target.value }));
      setErrors((prev) => ({ ...prev, [field]: undefined, general: undefined }));
      setApiError(null);
    };

  const validate = React.useCallback(() => {
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
  }, [values]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setApiError(null);
    if (!validate()) return;

    setSubmitting(true);
    try {
      const authenticatedMember = await signIn({
        email: values.email.trim(),
        password: values.password,
      });
      if (authenticatedMember) {
        router.replace(nextDestination);
        router.refresh();
      }
    } catch (error) {
      if (error instanceof HttpError) {
        if (error.status === 401) {
          setApiError('Invalid credentials. Please check your email and password.');
        } else if (error.status === 422) {
          setApiError('We could not validate your credentials. Please try again.');
        } else {
          setApiError(error.message);
        }
      } else {
        setApiError('Unable to reach the server. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading && !member) {
    return (
      <Container maxWidth="lg" sx={{ py: { xs: 6, md: 8 } }}>
        <LinearProgress />
      </Container>
    );
  }

  return (
    <Container
      maxWidth="sm"
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        py: { xs: 8, md: 12 },
      }}
    >
      <Card
        elevation={6}
        sx={{
          width: '100%',
          borderRadius: 4,
          overflow: 'hidden',
          boxShadow: '0 24px 64px rgba(15, 118, 110, 0.18)',
        }}
      >
        <Box
          sx={{
            px: { xs: 4, md: 6 },
            py: { xs: 5, md: 6 },
            bgcolor: 'background.paper',
          }}
        >
          <Stack spacing={4}>
            <Stack spacing={1.5}>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                Welcome back
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Sign in to pick up where you left off, manage your loans, and explore personalized shelves.
              </Typography>
            </Stack>

            <CardContent
              component="form"
              onSubmit={handleSubmit}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 3,
                px: 0,
              }}
            >
              <Stack spacing={2.5}>
                <TextField
                  label="Email"
                  type="email"
                  value={values.email}
                  onChange={handleChange('email')}
                  error={Boolean(errors.email)}
                  helperText={errors.email}
                  required
                  autoComplete="email"
                  autoFocus
                  sx={autofillSx}
                />
                <TextField
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  value={values.password}
                  onChange={handleChange('password')}
                  error={Boolean(errors.password)}
                  helperText={errors.password}
                  required
                  autoComplete="current-password"
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
              </Stack>

              {apiError ? (
                <Alert severity="error" onClose={() => setApiError(null)}>
                  {apiError}
                </Alert>
              ) : null}
              {errors.general ? (
                <Alert severity="error" onClose={() => setErrors((prev) => ({ ...prev, general: undefined }))}>
                  {errors.general}
                </Alert>
              ) : null}

              <Stack spacing={2}>
                <Button type="submit" variant="contained" size="large" disabled={submitting}>
                  {submitting ? 'Signing in…' : 'Sign in'}
                </Button>
                <Button component={NextLink} href="/" variant="outlined" color="inherit">
                  Back to home
                </Button>
              </Stack>
            </CardContent>

            <Stack direction="row" spacing={1} justifyContent="center">
              <Typography variant="body2" color="text.secondary">
                {"Don't have an account?"}
              </Typography>
              <Button component={NextLink} href="/signup" color="primary" variant="text">
                Sign up
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Card>
    </Container>
  );
}
