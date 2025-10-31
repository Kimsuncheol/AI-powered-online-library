'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Checkbox,
  Divider,
  FormControlLabel,
  Stack,
  Switch,
  Typography,
} from '@mui/material';

export interface NotificationSettings {
  comments: boolean;
  likes: boolean;
  marketing: boolean;
}

export interface NotificationSettingsCardProps {
  value: NotificationSettings;
  onChange: (value: NotificationSettings) => void;
}

export default function NotificationSettingsCard({ value, onChange }: NotificationSettingsCardProps) {
  const handleChange =
    (field: keyof NotificationSettings) => (event: React.ChangeEvent<HTMLInputElement>, checked: boolean) => {
      onChange({ ...value, [field]: checked });
    };

  return (
    <Card id="settings-panel-notifications" variant="outlined" sx={{ borderRadius: 3 }}>
      <CardHeader
        title="Notifications"
        titleTypographyProps={{ variant: 'h6', fontWeight: 600 }}
        subheader="Control which updates reach your inbox. We keep summaries concise and privacy-friendly."
      />
      <Divider />
      <CardContent>
        <Stack spacing={2}>
          <FormControlLabel
            control={<Switch checked={value.comments} onChange={handleChange('comments')} color="primary" />}
            label={
              <Stack>
                <Typography variant="subtitle2">Comment alerts</Typography>
                <Typography variant="body2" color="text.secondary">
                  Updates when someone replies to your review or discussion.
                </Typography>
              </Stack>
            }
          />
          <FormControlLabel
            control={<Switch checked={value.likes} onChange={handleChange('likes')} color="primary" />}
            label={
              <Stack>
                <Typography variant="subtitle2">Appreciation highlights</Typography>
                <Typography variant="body2" color="text.secondary">
                  Weekly digest of likes and saves on your lists.
                </Typography>
              </Stack>
            }
          />
          <Divider />
          <FormControlLabel
            control={<Checkbox checked={value.marketing} onChange={handleChange('marketing')} color="primary" />}
            label={
              <Stack>
                <Typography variant="subtitle2">Product insights &amp; beta invites</Typography>
                <Typography variant="body2" color="text.secondary">
                  Hear about new AI librarian capabilities and learning cohorts.
                </Typography>
              </Stack>
            }
          />
        </Stack>
      </CardContent>
    </Card>
  );
}
