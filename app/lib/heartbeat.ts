'use client';

import * as React from 'react';

import { HttpError, post } from '@/app/lib/http';

const DEFAULT_INTERVAL_MS = 7 * 60 * 1000;
const HEARTBEAT_ENDPOINT = '/activity/heartbeat';

export interface HeartbeatOptions {
  intervalMs?: number;
  enabled?: boolean;
}

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

async function sendHeartbeatRequest() {
  try {
    await post<void>(HEARTBEAT_ENDPOINT, { json: {} });
  } catch (error) {
    if (error instanceof HttpError && (error.status === 401 || error.status === 419)) {
      // Unauthorized handling is covered by the global listener via HttpError
      return;
    }

    if (process.env.NODE_ENV !== 'production') {
      console.warn('Heartbeat request failed', error);
    }
  }
}

export function useHeartbeat(options?: HeartbeatOptions) {
  const intervalMs = Math.max(1, options?.intervalMs ?? DEFAULT_INTERVAL_MS);
  const enabled = options?.enabled ?? true;
  const timerRef = React.useRef<number | null>(null);

  const clearTimer = React.useCallback(() => {
    if (timerRef.current !== null && isBrowser()) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = React.useCallback(() => {
    if (!isBrowser() || timerRef.current !== null) {
      return;
    }

    timerRef.current = window.setInterval(() => {
      void sendHeartbeatRequest();
    }, intervalMs);
  }, [intervalMs]);

  React.useEffect(() => {
    if (!isBrowser()) {
      return undefined;
    }

    if (!enabled) {
      clearTimer();
      return () => {
        clearTimer();
      };
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        clearTimer();
        void sendHeartbeatRequest();
        startTimer();
      } else {
        clearTimer();
      }
    };

    handleVisibilityChange();
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearTimer();
    };
  }, [enabled, clearTimer, startTimer]);
}
