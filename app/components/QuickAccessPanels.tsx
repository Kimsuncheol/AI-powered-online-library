'use client';

import * as React from 'react';
import { Box, ButtonBase, Paper, Stack, Typography } from '@mui/material';
import LibraryBooksRoundedIcon from '@mui/icons-material/LibraryBooksRounded';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import ChatBubbleRoundedIcon from '@mui/icons-material/ChatBubbleRounded';
import NoteAltRoundedIcon from '@mui/icons-material/NoteAltRounded';

export interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  description: string;
  onClick?: () => void;
}

export interface QuickAccessPanelsProps {
  title: string;
  actions?: QuickAction[];
}

const defaultActions: QuickAction[] = [
  {
    id: 'library',
    label: 'My Library',
    icon: <LibraryBooksRoundedIcon />,
    description: 'Keep track of your saved collections',
  },
  {
    id: 'borrowed',
    label: 'Borrowed Books',
    icon: <AutoAwesomeRoundedIcon />,
    description: 'Manage active loans and due dates',
  },
  {
    id: 'notes',
    label: 'Reading Notes',
    icon: <NoteAltRoundedIcon />,
    description: 'Sync notes across every device',
  },
  {
    id: 'summaries',
    label: 'AI Summaries',
    icon: <ChatBubbleRoundedIcon />,
    description: 'Review smart highlights instantly',
  },
];

export default function QuickAccessPanels({ title, actions = defaultActions }: QuickAccessPanelsProps) {
  return (
    <Box component="section">
      <Typography variant="h5" sx={{ color: "text.primary", fontWeight: 700, mb: 2 }}>
        {title}
      </Typography>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        sx={{ width: '100%' }}
      >
        {actions.map((action) => (
          <ButtonBase
            key={action.id}
            onClick={action.onClick}
            focusRipple
            sx={{
              textAlign: 'left',
              flex: 1,
              borderRadius: 3,
              alignItems: 'stretch',
            }}
          >
            <Paper
              elevation={2}
              sx={{
                width: '100%',
                p: 3,
                borderRadius: 3,
                bgcolor: 'rgba(59,130,246,0.04)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 18px 32px rgba(59,130,246,0.22)',
                },
              }}
            >
              <Stack direction="row" spacing={2} alignItems="flex-start">
                <Box
                  sx={{
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    borderRadius: 2,
                    width: 44,
                    height: 44,
                    display: 'grid',
                    placeItems: 'center',
                    boxShadow: '0 6px 18px rgba(59,130,246,0.35)',
                  }}
                >
                  {action.icon}
                </Box>
                <Stack spacing={0.5}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {action.label}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {action.description}
                  </Typography>
                </Stack>
              </Stack>
            </Paper>
          </ButtonBase>
        ))}
      </Stack>
    </Box>
  );
}
