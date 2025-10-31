'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Divider,
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
  Stack,
  TextField,
} from '@mui/material';

export type ThemePreference = 'light' | 'dark' | 'system';
export type DensityPreference = 'comfortable' | 'compact';

export interface AppearanceSettings {
  themeMode: ThemePreference;
  density: DensityPreference;
  language: string;
}

export interface AppearanceSettingsCardProps {
  value: AppearanceSettings;
  onChange: (value: AppearanceSettings) => void;
}

export default function AppearanceSettingsCard({ value, onChange }: AppearanceSettingsCardProps) {
  const handleThemeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...value, themeMode: event.target.value as ThemePreference });
  };

  const handleDensityChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...value, density: event.target.value as DensityPreference });
  };

  const handleLanguageChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    onChange({ ...value, language: event.target.value });
  };

  return (
    <Card id="settings-panel-appearance" variant="outlined" sx={{ borderRadius: 3 }}>
      <CardHeader
        title="Appearance"
        titleTypographyProps={{ variant: 'h6', fontWeight: 600 }}
        subheader="Tune the interface to match your preferences across light, dark, and high-density layouts."
      />
      <Divider />
      <CardContent>
        <Stack spacing={3}>
          <FormControl component="fieldset">
            <FormLabel component="legend">Theme mode</FormLabel>
            <RadioGroup
              row
              value={value.themeMode}
              onChange={handleThemeChange}
              aria-label="Theme mode preference"
            >
              <FormControlLabel value="light" control={<Radio />} label="Light" />
              <FormControlLabel value="dark" control={<Radio />} label="Dark" />
              <FormControlLabel value="system" control={<Radio />} label="System" />
            </RadioGroup>
          </FormControl>

          <FormControl component="fieldset">
            <FormLabel component="legend">Density</FormLabel>
            <RadioGroup
              row
              value={value.density}
              onChange={handleDensityChange}
              aria-label="Interface density preference"
            >
              <FormControlLabel value="comfortable" control={<Radio />} label="Comfortable" />
              <FormControlLabel value="compact" control={<Radio />} label="Compact" />
            </RadioGroup>
          </FormControl>

          <TextField
            label="Language"
            value={value.language}
            onChange={handleLanguageChange}
            helperText="We’ll localize labels and recommendations when available."
          />
        </Stack>
      </CardContent>
    </Card>
  );
}
