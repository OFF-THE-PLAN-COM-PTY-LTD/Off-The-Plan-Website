/**
 * Wrap plain text in <p>/<br> tags so it's safe to load into a TipTap editor
 * that expects HTML. Existing listings stored their description as raw text;
 * this keeps that data viewable + editable once we switch to a rich editor.
 */
export function plainTextToHtml(raw: string): string {
  if (!raw) return "";
  if (/<(p|div|br|ul|ol|h[1-6])\b/i.test(raw)) return raw;
  return raw
    .split(/\n{2,}/)
    .map((block) => `<p>${block.replace(/\n/g, "<br>")}</p>`)
    .filter((p) => p !== "<p></p>")
    .join("");
}

/** Strip tags for the plain-text companion field. */
export function htmlToPlainText(html: string): string {
  return html
    .replace(/<br\s*\/?>(\r\n|\n)?/gi, "\n")
    .replace(/<\/p>\s*<p[^>]*>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .trim();
}
