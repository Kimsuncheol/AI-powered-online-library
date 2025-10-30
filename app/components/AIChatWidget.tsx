'use client';

import * as React from 'react';
import { Avatar, Box, Button, IconButton, Paper, Stack, TextField, Typography } from '@mui/material';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import ChatRoundedIcon from '@mui/icons-material/ChatRounded';

export interface AIChatWidgetProps {
  promptPlaceholder?: string;
  onSubmit?: (prompt: string) => void;
  messages?: { from: 'assistant' | 'user'; text: string }[];
}

export default function AIChatWidget({
  promptPlaceholder = 'What should I read next about data science?',
  onSubmit,
  messages = [
    {
      from: 'assistant',
      text: 'Ask our AI Librarian anything!',
    },
  ],
}: AIChatWidgetProps) {
  const [input, setInput] = React.useState('');

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!input.trim()) return;
    onSubmit?.(input.trim());
    setInput('');
  };

  return (
    <Paper
      elevation={3}
      sx={{
        position: { xs: 'relative', md: 'sticky' },
        top: { md: 120 },
        borderRadius: 4,
        px: 3,
        py: 3,
        display: 'flex',
        flexDirection: 'column',
        gap: 2.5,
        minWidth: { xs: 'auto', md: 320 },
        bgcolor: 'background.paper',
      }}
    >
      <Stack direction="row" spacing={1.5} alignItems="center">
        <Avatar sx={{ bgcolor: 'primary.main' }}>
          <ChatRoundedIcon />
        </Avatar>
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Ask our AI Librarian anything!
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Personalized guidance, summaries, and more.
          </Typography>
        </Box>
      </Stack>

      <Stack spacing={1.5} sx={{ maxHeight: 220, overflowY: 'auto', pr: 1 }}>
        {messages.map((message, index) => (
          <Box
            key={`${message.from}-${index}`}
            sx={{
              alignSelf: message.from === 'user' ? 'flex-end' : 'flex-start',
              bgcolor: message.from === 'user' ? 'primary.light' : 'rgba(59,130,246,0.08)',
              color: message.from === 'user' ? 'primary.contrastText' : 'text.primary',
              px: 2,
              py: 1.2,
              borderRadius: 3,
              boxShadow: message.from === 'user' ? '0 8px 16px rgba(59,130,246,0.25)' : 'none',
              maxWidth: '85%',
            }}
          >
            <Typography variant="body2">{message.text}</Typography>
          </Box>
        ))}
      </Stack>

      <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', gap: 1 }}>
        <TextField
          fullWidth
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={promptPlaceholder}
          multiline
          maxRows={3}
        />
        <IconButton
          type="submit"
          color="primary"
          size="large"
          sx={{ alignSelf: 'flex-end', bgcolor: 'primary.main', color: 'primary.contrastText' }}
        >
          <SendRoundedIcon />
        </IconButton>
      </Box>

      <Button variant="outlined" color="primary" fullWidth>
        View conversation history
      </Button>
    </Paper>
  );
}
