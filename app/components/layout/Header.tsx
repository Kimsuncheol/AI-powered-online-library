'use client';

import * as React from 'react';
import { AppBar, Box, Button, IconButton, InputAdornment, TextField, Toolbar } from '@mui/material';

import { useAuth } from './AuthProvider';
import UserMenu from './UserMenu';
import Image from 'next/image';
import Link from 'next/link';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import { useRouter, useSearchParams } from 'next/navigation';

export interface HeaderProps {
  title?: string;
}

export default function Header({ title = 'AI Library' }: HeaderProps) {
  const { user, openLogin } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = React.useState('');
  const queryParam = React.useMemo(() => searchParams.get('q') ?? '', [searchParams]);

  React.useEffect(() => {
    setSearchValue(queryParam);
  }, [queryParam]);

  const navigateToSearch = React.useCallback(
    (term?: string) => {
      const trimmed = term?.trim() ?? '';
      if (trimmed.length > 0) {
        router.push(`/search?q=${encodeURIComponent(trimmed)}`);
        return;
      }
      router.push('/search');
    },
    [router],
  );

  const handleSubmitKey = React.useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key !== 'Enter') {
        return;
      }
      event.preventDefault();
      navigateToSearch(searchValue);
    },
    [navigateToSearch, searchValue],
  );

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
        <Link href='/' aria-label={title}>
          <Image src='/logo.png'
            alt=""
            width={200}
            height={86}
            style={{
              aspectRatio: '1.2 / 0.45'
            }} />
        </Link>
        <Box sx={{ flexGrow: 1 }} />

        <TextField
          value={searchValue}
          onChange={(event) => setSearchValue(event.target.value)}
          placeholder="Search the library"
          size="small"
          onKeyDown={handleSubmitKey}
          sx={{
            display: { xs: 'none', sm: 'flex' },
            width: { sm: 240, md: 320 },
            mr: { sm: 2, md: 3 },
          }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => navigateToSearch(searchValue)} edge="end">
                  <SearchRoundedIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        <IconButton
          sx={{ display: { xs: 'flex', sm: 'none' }, mr: 1 }}
          color="default"
          onClick={() => navigateToSearch(searchValue)}
          aria-label="Open search"
        >
          <SearchRoundedIcon />
        </IconButton>

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
