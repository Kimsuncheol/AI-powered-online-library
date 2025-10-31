'use client';

import * as React from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Grid2 as Grid,
  Stack,
  TextField,
  Typography,
} from '@mui/material';

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface AccountSettingsCardProps {
  email: string;
  onChangePassword: (payload: ChangePasswordPayload) => Promise<void> | void;
  isSubmitting: boolean;
  validationErrors: Partial<Record<keyof ChangePasswordPayload, string>>;
  onDeleteAccount: () => void;
}

export default function AccountSettingsCard({
  email,
  onChangePassword,
  isSubmitting,
  validationErrors,
  onDeleteAccount,
}: AccountSettingsCardProps) {
  const [values, setValues] = React.useState<ChangePasswordPayload>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  React.useEffect(() => {
    if (!isSubmitting) {
      setValues({ currentPassword: '', newPassword: '', confirmPassword: '' });
    }
  }, [isSubmitting]);

  const handleChange =
    (field: keyof ChangePasswordPayload) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setValues((prev) => ({ ...prev, [field]: event.target.value }));
    };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onChangePassword(values);
  };

  return (
    <Card id="settings-panel-account" variant="outlined" sx={{ borderRadius: 3 }}>
      <CardHeader
        title="Account preferences"
        titleTypographyProps={{ variant: 'h6', fontWeight: 600 }}
        subheader="Update your core account details, or request an export before closing your account."
      />
      <Divider />
      <CardContent>
        <Stack component="form" spacing={3} onSubmit={handleSubmit}>
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              Primary email
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {email}
            </Typography>
          </Box>

          <Stack spacing={2}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              Change password
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  label="Current password"
                  name="currentPassword"
                  type="password"
                  value={values.currentPassword}
                  onChange={handleChange('currentPassword')}
                  required
                  fullWidth
                  disabled={isSubmitting}
                  error={Boolean(validationErrors.currentPassword)}
                  helperText={validationErrors.currentPassword}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  label="New password"
                  name="newPassword"
                  type="password"
                  value={values.newPassword}
                  onChange={handleChange('newPassword')}
                  required
                  fullWidth
                  disabled={isSubmitting}
                  error={Boolean(validationErrors.newPassword)}
                  helperText={validationErrors.newPassword}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  label="Confirm new password"
                  name="confirmPassword"
                  type="password"
                  value={values.confirmPassword}
                  onChange={handleChange('confirmPassword')}
                  required
                  fullWidth
                  disabled={isSubmitting}
                  error={Boolean(validationErrors.confirmPassword)}
                  helperText={validationErrors.confirmPassword}
                />
              </Grid>
            </Grid>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="flex-end">
              <Button type="submit" variant="contained" color="primary" disabled={isSubmitting}>
                Update password
              </Button>
            </Stack>
          </Stack>

          <Divider />

          <Stack spacing={1}>
            <Typography variant="subtitle2" color="error" sx={{ fontWeight: 600 }}>
              Delete account
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Permanently remove your profile, activity history, and AI personalization settings. This action cannot be
              undone.
            </Typography>
            <Button color="error" variant="outlined" onClick={onDeleteAccount}>
              Delete account
            </Button>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}
