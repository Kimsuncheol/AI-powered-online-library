'use client';

import * as React from 'react';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  Divider,
  List,
  ListItem,
  ListItemSecondaryAction,
  ListItemText,
  Typography,
} from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import GitHubIcon from '@mui/icons-material/GitHub';

export interface IntegrationState {
  provider: 'google' | 'github';
  connected: boolean;
  lastSynced?: string;
}

export interface IntegrationsSettingsCardProps {
  integrations: IntegrationState[];
  onToggleIntegration: (provider: IntegrationState['provider']) => void;
  isProcessing?: boolean;
}

const PROVIDER_META: Record<
  IntegrationState['provider'],
  { label: string; description: string; icon: React.ReactElement }
> = {
  google: {
    label: 'Google',
    description: 'Sync your reading list with Google Drive exports.',
    icon: <GoogleIcon fontSize="small" />,
  },
  github: {
    label: 'GitHub',
    description: 'Publish AI-generated reading roadmaps to GitHub repositories.',
    icon: <GitHubIcon fontSize="small" />,
  },
};

export default function IntegrationsSettingsCard({
  integrations,
  onToggleIntegration,
  isProcessing = false,
}: IntegrationsSettingsCardProps) {
  return (
    <Card id="settings-panel-integrations" variant="outlined" sx={{ borderRadius: 3 }}>
      <CardHeader
        title="Integrations"
        titleTypographyProps={{ variant: 'h6', fontWeight: 600 }}
        subheader="Connect the AI librarian to other tools in your workflow."
      />
      <Divider />
      <CardContent>
        <List disablePadding>
          {integrations.map((integration) => {
            const meta = PROVIDER_META[integration.provider];
            const buttonLabel = integration.connected ? 'Disconnect' : 'Connect';
            return (
              <React.Fragment key={integration.provider}>
                <ListItem alignItems="flex-start">
                  <ListItemText
                    primary={
                      <Typography sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 600 }}>
                        {meta.icon}
                        {meta.label}
                      </Typography>
                    }
                    secondary={
                      <>
                        <Typography variant="body2" color="text.secondary">
                          {meta.description}
                        </Typography>
                        {integration.lastSynced ? (
                          <Typography variant="caption" color="text.secondary">
                            Last synced {integration.lastSynced}
                          </Typography>
                        ) : null}
                      </>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Button
                      variant={integration.connected ? 'outlined' : 'contained'}
                      color="primary"
                      size="small"
                      onClick={() => onToggleIntegration(integration.provider)}
                      disabled={isProcessing}
                    >
                      {buttonLabel}
                    </Button>
                  </ListItemSecondaryAction>
                </ListItem>
                <Divider component="li" />
              </React.Fragment>
            );
          })}
        </List>
      </CardContent>
    </Card>
  );
}
