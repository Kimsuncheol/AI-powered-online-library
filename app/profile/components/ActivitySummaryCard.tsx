'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, Divider, Grid2 as Grid, Stack, Typography } from '@mui/material';

export interface ActivitySummaryCardProps {
  loansCount: number;
  reviewsCount: number;
  recentlyViewed: string[];
}

export default function ActivitySummaryCard({ loansCount, reviewsCount, recentlyViewed }: ActivitySummaryCardProps) {
  return (
    <Card variant="outlined" sx={{ borderRadius: 3 }}>
      <CardHeader
        title="Activity summary"
        titleTypographyProps={{ variant: 'h6', fontWeight: 600 }}
        subheader="A quick snapshot of your recent engagement across the library."
      />
      <Divider />
      <CardContent>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Stack spacing={0.5}>
              <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 1 }}>
                loans
              </Typography>
              <Typography variant="h4" component="p" sx={{ fontWeight: 700 }}>
                {loansCount}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total active and historical loans managed through your AI librarian.
              </Typography>
            </Stack>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Stack spacing={0.5}>
              <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 1 }}>
                reviews
              </Typography>
              <Typography variant="h4" component="p" sx={{ fontWeight: 700 }}>
                {reviewsCount}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Insightful takes authored by you, powering community discovery.
              </Typography>
            </Stack>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Stack spacing={0.5}>
              <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 1 }}>
                recently viewed
              </Typography>
              <Stack spacing={0.5}>
                {recentlyViewed.slice(0, 3).map((title) => (
                  <Typography key={title} variant="body2">
                    {title}
                  </Typography>
                ))}
              </Stack>
            </Stack>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}
