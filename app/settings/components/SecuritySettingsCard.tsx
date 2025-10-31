'use client';

import * as React from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Stack,
  Switch,
  Tooltip,
  Typography,
} from '@mui/material';
import ExitToAppRoundedIcon from '@mui/icons-material/ExitToAppRounded';

export interface SessionInfo {
  id: string;
  device: string;
  location: string;
  lastActive: string;
  isCurrent?: boolean;
}

export interface SecuritySettingsCardProps {
  twoFactorEnabled: boolean;
  onToggleTwoFactor: (value: boolean) => void;
  sessions: SessionInfo[];
  onRevokeSession: (sessionId: string) => void;
  onRevokeAllSessions: () => void;
  lastLogin?: string;
}

export default function SecuritySettingsCard({
  twoFactorEnabled,
  onToggleTwoFactor,
  sessions,
  onRevokeSession,
  onRevokeAllSessions,
  lastLogin,
}: SecuritySettingsCardProps) {
  return (
    <Card id="settings-panel-security" variant="outlined" sx={{ borderRadius: 3 }}>
      <CardHeader
        title="Security"
        titleTypographyProps={{ variant: 'h6', fontWeight: 600 }}
        subheader="Strengthen your protections and keep tabs on authenticated devices."
      />
      <Divider />
      <CardContent>
        <Stack spacing={3}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'flex-start', sm: 'center' }}>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                Two-factor authentication
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {twoFactorEnabled
                  ? '2FA is active. We will prompt for your authenticator code at sign-in.'
                  : 'Add a second factor to defend your library from unwanted access.'}
              </Typography>
            </Box>
            <Switch
              checked={twoFactorEnabled}
              onChange={(event) => onToggleTwoFactor(event.target.checked)}
              inputProps={{ 'aria-label': 'Toggle two factor authentication' }}
            />
          </Stack>

          <Divider />

          <Stack spacing={1.5}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  Active sessions
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Review recent devices and sign out anything unfamiliar.
                </Typography>
              </Box>
              <Button color="primary" onClick={onRevokeAllSessions}>
                Sign out all
              </Button>
            </Stack>
            <List dense disablePadding sx={{ border: '1px solid rgba(15, 23, 42, 0.08)', borderRadius: 2 }}>
              {sessions.map((session) => (
                <React.Fragment key={session.id}>
                  <ListItem
                    secondaryAction={
                      session.isCurrent ? null : (
                        <Tooltip title="Revoke session">
                          <IconButton edge="end" onClick={() => onRevokeSession(session.id)} aria-label="Revoke session">
                            <ExitToAppRoundedIcon />
                          </IconButton>
                        </Tooltip>
                      )
                    }
                  >
                    <ListItemText
                      primary={
                        <Typography sx={{ fontWeight: session.isCurrent ? 600 : 500 }}>
                          {session.device}{' '}
                          {session.isCurrent ? (
                            <Typography component="span" variant="body2" color="secondary" sx={{ fontWeight: 600 }}>
                              (current)
                            </Typography>
                          ) : null}
                        </Typography>
                      }
                      secondary={`${session.location} • Active ${session.lastActive}`}
                    />
                  </ListItem>
                  <Divider component="li" />
                </React.Fragment>
              ))}
              {sessions.length === 0 ? (
                <ListItem>
                  <ListItemText
                    primary="No other devices are signed in."
                    secondary="Great job! Keep 2FA enabled to maintain a secure reading space."
                  />
                </ListItem>
              ) : null}
            </List>
          </Stack>

          {lastLogin ? (
            <Typography variant="body2" color="text.secondary">
              Last successful sign-in: {lastLogin}
            </Typography>
          ) : null}
        </Stack>
      </CardContent>
    </Card>
  );
}
