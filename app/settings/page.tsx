'use client';

import * as React from 'react';
import {
  Alert,
  Box,
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid2 as Grid,
  Snackbar,
  Stack,
} from '@mui/material';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/app/components/layout/AuthProvider';
import SettingsNav, { SettingsSectionId } from './components/SettingsNav';
import SettingsPanel from './components/SettingsPanel';
import AccountSettingsCard, { ChangePasswordPayload } from './components/AccountSettingsCard';
import SecuritySettingsCard, { SessionInfo } from './components/SecuritySettingsCard';
import NotificationSettingsCard, { NotificationSettings } from './components/NotificationSettingsCard';
import AppearanceSettingsCard, { AppearanceSettings } from './components/AppearanceSettingsCard';
import IntegrationsSettingsCard, { IntegrationState } from './components/IntegrationsSettingsCard';

const INITIAL_SESSIONS: SessionInfo[] = [
  {
    id: 'session-current',
    device: 'MacBook Pro • Arc Browser',
    location: 'San Francisco, CA',
    lastActive: '2 minutes ago',
    isCurrent: true,
  },
  {
    id: 'session-tablet',
    device: 'iPad • Safari',
    location: 'Portland, OR',
    lastActive: 'Yesterday',
  },
  {
    id: 'session-phone',
    device: 'Pixel 9 • Chrome',
    location: 'Austin, TX',
    lastActive: '3 days ago',
  },
];

const INITIAL_NOTIFICATION_SETTINGS: NotificationSettings = {
  comments: true,
  likes: true,
  marketing: false,
};

const INITIAL_APPEARANCE_SETTINGS: AppearanceSettings = {
  themeMode: 'system',
  density: 'comfortable',
  language: 'English',
};

const INITIAL_INTEGRATIONS: IntegrationState[] = [
  { provider: 'google', connected: true, lastSynced: '15 minutes ago' },
  { provider: 'github', connected: false },
];

function validatePasswordChange(values: ChangePasswordPayload) {
  const errors: Partial<Record<keyof ChangePasswordPayload, string>> = {};
  if (!values.currentPassword.trim()) {
    errors.currentPassword = 'Enter your current password.';
  }
  if (values.newPassword.length < 8) {
    errors.newPassword = 'New password must be at least 8 characters.';
  }
  if (values.newPassword && values.newPassword === values.currentPassword) {
    errors.newPassword = 'Choose a password different from your current one.';
  }
  if (values.confirmPassword !== values.newPassword) {
    errors.confirmPassword = 'Passwords do not match.';
  }
  return errors;
}

