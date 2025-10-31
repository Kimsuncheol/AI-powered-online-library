'use client';

import * as React from 'react';
import { Box, Card, CardContent, CardHeader, Chip, Stack, Typography, Avatar } from '@mui/material';
import Grid from '@mui/material/Grid2';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';

export interface Recommendation {
  id: string;
  title: string;
  author: string;
  coverImage: string;
  matchScore: number;
  reason: string;
}

export interface RecommendationCarouselProps {
  title: string;
  subtitle?: string;
  items: Recommendation[];
}

export default function RecommendationCarousel({ title, subtitle, items }: RecommendationCarouselProps) {
  return (
    <Box component="section">
      <Stack spacing={1.5} sx={{ mb: 3 }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <TrendingUpRoundedIcon color="secondary" />
          <Typography variant="h5" sx={{ color: "text.primary", fontWeight: 700 }}>
            {title}
          </Typography>
        </Stack>
        {subtitle ? (
          <Typography variant="body1" color="text.secondary">
            {subtitle}
          </Typography>
        ) : null}
      </Stack>
      <Box
        sx={{
          overflowX: 'auto',
          pb: 1,
          '&::-webkit-scrollbar': {
            height: 8,
          },
          '&::-webkit-scrollbar-thumb': {
            bgcolor: 'primary.light',
            borderRadius: 999,
          },
        }}
      >
        <Grid
          container
          wrap="nowrap"
          spacing={2}
          sx={{
            width: 'max-content',
            pr: 2,
          }}
        >
          {items.map((item) => (
            <Grid key={item.id} size={{ xs: 10, sm: 6, md: 4, lg: 3.5 }}>
              <Card sx={{ minWidth: 240, bgcolor: 'background.paper' }}>
                <CardHeader
                  avatar={<Avatar src={item.coverImage} variant="rounded" alt={`${item.title} cover`} />}
                  title={
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {item.title}
                    </Typography>
                  }
                  subheader={
                    <Typography variant="body2" color="text.secondary">
                      {item.author}
                    </Typography>
                  }
                  sx={{ pb: 0 }}
                />
                <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  <Chip
                    label={`Match ${Math.round(item.matchScore * 100)}%`}
                    color="secondary"
                    size="small"
                    sx={{ alignSelf: 'flex-start', fontWeight: 600 }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    {item.reason}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Box>
  );
}
