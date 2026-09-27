/**
 * client/src/test/axe.js
 * Accessibility assertions powered by axe-core (real engine, dev-only).
 *
 * jsdom has no layout or paint, so two rules are intentionally disabled:
 *   - `color-contrast`      — needs computed styles from a real renderer
 *   - `region`              — flags component fragments not wrapped in landmarks
 * Everything else (labels, roles, names, ARIA validity, structure) runs for real.
 */
import axe from 'axe-core';

const DISABLED = {
  'color-contrast': { enabled: false },
  region: { enabled: false },
};

/**
 * Run axe against a rendered node and return its violations.
 * @param {HTMLElement} [container=document.body]
 * @returns {Promise<import('axe-core').Result[]>}
 */
export async function axeViolations(container = document.body) {
  const results = await axe.run(container, { rules: DISABLED });
  return results.violations;
}

/** Human-readable one-line-per-violation summary for assertion messages. */
export function formatViolations(violations) {
  return violations
    .map((v) => `• ${v.id} [${v.impact}] ${v.help} — ${v.nodes.length} node(s): ` +
      v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(', '))
    .join('\n');
}
