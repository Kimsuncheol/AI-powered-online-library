'use client';

import * as React from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import HistoryRoundedIcon from '@mui/icons-material/HistoryRounded';
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

import type { AISearchResponse, SavedSearchOut } from '@/app/types/ai-search';
import { executeAISearch, listAISearchRecords } from '@/app/lib/api/aiSearch';
import { HttpError } from '@/app/lib/http';

const DEFAULT_TOP_K = 10;

interface LastExecuted {
  q: string;
  includeAnswer: boolean;
  rerank: boolean;
  topK?: number;
}

export default function AISearchPage(): React.ReactElement {
  const router = useRouter();
  const searchParams = useSearchParams();
  const routerQuery = searchParams.get('q')?.trim() ?? '';

  const [query, setQuery] = React.useState(routerQuery);
  const [topKInput, setTopKInput] = React.useState(String(DEFAULT_TOP_K));
  const [includeAnswer, setIncludeAnswer] = React.useState(true);
  const [rerank, setRerank] = React.useState(true);

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [response, setResponse] = React.useState<AISearchResponse | null>(null);
  const [recentSearches, setRecentSearches] = React.useState<SavedSearchOut[]>([]);
  const [recentLoading, setRecentLoading] = React.useState(false);
  const [lastExecuted, setLastExecuted] = React.useState<LastExecuted | null>(null);

  const topKValue = React.useMemo(() => {
    const numeric = Number(topKInput);
    if (!Number.isFinite(numeric) || numeric <= 0) {
      return undefined;
    }
    return Math.floor(numeric);
  }, [topKInput]);

  const refreshRecentSearches = React.useCallback(async () => {
    setRecentLoading(true);
    try {
      const items = await listAISearchRecords({ limit: 8 });
      setRecentSearches(items);
    } catch (recentError) {
      const isUnauthorized = recentError instanceof HttpError && recentError.status === 401;
      if (!isUnauthorized && process.env.NODE_ENV !== 'production') {
        console.warn('Failed to fetch recent searches', recentError);
      }
    } finally {
      setRecentLoading(false);
    }
  }, []);

  const performSearch = React.useCallback(
    async (nextQuery: string) => {
      const trimmed = nextQuery.trim();
      if (!trimmed) {
        setResponse(null);
        setLastExecuted(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const payload = {
          q: trimmed,
          includeAnswer,
          rerank,
          ...(typeof topKValue === 'number' ? { topK: topKValue } : {}),
        };

        const result = await executeAISearch(payload);
        setResponse(result);
        setLastExecuted({
          q: trimmed,
          includeAnswer,
          rerank,
          topK: topKValue,
        });
        void refreshRecentSearches();
      } catch (searchError) {
        if (searchError instanceof Error) {
          setError(searchError.message);
        } else {
          setError('Search failed. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    },
    [includeAnswer, rerank, topKValue, refreshRecentSearches],
  );

  React.useEffect(() => {
    void refreshRecentSearches();
  }, [refreshRecentSearches]);

  React.useEffect(() => {
    if (routerQuery !== query) {
      setQuery(routerQuery);
    }

    if (!routerQuery) {
      setResponse(null);
      setLastExecuted(null);
      return;
    }

    const shouldRun =
      !lastExecuted ||
      lastExecuted.q !== routerQuery ||
      lastExecuted.includeAnswer !== includeAnswer ||
      lastExecuted.rerank !== rerank ||
      lastExecuted.topK !== topKValue;

    if (shouldRun) {
      void performSearch(routerQuery);
    }
  }, [routerQuery, includeAnswer, rerank, topKValue, lastExecuted, performSearch, query]);

  const handleSubmit = React.useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const trimmed = query.trim();
      if (!trimmed) {
        setError('Enter a search term to continue.');
        setResponse(null);
        setLastExecuted(null);
        return;
      }

      const params = new URLSearchParams(searchParams.toString());
      params.set('q', trimmed);
      router.push(`/search?${params.toString()}`);

      void performSearch(trimmed);
    },
    [performSearch, query, router, searchParams],
  );

  const handleRecentClick = React.useCallback(
    (term: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('q', term);
      router.push(`/search?${params.toString()}`);
      setQuery(term);
      void performSearch(term);
    },
    [performSearch, router, searchParams],
  );

  const answer = response?.answer;
  const results = response?.results ?? [];

  return (
    <Box sx={{ maxWidth: 960, mx: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
      <Box component="section">
        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 600, fontSize: { xs: '1.875rem', md: '2.75rem' } }}>
          AI Search
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600 }}>
          Ask anything about our library collections. Results are enhanced with AI assistance and grounded in the original sources.
        </Typography>
      </Box>

      <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
        <TextField
          fullWidth
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          label="Search the library"
          placeholder="Search books, articles, topics…"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchRoundedIcon color="action" />
              </InputAdornment>
            ),
          }}
        />
        <Stack direction={{ xs: 'row', md: 'column' }} spacing={1} alignItems={{ xs: 'center', md: 'flex-start' }} justifyContent="center">
          <TextField
            label="Top results"
            type="number"
            inputProps={{ min: 1, max: 50 }}
            value={topKInput}
            onChange={(event) => setTopKInput(event.target.value)}
            sx={{ width: { xs: '40%', md: 120 } }}
          />
          <Button type="submit" variant="contained" color="primary" size="large" sx={{ minWidth: 140 }}>
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Search'}
          </Button>
        </Stack>
      </Box>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ xs: 'flex-start', md: 'center' }}>
        <FormControlLabel
          control={<Switch checked={includeAnswer} onChange={(_, checked) => setIncludeAnswer(checked)} />}
          label="Include AI answer"
        />
        <FormControlLabel
          control={<Switch checked={rerank} onChange={(_, checked) => setRerank(checked)} />}
          label="AI rerank"
        />
        {response?.tookMs ? (
          <Chip label={`Responded in ${(response.tookMs / 1000).toFixed(response.tookMs >= 1000 ? 1 : 2)}s`} size="small" />
        ) : null}
      </Stack>

      {error ? (
        <Box
          sx={{
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'error.light',
            px: 3,
            py: 2.5,
            color: 'error.main',
            backgroundColor: 'error.lighter',
          }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Search unavailable
          </Typography>
          <Typography variant="body2">{error}</Typography>
        </Box>
      ) : null}

      {loading && !response ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : null}

      {answer ? (
        <Card variant="outlined" sx={{ backgroundColor: 'grey.50', borderRadius: 3 }}>
          <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8 }}>
              Synthesized answer
            </Typography>
            <Typography variant="body1" component="div" sx={{ whiteSpace: 'pre-line', lineHeight: 1.6 }}>
              {answer.text}
            </Typography>
            {answer.citations && answer.citations.length > 0 ? (
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {answer.citations.map((citation, index) => (
                  <Chip
                    key={`${citation.id ?? citation.url ?? index}`}
                    label={citation.title ?? citation.url ?? `Source ${index + 1}`}
                    component={citation.url ? Link : 'div'}
                    href={citation.url ?? '#'}
                    clickable={Boolean(citation.url)}
                    icon={<OpenInNewRoundedIcon fontSize="small" />}
                  />
                ))}
              </Stack>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <Divider flexItem />

      <Stack direction={{ xs: 'column', lg: 'row' }} spacing={4} alignItems="flex-start">
        <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Search results
          </Typography>

          {!loading && results.length === 0 && !error ? (
            <Box
              sx={{
                borderRadius: 2,
                border: '1px dashed',
                borderColor: 'divider',
                py: 5,
                px: 3,
                textAlign: 'center',
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                No results yet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Start a search or tweak your settings to see AI-guided results.
              </Typography>
            </Box>
          ) : null}

          {results.map((item) => (
            <Card key={item.id} variant="outlined" sx={{ borderRadius: 3 }}>
              <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                  <Typography variant="h6" component="div" sx={{ fontWeight: 600, lineHeight: 1.4, flex: 1 }}>
                    {item.title}
                  </Typography>
                  {typeof item.score === 'number' ? (
                    <Chip label={`Score ${(item.score * 100).toFixed(1)}%`} size="small" color="secondary" variant="filled" />
                  ) : null}
                </Stack>
                {item.source ? (
                  <Typography variant="caption" color="text.secondary">
                    {item.source}
                  </Typography>
                ) : null}
                <Typography
                  variant="body2"
                  color="text.secondary"
                  component="div"
                  sx={{ lineHeight: 1.6 }}
                  dangerouslySetInnerHTML={{ __html: item.snippet }}
                />
                {item.url ? (
                  <Stack direction="row" spacing={1} alignItems="center">
                    <IconButton
                      component={Link}
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      color="primary"
                      size="small"
                      sx={{ ml: -1 }}
                    >
                      <OpenInNewRoundedIcon fontSize="small" />
                    </IconButton>
                    <Typography variant="body2" color="primary" component={Link} href={item.url} target="_blank" rel="noopener noreferrer">
                      View document
                    </Typography>
                  </Stack>
                ) : null}
              </CardContent>
            </Card>
          ))}

          {loading && results.length > 0 ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
              <CircularProgress size={28} />
            </Box>
          ) : null}
        </Box>

        <Box sx={{ width: { xs: '100%', lg: 280 }, flexShrink: 0 }}>
          <Card variant="outlined" sx={{ borderRadius: 3 }}>
            <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <HistoryRoundedIcon color="action" />
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  Recent searches
                </Typography>
              </Stack>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {recentLoading && recentSearches.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    Loading…
                  </Typography>
                ) : null}
                {recentSearches.length === 0 && !recentLoading ? (
                  <Typography variant="body2" color="text.secondary">
                    Searches you run will appear here.
                  </Typography>
                ) : null}
                {recentSearches.map((item) => (
                  <Chip key={item.id} label={item.query} onClick={() => handleRecentClick(item.query)} variant="outlined" />
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Box>
      </Stack>
    </Box>
  );
}
