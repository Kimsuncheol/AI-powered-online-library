'use client';

import * as React from 'react';
import { Divider, List, ListItemButton, ListItemIcon, ListItemText, Paper, Typography } from '@mui/material';
import ManageAccountsRoundedIcon from '@mui/icons-material/ManageAccountsRounded';
import SecurityRoundedIcon from '@mui/icons-material/SecurityRounded';
import NotificationsActiveRoundedIcon from '@mui/icons-material/NotificationsActiveRounded';
import DarkModeRoundedIcon from '@mui/icons-material/DarkModeRounded';
import HubRoundedIcon from '@mui/icons-material/HubRounded';

export type SettingsSectionId = 'account' | 'security' | 'notifications' | 'appearance' | 'integrations';

const SECTIONS: Array<{
  id: SettingsSectionId;
  label: string;
  description: string;
  icon: React.ReactElement;
}> = [
  {
    id: 'account',
    label: 'Account',
    description: 'Email, password, account removal',
    icon: <ManageAccountsRoundedIcon />,
  },
  {
    id: 'security',
    label: 'Security',
    description: 'Sign-in safety, device management',
    icon: <SecurityRoundedIcon />,
  },
  {
    id: 'notifications',
    label: 'Notifications',
    description: 'Emails, activity, marketing',
    icon: <NotificationsActiveRoundedIcon />,
  },
  {
    id: 'appearance',
    label: 'Appearance',
    description: 'Theme, density, language',
    icon: <DarkModeRoundedIcon />,
  },
  {
    id: 'integrations',
    label: 'Integrations',
    description: 'Connected apps & services',
    icon: <HubRoundedIcon />,
  },
];

export interface SettingsNavProps {
  selected: SettingsSectionId;
  onSelect: (section: SettingsSectionId) => void;
}

export default function SettingsNav({ selected, onSelect }: SettingsNavProps) {
  return (
    <Paper
      variant="outlined"
      sx={{
        borderRadius: 3,
        overflow: 'hidden',
      }}
      aria-label="Settings navigation"
    >
      <List component="nav" disablePadding>
        <Typography variant="subtitle2" sx={{ px: 3, py: 2, fontWeight: 600 }}>
          Settings
        </Typography>
        <Divider />
        {SECTIONS.map((section) => (
          <ListItemButton
            key={section.id}
            selected={section.id === selected}
            onClick={() => onSelect(section.id)}
            aria-controls={`settings-panel-${section.id}`}
            aria-current={section.id === selected ? 'true' : undefined}
          >
            <ListItemIcon sx={{ color: section.id === selected ? 'primary.main' : 'text.secondary' }}>
              {section.icon}
            </ListItemIcon>
            <ListItemText primary={section.label} secondary={section.description} />
          </ListItemButton>
        ))}
      </List>
    </Paper>
  );
}
