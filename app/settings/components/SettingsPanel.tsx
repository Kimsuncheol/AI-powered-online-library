'use client';

import * as React from 'react';
import { Box } from '@mui/material';

import type { SettingsSectionId } from './SettingsNav';

export interface SettingsPanelProps {
  activeSection: SettingsSectionId;
  children: React.ReactNode;
}

export default function SettingsPanel({ activeSection, children }: SettingsPanelProps) {
  return (
    <Box
      role="region"
      aria-live="polite"
      aria-labelledby={`settings-panel-${activeSection}`}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: { xs: 3, md: 4 },
      }}
    >
      {children}
    </Box>
  );
}
