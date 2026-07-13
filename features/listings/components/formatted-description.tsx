"use client";

import { useState } from "react";

interface FormattedDescriptionProps {
  text: string;
}

type Segment =
  | { type: "incentive"; text: string }
  | { type: "bullets"; items: string[] }
  | { type: "heading"; text: string }
  | { type: "para"; text: string };

/**
 * Parses a plain-text listing description into structured segments and
 * renders them with proper formatting:
 *   - First promotional sentence  → orange highlight
 *   - Short feature sentences      → bullet list
 *   - Short all-caps-style phrases → bold subheadings
 *   - Long descriptive sentences   → body paragraphs
 */
function parseDescription(raw: string): Segment[] {
  if (!raw) return [];

  // Split on ". " boundaries, keeping trailing content
  const sentences = raw
    .split(/\.\s+/)
    .map((s) => s.replace(/\.$/, "").trim())
    .filter(Boolean);

  const segments: Segment[] = [];
  let reachedBodyText = false;
  const bulletBuffer: string[] = [];

  const flushBullets = () => {
    if (bulletBuffer.length > 0) {
      segments.push({ type: "bullets", items: [...bulletBuffer] });
      bulletBuffer.length = 0;
    }
  };

  for (let i = 0; i < sentences.length; i++) {
    const s = sentences[i];

    // ── Incentive: first sentence with promotional language ──────────────
    if (
      i === 0 &&
      (s.includes("$") ||
        s.includes("%") ||
        s.includes("!") ||
        /bonus|offer|exchange|deposit/i.test(s))
    ) {
      segments.push({ type: "incentive", text: s });
      continue;
    }

    // ── Already in body-text territory: treat everything as paragraphs ──
    if (reachedBodyText) {
      flushBullets();
      // Merge short trailing sentences into the last para if possible
      if (
        segments.length > 0 &&
        segments[segments.length - 1].type === "para" &&
        s.length < 80
      ) {
        (segments[segments.length - 1] as { type: "para"; text: string }).text +=
          ". " + s;
      } else {
        segments.push({ type: "para", text: s });
      }
      continue;
    }

    // ── Heading: short phrase that reads like a subheading ───────────────
    // e.g. "Construction Nearing Completion", "About The Development"
    if (
      s.length < 55 &&
      !/,/.test(s) &&
      !/\d/.test(s) &&
      /^[A-Z]/.test(s) &&
      !/^(a |an |the |in |at |on |to |by |with |from |for |and |or )/i.test(s)
    ) {
      flushBullets();
      segments.push({ type: "heading", text: s });
      continue;
    }

    // ── Long sentence → body paragraph; triggers paragraph mode ─────────
    if (s.length > 160) {
      flushBullets();
      reachedBodyText = true;
      segments.push({ type: "para", text: s });
      continue;
    }

    // ── Everything else before body text → bullet point ──────────────────
    bulletBuffer.push(s);
  }

  flushBullets();
  return segments;
}

export function FormattedDescription({ text }: FormattedDescriptionProps) {
  const [expanded, setExpanded] = useState(false);
  const segments = parseDescription(text);
  const needsToggle = segments.length > 3;

  const renderedContent = segments.map((seg, i) => {
    switch (seg.type) {
      case "incentive":
        return (
          <p key={i} className="font-sans text-[14px] text-orange font-medium leading-relaxed mb-4">
            {seg.text}.
          </p>
        );
      case "bullets":
        return (
          <ul key={i} className="mb-4 space-y-1.5">
            {seg.items.map((item, j) => (
              <li key={j} className="flex items-start gap-2">
                <span className="mt-[7px] w-1 h-1 rounded-full bg-ink/40 flex-shrink-0" />
                <span className="font-sans text-[14px] text-ink/80 leading-relaxed">{item}.</span>
              </li>
            ))}
          </ul>
        );
      case "heading":
        return (
          <p key={i} className="font-sans font-semibold text-[14px] text-ink mt-6 mb-2">
            {seg.text}
          </p>
        );
      case "para":
        return (
          <p key={i} className="font-sans text-[14px] text-ink/70 leading-relaxed mb-4">
            {seg.text}.
          </p>
        );
    }
  });

  return (
    <div>
      <div className="relative overflow-hidden" style={{ maxHeight: expanded ? "none" : 300 }}>
        {renderedContent}
        {!expanded && needsToggle && (
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-cream to-transparent pointer-events-none" />
        )}
      </div>
      {needsToggle && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="font-mono text-[10px] uppercase tracking-widest text-orange hover:text-orange/70 transition-colors mt-3"
        >
          {expanded ? "Read Less ↑" : "Read More ↓"}
        </button>
      )}
    </div>
  );
}
