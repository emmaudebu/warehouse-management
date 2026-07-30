import * as Sentry from '@sentry/nextjs';

export function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    Sentry.init({
      dsn: "https://608c7911872838d8de38c9c8a764be26@o4511824028237824.ingest.de.sentry.io/4511824037150800",
      tracesSampleRate: 1,
      debug: false,
    });
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    Sentry.init({
      dsn: "https://608c7911872838d8de38c9c8a764be26@o4511824028237824.ingest.de.sentry.io/4511824037150800",
      tracesSampleRate: 1,
      debug: false,
    });
  }
}
