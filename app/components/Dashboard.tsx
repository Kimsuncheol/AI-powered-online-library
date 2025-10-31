'use client';

import * as React from 'react';
import { Box, Container, Stack } from '@mui/material';
import Grid from '@mui/material/Grid2';

import HeroSection, { HeroSectionProps } from './HeroSection';
import FeaturedBooksSection, { FeaturedBooksSectionProps } from './FeaturedBooksSection';
import RecommendationCarousel, { RecommendationCarouselProps } from './RecommendationCarousel';
import AIChatWidget, { AIChatWidgetProps } from './AIChatWidget';
import QuickAccessPanels, { QuickAccessPanelsProps } from './QuickAccessPanels';
import SiteFooter, { SiteFooterProps } from './SiteFooter';

export interface DashboardProps {
  hero: HeroSectionProps;
  featuredBooks: FeaturedBooksSectionProps;
  recommendations: RecommendationCarouselProps;
  quickActions: QuickAccessPanelsProps;
  chatWidget: AIChatWidgetProps;
  footer: SiteFooterProps;
}

export default function Dashboard({
  hero,
  featuredBooks,
  recommendations,
  quickActions,
  chatWidget,
  footer,
}: DashboardProps) {
  return (
    <Box
      sx={{
        bgcolor: 'background.default',
        minHeight: '100vh',
        py: { xs: 6, md: 10 },
      }}
    >
      <Container maxWidth="lg">
        <Stack spacing={{ xs: 6, md: 10 }}>
          <HeroSection {...hero} />

          <Grid container spacing={{ xs: 4, md: 6 }}>
            <Grid size={{ xs: 12, md: 8 }}>
              <Stack spacing={{ xs: 4, md: 6 }}>
                <QuickAccessPanels {...quickActions} />
                <FeaturedBooksSection {...featuredBooks} />
                <RecommendationCarousel {...recommendations} />
              </Stack>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <AIChatWidget {...chatWidget} />
            </Grid>
          </Grid>

          <SiteFooter {...footer} />
        </Stack>
      </Container>
    </Box>
  );
}
