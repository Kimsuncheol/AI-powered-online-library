'use client';

import * as React from 'react';
import { Box, Card, CardActionArea, CardContent, CardMedia, Chip, Stack, Typography, Skeleton } from '@mui/material';
import Grid from '@mui/material/Grid2';

export interface BookSummary {
  id: string;
  title: string;
  author: string;
  coverImage: string;
  aiSummary: string;
  category?: string;
}

export interface FeaturedBooksSectionProps {
  title: string;
  description?: string;
  items: BookSummary[];
  loading?: boolean;
  onSelectBook?: (book: BookSummary) => void;
}

export default function FeaturedBooksSection({
  title,
  description,
  items,
  loading = false,
  onSelectBook,
}: FeaturedBooksSectionProps) {
  const displayItems = React.useMemo<(BookSummary | undefined)[]>(() => {
    if (loading) {
      return Array.from({ length: 6 });
    }
    return items;
  }, [items, loading]);

  return (
    <Box component="section">
      <Stack spacing={2} sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          {title}
        </Typography>
        {description ? (
          <Typography variant="body1" color="text.secondary">
            {description}
          </Typography>
        ) : null}
      </Stack>

      <Grid container spacing={{ xs: 2, sm: 3 }}>
        {displayItems.map((item, index) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={item ? item.id : index}>
            <Card
              variant="outlined"
              sx={{ height: '100%', bgcolor: 'background.paper' }}
              onClick={() => {
                if (!loading && item && onSelectBook) {
                  onSelectBook(item as BookSummary);
                }
              }}
            >
              <CardActionArea sx={{ height: '100%', alignItems: 'stretch' }}>
                <Stack
                  direction="column"
                  sx={{ height: '100%', alignItems: 'stretch', justifyContent: 'space-between' }}
                >
                  {loading ? (
                    <Skeleton variant="rectangular" height={220} animation="wave" />
                  ) : (
                    <CardMedia
                      component="img"
                      image={item.coverImage}
                      alt={`${item.title} cover`}
                      sx={{
                        height: 220,
                        objectFit: 'cover',
                        borderBottomLeftRadius: 0,
                        borderBottomRightRadius: 0,
                      }}
                    />
                  )}

                  <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {loading ? (
                      <>
                        <Skeleton variant="text" width="80%" />
                        <Skeleton variant="text" width="40%" />
                        <Skeleton variant="rounded" width={120} height={28} />
                      </>
                    ) : (
                      <>
                        <Stack spacing={0.5}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                            {item.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {item.author}
                          </Typography>
                        </Stack>
                        <Chip
                          label="AI Summary"
                          color="primary"
                          size="small"
                          sx={{ alignSelf: 'flex-start', fontWeight: 600 }}
                        />
                        <Typography variant="body2" color="text.secondary">
                          {item.aiSummary}
                        </Typography>
                      </>
                    )}
                  </CardContent>
                </Stack>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
