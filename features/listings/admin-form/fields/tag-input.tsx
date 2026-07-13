"use client";

import { useState } from "react";

export function TagInput({
  value,
  onChange,
  placeholder,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
}) {
  const [input, setInput] = useState("");

  function addTag() {
    const trimmed = input.trim();
    if (trimmed && !value.includes(trimmed)) onChange([...value, trimmed]);
    setInput("");
  }

  return (
    <div>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {value.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest px-2 py-1 bg-navy/5 border border-line text-ink/70"
            >
              {tag}
              <button
                type="button"
                onClick={() => onChange(value.filter((t) => t !== tag))}
                className="text-ink/40 hover:text-red-500 ml-0.5 leading-none"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") { e.preventDefault(); addTag(); }
          }}
          placeholder={placeholder ?? "Type and press Enter to add"}
          className="flex-1 border border-line px-3 py-2 bg-white font-sans text-sm text-ink outline-none focus:border-orange/60 transition-colors"
        />
        <button
          type="button"
          onClick={addTag}
          className="font-mono text-[10px] uppercase tracking-widest px-3 py-2 border border-line text-ink/60 hover:border-navy hover:text-navy transition-colors whitespace-nowrap"
        >
          Add
        </button>
      </div>
    </div>
  );
}
