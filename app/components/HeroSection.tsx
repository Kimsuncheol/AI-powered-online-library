'use client';

import * as React from 'react';
import { Box, Button, IconButton, InputAdornment, Stack, TextField, Typography, Chip, Fade } from '@mui/material';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';

export interface HeroSectionProps {
  headline: string;
  description: string;
  placeholder?: string;
  onSearch?: (query: string) => void;
  aiTaglines?: string[];
  featuredInsights?: string[];
}

export default function HeroSection({
  headline,
  description,
  placeholder = 'Search across 100k+ titles, authors, topics…',
  onSearch,
  aiTaglines = [
    'AI summaries tailored to your reading goals.',
    'Conversational search that understands context.',
    'Personalized discovery powered by machine learning.',
  ],
  featuredInsights = ['Adaptive recommendations', 'Contextual insights', 'Cross-device syncing'],
}: HeroSectionProps) {
  const [query, setQuery] = React.useState('');
  const [taglineIndex, setTaglineIndex] = React.useState(0);

  React.useEffect(() => {
    const interval = window.setInterval(() => {
      setTaglineIndex((prev) => (prev + 1) % aiTaglines.length);
    }, 4000);

    return () => window.clearInterval(interval);
  }, [aiTaglines.length]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (onSearch) {
      onSearch(query);
    }
  };

  return (
    <Box
      component="section"
      sx={{
        position: 'relative',
        display: 'grid',
        placeItems: 'center',
        borderRadius: { xs: 4, md: 6 },
        overflow: 'hidden',
        bgcolor: 'background.paper',
        px: { xs: 3, md: 6 },
        py: { xs: 6, md: 10 },
        boxShadow: '0 20px 60px rgba(15, 118, 110, 0.12)',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(circle at 20% 20%, rgba(59,130,246,0.18) 0, transparent 40%), radial-gradient(circle at 80% 30%, rgba(16,185,129,0.16) 0, transparent 45%)',
        }}
      />

      <Stack
        spacing={{ xs: 3, md: 4 }}
        sx={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: 760 }}
      >
        <Stack spacing={2} alignItems="center">
          <Chip
            icon={<AutoAwesomeRoundedIcon fontSize="small" />}
            label="AI-Powered Discovery"
            color="secondary"
            variant="outlined"
            sx={{ fontWeight: 600, bgcolor: 'rgba(16,185,129,0.08)' }}
          />
          <Typography variant="h2" component="h1" sx={{ color: "text.primary",  fontSize: { xs: 36, md: 52 } }}>
            {headline}
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary', maxWidth: 520 }}>
            {description}
          </Typography>
        </Stack>

        <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
          <TextField
            fullWidth
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={placeholder}
            variant="outlined"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon color="primary" />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton type="submit" color="primary" size="large">
                    <SearchRoundedIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{
              bgcolor: 'rgba(255,255,255,0.9)',
              borderRadius: 999,
              '& .MuiOutlinedInput-root': {
                borderRadius: 999,
                pr: 1,
                pl: 1.5,
              },
            }}
          />
        </Box>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
          {featuredInsights.map((insight) => (
            <Button key={insight} variant="contained" color="primary" sx={{ borderRadius: 999 }}>
              {insight}
            </Button>
          ))}
        </Stack>

        <Fade in key={taglineIndex}>
          <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="center">
            <AutoAwesomeRoundedIcon color="secondary" fontSize="small" />
            <Typography variant="subtitle1" color="text.secondary">
              {aiTaglines[taglineIndex]}
            </Typography>
          </Stack>
        </Fade>
      </Stack>

      <Box
        aria-hidden
        sx={{
          display: { xs: 'none', md: 'block' },
          position: 'absolute',
          right: 48,
          bottom: 32,
          width: 200,
          height: 200,
          borderRadius: '50%',
          background:
            'radial-gradient(circle at 30% 30%, rgba(59,130,246,0.45), transparent 65%), radial-gradient(circle at 70% 70%, rgba(16,185,129,0.35), transparent 60%)',
          filter: 'blur(0px)',
          opacity: 0.75,
        }}
      />
    </Box>
  );
}
