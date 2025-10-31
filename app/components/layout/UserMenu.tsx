'use client';

import * as React from 'react';
import { Avatar, IconButton, ListItemIcon, Menu, MenuItem, Stack, Typography } from '@mui/material';
import Link from 'next/link';
import AccountCircleRoundedIcon from '@mui/icons-material/AccountCircleRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import LibraryBooksRoundedIcon from '@mui/icons-material/LibraryBooksRounded';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import LibraryAddRoundedIcon from '@mui/icons-material/LibraryAddRounded';
import PeopleRoundedIcon from '@mui/icons-material/PeopleRounded';

import { useAuth } from './AuthProvider';

export interface UserMenuProps {
  hideEmail?: boolean;
}

export default function UserMenu({ hideEmail = false }: UserMenuProps) {
  const { user, logout } = useAuth();
  const [menuAnchor, setMenuAnchor] = React.useState<null | HTMLElement>(null);
  const menuOpen = Boolean(menuAnchor);

  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchor(event.currentTarget);
  };

  const handleCloseMenu = () => setMenuAnchor(null);

  const handleLogout = async () => {
    await logout();
    handleCloseMenu();
  };

  const userInitials = React.useMemo(() => {
    if (!user?.name) return 'A';
    const [first, second] = user.name.split(' ');
    if (first && second) {
      return `${first[0]}${second[0]}`.toUpperCase();
    }
    return first[0]?.toUpperCase() ?? 'A';
  }, [user]);

  if (!user) {
    return null;
  }

  return (
    <Stack direction="row" spacing={1} alignItems="center">
      <Stack alignItems="flex-end" spacing={0} sx={{ display: hideEmail ? 'none' : { xs: 'none', sm: 'flex' } }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
          {user.name}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {user.email}
        </Typography>
      </Stack>
      <IconButton
        disableRipple
        color="primary"
        onClick={handleOpenMenu}
        sx={{
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
        <MenuItem component={Link} href="/profile" onClick={handleCloseMenu}>
          <ListItemIcon>
            <AccountCircleRoundedIcon fontSize="small" />
          </ListItemIcon>
          Profile
        </MenuItem>
        <MenuItem component={Link} href="/settings" onClick={handleCloseMenu}>
          <ListItemIcon>
            <SettingsRoundedIcon fontSize="small" />
          </ListItemIcon>
          Settings
        </MenuItem>
        {user.role === 'admin' && (
          <MenuItem component={Link} href="/admin/books/new" onClick={handleCloseMenu}>
            <ListItemIcon>
              <LibraryAddRoundedIcon fontSize="small" />
            </ListItemIcon>
            Register Book
          </MenuItem>
        )}
        {user.role === 'admin' && (
          <MenuItem component={Link} href="/admin/members" onClick={handleCloseMenu}>
            <ListItemIcon>
              <PeopleRoundedIcon fontSize="small" />
            </ListItemIcon>
            Manage Members
          </MenuItem>
        )}
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
  );
}
