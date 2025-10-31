'use client';

import * as React from 'react';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  IconButton,
  Stack,
  Typography,
} from '@mui/material';
import CameraAltRoundedIcon from '@mui/icons-material/CameraAltRounded';

export interface ProfileHeaderCardProps {
  name: string;
  email: string;
  avatarUrl?: string;
  isEditing: boolean;
  onEditToggle: () => void;
  onAvatarChange?: (file: File) => void;
}

export default function ProfileHeaderCard({
  name,
  email,
  avatarUrl,
  isEditing,
  onEditToggle,
  onAvatarChange,
}: ProfileHeaderCardProps) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  const handlePickAvatar = () => {
    inputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && onAvatarChange) {
      onAvatarChange(file);
    }
    event.target.value = '';
  };

  return (
    <Card variant="outlined" sx={{ borderRadius: 3 }}>
      <CardHeader
        title="Profile overview"
        titleTypographyProps={{ variant: 'h6', fontWeight: 600 }}
        action={
          <Button
            variant={isEditing ? 'outlined' : 'contained'}
            color="primary"
            onClick={onEditToggle}
            aria-label={isEditing ? 'Cancel profile editing' : 'Enable profile editing'}
          >
            {isEditing ? 'Cancel' : 'Edit Profile'}
          </Button>
        }
      />
      <CardContent>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems={{ xs: 'flex-start', sm: 'center' }}>
          <Box position="relative">
            <Avatar
              src={avatarUrl}
              alt={name}
              sx={{
                width: 96,
                height: 96,
                fontSize: 32,
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
              }}
            >
              {name.charAt(0).toUpperCase()}
            </Avatar>
            <IconButton
              size="small"
              color="primary"
              onClick={handlePickAvatar}
              sx={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                bgcolor: 'background.paper',
                border: '1px solid rgba(59,130,246,0.2)',
              }}
              aria-label="Upload new avatar"
            >
              <CameraAltRoundedIcon fontSize="small" />
            </IconButton>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              hidden
              aria-hidden
            />
          </Box>

          <Stack spacing={1}>
            <Typography variant="h5" component="h2" sx={{ fontWeight: 600 }}>
              {name}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {email}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 480 }}>
              This profile feeds your public AI Library presence and reader community profile. Keep it up to date so
              others can discover your latest interests.
            </Typography>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}
