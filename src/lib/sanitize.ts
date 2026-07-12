/**
 * HTML sanitization utility to prevent XSS attacks.
 * Uses DOMPurify to strip dangerous tags/attributes from HTML.
 *
 * MUST be used before every `dangerouslySetInnerHTML` render.
 */

import DOMPurify from "isomorphic-dompurify";

/**
 * Sanitize HTML string to prevent XSS.
 * Allows safe HTML tags (formatting, links, images) but strips
 * script tags, event handlers, and other dangerous content.
 */
export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [
      "h1", "h2", "h3", "h4", "h5", "h6",
      "p", "br", "hr",
      "ul", "ol", "li",
      "strong", "em", "b", "i", "u", "s", "del", "ins",
      "a", "img",
      "blockquote", "pre", "code",
      "table", "thead", "tbody", "tr", "th", "td",
      "div", "span",
      "sup", "sub",
      "details", "summary",
      "input", // for checkboxes in markdown
    ],
    ALLOWED_ATTR: [
      "href", "src", "alt", "title", "target", "rel",
      "class", "id",
      "type", "checked", "disabled", // for checkbox inputs
      "width", "height",
    ],
    ALLOW_DATA_ATTR: false,
    ADD_ATTR: ["target"], // Allow target="_blank" on links
  });
}