export default function SettingsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [activeSection, setActiveSection] = React.useState<SettingsSectionId>('account');
  const [passwordSubmitting, setPasswordSubmitting] = React.useState(false);
  const [passwordErrors, setPasswordErrors] = React.useState<Partial<Record<keyof ChangePasswordPayload, string>>>({});
  const [twoFactorEnabled, setTwoFactorEnabled] = React.useState(true);
  const [sessions, setSessions] = React.useState<SessionInfo[]>(INITIAL_SESSIONS);
  const [notificationSettings, setNotificationSettings] = React.useState<NotificationSettings>(
    INITIAL_NOTIFICATION_SETTINGS,
  );
  const [appearanceSettings, setAppearanceSettings] = React.useState<AppearanceSettings>(INITIAL_APPEARANCE_SETTINGS);
  const [integrations, setIntegrations] = React.useState<IntegrationState[]>(INITIAL_INTEGRATIONS);
  const [snackbar, setSnackbar] = React.useState<{ open: boolean; type: 'success' | 'error'; message: string }>({
    open: false,
    type: 'success',
    message: '',
  });
  const [confirmDeleteOpen, setConfirmDeleteOpen] = React.useState(false);
  const [confirmRevokeOpen, setConfirmRevokeOpen] = React.useState(false);
  const [integrationProcessing, setIntegrationProcessing] = React.useState(false);

  React.useEffect(() => {
    if (!user) {
      router.replace('/login?next=/settings');
    }
  }, [router, user]);

  const handlePasswordChange = React.useCallback(
    async (payload: ChangePasswordPayload) => {
      const errors = validatePasswordChange(payload);
      setPasswordErrors(errors);
      if (Object.keys(errors).length > 0) return;

      setPasswordSubmitting(true);
      try {
        await new Promise((resolve) => setTimeout(resolve, 900));
        setSnackbar({ open: true, type: 'success', message: 'Password updated successfully.' });
      } catch (error) {
        setSnackbar({ open: true, type: 'error', message: 'Unable to update password. Try again shortly.' });
      } finally {
        setPasswordSubmitting(false);
      }
    },
    [],
  );

  const handleToggleTwoFactor = React.useCallback((value: boolean) => {
    setTwoFactorEnabled(value);
    setSnackbar({
      open: true,
      type: 'success',
      message: value ? 'Two-factor authentication enabled.' : 'Two-factor authentication disabled.',
    });
  }, []);

  const handleRevokeSession = React.useCallback((sessionId: string) => {
    setSessions((prev) => prev.filter((session) => session.id !== sessionId));
    setSnackbar({ open: true, type: 'success', message: 'Session revoked.' });
  }, []);

  const handleRevokeAllSessions = React.useCallback(() => {
    setConfirmRevokeOpen(true);
  }, []);

  const confirmRevokeAll = React.useCallback(() => {
    setSessions((prev) => prev.filter((session) => session.isCurrent));
    setConfirmRevokeOpen(false);
    setSnackbar({ open: true, type: 'success', message: 'All other sessions have been signed out.' });
  }, []);

  const handleToggleIntegration = React.useCallback((provider: IntegrationState['provider']) => {
    setIntegrationProcessing(true);
    setTimeout(() => {
      let nextConnected = false;
      setIntegrations((prev) =>
        prev.map((integration) => {
          if (integration.provider !== provider) {
            return integration;
          }
          nextConnected = !integration.connected;
          return {
            ...integration,
            connected: nextConnected,
            lastSynced: nextConnected ? 'Just now' : undefined,
          };
        }),
      );
      setIntegrationProcessing(false);
      setSnackbar({
        open: true,
        type: 'success',
        message: `Integration ${provider === 'google' ? 'Google' : 'GitHub'} ${
          nextConnected ? 'connected' : 'disconnected'
        }.`,
      });
    }, 600);
  }, []);

  const handleDeleteAccount = React.useCallback(() => {
    setConfirmDeleteOpen(true);
  }, []);

  const confirmDeleteAccount = React.useCallback(() => {
    setConfirmDeleteOpen(false);
    setSnackbar({
      open: true,
      type: 'success',
      message: 'Account deletion request received. We will send next steps via email.',
    });
  }, []);

  const renderActivePanel = React.useMemo(() => {
    switch (activeSection) {
      case 'account':
        return (
          <AccountSettingsCard
            email={user?.email ?? 'reader@example.com'}
            onChangePassword={handlePasswordChange}
            isSubmitting={passwordSubmitting}
            validationErrors={passwordErrors}
            onDeleteAccount={handleDeleteAccount}
          />
        );
      case 'security':
        return (
          <SecuritySettingsCard
            twoFactorEnabled={twoFactorEnabled}
            onToggleTwoFactor={handleToggleTwoFactor}
            sessions={sessions}
            onRevokeSession={handleRevokeSession}
            onRevokeAllSessions={handleRevokeAllSessions}
            lastLogin="Oct 21, 2024 at 11:48 PM PT"
          />
        );
      case 'notifications':
        return (
          <NotificationSettingsCard value={notificationSettings} onChange={setNotificationSettings} />
        );
      case 'appearance':
        return <AppearanceSettingsCard value={appearanceSettings} onChange={setAppearanceSettings} />;
      case 'integrations':
        return (
          <IntegrationsSettingsCard
            integrations={integrations}
            onToggleIntegration={handleToggleIntegration}
            isProcessing={integrationProcessing}
          />
        );
      default:
        return null;
    }
  }, [
    activeSection,
    appearanceSettings,
    handleDeleteAccount,
    handlePasswordChange,
    handleRevokeAllSessions,
    handleRevokeSession,
    handleToggleIntegration,
    handleToggleTwoFactor,
    integrationProcessing,
    integrations,
    notificationSettings,
    passwordErrors,
    passwordSubmitting,
    sessions,
    twoFactorEnabled,
    user?.email,
  ]);

  if (!user) {
    return null;
  }

  return (
    <Container
      component="main"
      maxWidth="xl"
      sx={{
        py: { xs: 4, md: 6 },
      }}
    >
      <Grid container spacing={{ xs: 3, md: 4 }}>
        <Grid size={{ xs: 12, md: 4, lg: 3 }}>
          <SettingsNav selected={activeSection} onSelect={setActiveSection} />
        </Grid>
        <Grid size={{ xs: 12, md: 8, lg: 9 }}>
          <SettingsPanel activeSection={activeSection}>{renderActivePanel}</SettingsPanel>
        </Grid>
      </Grid>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={snackbar.type}
          variant="filled"
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      <Dialog
        open={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        aria-labelledby="delete-account-title"
        aria-describedby="delete-account-description"
      >
        <DialogTitle id="delete-account-title">Delete account?</DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-account-description">
            This will permanently remove your profile, reading history, and AI personalization. We recommend exporting
            your data first.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDeleteOpen(false)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={confirmDeleteAccount}>
            Confirm deletion
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={confirmRevokeOpen}
        onClose={() => setConfirmRevokeOpen(false)}
        aria-labelledby="revoke-sessions-title"
        aria-describedby="revoke-sessions-description"
      >
        <DialogTitle id="revoke-sessions-title">Sign out all other sessions?</DialogTitle>
        <DialogContent>
          <DialogContentText id="revoke-sessions-description">
            We will keep this device signed in and revoke access everywhere else. Continue?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmRevokeOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={confirmRevokeAll}>
            Sign out others
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
