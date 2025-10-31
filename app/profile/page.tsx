'use client';

import * as React from 'react';
import { Alert, Button, Container, Snackbar, Stack, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';

import { useAuthContext } from '@/app/context/AuthContext';
import { deleteProfile, readProfile, updateProfile } from '@/app/lib/api/profile';
import { HttpError } from '@/app/lib/http';
import ProfileHeaderCard from './components/ProfileHeaderCard';
import ProfileInfoForm, { ProfileInfoFormValues } from './components/ProfileInfoForm';
import ActivitySummaryCard from './components/ActivitySummaryCard';

interface ActivitySummary {
  loansCount: number;
  reviewsCount: number;
  recentlyViewed: string[];
}

const INITIAL_PROFILE: ProfileInfoFormValues = {
  displayName: '',
  bio: '',
  website: '',
  location: '',
  preferredGenres: [],
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
  const { member, isInitialized, refreshMember } = useAuthContext();
  const [profile, setProfile] = React.useState<ProfileInfoFormValues>(INITIAL_PROFILE);
  const [isEditing, setIsEditing] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [loadingProfile, setLoadingProfile] = React.useState(true);
  const [validationErrors, setValidationErrors] = React.useState<Partial<Record<keyof ProfileInfoFormValues, string>>>(
    {},
  );
  const [snackbar, setSnackbar] = React.useState<{ open: boolean; type: 'success' | 'error'; message: string }>({
    open: false,
    type: 'success',
    message: '',
  });

  React.useEffect(() => {
    if (!isInitialized) return;
    if (!member) {
      router.replace('/login?next=/profile');
    }
  }, [isInitialized, member, router]);

  React.useEffect(() => {
    if (!isInitialized || !member) return;

    let active = true;
    setLoadingProfile(true);

    readProfile()
      .then((memberProfile) => {
        if (!active) return;
        setProfile({
          displayName: memberProfile.displayName ?? '',
          bio: memberProfile.bio ?? '',
          website: memberProfile.website ?? '',
          location: memberProfile.location ?? '',
          preferredGenres: memberProfile.preferredGenres ?? [],
        });
      })
      .catch((error: unknown) => {
        if (!active) return;
        const message =
          error instanceof HttpError
            ? error.status === 401
              ? 'Your session has expired. Please sign in again.'
              : error.message
            : 'We could not load your profile. Please try again.';
        setSnackbar({ open: true, type: 'error', message });
        if (error instanceof HttpError && error.status === 401) {
          void refreshMember();
        }
      })
      .finally(() => {
        if (active) {
          setLoadingProfile(false);
        }
      });

    return () => {
      active = false;
    };
  }, [isInitialized, member, refreshMember, router]);

  const handleToggleEdit = React.useCallback(() => {
    if (isSubmitting || isDeleting || loadingProfile) return;
    setIsEditing((prev) => !prev);
    setValidationErrors({});
  }, [isDeleting, isSubmitting, loadingProfile]);

  const handleSubmit = React.useCallback(
    async (values: ProfileInfoFormValues) => {
      const errors = validateProfile(values);
      setValidationErrors(errors);
      if (Object.keys(errors).length > 0) {
        return;
      }

      setIsSubmitting(true);
      try {
        const updated = await updateProfile({
          displayName: values.displayName.trim(),
          bio: values.bio.trim() || undefined,
          website: values.website.trim() || undefined,
          location: values.location.trim() || undefined,
          preferredGenres: values.preferredGenres,
        });
        setProfile({
          displayName: updated.displayName ?? values.displayName,
          bio: updated.bio ?? '',
          website: updated.website ?? '',
          location: updated.location ?? '',
          preferredGenres: updated.preferredGenres ?? [],
        });
        await refreshMember();
        setSnackbar({ open: true, type: 'success', message: 'Profile updated successfully.' });
        setIsEditing(false);
      } catch (error) {
        const message =
          error instanceof HttpError
            ? error.status === 422
              ? 'Some details were invalid. Please review the highlighted fields.'
              : error.message
            : 'We could not save your profile. Try again.';
        setSnackbar({ open: true, type: 'error', message });
      } finally {
        setIsSubmitting(false);
      }
    },
    [refreshMember],
  );

  const handleAvatarChange = React.useCallback((file: File) => {
    setSnackbar({
      open: true,
      type: 'success',
      message: `Uploaded new avatar: ${file.name}`,
    });
  }, []);

  const handleDeleteAccount = React.useCallback(async () => {
    if (isDeleting) return;
    const confirmed =
      typeof window !== 'undefined'
        ? window.confirm(
            'Deleting your account will remove your profile and access to the AI Library. This action cannot be undone. Continue?',
          )
        : false;

    if (!confirmed) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteProfile();
      await refreshMember();
      setSnackbar({ open: true, type: 'success', message: 'Your account has been deleted.' });
      router.replace('/');
    } catch (error) {
      const message =
        error instanceof HttpError ? error.message : 'We could not delete your account. Please try again.';
      setSnackbar({ open: true, type: 'error', message });
    } finally {
      setIsDeleting(false);
    }
  }, [isDeleting, refreshMember, router]);

  if (!member) {
    return null;
  }

  const disabled = loadingProfile || isDeleting;

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
        name={profile.displayName || member.displayName || member.email}
        email={member.email}
        avatarUrl={member.avatarUrl}
        isEditing={isEditing && !disabled}
        onEditToggle={handleToggleEdit}
        onAvatarChange={handleAvatarChange}
      />

      <ProfileInfoForm
        defaultValues={profile}
        isEditing={isEditing && !disabled}
        isSubmitting={isSubmitting || loadingProfile}
        onSubmit={handleSubmit}
        onEditRequest={handleToggleEdit}
        validationErrors={validationErrors}
      />

      <ActivitySummaryCard
        loansCount={INITIAL_ACTIVITY.loansCount}
        reviewsCount={INITIAL_ACTIVITY.reviewsCount}
        recentlyViewed={INITIAL_ACTIVITY.recentlyViewed}
      />

      <Stack
        direction="row"
        justifyContent="flex-end"
        alignItems="center"
        spacing={2}
        sx={{
          backgroundColor: 'background.paper',
          borderRadius: 3,
          border: '1px solid rgba(15, 23, 42, 0.08)',
          p: { xs: 2, md: 3 },
        }}
      >
        <Typography variant="body2" color="text.secondary">
          Need to leave the library? You can permanently remove your account.
        </Typography>
        <Button variant="outlined" color="error" onClick={handleDeleteAccount} disabled={isDeleting || loadingProfile}>
          {isDeleting ? 'Deleting account…' : 'Delete account'}
        </Button>
      </Stack>

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
