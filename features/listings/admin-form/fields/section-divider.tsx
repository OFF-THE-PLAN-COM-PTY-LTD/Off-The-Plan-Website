"use client";

export function SectionDivider({ label }: { label: string }) {
  return (
    <p className="font-mono text-[10px] uppercase tracking-widest text-orange border-b border-orange/20 pb-1 mt-5 mb-4">
      {label}
    </p>
  );
}
