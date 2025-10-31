'use client';

import { useCallback, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import type { NewBook } from '@/app/interfaces/book';
import {
  Alert,
  Button,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';

const initialFormValues = {
  title: '',
  author: '',
  category: '',
  publisher: '',
  description: '',
  coverImageUrl: '',
  isbn: '',
  language: '',
  pageCount: '',
  publishedAt: '',
  tags: '',
} as const;

type FormValues = typeof initialFormValues;

type FormErrors = Partial<Record<keyof FormValues, string>>;

const validationMessages = {
  title: 'Title is required.',
  author: 'Author is required.',
  pageCount: 'Page count must be a positive integer.',
  isbn: 'ISBN must be 10 or 13 digits (hyphens allowed).',
  publishedAt: 'Published date must be a valid date.',
} as const;

export interface BookFormProps {
  onSubmit: (payload: NewBook) => Promise<void>;
  onReset?: () => void;
  isSubmitting?: boolean;
  validationError?: string | null;
}

export function BookForm({ onSubmit, onReset, isSubmitting = false, validationError }: BookFormProps) {
  const [values, setValues] = useState<FormValues>(initialFormValues);
  const [errors, setErrors] = useState<FormErrors>({});

  const handleChange = useCallback((field: keyof FormValues) => {
    return (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { value } = event.target;
      setValues((prev) => ({
        ...prev,
        [field]: value,
      }));
    };
  }, []);

  const handleSelectChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setValues((prev) => ({
      ...prev,
      [name as keyof FormValues]: value,
    }));
  }, []);

  const validate = useCallback((state: FormValues): FormErrors => {
    const nextErrors: FormErrors = {};

    if (!state.title.trim()) {
      nextErrors.title = validationMessages.title;
    }

    if (!state.author.trim()) {
      nextErrors.author = validationMessages.author;
    }

    if (state.pageCount.trim()) {
      const parsed = Number(state.pageCount);
      if (!Number.isInteger(parsed) || parsed <= 0) {
        nextErrors.pageCount = validationMessages.pageCount;
      }
    }

    if (state.isbn.trim()) {
      const cleaned = state.isbn.replace(/-/g, '');
      if (!/^\d+$/.test(cleaned) || (cleaned.length !== 10 && cleaned.length !== 13)) {
        nextErrors.isbn = validationMessages.isbn;
      }
    }

    if (state.publishedAt.trim()) {
      const timestamp = Date.parse(state.publishedAt);
      if (Number.isNaN(timestamp)) {
        nextErrors.publishedAt = validationMessages.publishedAt;
      }
    }

    return nextErrors;
  }, []);

  const buildPayload = useCallback((state: FormValues): NewBook => {
    const toOptionalString = (value: string) => {
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : undefined;
    };

    const optionalStrings: Record<string, string | undefined> = {
      category: toOptionalString(state.category),
      publisher: toOptionalString(state.publisher),
      description: toOptionalString(state.description),
      coverImageUrl: toOptionalString(state.coverImageUrl),
      isbn: toOptionalString(state.isbn),
      language: toOptionalString(state.language),
      publishedAt: toOptionalString(state.publishedAt),
    };

    const pageCount = state.pageCount.trim()
      ? Number.parseInt(state.pageCount.trim(), 10)
      : undefined;

    const tags = state.tags
      .split(',')
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);

    return {
      title: state.title.trim(),
      author: state.author.trim(),
      pageCount,
      tags: tags.length > 0 ? tags : undefined,
      ...optionalStrings,
    };
  }, []);

  const handleSubmit = useCallback(async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors = validate(values);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    const payload = buildPayload(values);
    await onSubmit(payload);
  }, [buildPayload, onSubmit, validate, values]);

  const handleReset = useCallback(() => {
    setValues(initialFormValues);
    setErrors({});
    onReset?.();
  }, [onReset]);

  return (
    <Paper elevation={3} sx={{ p: 4 }}>
      <Stack component="form" spacing={3} onSubmit={handleSubmit}>
        <Typography variant="h5" component="h1">
          Register New Book
        </Typography>

        {validationError ? (
          <Alert severity="error">{validationError}</Alert>
        ) : null}

        <TextField
          label="Title"
          name="title"
          value={values.title}
          onChange={handleChange('title')}
          required
          error={Boolean(errors.title)}
          helperText={errors.title}
          disabled={isSubmitting}
        />

        <TextField
          label="Author"
          name="author"
          value={values.author}
          onChange={handleChange('author')}
          required
          error={Boolean(errors.author)}
          helperText={errors.author}
          disabled={isSubmitting}
        />

        <TextField
          label="Category"
          name="category"
          value={values.category}
          onChange={handleSelectChange}
          disabled={isSubmitting}
        />

        <TextField
          label="Publisher"
          name="publisher"
          value={values.publisher}
          onChange={handleSelectChange}
          disabled={isSubmitting}
        />

        <TextField
          label="Description"
          name="description"
          value={values.description}
          onChange={handleChange('description')}
          multiline
          minRows={3}
          disabled={isSubmitting}
        />

        <TextField
          label="Cover Image URL"
          name="coverImageUrl"
          value={values.coverImageUrl}
          onChange={handleSelectChange}
          disabled={isSubmitting}
        />

        <TextField
          label="ISBN"
          name="isbn"
          value={values.isbn}
          onChange={handleSelectChange}
          error={Boolean(errors.isbn)}
          helperText={errors.isbn}
          disabled={isSubmitting}
        />

        <TextField
          label="Language"
          name="language"
          value={values.language}
          onChange={handleSelectChange}
          disabled={isSubmitting}
        />

        <TextField
          label="Page Count"
          name="pageCount"
          type="number"
          value={values.pageCount}
          onChange={handleSelectChange}
          error={Boolean(errors.pageCount)}
          helperText={errors.pageCount}
          disabled={isSubmitting}
          inputProps={{ min: 1 }}
        />

        <TextField
          label="Published At"
          name="publishedAt"
          type="date"
          value={values.publishedAt}
          onChange={handleSelectChange}
          error={Boolean(errors.publishedAt)}
          helperText={errors.publishedAt}
          disabled={isSubmitting}
          InputLabelProps={{ shrink: true }}
        />

        <TextField
          label="Tags (comma separated)"
          name="tags"
          value={values.tags}
          onChange={handleChange('tags')}
          disabled={isSubmitting}
        />

        <Stack direction="row" spacing={2} justifyContent="flex-end">
          <Button type="button" variant="text" onClick={handleReset} disabled={isSubmitting}>
            Reset
          </Button>
          <Button type="submit" variant="contained" disabled={isSubmitting}>
            Save
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
}
