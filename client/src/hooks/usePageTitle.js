import { useEffect } from 'react';

const SUFFIX = 'IdeaHub';

/**
 * Sets document.title for the current screen, restoring the default on unmount.
 * Purely presentational — no data fetching, no routing change.
 */
export default function usePageTitle(title) {
  useEffect(() => {
    const previous = document.title;
    document.title = title ? `${title} · ${SUFFIX}` : SUFFIX;
    return () => {
      document.title = previous;
    };
  }, [title]);
}
