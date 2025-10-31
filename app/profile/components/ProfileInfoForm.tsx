'use client';

import * as React from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  FormControl,
  FormHelperText,
  Grid2 as Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';

export interface ProfileInfoFormValues {
  displayName: string;
  bio: string;
  website: string;
  location: string;
  preferredGenres: string[];
}

export interface ProfileInfoFormProps {
  defaultValues: ProfileInfoFormValues;
  isEditing: boolean;
  isSubmitting: boolean;
  onSubmit: (values: ProfileInfoFormValues) => Promise<void> | void;
  onEditRequest: () => void;
  validationErrors?: Partial<Record<keyof ProfileInfoFormValues, string>>;
}

const GENRE_OPTIONS = [
  'Artificial Intelligence',
  'Data Science',
  'Science Fiction',
  'Cybersecurity',
  'Design',
  'Productivity',
  'Business',
  'History',
  'Philosophy',
];

export default function ProfileInfoForm({
  defaultValues,
  isEditing,
  isSubmitting,
  onSubmit,
  onEditRequest,
  validationErrors,
}: ProfileInfoFormProps) {
  const [values, setValues] = React.useState<ProfileInfoFormValues>(defaultValues);

  React.useEffect(() => {
    setValues(defaultValues);
  }, [defaultValues]);

  const handleChange =
    (field: keyof ProfileInfoFormValues) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setValues((prev) => ({ ...prev, [field]: event.target.value }));
    };

  const handleGenreChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    const nextValue = event.target.value as string[];
    setValues((prev) => ({ ...prev, preferredGenres: nextValue }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isEditing) {
      onEditRequest();
      return;
    }
    onSubmit(values);
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      aria-labelledby="profile-info-form-title"
      sx={{
        backgroundColor: 'background.paper',
        borderRadius: 3,
        border: '1px solid rgba(15, 23, 42, 0.08)',
        p: { xs: 3, md: 4 },
      }}
    >
      <Stack spacing={3}>
        <Box>
          <Typography id="profile-info-form-title" variant="h6" sx={{ fontWeight: 600 }}>
            Personal details
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Share a glimpse of yourself with the rest of the community. These fields populate your profile card and AI
            recommendations.
          </Typography>
        </Box>

        {!isEditing ? (
          <Alert severity="info" variant="outlined">
            Profile fields are view-only. Select “Edit Profile” above to make changes.
          </Alert>
        ) : null}

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              label="Display name"
              name="displayName"
              value={values.displayName}
              onChange={handleChange('displayName')}
              disabled={!isEditing || isSubmitting}
              required
              fullWidth
              inputProps={{ 'aria-required': true }}
              error={Boolean(validationErrors?.displayName)}
              helperText={validationErrors?.displayName}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              label="Website"
              name="website"
              value={values.website}
              onChange={handleChange('website')}
              disabled={!isEditing || isSubmitting}
              type="url"
              placeholder="https://"
              fullWidth
              error={Boolean(validationErrors?.website)}
              helperText={validationErrors?.website}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              label="Location"
              name="location"
              value={values.location}
              onChange={handleChange('location')}
              disabled={!isEditing || isSubmitting}
              fullWidth
              error={Boolean(validationErrors?.location)}
              helperText={validationErrors?.location}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField
              label="Short bio"
              name="bio"
              value={values.bio}
              onChange={handleChange('bio')}
              disabled={!isEditing || isSubmitting}
              fullWidth
              multiline
              minRows={3}
              maxRows={6}
              helperText={
                validationErrors?.bio ??
                'Give other readers a sense of your interests, ongoing projects, or reading goals.'
              }
              error={Boolean(validationErrors?.bio)}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <FormControl fullWidth disabled={!isEditing || isSubmitting} error={Boolean(validationErrors?.preferredGenres)}>
              <InputLabel id="preferred-genres-label">Preferred genres</InputLabel>
              <Select
                labelId="preferred-genres-label"
                multiple
                value={values.preferredGenres}
                label="Preferred genres"
                onChange={handleGenreChange}
                renderValue={(selected) =>
                  (selected as string[]).map((genre) => <Chip key={genre} label={genre} sx={{ mr: 0.5 }} />)
                }
              >
                {GENRE_OPTIONS.map((genre) => (
                  <MenuItem key={genre} value={genre}>
                    {genre}
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>
                {validationErrors?.preferredGenres ?? 'We use this to fine-tune your AI-assisted book suggestions.'}
              </FormHelperText>
            </FormControl>
          </Grid>
        </Grid>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="flex-end">
          {!isEditing ? (
            <Button variant="outlined" color="primary" onClick={onEditRequest}>
              Edit Profile
            </Button>
          ) : null}
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={isSubmitting}
            aria-disabled={isSubmitting}
          >
            {isEditing ? 'Save changes' : 'Edit Profile'}
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
