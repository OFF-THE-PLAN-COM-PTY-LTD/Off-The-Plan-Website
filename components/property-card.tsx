"use client";

import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Pill } from "@/components/pill";
import type { Development } from "@/types/development";

interface PropertyCardProps {
  development: Development;
  layout?: "tall" | "wide";
  className?: string;
  onSave?: (id: string) => void;
  isSaved?: boolean;
}

function tagVariant(tag: Development["tag"]): "orange" | "navy" | "ghost" {
  if (tag === "Featured" || tag === "Editor's pick") return "orange";
  if (tag === "New launch") return "navy";
  return "ghost";
}

export function PropertyCard({
  development,
  layout = "tall",
  className,
  onSave,
  isSaved = false,
}: PropertyCardProps) {
  const heroImageUrl =
    development.images?.find((img) => img.is_hero)?.url ??
    development.images?.[0]?.url ??
    development.hero_image_url ??
    null;

  const handleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onSave?.(development.id);
  };

  if (layout === "wide") {
    return (
      <Link
        href={`/developments/${development.slug}`}
        className={cn("group relative flex gap-0 overflow-hidden bg-cream-alt border border-line", className)}
      >
        {/* Image side */}
        <div className="relative w-1/2 min-h-[360px] bg-navy/10 flex-shrink-0">
          {heroImageUrl ? (
            <Image
              src={heroImageUrl}
              alt={development.name}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-navy to-navy-mid" />
          )}
          {development.tag && (
            <div className="absolute top-4 left-4">
              <Pill variant={tagVariant(development.tag)}>{development.tag}</Pill>
            </div>
          )}
        </div>

        {/* Content side */}
        <div className="flex flex-col justify-between p-8 flex-1">
          <div>
            <p className="font-mono text-label-lg uppercase tracking-widest text-ink/40 mb-3">
              {development.suburb}, {development.state}
            </p>
            <h3 className="font-display text-card-xl font-light text-navy mb-4 group-hover:text-orange transition-colors">
              {development.name}
            </h3>
            {development.summary && (
              <p className="font-sans text-body-md text-ink/60 leading-relaxed mb-6 line-clamp-3">
                {development.summary}
              </p>
            )}
            {/* Specs */}
            <div className="flex gap-6 text-ink/50">
              {development.price_display && (
                <div>
                  <p className="font-mono text-label-sm uppercase tracking-widest mb-0.5">From</p>
                  <p className="font-mono text-label-lg text-ink">{development.price_display}</p>
                </div>
              )}
              {development.beds_min && (
                <div>
                  <p className="font-mono text-label-sm uppercase tracking-widest mb-0.5">Beds</p>
                  <p className="font-mono text-label-lg text-ink">
                    {development.beds_min === development.beds_max
                      ? development.beds_min
                      : `${development.beds_min}–${development.beds_max}`}
                  </p>
                </div>
              )}
              {development.type && (
                <div>
                  <p className="font-mono text-label-sm uppercase tracking-widest mb-0.5">Type</p>
                  <p className="font-mono text-label-lg text-ink">{development.type}</p>
                </div>
              )}
              {development.completion_quarter && (
                <div>
                  <p className="font-mono text-label-sm uppercase tracking-widest mb-0.5">Completion</p>
                  <p className="font-mono text-label-lg text-ink">{development.completion_quarter}</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between mt-6">
            {development.status && (
              <Pill variant={development.status === "Selling now" ? "orange" : "ghost"}>
                {development.status}
              </Pill>
            )}
            {onSave && (
              <button
                onClick={handleSave}
                aria-label={isSaved ? "Remove from saved" : "Save development"}
                className="p-2 text-ink/30 hover:text-orange transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill={isSaved ? "#E8722C" : "none"}>
                  <path
                    d="M10 16.5L3.5 9.5C3.5 7 5.3 5 7.5 5c1.1 0 2.1.5 2.8 1.3L10 7l-.2-.7C10.5 5.5 11.5 5 12.5 5c2.2 0 4 2 4 4.5L10 16.5z"
                    stroke={isSaved ? "#E8722C" : "currentColor"}
                    strokeWidth="1.3"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>
      </Link>
    );
  }

  // Tall (default) layout
  return (
    <Link
      href={`/developments/${development.slug}`}
      className={cn("group relative flex flex-col overflow-hidden bg-cream-alt border border-line", className)}
    >
      {/* Image */}
      <div className="relative h-56 bg-navy/10 overflow-hidden">
        {heroImageUrl ? (
          <Image
            src={heroImageUrl}
            alt={development.name}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-navy to-navy-mid" />
        )}

        {/* Pills */}
        <div className="absolute top-3 left-3 flex gap-2">
          {development.tag && (
            <Pill variant={tagVariant(development.tag)}>{development.tag}</Pill>
          )}
        </div>

        {/* Save button */}
        {onSave && (
          <button
            onClick={handleSave}
            aria-label={isSaved ? "Remove from saved" : "Save development"}
            className="absolute top-3 right-3 p-1.5 bg-white/90 hover:bg-white transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill={isSaved ? "#E8722C" : "none"}>
              <path
                d="M10 16.5L3.5 9.5C3.5 7 5.3 5 7.5 5c1.1 0 2.1.5 2.8 1.3L10 7l-.2-.7C10.5 5.5 11.5 5 12.5 5c2.2 0 4 2 4 4.5L10 16.5z"
                stroke={isSaved ? "#E8722C" : "#14181d"}
                strokeWidth="1.3"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4">
        <p className="font-mono text-label-sm uppercase tracking-widest text-ink/40 mb-1.5">
          {development.suburb}, {development.state}
        </p>
        <h3 className="font-display text-card-lg font-light text-navy group-hover:text-orange transition-colors mb-3">
          {development.name}
        </h3>

        <div className="flex gap-4 mt-auto pt-3 border-t border-line">
          {development.price_display && (
            <div>
              <p className="font-mono text-label-sm uppercase tracking-widest text-ink/30">From</p>
              <p className="font-mono text-label-lg text-ink">{development.price_display}</p>
            </div>
          )}
          {development.beds_min && (
            <div>
              <p className="font-mono text-label-sm uppercase tracking-widest text-ink/30">Beds</p>
              <p className="font-mono text-label-lg text-ink">
                {development.beds_min === development.beds_max
                  ? development.beds_min
                  : `${development.beds_min}–${development.beds_max}`}
              </p>
            </div>
          )}
          {development.completion_quarter && (
            <div>
              <p className="font-mono text-label-sm uppercase tracking-widest text-ink/30">Est.</p>
              <p className="font-mono text-label-lg text-ink">{development.completion_quarter}</p>
            </div>
          )}
        </div>
      </div>

      {/* Status bar */}
      {development.status && (
        <div className="px-4 pb-3">
          <Pill variant={development.status === "Selling now" ? "orange" : "ghost"}>
            {development.status}
          </Pill>
        </div>
      )}
    </Link>
  );
}
