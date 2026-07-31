// HTML sanitization utility to prevent XSS attacks using DOMPurify

import DOMPurify from "isomorphic-dompurify";


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
      "input",
    ],
    ALLOWED_ATTR: [
      "href", "src", "alt", "title", "target", "rel",
      "class", "id",
      "type", "checked", "disabled",
      "width", "height",
    ],
    ALLOW_DATA_ATTR: false,
    ADD_ATTR: ["target"],
  });
}
