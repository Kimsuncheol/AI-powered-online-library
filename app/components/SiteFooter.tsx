'use client';

import * as React from 'react';
import { Box, Link, Stack, Typography } from '@mui/material';

export interface SiteFooterLink {
  id: string;
  label: string;
  href: string;
}

export interface SiteFooterProps {
  links: SiteFooterLink[];
  copyright?: string;
}

export default function SiteFooter({
  links,
  copyright = `© ${new Date().getFullYear()} Aurora Library. All rights reserved.`,
}: SiteFooterProps) {
  return (
    <Box component="footer" sx={{ py: 6, borderTop: '1px solid rgba(17,24,39,0.08)' }}>
      <Stack
        spacing={3}
        direction={{ xs: 'column', md: 'row' }}
        alignItems={{ xs: 'flex-start', md: 'center' }}
        justifyContent="space-between"
      >
        <Stack spacing={0.5}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Aurora Library
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Explore books smarter with AI-driven insights.
          </Typography>
        </Stack>

        <Stack direction="row" spacing={3} sx={{ flexWrap: 'wrap', rowGap: 1.5 }}>
          {links.map((link) => (
            <Link key={link.id} href={link.href} color="text.secondary" underline="hover">
              {link.label}
            </Link>
          ))}
        </Stack>
      </Stack>

      <Typography variant="caption" color="text.secondary" sx={{ mt: 4, display: 'block' }}>
        {copyright}
      </Typography>
    </Box>
  );
}
