'use client';

import * as React from 'react';
import { Alert, Container, Snackbar, Stack } from '@mui/material';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/app/components/layout/AuthProvider';
import ProfileHeaderCard from './components/ProfileHeaderCard';
import ProfileInfoForm, { ProfileInfoFormValues } from './components/ProfileInfoForm';
import ActivitySummaryCard from './components/ActivitySummaryCard';

interface ActivitySummary {
  loansCount: number;
  reviewsCount: number;
  recentlyViewed: string[];
}

const INITIAL_PROFILE: ProfileInfoFormValues = {
  displayName: 'Jordan Reed',
  bio: 'AI librarian, lifelong learner, and curator of signal in the noise. Always excited about emergent tools.',
  website: 'https://readwithai.dev',
  location: 'San Francisco, CA',
  preferredGenres: ['Artificial Intelligence', 'Data Science', 'Science Fiction'],
};

const INITIAL_ACTIVITY: ActivitySummary = {
  loansCount: 18,
  reviewsCount: 12,
  recentlyViewed: ['Designing Agentic Systems', 'Prompt Engineering Mastery', 'The Library of Babel'],
};

function validateProfile(values: ProfileInfoFormValues) {
  const errors: Partial<Record<keyof ProfileInfoFormValues, string>> = {};
  if (!values.displayName.trim()) {
    errors.displayName = 'Display name is required.';
  }
  if (values.website && !/^https?:\/\/.+/i.test(values.website)) {
    errors.website = 'Please provide a valid URL starting with http:// or https://';
  }
  if (values.bio && values.bio.length > 280) {
    errors.bio = 'Keep your bio under 280 characters.';
  }
  if (values.preferredGenres.length === 0) {
    errors.preferredGenres = 'Select at least one genre so we can personalize your experience.';
  }
  return errors;
}

export default function ProfilePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [profile, setProfile] = React.useState<ProfileInfoFormValues>(INITIAL_PROFILE);
  const [isEditing, setIsEditing] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [validationErrors, setValidationErrors] = React.useState<Partial<Record<keyof ProfileInfoFormValues, string>>>(
    {},
  );
  const [snackbar, setSnackbar] = React.useState<{ open: boolean; type: 'success' | 'error'; message: string }>({
    open: false,
    type: 'success',
    message: '',
  });

  React.useEffect(() => {
    if (!user) {
      router.replace('/login?next=/profile');
    }
  }, [router, user]);

  React.useEffect(() => {
    if (user?.name) {
      setProfile((prev) => ({
        ...prev,
        displayName: user.name ?? prev.displayName,
      }));
    }
  }, [user?.name]);

  const handleToggleEdit = React.useCallback(() => {
    if (isSubmitting) return;
    setIsEditing((prev) => !prev);
    setValidationErrors({});
  }, [isSubmitting]);

  const handleSubmit = React.useCallback(
    async (values: ProfileInfoFormValues) => {
      const errors = validateProfile(values);
      setValidationErrors(errors);
      if (Object.keys(errors).length > 0) {
        return;
      }

      setIsSubmitting(true);
      try {
        await new Promise((resolve) => setTimeout(resolve, 800));
        setProfile(values);
        setSnackbar({ open: true, type: 'success', message: 'Profile updated successfully.' });
        setIsEditing(false);
      } catch (error) {
        setSnackbar({ open: true, type: 'error', message: 'We could not save your profile. Try again.' });
      } finally {
        setIsSubmitting(false);
      }
    },
    [],
  );

  const handleAvatarChange = React.useCallback((file: File) => {
    setSnackbar({
      open: true,
      type: 'success',
      message: `Uploaded new avatar: ${file.name}`,
    });
  }, []);

  if (!user) {
    return null;
  }

  return (
    <Container
      component="main"
      maxWidth="lg"
      sx={{
        py: { xs: 4, md: 6 },
        display: 'flex',
        flexDirection: 'column',
        gap: { xs: 4, md: 6 },
      }}
    >
      <ProfileHeaderCard
        name={profile.displayName}
        email={user?.email ?? 'reader@example.com'}
        avatarUrl={user?.avatarUrl}
        isEditing={isEditing}
        onEditToggle={handleToggleEdit}
        onAvatarChange={handleAvatarChange}
      />

      <ProfileInfoForm
        defaultValues={profile}
        isEditing={isEditing}
        isSubmitting={isSubmitting}
        onSubmit={handleSubmit}
        onEditRequest={handleToggleEdit}
        validationErrors={validationErrors}
      />

      <ActivitySummaryCard
        loansCount={INITIAL_ACTIVITY.loansCount}
        reviewsCount={INITIAL_ACTIVITY.reviewsCount}
        recentlyViewed={INITIAL_ACTIVITY.recentlyViewed}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={snackbar.type}
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
