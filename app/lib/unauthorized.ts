'use client';

import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

import { UNAUTHORIZED_EVENT, type UnauthorizedEventDetail } from '@/app/lib/http';

export interface UnauthorizedHandlerOptions {
  router: AppRouterInstance;
  clearState?: () => void;
  beforeRedirect?: (detail: UnauthorizedEventDetail) => Promise<void> | void;
  getRedirectPath?: () => string;
}

let handlerInitialized = false;
let redirectInProgress = false;
let lastRedirectAt = 0;

export function initializeUnauthorizedHandler(options: UnauthorizedHandlerOptions) {
  if (handlerInitialized || typeof window === 'undefined') {
    return;
  }

  const { router, clearState, beforeRedirect, getRedirectPath } = options;

  const listener = async (event: Event) => {
    const detail = (event as CustomEvent<UnauthorizedEventDetail | undefined>).detail ?? {
      status: 401,
      url: window.location.pathname,
      fromInteraction: false,
      timestamp: Date.now(),
    };

    if (redirectInProgress && detail.timestamp <= lastRedirectAt + 250) {
      return;
    }

    redirectInProgress = true;
    lastRedirectAt = detail.timestamp;

    try {
      clearState?.();

      if (beforeRedirect) {
        await beforeRedirect(detail);
      }

      const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      const nextPath = getRedirectPath?.() ?? currentPath;

      if (currentPath.startsWith('/login')) {
        redirectInProgress = false;
        return;
      }

      const loginUrl = `/login?next=${encodeURIComponent(nextPath)}`;
      router.replace(loginUrl);
    } finally {
      // ensure flag resets after navigation attempts
      redirectInProgress = false;
    }
  };

  window.addEventListener(UNAUTHORIZED_EVENT, listener);
  handlerInitialized = true;
}

