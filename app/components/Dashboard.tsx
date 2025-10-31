'use client';

import * as React from 'react';
import { Box, Container, Stack } from '@mui/material';

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
        px: { xs: 2, md: 4 },
      }}
    >
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1fr) auto' },
          columnGap: { xs: 0, lg: 6 },
          justifyContent: 'center',
          maxWidth: { lg: (theme) => theme.breakpoints.values.xl + 360 },
          mx: 'auto',
        }}
      >
        <Container
          maxWidth="xl"
          disableGutters
          sx={{
            gridColumn: '1 / span 1',
            px: { xs: 0, sm: 3 },
          }}
        >
          <Stack spacing={{ xs: 6, md: 10 }}>
            <HeroSection {...hero} />

            <Stack spacing={{ xs: 4, md: 6 }}>
              <QuickAccessPanels {...quickActions} />
              <FeaturedBooksSection {...featuredBooks} />
              <RecommendationCarousel {...recommendations} />
            </Stack>

            <SiteFooter {...footer} />
          </Stack>
        </Container>

        <Box
          sx={{
            display: { xs: 'none', lg: 'flex' },
            justifyContent: 'flex-start',
            alignItems: 'flex-start',
            pt: { lg: 0.5 },
            position: 'sticky',
            top: 112,
            minWidth: 320,
          }}
        >
          <AIChatWidget {...chatWidget} />
        </Box>
      </Box>

      <Box
        sx={{
          mt: { xs: 6, lg: 8 },
          display: { xs: 'block', lg: 'none' },
        }}
      >
        <AIChatWidget {...chatWidget} />
      </Box>
    </Box>
  );
}
