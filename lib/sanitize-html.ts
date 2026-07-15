import DOMPurify from "isomorphic-dompurify";

/**
 * Allowlist-based HTML sanitizer for user/scraped rich text that ends up in
 * `dangerouslySetInnerHTML`. Strips <script>, event handlers (on*),
 * `javascript:` URLs, <style>, <iframe>, etc., keeping only formatting tags
 * and safe links/images.
 *
 * Use this on EVERY render of stored HTML that a non-admin (or an external
 * scrape) can influence — listing descriptions, and defensively on journal
 * bodies too. Sanitizing at render (not only on write) also protects rows
 * that were stored before this guard existed.
 */
const ALLOWED_TAGS = [
  "p", "br", "b", "strong", "i", "em", "u", "s", "sub", "sup",
  "ul", "ol", "li", "blockquote", "hr",
  "h1", "h2", "h3", "h4", "h5", "h6",
  "a", "img", "span", "div", "table", "thead", "tbody", "tr", "th", "td",
];

const ALLOWED_ATTR = ["href", "target", "rel", "src", "alt", "title", "width", "height"];

export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    // Block javascript:, data: (except images), vbscript: URLs.
    ALLOW_DATA_ATTR: false,
    FORBID_TAGS: ["style", "script", "iframe", "object", "embed", "form"],
    FORBID_ATTR: ["style", "onerror", "onload", "onclick"],
  });
}
