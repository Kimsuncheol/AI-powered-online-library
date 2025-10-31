'use client';

import * as React from 'react';
import {
  AppBar,
  Avatar,
  Box,
  Button,
  IconButton,
  InputAdornment,
  ListItemIcon,
  Menu,
  MenuItem,
  OutlinedInput,
  Stack,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import AccountCircleRoundedIcon from '@mui/icons-material/AccountCircleRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import LibraryBooksRoundedIcon from '@mui/icons-material/LibraryBooksRounded';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';

import { useAuth } from './AuthProvider';
import Image from 'next/image';
import Link from 'next/link';

export interface HeaderProps {
  title?: string;
  onSearchSubmit?: (query: string) => void;
}

export default function Header({ title = 'AI Library', onSearchSubmit }: HeaderProps) {
  const { user, openLogin, logout } = useAuth();
  const [menuAnchor, setMenuAnchor] = React.useState<null | HTMLElement>(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  const menuOpen = Boolean(menuAnchor);
  const theme = useTheme();

  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchor(event.currentTarget);
  };

  const handleCloseMenu = () => setMenuAnchor(null);

  const handleLogout = () => {
    logout();
    handleCloseMenu();
  };

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedQuery = searchQuery.trim();
    if (!trimmedQuery) return;
    onSearchSubmit?.(trimmedQuery);
    setSearchQuery('');
  };

  const userInitials = React.useMemo(() => {
    if (!user?.name) return 'A';
    const [first, second] = user.name.split(' ');
    if (first && second) {
      return `${first[0]}${second[0]}`.toUpperCase();
    }
    return first[0]?.toUpperCase() ?? 'A';
  }, [user]);

  return (
    <AppBar
      position="fixed"
      color="inherit"
      elevation={0}
      sx={{
        borderRadius: 0,
        borderBottom: '1px solid rgba(17,24,39,0.08)',
        backgroundColor: 'rgba(249,250,251,0.85)',
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
        <Box
          component="form"
          onSubmit={handleSearchSubmit}
          sx={{ flexGrow: 1, mx: { xs: 1.5, md: 4 }, maxWidth: { xs: 260, sm: 360, md: '100%' } }}
        >
          <OutlinedInput
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search the library"
            startAdornment={
              <InputAdornment position="start">
                <SearchRoundedIcon color="primary" />
              </InputAdornment>
            }
            size="small"
            sx={{
              width: '100%',
              borderRadius: 0,
              px: 1,
              py: 0.5,
              backgroundColor: alpha(theme.palette.common.white, 0.95),
              boxShadow: '0 1px 2px rgba(15, 23, 42, 0.08)',
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: alpha(theme.palette.primary.main, 0.1),
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: alpha(theme.palette.primary.main, 0.3),
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: theme.palette.primary.main,
                borderWidth: 1.5,
              },
            }}
          />
        </Box>

        {!user ? (
          <Button variant="contained" color="primary" onClick={openLogin} sx={{ borderRadius: 0, px: 2.5 }}>
            Log in
          </Button>
        ) : (
          <Stack direction="row" spacing={1} alignItems="center">
            <Stack alignItems="flex-end" spacing={0} sx={{ display: { xs: 'none', sm: 'flex' } }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                {user.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {user.email}
              </Typography>
            </Stack>
            <IconButton
              color="primary"
              onClick={handleOpenMenu}
              sx={{
                borderRadius: 0,
                border: '1px solid rgba(59,130,246,0.25)',
                px: 0.75,
                bgcolor: 'background.paper',
              }}
            >
              <Avatar src={user.avatarUrl} alt={user.name} sx={{ width: 34, height: 34, mr: 1 }}>
                {userInitials}
              </Avatar>
              <ExpandMoreRoundedIcon fontSize="small" />
            </IconButton>
            <Menu
              anchorEl={menuAnchor}
              open={menuOpen}
              onClose={handleCloseMenu}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              keepMounted
            >
              <MenuItem onClick={handleCloseMenu}>
                <ListItemIcon>
                  <AccountCircleRoundedIcon fontSize="small" />
                </ListItemIcon>
                Profile
              </MenuItem>
              <MenuItem onClick={handleCloseMenu}>
                <ListItemIcon>
                  <LibraryBooksRoundedIcon fontSize="small" />
                </ListItemIcon>
                My Library
              </MenuItem>
              <MenuItem onClick={handleLogout}>
                <ListItemIcon>
                  <LogoutRoundedIcon fontSize="small" />
                </ListItemIcon>
                Logout
              </MenuItem>
            </Menu>
          </Stack>
        )}
      </Toolbar>
    </AppBar>
  );
}
