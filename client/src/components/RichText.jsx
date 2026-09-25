/**
 * client/src/components/RichText.jsx
 * Renders trusted-after-sanitization rich-text HTML. Always route stored HTML
 * through here instead of calling dangerouslySetInnerHTML directly, so every
 * render goes through the allow-list sanitizer.
 */
import { useMemo } from 'react';
import sanitizeHtml from '../utils/sanitizeHtml';

/**
 * @param {string} html
 * @param {string} [className]
 */
export default function RichText({ html, className = '' }) {
  const clean = useMemo(() => sanitizeHtml(html), [html]);
  if (!clean) return null;
  return (
    <div
      className={`prose-idea ${className}`}
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}
