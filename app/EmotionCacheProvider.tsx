'use client';

import * as React from 'react';
import { CacheProvider } from '@emotion/react';
import createCache, { Options } from '@emotion/cache';
import { useServerInsertedHTML } from 'next/navigation';

interface EmotionCacheProviderProps {
  readonly options: Options;
  readonly children: React.ReactNode;
}

export default function EmotionCacheProvider({ options, children }: EmotionCacheProviderProps) {
  const [{ cache, flush }] = React.useState(() => {
    const cache = createCache(options);
    cache.compat = true;
    const prevInsert = cache.insert;
    let inserted: string[] = [];
    cache.insert = (...args: Parameters<typeof prevInsert>) => {
      const serialized = args[1];
      if (cache.inserted[serialized.name] === undefined) {
        inserted.push(serialized.name);
      }
      return prevInsert(...args);
    };
    const flush = () => {
      const prevInserted = inserted;
      inserted = [];
      return prevInserted;
    };
    return { cache, flush };
  });

  useServerInsertedHTML(() => {
    const names = flush();
    if (names.length === 0) {
      return null;
    }
    let styles = '';
    names.forEach((name) => {
      const style = cache.inserted[name];
      if (typeof style === 'string') {
        styles += style;
      }
    });

    return (
      <style
        data-emotion={`${cache.key} ${names.join(' ')}`}
        dangerouslySetInnerHTML={{ __html: styles }}
      />
    );
  });

  return <CacheProvider value={cache}>{children}</CacheProvider>;
}
