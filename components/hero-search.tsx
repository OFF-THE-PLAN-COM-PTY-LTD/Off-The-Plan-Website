"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { SearchIcon } from "@/components/icons";

const tabs = ["Buy", "Lifestyle", "Invest", "New launches"];

const priceOptions = [
  { label: "Any price", value: "" },
  { label: "Up to $500K", value: "500000" },
  { label: "Up to $750K", value: "750000" },
  { label: "Up to $1M", value: "1000000" },
  { label: "Up to $2M", value: "2000000" },
  { label: "Up to $5M", value: "5000000" },
  { label: "$5M+", value: "5000001" },
];

const typeOptions = [
  { label: "All types", value: "" },
  { label: "Apartments", value: "Apartments" },
  { label: "Townhouses", value: "Townhouses" },
  { label: "Houses", value: "Houses" },
  { label: "Penthouses", value: "Penthouses" },
];

interface HeroSearchProps {
  tone?: "light" | "dark";
}

export function HeroSearch({ tone = "dark" }: HeroSearchProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(0);
  const [suburb, setSuburb] = useState("");
  const [price, setPrice] = useState("");
  const [type, setType] = useState("");

  const isDark = tone === "dark";

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (suburb) params.set("suburb", suburb);
    if (price) params.set("price_max", price);
    if (type) params.set("type", type);
    if (activeTab === 3) params.set("tag", "New launch");
    router.push(`/search?${params.toString()}`);
  };

  return (
    <div
      className={cn(
        "w-full max-w-3xl",
        isDark ? "text-ink-light" : "text-ink"
      )}
    >
      {/* Tabs */}
      <div className="flex gap-0 mb-0 border-b border-white/20">
        {tabs.map((tab, i) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(i)}
            className={cn(
              "font-mono text-label-lg uppercase tracking-widest px-5 py-2.5 transition-colors border-b-2 -mb-px",
              activeTab === i
                ? "border-orange text-ink-light"
                : "border-transparent text-ink-light/50 hover:text-ink-light/80"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Search panel */}
      <form
        onSubmit={handleSearch}
        className={cn(
          "flex flex-col md:flex-row gap-0",
          isDark ? "bg-white/10 backdrop-blur-sm" : "bg-white border border-line"
        )}
      >
        {/* Suburb input */}
        <div className="flex-1 flex items-center gap-3 px-4 py-3 border-b md:border-b-0 md:border-r border-white/10">
          <SearchIcon size={16} className={isDark ? "text-ink-light/40" : "text-ink/30"} />
          <input
            type="text"
            placeholder="Suburb or postcode"
            value={suburb}
            onChange={(e) => setSuburb(e.target.value)}
            className={cn(
              "flex-1 bg-transparent font-sans text-body-md outline-none placeholder:text-ink-light/40",
              isDark ? "text-ink-light" : "text-ink placeholder:text-ink/30"
            )}
            aria-label="Suburb or postcode"
          />
        </div>

        {/* Price select */}
        <select
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          aria-label="Maximum price"
          className={cn(
            "px-4 py-3 bg-transparent font-mono text-label-lg border-b md:border-b-0 md:border-r border-white/10 outline-none appearance-none cursor-pointer",
            isDark ? "text-ink-light" : "text-ink"
          )}
        >
          {priceOptions.map((opt) => (
            <option key={opt.value} value={opt.value} className="text-ink bg-cream">
              {opt.label}
            </option>
          ))}
        </select>

        {/* Type select */}
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          aria-label="Property type"
          className={cn(
            "px-4 py-3 bg-transparent font-mono text-label-lg outline-none appearance-none cursor-pointer",
            isDark ? "text-ink-light" : "text-ink"
          )}
        >
          {typeOptions.map((opt) => (
            <option key={opt.value} value={opt.value} className="text-ink bg-cream">
              {opt.label}
            </option>
          ))}
        </select>

        {/* Search button */}
        <button
          type="submit"
          className="flex items-center gap-2 px-6 py-3 bg-orange text-white font-mono text-label-lg uppercase tracking-widest hover:bg-orange/90 transition-colors flex-shrink-0"
        >
          <SearchIcon size={14} />
          Search
        </button>
      </form>
    </div>
  );
}
