'use client';

import * as React from 'react';
import { AppBar, Box, Button, Toolbar } from '@mui/material';

import { useAuth } from './AuthProvider';
import UserMenu from './UserMenu';
import Image from 'next/image';
import Link from 'next/link';

export interface HeaderProps {
  title?: string;
}

export default function Header({ title = 'AI Library' }: HeaderProps) {
  const { user, openLogin } = useAuth();

  return (
    <AppBar
      position="fixed"
      color="inherit"
      elevation={0}
      sx={{
        borderRadius: 0,
        borderBottom: '1px solid rgba(17,24,39,0.08)',
        backgroundColor: 'white',
        backdropFilter: 'blur(16px)',
        zIndex: (theme) => theme.zIndex.drawer + 1,
      }}
    >
      <Toolbar sx={{ minHeight: { xs: 68, md: 76 }, px: { xs: 2, md: 4 } }}>
        <Link href='/'>
          <Image src='/logo.png'
            alt=""
            width={200}
            height={86}
            style={{
              aspectRatio: '1.2 / 0.45'
            }} />
        </Link>
        <Box sx={{ flexGrow: 1 }} />

        {!user ? (
          <Button variant="contained" color="primary" onClick={openLogin} sx={{ borderRadius: 2, px: 2.5 }}>
            Log in
          </Button>
        ) : (
          <UserMenu />
        )}
      </Toolbar>
    </AppBar>
  );
}
