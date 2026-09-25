/**
 * client/src/utils/sanitizeHtml.js
 *
 * Minimal allow-list HTML sanitizer for rich-text (react-quill) output.
 *
 * NOTE: DOMPurify is the correct tool for this, but it cannot be installed in
 * this environment (npm registry is blocked). This is a conservative, browser-
 * native fallback: it parses the HTML in a detached document, then walks the
 * tree removing any element, attribute, or URL scheme not on the allow-list.
 * It strips <script>/<style>, all event handlers (on*), and javascript:/data:
 * URLs. Quill only ever emits a small, known tag set, so the allow-list is
 * intentionally tight.
 */

const ALLOWED_TAGS = new Set([
  'P', 'BR', 'SPAN', 'DIV',
  'B', 'STRONG', 'I', 'EM', 'U', 'S', 'STRIKE', 'SUB', 'SUP',
  'H1', 'H2', 'H3', 'H4', 'H5', 'H6',
  'UL', 'OL', 'LI',
  'BLOCKQUOTE', 'PRE', 'CODE',
  'A', 'HR',
]);

// Attributes permitted per tag (plus the global set below).
const ALLOWED_ATTRS = {
  A: ['href', 'title', 'target', 'rel'],
};
const GLOBAL_ATTRS = ['class']; // quill uses classes for indent/align

const SAFE_URL = /^(https?:|mailto:|tel:|#|\/)/i;

function scrubElement(el) {
  // Remove disallowed elements entirely (including their subtree).
  if (!ALLOWED_TAGS.has(el.tagName)) {
    el.remove();
    return;
  }

  const allowedForTag = ALLOWED_ATTRS[el.tagName] || [];
  for (const attr of Array.from(el.attributes)) {
    const name = attr.name.toLowerCase();
    const isAllowed = GLOBAL_ATTRS.includes(name) || allowedForTag.includes(name);
    if (!isAllowed) {
      el.removeAttribute(attr.name);
      continue;
    }
    // Validate URL-bearing attributes.
    if (name === 'href' && !SAFE_URL.test(attr.value.trim())) {
      el.removeAttribute(attr.name);
    }
  }

  // Force safe rel on links that open a new tab.
  if (el.tagName === 'A' && el.getAttribute('target') === '_blank') {
    el.setAttribute('rel', 'noopener noreferrer');
  }

  // Recurse over a static copy (children mutate as we scrub).
  for (const child of Array.from(el.children)) {
    scrubElement(child);
  }
}

/**
 * Returns a sanitized HTML string safe to pass to dangerouslySetInnerHTML.
 * @param {string} dirty
 * @returns {string}
 */
export function sanitizeHtml(dirty) {
  if (!dirty || typeof dirty !== 'string') return '';
  // parseFromString isolates parsing from the live document (no scripts run).
  const doc = new DOMParser().parseFromString(dirty, 'text/html');
  for (const child of Array.from(doc.body.children)) {
    scrubElement(child);
  }
  return doc.body.innerHTML;
}

export default sanitizeHtml;
