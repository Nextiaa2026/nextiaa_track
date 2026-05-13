import { getRequestConfig } from 'next-intl/server';
import { hasLocale } from 'next-intl';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  // requestLocale is a Promise in next-intl v4 — must be awaited
  const requested = await requestLocale;

  // Fall back to defaultLocale if the incoming locale is not supported
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});

// Re-export for convenience so other files can still import from here
export { routing };
export type Locale = (typeof routing.locales)[number];
