"use client";

/**
 * Tiny mock of a listing card used inside ExampleHint popovers. Highlights
 * the input being explained by wrapping it in <mark>.
 */
export function CardPreview({ highlight }: { highlight: "price" | "config" | "summary" }) {
  return (
    <div className="border border-line bg-cream-alt p-3 font-sans text-xs">
      <p className="text-[9px] uppercase tracking-widest text-ink/40 mb-2">Listing card preview</p>
      <div className="bg-white p-3 border border-line">
        <p className="font-semibold text-ink">Sample Project · Suburb NSW</p>
        <p className="text-ink/60 text-[11px] mb-2">
          Price Guide: {highlight === "price"
            ? <mark className="bg-yellow-200 px-1">From $650,000</mark>
            : <span>From $650,000</span>}
        </p>
        <p className="text-[10px] uppercase tracking-widest text-orange mb-2">
          New Apartments {highlight === "config" && <mark className="bg-yellow-200 px-1 normal-case font-sans tracking-normal">· 1, 2 &amp; 3 Bedrooms</mark>}
        </p>
        <div className={`flex gap-3 text-[11px] text-ink ${highlight === "summary" ? "bg-yellow-200 p-1 -mx-1" : ""}`}>
          <span>🛏 3</span><span>🛁 2</span><span>🚗 2</span><span>↔ 185</span>
        </div>
      </div>
    </div>
  );
}
